import { Request, Response } from "express";
import User from "../models/User.js";

export const createUser = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            githubId,
            username,
            email,
            avatarUrl
        } = req.body;

        if (!githubId || !username) {
            return res.status(400).json({
                message: "githubId and username are required"
            });
        }

        const existingUser = await User.findOne({
            githubId
        });

        if (existingUser) {
            return res.status(200).json({
                message: "User already exists",
                user: existingUser
            });
        }

        const user = await User.create({
            githubId,
            username,
            email,
            avatarUrl
        });

        res.status(201).json({
            message: "User created successfully",
            user
        });
    } catch (error) {
        console.error("Error creating user:", error);

        res.status(500).json({
            message: "Failed to create user"
        });
    }
};