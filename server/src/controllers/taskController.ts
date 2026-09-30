import { Request, Response } from "express";
import Task from "../models/Task.js";

export const createTask = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            userId,
            repositoryId,
            issueNumber,
            title,
            description
        } = req.body;

        if (
            !userId ||
            !repositoryId ||
            !title ||
            !description
        ) {
            return res.status(400).json({
                message: "Required fields are missing"
            });
        }

        const task = await Task.create({
            userId,
            repositoryId,
            issueNumber,
            title,
            description
        });

        res.status(201).json({
            message: "Task created successfully",
            task
        });
    } catch (error) {
        console.error("Error creating task:", error);

        res.status(500).json({
            message: "Failed to create task"
        });
    }
};