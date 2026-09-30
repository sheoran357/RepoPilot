import { Response } from "express";

import User from "../models/User.js";

import {
    AuthenticatedRequest
} from "../middleware/authMiddleware.js";

export const getCurrentUser = async (
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
        ).select("-githubAccessToken");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.json({
            user
        });
    } catch (error) {
        console.error(
            "Error getting current user:",
            error
        );

        return res.status(500).json({
            message: "Failed to get current user"
        });
    }
};