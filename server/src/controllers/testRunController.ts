import { Request, Response } from "express";
import TestRun from "../models/TestRun.js";

export const createTestRun = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            runId,
            command
        } = req.body;

        if (!runId || !command) {
            return res.status(400).json({
                message: "runId and command are required"
            });
        }

        const testRun = await TestRun.create({
            runId,
            command
        });

        res.status(201).json({
            message: "Test run created successfully",
            testRun
        });
    } catch (error) {
        console.error("Error creating test run:", error);

        res.status(500).json({
            message: "Failed to create test run"
        });
    }
};