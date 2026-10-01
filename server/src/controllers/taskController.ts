import { Response } from "express";

import {
    AuthenticatedRequest
} from "../middleware/authMiddleware.js";

import Task from "../models/Task.js";

export const createTask = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {

        if (!req.userId) {
            return res.status(401).json({
                message: "User is not authenticated"
            });
        }

        const {
            repositoryId,
            issueNumber,
            title,
            description
        } = req.body;

        if (
            !repositoryId ||
            !title ||
            !description
        ) {
            return res.status(400).json({
                message: "Required fields are missing"
            });
        }

        const task = await Task.create({
            userId: req.userId,
            repositoryId,
            issueNumber,
            title,
            description
        });

        return res.status(201).json({
            message: "Task created successfully",
            task
        });

    } catch (error) {

        console.error(
            "Error creating task:",
            error
        );

        return res.status(500).json({
            message: "Failed to create task"
        });
    }
};