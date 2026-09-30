import { Request, Response } from "express";
import AgentRun from "../models/AgentRun.js";

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

        res.status(201).json({
            message: "Agent run created successfully",
            agentRun
        });
    } catch (error) {
        console.error("Error creating agent run:", error);

        res.status(500).json({
            message: "Failed to create agent run"
        });
    }
};