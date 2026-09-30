import { Response } from "express";

import User from "../models/User.js";
import Repository from "../models/Repository.js";

import {
    getGithubRepositories
} from "../services/githubService.js";

import {
    AuthenticatedRequest
} from "../middleware/authMiddleware.js";


export const getUserRepositories = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                message: "User is not authenticated"
            });
        }

        const repositories =
            await Repository.find({
                userId: req.userId
            }).sort({
                updatedAt: -1
            });

        return res.json({
            repositories
        });
    } catch (error) {
        console.error(
            "Error getting repositories:",
            error
        );

        return res.status(500).json({
            message: "Failed to get repositories"
        });
    }
};

export const syncRepositories = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                message: "User is not authenticated"
            });
        }

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

        const githubRepositories =
            await getGithubRepositories(
                user.githubAccessToken
            );

        const repositories = [];

        for (const githubRepo of githubRepositories) {
            const repository =
                await Repository.findOneAndUpdate(
                    {
                        userId: user._id,
                        githubId: githubRepo.id
                    },
                    {
                        userId: user._id,
                        githubId: githubRepo.id,
                        name: githubRepo.name,
                        fullName: githubRepo.full_name,
                        url: githubRepo.html_url,
                        defaultBranch:
                            githubRepo.default_branch
                    },
                    {
                        new: true,
                        upsert: true
                    }
                );

            repositories.push(repository);
        }

        return res.json({
            message: "Repositories synced successfully",
            count: repositories.length,
            repositories
        });
    } catch (error) {
        console.error(
            "Error syncing repositories:",
            error
        );

        return res.status(500).json({
            message: "Failed to sync repositories"
        });
    }
};