import { Request, Response } from "express";
import Repository from "../models/Repository.js";

export const createRepository = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            userId,
            githubId,
            name,
            fullName,
            url,
            defaultBranch
        } = req.body;

        if (
            !userId ||
            !githubId ||
            !name ||
            !fullName ||
            !url
        ) {
            return res.status(400).json({
                message: "Required fields are missing"
            });
        }

        const repository = await Repository.create({
            userId,
            githubId,
            name,
            fullName,
            url,
            defaultBranch
        });

        res.status(201).json({
            message: "Repository created successfully",
            repository
        });
    } catch (error) {
        console.error("Error creating repository:", error);

        res.status(500).json({
            message: "Failed to create repository"
        });
    }
};