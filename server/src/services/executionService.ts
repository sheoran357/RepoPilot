
import { spawn } from "child_process";
import { createHash, randomUUID } from "crypto";
import { readFile, writeFile } from "fs/promises";
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

const COMMAND_TIMEOUT = 180_000;
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

/**
 * Forcefully stops and removes a named Docker container.
 * Resolves even if the container has already stopped or been removed.
 */
const removeDockerContainer = (
    containerName: string
): Promise<void> => {
    return new Promise<void>((resolve) => {
        let settled = false;

        const settle = () => {
            if (settled) {
                return;
            }

            settled = true;
            resolve();
        };

        const cleanup = spawn(
            "docker",
            [
                "rm",
                "-f",
                containerName
            ],
            {
                shell: false,
                windowsHide: true,
                stdio: "ignore"
            }
        );

        cleanup.on("error", settle);
        cleanup.on("close", settle);
    });
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

            const containerName =
                `repopilot-${randomUUID()}`;

            let stdout = "";
            let stderr = "";
            let finished = false;
            let timingOut = false;

            const child = spawn(
                "docker",
                [
                    "run",
                    "--name",
                    containerName,
                    "--network",
                    network,
                    "--cpus",
                    "2",
                    "--memory",
                    "1g",
                    "--pids-limit",
                    "256",
                    "--read-only",
                    "--tmpfs",
                    "/tmp:rw,noexec,nosuid,size=256m",
                    "-e",
                    "npm_config_cache=/npm-cache",
                    "--mount",
                    "type=volume,source=repopilot-npm-cache,target=/npm-cache",
                    "-v",
                    path.resolve(safeWorkingDirectory) +
                        ":/workspace:rw",
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
                        appendOutput(stdout, data);
                }
            );

            child.stderr.on(
                "data",
                (data: Buffer) => {
                    stderr =
                        appendOutput(stderr, data);
                }
            );

            const timeout = setTimeout(
                async () => {
                    if (finished || timingOut) {
                        return;
                    }

                    timingOut = true;

                    // Stop the Docker CLI process.
                    child.kill();

                    const timeoutError =
                        stderr +
                        "\nDocker command timed out.";

                    try {
                        // Also stop and remove the actual container.
                        await removeDockerContainer(
                            containerName
                        );

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
                                Date.now() - startedAt
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

                    if (finished || timingOut) {
                        return;
                    }

                    try {
                        await removeDockerContainer(
                            containerName
                        );

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

                    // The timeout handler owns cleanup and recording
                    // if the command has already timed out.
                    if (finished || timingOut) {
                        return;
                    }

                    const success =
                        code === 0;

                    try {
                        // Containers are explicitly removed after
                        // normal completion as well as on timeout.
                        await removeDockerContainer(
                            containerName
                        );

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
                                Date.now() - startedAt
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
    const safeWorkingDirectory =
        validateWorkspace(workingDirectory);

    const lockFilePath =
        path.resolve(
            safeWorkingDirectory,
            "server",
            "package-lock.json"
        );

    const markerPath =
        path.resolve(
            safeWorkingDirectory,
            "server",
            "node_modules",
            ".repopilot-dependencies-lock-sha256"
        );

    let lockHash: string | null = null;

    try {
        const lockFile =
            await readFile(lockFilePath);

        lockHash =
            createHash("sha256")
                .update(lockFile)
                .digest("hex");

        const installedHash =
            await readFile(markerPath, "utf8");

        if (installedHash.trim() === lockHash) {
            return {
                success: true,
                exitCode: 0,
                stdout:
                    "Dependencies already installed; package-lock.json is unchanged.\n",
                stderr: "",
                duration: 0
            };
        }
    } catch {
        // A missing lockfile, marker, or node_modules directory
        // means dependencies must be installed normally.
    }

    const result =
        await runDockerCommand(
            runId,
            "npm ci --ignore-scripts --prefix server",
            safeWorkingDirectory,
            "bridge",
            INSTALL_TIMEOUT
        );

    if (result.success && lockHash !== null) {
        try {
            await writeFile(
                markerPath,
                lockHash,
                "utf8"
            );
        } catch {
            // Caching is an optimization; do not fail a successful install.
        }
    }

    return result;
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
