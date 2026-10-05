import { Request, Response } from "express";
import FileChange from "../models/FileChange.js";

export const approveChange = async (
    req: Request,
    res: Response
) => {
    try {
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

        if (change.status !== "PENDING") {
            return res.status(400).json({
                message: `Cannot approve change with status ${change.status}`
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