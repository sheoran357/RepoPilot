import { Agent } from "./agent.js";

import {
    runTool
} from "./toolExecutor.js";

import {
    startAgentStep,
    completeAgentStep,
    failAgentStep
} from "./stepLogger.js";

import {
    createPlan,
    getNextAction
} from "./planner.js";

interface AgentLoopInput {
    accessToken: string;
    owner: string;
    repo: string;
}

const MAX_STEPS = 8;
const allowedTools = [
    "search_code",
    "get_file",
    "list_files",
    "edit_file",
    "create_file",
    "delete_file"
];

const codingTools = [
    "edit_file",
    "create_file",
    "delete_file"
];

const requiresCodeChange = (goal: string) => {
    return /\b(add|change|edit|modify|update|fix|create|delete|remove|implement|refactor|replace)\b/i.test(
        goal
    );
};

export const runAgentLoop = async (
    agent: Agent,
    input: AgentLoopInput
) => {

    const state = agent.getState();

    try {

        // -----------------------------
        // Create initial plan
        // -----------------------------

        const plan = await createPlan(
            state.goal
        );

        agent.setPlan(plan);

        agent.addObservation(
            "Initial investigation plan created."
        );

        // -----------------------------
        // Agent loop
        // -----------------------------

        while (
            state.currentStep < MAX_STEPS
        ) {

            const decision =
                await getNextAction({
                    goal: state.goal,

                    plan: state.plan,

                    observations:
                        state.observations,

                    toolHistory:
                        state.toolHistory
                });

            // -----------------------------
            // Finish
            // -----------------------------

            if (
                decision.action === "finish"
            ) {

                const hasCodingTool =
                    state.toolHistory.some(
                        (history) =>
                            codingTools.includes(
                                history.toolName
                            )
                    );

                if (
                    requiresCodeChange(state.goal) &&
                    !hasCodingTool
                ) {
                    agent.addObservation(
                        "Finish was rejected because this task requires a code change and no coding tool has successfully proposed one yet."
                    );

                    continue;
                }

                agent.addObservation(
                    `Agent finished investigation: ${decision.reason}`
                );

                agent.complete();

                break;
            }

            // -----------------------------
            // Validate tool
            // -----------------------------

            if (!decision.toolName) {
                throw new Error(
                    "LLM did not provide a tool"
                );
            }

            if (
                !allowedTools.includes(
                    decision.toolName
                )
            ) {
                throw new Error(
                    `Tool not allowed: ${decision.toolName}`
                );
            }

            if (!decision.input) {
                throw new Error(
                    "LLM did not provide tool input"
                );
            }

            // -----------------------------
            // Prevent repeated tool calls
            // -----------------------------

            const previousCalls =
                state.toolHistory.filter(
                    (history) =>
                        history.toolName ===
                            decision.toolName &&
                        JSON.stringify(history.input) ===
                            JSON.stringify(decision.input)
                );

            if (previousCalls.length > 0) {

                agent.addObservation(
                    `The tool ${decision.toolName} with the same input was already executed. Choose a different useful action.`
                );

                continue;
            }

            // -----------------------------
            // Update step
            // -----------------------------

            agent.updateStep();

            console.log(
                `Agent step ${state.currentStep}/${MAX_STEPS}`
            );

            console.log(
                "Selected tool:",
                decision.toolName
            );

            console.log(
                "Tool input:",
                decision.input
            );

            // -----------------------------
            // Create AgentStep
            // -----------------------------

            const step =
                await startAgentStep(
                    state.runId,

                    state.currentStep,

                    decision.reason,

                    decision.toolName,

                    decision.input
                );

            try {

                // -----------------------------
                // Execute tool
                // -----------------------------

                const result =
                    await runTool(
                        state.runId,

                        decision.toolName,

                        decision.input,

                        input
                    );

                // -----------------------------
                // Save tool history
                // -----------------------------

                agent.addToolHistory(
                    decision.toolName,

                    decision.input,

                    result
                );

                // -----------------------------
                // Save useful observation
                // -----------------------------

                const resultText =
                    typeof result === "string"
                        ? result
                        : JSON.stringify(result);

                agent.addObservation(
                    `Tool ${decision.toolName} executed successfully. Result: ${resultText}`
                );

                // -----------------------------
                // Complete step
                // -----------------------------

                await completeAgentStep(
                    step,
                    result
                );

                // -----------------------------
                // Last-step protection
                // -----------------------------

                if (
                    state.currentStep >=
                    MAX_STEPS
                ) {

                    const hasCodingTool =
                        state.toolHistory.some(
                            (history) =>
                                codingTools.includes(
                                    history.toolName
                                )
                        );

                    if (
                        requiresCodeChange(state.goal) &&
                        !hasCodingTool
                    ) {
                        throw new Error(
                            "Agent reached the step limit before proposing the required code change"
                        );
                    }

                    agent.addObservation(
                        "Investigation step limit reached. Completing the agent run with the information collected so far."
                    );

                    agent.complete();

                    break;
                }

            } catch (error) {

                await failAgentStep(
                    step,
                    error
                );

                throw error;
            }
        }

        // -----------------------------
        // Safety check
        // -----------------------------

        if (
            state.status !== "COMPLETED" &&
            state.currentStep >= MAX_STEPS
        ) {

            agent.complete();
        }

        return state;

    } catch (error) {

        agent.fail();

        throw error;
    }
};