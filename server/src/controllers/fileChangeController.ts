import { Request, Response } from "express";

import FileChange from "../models/FileChange.js";


export const getRunChanges = async (
    req: Request,
    res: Response
) => {

    try {

        const { runId } = req.params;

        if (!runId) {

            return res.status(400).json({
                message: "runId is required"
            });
        }


        const changes =
            await FileChange.find({
                runId
            }).sort({
                createdAt: 1
            });


        return res.status(200).json({
            changes
        });

    } catch (error) {

        console.error(
            "Error fetching file changes:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch file changes"
        });
    }
};