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
    workingDirectory?: string;
}

const MAX_STEPS = 8;

const allowedTools = [
    "search_code",
    "get_file",
    "list_files",
    "edit_file",
    "create_file",
    "delete_file",
    "run_command"
];

const codingTools = [
    "edit_file",
    "create_file",
    "delete_file"
];

const requiresCodeChange = (goal: string) => {
    const noCodeChangeRequested =
        /\b(do not|don't|without|no)\b[\s\S]{0,60}\b(modif\w*|change\w*|edit\w*|create\w*|delete\w*)\b/i.test(
            goal
        );

    if (noCodeChangeRequested) {
        return false;
    }

    return /\b(add|change|edit|modify|update|fix|create|delete|remove|implement|refactor|replace)\b/i.test(
        goal
    );
};


const isReadOnlyTask = (goal: string) => {
    return (
        /\bread[- ]only\b/i.test(goal) ||
        /\b(?:do not|don't|never)\b[\s\S]{0,100}\b(?:modify|change|edit|create|delete|write|apply)\b/i.test(goal) ||
        /\bwithout\b[\s\S]{0,50}\b(?:changes?|modifications?|edits?)\b/i.test(goal) ||
        /\bno\s+(?:file\s+)?(?:changes?|modifications?|edits?)\b/i.test(goal)
    );
};

export const runAgentLoop = async (
    agent: Agent,
    input: AgentLoopInput
) => {
    const state = agent.getState();

    try {
        // Create initial plan
        const plan = await createPlan(
            state.goal
        );

        agent.setPlan(plan);

        agent.addObservation(
            "Initial investigation plan created."
        );

        // Agent loop
        let repeatedActionCount = 0;
        let blockedReadOnlyActionCount = 0;

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

            // Finish
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

            // Validate tool
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

            // Enforce read-only intent at the execution boundary. Prompt instructions
            // alone are not sufficient to prevent a small local model from proposing edits.
            if (
                isReadOnlyTask(state.goal) &&
                codingTools.includes(decision.toolName)
            ) {
                blockedReadOnlyActionCount++;

                agent.addObservation(
                    `Blocked ${decision.toolName}: this task is read-only, so no file changes are allowed.`
                );

                if (blockedReadOnlyActionCount >= 2) {
                    agent.addObservation(
                        "Stopped safely after the model repeatedly selected a coding tool for a read-only task."
                    );
                    agent.complete();
                    break;
                }

                continue;
            }

            blockedReadOnlyActionCount = 0;

            if (!decision.input) {
                throw new Error(
                    "LLM did not provide tool input"
                );
            }

            // Prevent repeated tool calls
            const previousCalls =
                state.toolHistory.filter(
                    (history) =>
                        history.toolName ===
                            decision.toolName &&
                        JSON.stringify(history.input) ===
                            JSON.stringify(decision.input)
                );

            if (previousCalls.length > 0) {
                repeatedActionCount++;

                agent.addObservation(
                    `The tool ${decision.toolName} with the same input was already executed. Choose a different useful action.`
                );

                if (repeatedActionCount >= 2) {
                    throw new Error(
                        `Agent repeatedly selected the same tool and input: ${decision.toolName}`
                    );
                }

                continue;
            }

            repeatedActionCount = 0;

            // Update step
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

            // Create AgentStep
            const step =
                await startAgentStep(
                    state.runId,
                    state.currentStep,
                    decision.reason,
                    decision.toolName,
                    decision.input
                );

            try {
                // Execute tool
                const result =
                    await runTool(
                        state.runId,
                        decision.toolName,
                        decision.input,
                        {
                            ...input,
                            workingDirectory:
                                input.workingDirectory ||
                                process.env.EXECUTION_WORKSPACE
                        }
                    );

                // Save tool history
                agent.addToolHistory(
                    decision.toolName,
                    decision.input,
                    result
                );

                // Save useful observation
                const resultText =
                    typeof result === "string"
                        ? result
                        : JSON.stringify(result);

                const observationMessage =
                    result?.success === false
                        ? `Tool ${decision.toolName} reported failure. Use the returned output to decide whether to diagnose or stop. Result: ${resultText}`
                        : result?.success === true
                            ? `Tool ${decision.toolName} executed successfully. Result: ${resultText}`
                            : `Tool ${decision.toolName} completed and returned a result. Result: ${resultText}`;

                agent.addObservation(
                    observationMessage
                );

                // Complete step
                await completeAgentStep(
                    step,
                    result
                );

                // A successful command completes the run.
                // Do not ask the LLM for another command.
                if (
                    decision.toolName === "run_command" &&
                    result?.success === true
                ) {
                    agent.addObservation(
                        "The requested command completed successfully. The agent run is complete."
                    );

                    agent.complete();

                    break;
                }

                // Last-step protection
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

        // Safety check
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