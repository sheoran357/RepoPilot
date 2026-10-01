import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import {
    getFile,
    listRepositoryFiles
} from "../tools/githubTool.js";
import { searchCode } from "../tools/githubTool.js";



export const searchRepositoryCode = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                message: "User is not authenticated"
            });
        }

        const { owner, repo } = req.params;
        const { q } = req.query;

        if (typeof q !== "string" || q.trim() === "") {
            return res.status(400).json({
                message: "Search query is required"
            });
        }

        const user = await User.findById(req.userId);

        if (!user || !user.githubAccessToken) {
            return res.status(401).json({
                message: "GitHub account is not connected"
            });
        }

        const results = await searchCode(
            user.githubAccessToken,
            owner,
            repo,
            q
        );

        return res.status(200).json({
            results
        });
    } catch (error) {
        console.error(
            "Failed to search repository:",
            error
        );

        return res.status(500).json({
            message: "Failed to search repository"
        });
    }
};


export const readFile = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                message: "User is not authenticated"
            });
        }

        const { owner, repo } = req.params;

        const pathParam = req.params.path;

        const path = Array.isArray(pathParam)
            ? pathParam.join("/")
            : pathParam;

        console.log("Owner:", owner);
        console.log("Repo:", repo);
        console.log("Path:", path);

        const user = await User.findById(req.userId);


        if (!user || !user.githubAccessToken) {
            return res.status(401).json({
                message: "GitHub account is not connected"
            });
        }

        const file = await getFile(
            user.githubAccessToken,
            owner,
            repo,
            path
        );


        return res.status(200).json({
            file
        });
   } catch (error: any) {
    console.error(
        "Failed to read file:",
        error.response?.data || error.message || error
    );

    return res.status(500).json({
        message: "Failed to read repository file",
        error: error.response?.data || error.message
    });
}
};


export const listFiles = async (
    req: AuthenticatedRequest,
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
        console.error(
            "Failed to list repository files:",
            error
        );

        return res.status(500).json({
            message: "Failed to get repository files"
        });
    }
};