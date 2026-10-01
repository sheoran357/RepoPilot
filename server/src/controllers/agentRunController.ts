import { Request, Response } from "express";

import {
    AuthenticatedRequest
} from "../middleware/authMiddleware.js";

import AgentRun from "../models/AgentRun.js";

import {
    startAgentRun
} from "../services/agentService.js";


export const runAgent = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                message: "User is not authenticated"
            });
        }

        const { taskId } = req.body;

        if (!taskId) {
            return res.status(400).json({
                message: "taskId is required"
            });
        }

        const agentRun = await startAgentRun(
            taskId,
            req.userId
        );

        return res.status(201).json({
            message: "Agent run completed",
            agentRun
        });
    } catch (error) {
        console.error(
            "Agent run failed:",
            error
        );

        return res.status(500).json({
            message: "Agent run failed"
        });
    }
};


export const createAgentRun = async (
    req: Request,
    res: Response
) => {
    try {
        const { taskId } = req.body;

        if (!taskId) {
            return res.status(400).json({
                message: "taskId is required"
            });
        }

        const agentRun = await AgentRun.create({
            taskId
        });

        return res.status(201).json({
            message: "Agent run created successfully",
            agentRun
        });
    } catch (error) {
        console.error(
            "Error creating agent run:",
            error
        );

        return res.status(500).json({
            message: "Failed to create agent run"
        });
    }
};