import { Response } from "express";

import {
    AuthenticatedRequest
} from "../middleware/authMiddleware.js";

import FileChange from "../models/FileChange.js";
import AgentRun from "../models/AgentRun.js";
import Task from "../models/Task.js";
import Repository from "../models/Repository.js";
import User from "../models/User.js";

import {
    createGithubFile,
    updateGithubFile,
    deleteGithubFile,
    getRepositoryFile
} from "../services/githubService.js";

export const applyChange = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                message: "User is not authenticated"
            });
        }

        const { changeId } = req.params;

        if (!changeId) {
            return res.status(400).json({
                message: "changeId is required"
            });
        }

        const change =
            await FileChange.findById(changeId);

        if (!change) {
            return res.status(404).json({
                message: "File change not found"
            });
        }

        if (change.status !== "APPROVED") {
            return res.status(400).json({
                message:
                    "Cannot apply change with status " +
                    change.status
            });
        }

        const run =
            await AgentRun.findById(change.runId);

        if (!run) {
            return res.status(404).json({
                message: "Agent run not found"
            });
        }

        const task =
            await Task.findOne({
                _id: run.taskId,
                userId: req.userId
            });

        if (!task) {
            return res.status(403).json({
                message:
                    "You do not have access to this file change"
            });
        }

        const repository =
            await Repository.findOne({
                _id: task.repositoryId,
                userId: req.userId
            });

        if (!repository) {
            return res.status(403).json({
                message:
                    "You do not have access to this repository"
            });
        }

        const user =
            await User.findById(req.userId);

        if (!user || !user.githubAccessToken) {
            return res.status(400).json({
                message:
                    "GitHub account is not connected"
            });
        }

        const [owner, repo] =
            repository.fullName.split("/");

        if (!owner || !repo) {
            return res.status(400).json({
                message:
                    "Invalid repository full name"
            });
        }

        const commitMessage =
            "RepoPilot: " +
            change.changeType.toLowerCase() +
            " " +
            change.filePath;

        let result;

        if (change.changeType === "ADDED") {
            result = await createGithubFile(
                user.githubAccessToken,
                owner,
                repo,
                change.filePath,
                change.newContent || "",
                commitMessage
            );
        }

        if (change.changeType === "MODIFIED") {
            const currentFile =
                await getRepositoryFile(
                    user.githubAccessToken,
                    owner,
                    repo,
                    change.filePath
                );

            if (!currentFile.sha) {
                return res.status(400).json({
                    message:
                        "Unable to get current file SHA from GitHub"
                });
            }

            const currentContent =
                Buffer.from(
                    currentFile.content,
                    "base64"
                ).toString("utf-8");

            if (
                currentContent !==
                (change.oldContent || "")
            ) {
                return res.status(409).json({
                    message:
                        "File changed on GitHub after this change was proposed. The approved change was not applied."
                });
            }

            result = await updateGithubFile(
                user.githubAccessToken,
                owner,
                repo,
                change.filePath,
                change.newContent || "",
                currentFile.sha,
                commitMessage
            );
        }

        if (change.changeType === "DELETED") {
            const currentFile =
                await getRepositoryFile(
                    user.githubAccessToken,
                    owner,
                    repo,
                    change.filePath
                );

            if (!currentFile.sha) {
                return res.status(400).json({
                    message:
                        "Unable to get current file SHA from GitHub"
                });
            }

            const currentContent =
                Buffer.from(
                    currentFile.content,
                    "base64"
                ).toString("utf-8");

            if (
                currentContent !==
                (change.oldContent || "")
            ) {
                return res.status(409).json({
                    message:
                        "File changed on GitHub after this change was proposed. The approved deletion was not applied."
                });
            }

            result = await deleteGithubFile(
                user.githubAccessToken,
                owner,
                repo,
                change.filePath,
                currentFile.sha,
                commitMessage
            );
        }

        change.status = "APPLIED";

        await change.save();

        return res.status(200).json({
            message:
                "File change applied successfully",
            change,
            result
        });

    } catch (error) {
        console.error(
            "Error applying file change:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to apply file change"
        });
    }
};
