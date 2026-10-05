import { Response } from "express";

import {
    AuthenticatedRequest
} from "../middleware/authMiddleware.js";

import Execution from "../models/Execution.js";
import AgentRun from "../models/AgentRun.js";
import Task from "../models/Task.js";
import Repository from "../models/Repository.js";

export const getRunExecution = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                message: "User is not authenticated"
            });
        }

        const { runId } = req.params;

        if (!runId) {
            return res.status(400).json({
                message: "runId is required"
            });
        }

        const run =
            await AgentRun.findById(runId);

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
            return res.status(404).json({
                message: "Task not found"
            });
        }

        const repository =
            await Repository.findOne({
                _id: task.repositoryId,
                userId: req.userId
            });

        if (!repository) {
            return res.status(404).json({
                message: "Repository not found"
            });
        }

        const execution =
            await Execution.findOne({
                runId: run._id
            }).sort({
                createdAt: -1
            });

        return res.json({
            execution
        });
    } catch (error) {
        console.error(
            "Error getting execution:",
            error
        );

        return res.status(500).json({
            message: "Failed to get execution"
        });
    }
};
