import { Request, Response } from "express";
import AgentStep from "../models/AgentStep.js";

export const createAgentStep = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            runId,
            stepNumber,
            action,
            toolName,
            input
        } = req.body;

        if (!runId || !stepNumber || !action) {
            return res.status(400).json({
                message: "runId, stepNumber and action are required"
            });
        }

        const step = await AgentStep.create({
            runId,
            stepNumber,
            action,
            toolName,
            input
        });

        res.status(201).json({
            message: "Agent step created successfully",
            step
        });
    } catch (error) {
        console.error("Error creating agent step:", error);

        res.status(500).json({
            message: "Failed to create agent step"
        });
    }
};