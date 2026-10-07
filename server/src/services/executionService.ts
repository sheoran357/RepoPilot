import { spawn } from "child_process";
import path from "path";
import Execution from "../models/Execution.js";

import {
    validateWorkspace
} from "./workspaceService.js";

interface ExecutionResult {
    success: boolean;
    exitCode: number | null;
    stdout: string;
    stderr: string;
    duration: number;
}

const COMMAND_TIMEOUT = 30_000;
const INSTALL_TIMEOUT = 300_000;
const MAX_OUTPUT_LENGTH = 20_000;
const DOCKER_IMAGE = "node:22-alpine";

const allowedCommands = [
    "node --version",
    "npm --version",
    "npm test --prefix server",
    "npm run build --prefix server"
];

const appendOutput = (
    current: string,
    value: Buffer
) => {
    const next =
        current + value.toString();

    return next.length > MAX_OUTPUT_LENGTH
        ? next.slice(0, MAX_OUTPUT_LENGTH)
        : next;
};

const runDockerCommand = async (
    runId: string,
    command: string,
    workingDirectory: string,
    network: "none" | "bridge",
    timeoutMs: number
): Promise<ExecutionResult> => {
    const safeWorkingDirectory =
        validateWorkspace(workingDirectory);

    const execution =
        await Execution.create({
            runId,
            command,
            status: "RUNNING"
        });

    const startedAt = Date.now();

    return await new Promise<ExecutionResult>(
        (resolve, reject) => {
            const parts =
                command.split(/\s+/);

            const child = spawn(
                "docker",
                [
                    "run",
                    "--rm",
                    "--network",
                    network,
                    "--cpus",
                    "1",
                    "--memory",
                    "512m",
                    "--pids-limit",
                    "128",
                    "--read-only",
                    "--tmpfs",
                    "/tmp:rw,noexec,nosuid,size=64m",
                    "-v",
                    path.resolve(safeWorkingDirectory) + ":/workspace:rw",
                    "-w",
                    "/workspace",
                    DOCKER_IMAGE,
                    ...parts
                ],
                {
                    shell: false,
                    windowsHide: true
                }
            );

            let stdout = "";
            let stderr = "";
            let finished = false;

            const finish = async (
                status: "COMPLETED" | "FAILED",
                exitCode: number | null,
                errorOutput?: string
            ) => {
                if (finished) {
                    return;
                }

                finished = true;

                execution.status = status;
                execution.stdout = stdout;
                execution.stderr =
                    errorOutput !== undefined
                        ? errorOutput
                        : stderr;
                execution.exitCode = exitCode;
                execution.duration =
                    Date.now() - startedAt;

                await execution.save();
            };

            child.stdout.on(
                "data",
                (data: Buffer) => {
                    stdout =
                        appendOutput(
                            stdout,
                            data
                        );
                }
            );

            child.stderr.on(
                "data",
                (data: Buffer) => {
                    stderr =
                        appendOutput(
                            stderr,
                            data
                        );
                }
            );

            const timeout =
                setTimeout(
                    async () => {
                        if (finished) {
                            return;
                        }

                        child.kill();

                        const timeoutError =
                            stderr +
                            "\nDocker command timed out.";

                        try {
                            await finish(
                                "FAILED",
                                null,
                                timeoutError
                            );

                            resolve({
                                success: false,
                                exitCode: null,
                                stdout,
                                stderr: timeoutError,
                                duration:
                                    Date.now() -
                                    startedAt
                            });
                        } catch (error) {
                            reject(error);
                        }
                    },
                    timeoutMs
                );

            child.on(
                "error",
                async (error) => {
                    clearTimeout(timeout);

                    if (finished) {
                        return;
                    }

                    try {
                        await finish(
                            "FAILED",
                            null,
                            error.message
                        );

                        reject(error);
                    } catch (saveError) {
                        reject(saveError);
                    }
                }
            );

            child.on(
                "close",
                async (code) => {
                    clearTimeout(timeout);

                    if (finished) {
                        return;
                    }

                    const success =
                        code === 0;

                    try {
                        await finish(
                            success
                                ? "COMPLETED"
                                : "FAILED",
                            code
                        );

                        resolve({
                            success,
                            exitCode: code,
                            stdout,
                            stderr,
                            duration:
                                Date.now() -
                                startedAt
                        });
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        }
    );
};

export const installDependencies = async (
    runId: string,
    workingDirectory: string
): Promise<ExecutionResult> => {
    return await runDockerCommand(
        runId,
        "npm ci --ignore-scripts --prefix server",
        workingDirectory,
        "bridge",
        INSTALL_TIMEOUT
    );
};

export const runCommand = async (
    runId: string,
    command: string,
    workingDirectory: string
) => {
    const normalizedCommand =
        command.trim();

    if (!allowedCommands.includes(normalizedCommand)) {
        throw new Error("Command is not allowed");
    }

    if (
        normalizedCommand ===
            "npm test --prefix server" ||
        normalizedCommand ===
            "npm run build --prefix server"
    ) {
        const installResult =
            await installDependencies(
                runId,
                workingDirectory
            );

        if (!installResult.success) {
            return {
                success: false,
                exitCode: installResult.exitCode,
                stdout: installResult.stdout,
                stderr:
                    "Dependency installation failed.\n" +
                    installResult.stderr,
                duration: installResult.duration
            };
        }
    }

    return await runDockerCommand(
        runId,
        normalizedCommand,
        workingDirectory,
        "none",
        COMMAND_TIMEOUT
    );
};