import AgentStep from "../models/AgentStep.js";

export const startAgentStep = async (
    runId: string,
    stepNumber: number,
    action: string,
    toolName?: string,
    input?: any
) => {
    return await AgentStep.create({
        runId,
        stepNumber,
        action,
        toolName,
        input: input
            ? JSON.stringify(input)
            : undefined,
        status: "RUNNING"
    });
};

export const completeAgentStep = async (
    step: any,
    output: any
) => {
    step.output =
        JSON.stringify(output);

    step.status = "COMPLETED";

    await step.save();
};

export const failAgentStep = async (
    step: any,
    error: unknown
) => {
    step.output =
        error instanceof Error
            ? error.message
            : "Unknown error";

    step.status = "FAILED";

    await step.save();
};