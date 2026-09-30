import { Request, Response } from "express";
import PullRequest from "../models/PullRequest.js";

export const createPullRequest = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            runId,
            repositoryId,
            number,
            title,
            url
        } = req.body;

        if (
            !runId ||
            !repositoryId ||
            !number ||
            !title ||
            !url
        ) {
            return res.status(400).json({
                message: "Required fields are missing"
            });
        }

        const pullRequest = await PullRequest.create({
            runId,
            repositoryId,
            number,
            title,
            url
        });

        res.status(201).json({
            message: "Pull request recorded successfully",
            pullRequest
        });
    } catch (error) {
        console.error("Error creating pull request:", error);

        res.status(500).json({
            message: "Failed to create pull request"
        });
    }
};