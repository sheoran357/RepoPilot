import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

const getWorkspaceRoot = () => {
    return path.resolve(
        process.env.EXECUTION_WORKSPACE_ROOT ||
        path.join(process.cwd(), "workspace")
    );
};

const isInsideWorkspaceRoot = (
    workspacePath: string,
    workspaceRoot: string
) => {
    const relative = path.relative(
        workspaceRoot,
        workspacePath
    );

    return (
        relative !== "" &&
        !relative.startsWith("..") &&
        !path.isAbsolute(relative)
    );
};

export const createWorkspace = async (
    accessToken: string,
    owner: string,
    repo: string,
    runId: string
) => {
    const workspaceRoot =
        getWorkspaceRoot();

    const workspacePath =
        path.join(
            workspaceRoot,
            runId
        );

    if (
        !isInsideWorkspaceRoot(
            workspacePath,
            workspaceRoot
        )
    ) {
        throw new Error(
            "Invalid execution workspace path"
        );
    }

    await fs.mkdir(
        workspaceRoot,
        {
            recursive: true
        }
    );

    await fs.rm(
        workspacePath,
        {
            recursive: true,
            force: true
        }
    );

    const repositoryUrl =
        `https://github.com/${owner}/${repo}.git`;

    const gitConfig = {
        ...process.env,
        GIT_CONFIG_COUNT: "1",
        GIT_CONFIG_KEY_0:
            "http.extraheader",
        GIT_CONFIG_VALUE_0:
            `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${accessToken}`).toString("base64")}`
    };

    await new Promise<void>(
        (resolve, reject) => {
            const child = spawn(
                "git",
                [
                    "clone",
                    "--depth",
                    "1",
                    repositoryUrl,
                    workspacePath
                ],
                {
                    cwd: workspaceRoot,
                    env: gitConfig,
                    shell: false,
                    windowsHide: true
                }
            );

            let stderr = "";

            child.stderr.on(
                "data",
                (data: Buffer) => {
                    stderr += data.toString();
                }
            );

            child.on(
                "error",
                reject
            );

            child.on(
                "close",
                (code) => {
                    if (code === 0) {
                        resolve();
                        return;
                    }

                    reject(
                        new Error(
                            `Failed to clone repository: ${stderr.trim() || "git clone failed"}`
                        )
                    );
                }
            );
        }
    );

    return workspacePath;
};

export const removeWorkspace = async (
    workspacePath: string
) => {
    const workspaceRoot =
        getWorkspaceRoot();

    const resolvedPath =
        path.resolve(
            workspacePath
        );

    if (
        !isInsideWorkspaceRoot(
            resolvedPath,
            workspaceRoot
        )
    ) {
        throw new Error(
            "Invalid execution workspace path"
        );
    }

    await fs.rm(
        resolvedPath,
        {
            recursive: true,
            force: true
        }
    );
};

export const validateWorkspace = (
    workspacePath: string
) => {
    const workspaceRoot =
        getWorkspaceRoot();

    const resolvedPath =
        path.resolve(
            workspacePath
        );

    if (
        !isInsideWorkspaceRoot(
            resolvedPath,
            workspaceRoot
        )
    ) {
        throw new Error(
            "Execution is only allowed inside a RepoPilot workspace"
        );
    }

    return resolvedPath;
};