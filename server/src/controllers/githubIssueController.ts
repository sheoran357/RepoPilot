import { Response } from "express";

import User from "../models/User.js";
import Repository from "../models/Repository.js";
import Task from "../models/Task.js";

import {
    getRepositoryIssues
} from "../services/githubService.js";

import {
    AuthenticatedRequest
} from "../middleware/authMiddleware.js";

export const syncRepositoryIssues = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                message: "User is not authenticated"
            });
        }

        const { repositoryId } = req.params;

        const user = await User.findById(
            req.userId
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!user.githubAccessToken) {
            return res.status(401).json({
                message: "GitHub account is not connected"
            });
        }

        const repository =
            await Repository.findOne({
                _id: repositoryId,
                userId: user._id
            });

        if (!repository) {
            return res.status(404).json({
                message: "Repository not found"
            });
        }

        const [owner, repo] =
            repository.fullName.split("/");

        const githubIssues =
            await getRepositoryIssues(
                user.githubAccessToken,
                owner,
                repo
            );

        const tasks = [];

        for (const issue of githubIssues) {
            if (issue.pull_request) {
                continue;
            }

            const task =
                await Task.findOneAndUpdate(
                    {
                        userId: user._id,
                        repositoryId: repository._id,
                        issueNumber: issue.number
                    },
                    {
                        userId: user._id,
                        repositoryId: repository._id,
                        issueNumber: issue.number,
                        title: issue.title,
                        description: issue.body || "",
                        status: "PENDING"
                    },
                    {
                        new: true,
                        upsert: true
                    }
                );

            tasks.push(task);
        }

        return res.json({
            message: "Issues synced successfully",
            count: tasks.length,
            tasks
        });
    } catch (error) {
        console.error(
            "Error syncing GitHub issues:",
            error
        );

        return res.status(500).json({
            message: "Failed to sync issues"
        });
    }
};