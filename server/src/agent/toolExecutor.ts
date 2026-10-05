import ToolCall from "../models/ToolCall.js";

import {
    executeTool,
    ToolContext
} from "./agentTools.js";


export const runTool = async (
    runId: string,
    toolName: string,
    input: any,
    context: ToolContext
) => {

    const toolCall = await ToolCall.create({
        runId,
        toolName,
        input: JSON.stringify(input),
        status: "RUNNING"
    });

    try {

        const result = await executeTool(
            runId,
            toolName,
            input,
            context
        );

        toolCall.output =
            JSON.stringify(result);

        toolCall.status = "COMPLETED";

        await toolCall.save();

        return result;

    } catch (error) {

        toolCall.output =
            error instanceof Error
                ? error.message
                : "Unknown error";

        toolCall.status = "FAILED";

        await toolCall.save();

        throw error;
    }
};