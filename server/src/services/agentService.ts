import AgentRun from "../models/AgentRun.js";
import AgentStep from "../models/AgentStep.js";
import ToolCall from "../models/ToolCall.js";
import Task from "../models/Task.js";
import Repository from "../models/Repository.js";
import User from "../models/User.js";

import { Agent } from "../agent/agent.js";
import {
    runAgentLoop
} from "../agent/agentLoop.js";

export const startAgentRun = async (
    taskId: string,
    userId: string
) => {
    const task = await Task.findOne({
        _id: taskId,
        userId
    });

    if (!task) {
        throw new Error("Task not found");
    }

    const repository =
        await Repository.findById(
            task.repositoryId
        );

    if (!repository) {
        throw new Error(
            "Repository not found"
        );
    }

    const user =
        await User.findById(userId);

    if (
        !user ||
        !user.githubAccessToken
    ) {
        throw new Error(
            "GitHub account is not connected"
        );
    }


    const [owner, repo] =
        repository.fullName.split("/");

    const agentRun =
        await AgentRun.create({
            taskId: task._id,
            status: "RUNNING",
            startedAt: new Date(),
            tokensUsed: 0,
            executionTime: 0
        });

        
const state = {
    taskId: task._id.toString(),

    runId: agentRun._id.toString(),

    goal: `${task.title}

${task.description}`,

    currentStep: 0,

    status: "RUNNING",

    plan: [],

    observations: [],

    filesInspected: [],

    searchResults: [],

    toolHistory: []
};

    const agent =
        new Agent(state);

    const startTime = Date.now();

    try {
        const result =
            await runAgentLoop(
                agent,
                {
                    accessToken:
                        user.githubAccessToken,

                    owner,
                    repo
                }
            );

        /*
         * Save AgentStep records
         */

        for (
            let i = 0;
            i < result.currentStep;
            i++
        ) {
            await AgentStep.create({
                runId: agentRun._id,
                stepNumber: i + 1,
                action:
                    result.observations[i] ||
                    "Agent action",
                status: "COMPLETED"
            });
        }

        agentRun.status = "COMPLETED";

        agentRun.completedAt =
            new Date();

        agentRun.executionTime =
            Date.now() - startTime;

        await agentRun.save();

        return result;
    } catch (error) {
        agentRun.status = "FAILED";

        agentRun.completedAt =
            new Date();

        agentRun.executionTime =
            Date.now() - startTime;

        await agentRun.save();

        throw error;
    }
};