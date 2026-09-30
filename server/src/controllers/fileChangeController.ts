import { Request, Response } from "express";
import FileChange from "../models/FileChange.js";

export const createFileChange = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            runId,
            filePath,
            changeType,
            additions,
            deletions,
            diff
        } = req.body;

        if (!runId || !filePath || !changeType) {
            return res.status(400).json({
                message: "runId, filePath and changeType are required"
            });
        }

        const fileChange = await FileChange.create({
            runId,
            filePath,
            changeType,
            additions,
            deletions,
            diff
        });

        res.status(201).json({
            message: "File change recorded successfully",
            fileChange
        });
    } catch (error) {
        console.error("Error recording file change:", error);

        res.status(500).json({
            message: "Failed to record file change"
        });
    }
};