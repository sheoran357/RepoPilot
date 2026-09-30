import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import { listRepositoryFiles } from "../tools/githubTool.js";

export const listFiles = async (
    req: AuthenticatedRequest<{ owner: string; repo: string }>,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                message: "User is not authenticated"
            });
        }

        const { owner, repo } = req.params;

        const user = await User.findById(req.userId);

        if (!user || !user.githubAccessToken) {
            return res.status(401).json({
                message: "GitHub account is not connected"
            });
        }

        const files = await listRepositoryFiles(
            user.githubAccessToken,
            owner,
            repo
        );

        return res.status(200).json({
            files
        });
    } catch (error) {
        console.error("Failed to list repository files:", error);

        return res.status(500).json({
            message: "Failed to get repository files"
        });
    }
};