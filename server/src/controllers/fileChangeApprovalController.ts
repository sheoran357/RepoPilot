import { Response } from "express";

import {
    AuthenticatedRequest
} from "../middleware/authMiddleware.js";

import FileChange from "../models/FileChange.js";
import AgentRun from "../models/AgentRun.js";
import Task from "../models/Task.js";
import Repository from "../models/Repository.js";

export const approveChange = async (
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

        const run =
            await AgentRun.findById(
                change.runId
            );

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
                message: "You do not have access to this file change"
            });
        }

        const repository =
            await Repository.findOne({
                _id: task.repositoryId,
                userId: req.userId
            });

        if (!repository) {
            return res.status(403).json({
                message: "You do not have access to this repository"
            });
        }

        if (change.status !== "PENDING") {
            return res.status(400).json({
                message: "Cannot approve change with status " + change.status
            });
        }

        change.status = "APPROVED";

        await change.save();

        return res.status(200).json({
            message: "File change approved",
            change
        });

    } catch (error) {
        console.error(
            "Error approving file change:",
            error
        );

        return res.status(500).json({
            message: "Failed to approve file change"
        });
    }
};
