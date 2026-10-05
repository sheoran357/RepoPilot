import { spawn } from "child_process";
import Execution from "../models/Execution.js";

const COMMAND_TIMEOUT = 30_000;
const MAX_OUTPUT_LENGTH = 20_000;

const allowedCommands = [
    "node --version",
    "npm --version",
    "npm test",
    "npm run build"
];

export const runCommand = async (
    runId: string,
    command: string,
    workingDirectory: string
) => {
    const normalizedCommand = command.trim();

    if (!allowedCommands.includes(normalizedCommand)) {
        throw new Error("Command is not allowed");
    }

    const execution = await Execution.create({
        runId,
        command: normalizedCommand,
        status: "RUNNING"
    });

    const startedAt = Date.now();

    return await new Promise((resolve, reject) => {
        const parts = normalizedCommand.split(/\s+/);
        const program =
            process.platform === "win32" && parts[0] === "npm"
                ? "npm.cmd"
                : parts[0];
        const args = parts.slice(1);

        const child = spawn(
            program,
            args,
            {
                cwd: workingDirectory,
                shell: false,
                windowsHide: true
            }
        );

        let stdout = "";
        let stderr = "";

        const appendOutput = (
            current: string,
            value: Buffer
        ) => {
            const next = current + value.toString();

            return next.length > MAX_OUTPUT_LENGTH
                ? next.slice(0, MAX_OUTPUT_LENGTH)
                : next;
        };

        child.stdout.on("data", (data: Buffer) => {
            stdout = appendOutput(stdout, data);
        });

        child.stderr.on("data", (data: Buffer) => {
            stderr = appendOutput(stderr, data);
        });

        const timeout = setTimeout(() => {
            child.kill();

            execution.status = "FAILED";
            execution.stdout = stdout;
            execution.stderr =
                stderr + "\nCommand timed out.";
            execution.exitCode = null;
            execution.duration = Date.now() - startedAt;

            execution.save()
                .then(() => {
                    resolve({
                        success: false,
                        exitCode: null,
                        stdout,
                        stderr:
                            stderr + "\nCommand timed out.",
                        duration: Date.now() - startedAt
                    });
                })
                .catch(reject);
        }, COMMAND_TIMEOUT);

        child.on("error", async (error) => {
            clearTimeout(timeout);

            execution.status = "FAILED";
            execution.stdout = stdout;
            execution.stderr = error.message;
            execution.exitCode = null;
            execution.duration = Date.now() - startedAt;

            try {
                await execution.save();
                reject(error);
            } catch (saveError) {
                reject(saveError);
            }
        });

        child.on("close", async (code) => {
            clearTimeout(timeout);

            const success = code === 0;

            execution.status =
                success ? "COMPLETED" : "FAILED";
            execution.stdout = stdout;
            execution.stderr = stderr;
            execution.exitCode = code;
            execution.duration = Date.now() - startedAt;

            try {
                await execution.save();

                resolve({
                    success,
                    exitCode: code,
                    stdout,
                    stderr,
                    duration: Date.now() - startedAt
                });
            } catch (error) {
                reject(error);
            }
        });
    });
};
