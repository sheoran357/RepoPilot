import { Request, Response } from "express";
import crypto from "crypto";

import Repository from "../models/Repository.js";
import Task from "../models/Task.js";

interface WebhookRequest extends Request {
    rawBody?: Buffer;
}

const verifySignature = (
    payload: Buffer,
    signature: string
) => {
    const secret =
        process.env.GITHUB_WEBHOOK_SECRET;

    if (!secret) {
        throw new Error(
            "GITHUB_WEBHOOK_SECRET is missing"
        );
    }

    const expectedSignature =
        "sha256=" +
        crypto
            .createHmac("sha256", secret)
            .update(payload)
            .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
    );
};

export const handleGithubWebhook = async (
    req: WebhookRequest,
    res: Response
) => {
    try {
        const signature =
            req.headers["x-hub-signature-256"];

        if (
            typeof signature !== "string" ||
            !req.rawBody
        ) {
            return res.status(401).json({
                message: "Invalid webhook request"
            });
        }

        const isValid =
            verifySignature(
                req.rawBody,
                signature
            );

        if (!isValid) {
            return res.status(401).json({
                message: "Invalid webhook signature"
            });
        }

        const event =
            req.headers["x-github-event"];

        const payload = req.body;

        console.log(
            "GitHub event:",
            event
        );

        if (
            event !== "issues" ||
            payload.action !== "opened"
        ) {
            return res.status(200).json({
                message: "Event ignored"
            });
        }

        const githubRepositoryId =
            payload.repository.id;

        const repository =
            await Repository.findOne({
                githubId: githubRepositoryId
            });

        if (!repository) {
            return res.status(404).json({
                message:
                    "Repository is not connected to RepoPilot"
            });
        }

        const issue =
            payload.issue;

        const existingTask =
            await Task.findOne({
                repositoryId: repository._id,
                issueNumber: issue.number
            });

        if (existingTask) {
            return res.status(200).json({
                message: "Task already exists",
                task: existingTask
            });
        }

        const task = await Task.create({
            userId: repository.userId,
            repositoryId: repository._id,
            issueNumber: issue.number,
            title: issue.title,
            description: issue.body || "",
            status: "PENDING"
        });

        console.log(
            `Created task for GitHub issue #${issue.number}`
        );

        return res.status(201).json({
            message: "Task created from GitHub issue",
            task
        });
    } catch (error) {
        console.error(
            "GitHub webhook error:",
            error
        );

        return res.status(500).json({
            message: "Webhook processing failed"
        });
    }
};