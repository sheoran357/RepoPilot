import { Request, Response } from "express";
import ToolCall from "../models/ToolCall.js";

export const createToolCall = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            runId,
            toolName,
            input
        } = req.body;

        if (!runId || !toolName) {
            return res.status(400).json({
                message: "runId and toolName are required"
            });
        }

        const toolCall = await ToolCall.create({
            runId,
            toolName,
            input
        });

        res.status(201).json({
            message: "Tool call created successfully",
            toolCall
        });
    } catch (error) {
        console.error("Error creating tool call:", error);

        res.status(500).json({
            message: "Failed to create tool call"
        });
    }
};