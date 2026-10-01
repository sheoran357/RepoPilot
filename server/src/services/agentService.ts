import AgentRun from "../models/AgentRun.js";
import AgentStep from "../models/AgentStep.js";
import ToolCall from "../models/ToolCall.js";
import Task from "../models/Task.js";
import Repository from "../models/Repository.js";
import User from "../models/User.js";

import {
    searchCode,
    getFile
} from "../tools/githubTool.js";


export const startAgentRun = async (
    taskId: string,
    userId: string
) => {

    const task = await Task.findById(taskId);

    if (!task) {
        throw new Error("Task not found");
    }

    console.log(
        "Task userId:",
        task.userId.toString()
    );

    console.log(
        "JWT userId:",
        userId
    );

    if (task.userId.toString() !== userId) {
        throw new Error(
            "You are not allowed to run this task"
        );
    }

    const repository = await Repository.findById(
        task.repositoryId
    );

    if (!repository) {
        throw new Error("Repository not found");
    }

    const user = await User.findById(
        task.userId
    );

    if (!user || !user.githubAccessToken) {
        throw new Error(
            "GitHub account is not connected"
        );
    }

    const [owner, repo] =
        repository.fullName.split("/");

    const startTime = Date.now();

    const agentRun = await AgentRun.create({
        taskId: task._id,
        status: "RUNNING",
        startedAt: new Date(),
        tokensUsed: 0,
        executionTime: 0
    });

    try {

        // STEP 1
        // Search the repository using the task title.

        const step1 = await AgentStep.create({
            runId: agentRun._id,
            stepNumber: 1,
            action: "SEARCH_CODE",
            toolName: "search_code",
            input: task.title,
            status: "RUNNING"
        });

        const searchResults = await searchCode(
            user.githubAccessToken,
            owner,
            repo,
            task.title
        );

        await ToolCall.create({
            runId: agentRun._id,
            toolName: "search_code",
            input: JSON.stringify({
                searchTerm: task.title
            }),
            output: JSON.stringify(searchResults),
            status: "COMPLETED"
        });

        step1.output =
            JSON.stringify(searchResults);

        step1.status = "COMPLETED";

        await step1.save();


        // STEP 2
        // Read the first matching file.

        if (searchResults.length > 0) {

            const firstFile =
                searchResults[0];

            const step2 =
                await AgentStep.create({
                    runId: agentRun._id,
                    stepNumber: 2,
                    action: "READ_FILE",
                    toolName: "get_file",
                    input: firstFile.path,
                    status: "RUNNING"
                });

            const file = await getFile(
                user.githubAccessToken,
                owner,
                repo,
                firstFile.path
            );

            await ToolCall.create({
                runId: agentRun._id,
                toolName: "get_file",
                input: JSON.stringify({
                    path: firstFile.path
                }),
                output: JSON.stringify(file),
                status: "COMPLETED"
            });

            step2.output =
                JSON.stringify(file);

            step2.status = "COMPLETED";

            await step2.save();
        }


        // COMPLETE AGENT RUN

        const executionTime =
            Date.now() - startTime;

        agentRun.status = "COMPLETED";

        agentRun.completedAt =
            new Date();

        agentRun.executionTime =
            executionTime;

        await agentRun.save();

        return agentRun;

    } catch (error) {

        const executionTime =
            Date.now() - startTime;

        agentRun.status = "FAILED";

        agentRun.completedAt =
            new Date();

        agentRun.executionTime =
            executionTime;

        await agentRun.save();

        throw error;
    }
};