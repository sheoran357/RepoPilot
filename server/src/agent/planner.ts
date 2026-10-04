import { askLLM } from "../services/llmService.js";

import {
    toolDefinitions
} from "./toolDefinitions.js";


interface PlannerInput {
    goal: string;

    plan: string[];

    observations: string[];

    toolHistory: {
        toolName: string;
        input: any;
        output: any;
    }[];
}


export interface PlannerDecision {
    action: "tool" | "finish";

    toolName?: string;

    input?: any;

    reason: string;
}


const parseJSON = (text: string) => {

    try {

        return JSON.parse(text);

    } catch {

        const cleanedText = text
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        try {

            return JSON.parse(cleanedText);

        } catch {

            console.error(
                "Invalid JSON returned by LLM:"
            );

            console.error(text);

            throw new Error(
                "LLM returned invalid JSON"
            );
        }
    }
};


export const createPlan = async (
    goal: string
): Promise<string[]> => {

    const systemPrompt = `
You are RepoPilot, an AI software engineering agent.

Create a short investigation plan for the task.

You are currently only allowed to inspect
the repository.

Do not modify any files.

The investigation should focus only on
information relevant to the task.

Create a small number of useful steps.
Do not create unnecessary investigation steps.

Return ONLY valid JSON.

Do not use Markdown code fences.

The response MUST follow exactly this format:

{
    "plan": [
        "step 1",
        "step 2",
        "step 3"
    ]
}

The "plan" field must be an array of strings.
`;


    const userPrompt = `
Task:

${goal}
`;


    const response =
        await askLLM(
            systemPrompt,
            userPrompt
        );


    const result =
        parseJSON(response);


    if (
        !result.plan ||
        !Array.isArray(result.plan)
    ) {

        throw new Error(
            "LLM returned an invalid plan"
        );
    }


    return result.plan;
};


export const getNextAction = async (
    input: PlannerInput
): Promise<PlannerDecision> => {

    const systemPrompt = `
You are RepoPilot, an AI software engineering agent.

Your job is to inspect a GitHub repository
to understand a software engineering task.

You are currently in the repository investigation phase.

You MUST follow the action format exactly.

Available tools:

${JSON.stringify(
    toolDefinitions,
    null,
    2
)}

IMPORTANT ACTION FORMAT:

There are only TWO possible values for
the "action" field:

1. "tool"
2. "finish"

NEVER put a tool name in the "action" field.

The tool name MUST always go inside
the "toolName" field.


CORRECT:

{
    "action": "tool",
    "toolName": "get_file",
    "input": {
        "path": "README.md"
    },
    "reason": "I need to read the README."
}


INCORRECT:

{
    "action": "get_file",
    "toolName": "get_file",
    "input": {
        "path": "README.md"
    },
    "reason": "I need to read the README."
}

The above INCORRECT format must NEVER be used.


AVAILABLE TOOL NAMES:

Only use tools that appear in the
provided tool definitions.

Never invent a tool name.


INVESTIGATION RULES:

1. Do not modify files.

2. Focus only on information relevant
   to the current task.

3. Use list_files first when repository
   structure is not known.

4. Use get_file only when the file path
   is known from previous tool results.

5. Use search_code when you need to locate
   relevant code.

6. Review previous tool results before
   selecting another tool.

7. Do not invent file paths.

8. Do not investigate unrelated technologies,
   directories, or files.

9. Do not repeat the same tool call with
   the same input.

10. Only use another tool when it provides
    genuinely new information.

11. When enough information has been collected,
    immediately use the "finish" action.

12. You do NOT need to inspect the entire
    repository.

13. Do not keep investigating just because
    tools are available.

14. If the previous tool results already provide
    enough information to understand the task,
    choose "finish".

15. If there is no important missing information,
    choose "finish".


FINISH RULE:

When you have enough information to understand
the task, return:

{
    "action": "finish",
    "reason": "I have collected enough relevant information to complete the investigation."
}

Do NOT call another tool after reaching this point.


TOOL ACTION FORMAT:

{
    "action": "tool",
    "toolName": "<one of the available tools>",
    "input": {},
    "reason": "<short explanation>"
}


FINISH ACTION FORMAT:

{
    "action": "finish",
    "reason": "<short explanation>"
}


EXAMPLE 1 - LIST FILES:

{
    "action": "tool",
    "toolName": "list_files",
    "input": {},
    "reason": "I need to inspect the repository structure."
}


EXAMPLE 2 - GET FILE:

{
    "action": "tool",
    "toolName": "get_file",
    "input": {
        "path": "README.md"
    },
    "reason": "I need to read the README to understand the project."
}


EXAMPLE 3 - SEARCH CODE:

{
    "action": "tool",
    "toolName": "search_code",
    "input": {
        "searchTerm": "agent"
    },
    "reason": "I need to find code related to the agent."
}


EXAMPLE 4 - FINISH:

{
    "action": "finish",
    "reason": "I have collected enough relevant information about the repository."
}


FINAL REQUIREMENTS:

- Return ONLY valid JSON.
- Do NOT use Markdown code fences.
- action must be exactly "tool" or "finish".
- toolName must contain the actual tool name.
- Never put a tool name in action.
- Always include reason.
- Always include input when action is "tool".
`;


    const userPrompt = `
Task:

${input.goal}


Current plan:

${JSON.stringify(
    input.plan,
    null,
    2
)}


Previous observations:

${JSON.stringify(
    input.observations,
    null,
    2
)}


Previous tool calls and results:

${JSON.stringify(
    input.toolHistory,
    null,
    2
)}


IMPORTANT:

You have already performed the tool calls
shown above.

Use their results before deciding what to do next.

Do not repeat a tool call with the same input.

Do not invent file paths.

Do not inspect unrelated files.

Only select another tool if important information
is still missing.

If enough information has been collected,
return the "finish" action immediately.


Choose exactly ONE next action.

Remember:

- If using a tool, action MUST be "tool".
- The actual tool name MUST be in "toolName".
- If finished, action MUST be "finish".
- Never use a tool name as the value of "action".
- Return ONLY valid JSON.
`;


    const response =
        await askLLM(
            systemPrompt,
            userPrompt
        );


    const result =
        parseJSON(response);


    // ---------------------------------
    // Validate action
    // ---------------------------------

    if (
        result.action !== "tool" &&
        result.action !== "finish"
    ) {

        console.error(
            "Invalid action returned by LLM:",
            result
        );

        throw new Error(
            "LLM returned an invalid action"
        );
    }


    // ---------------------------------
    // Validate finish action
    // ---------------------------------

    if (
        result.action === "finish"
    ) {

        if (!result.reason) {

            throw new Error(
                "LLM did not provide a finish reason"
            );
        }

        return {
            action: "finish",
            reason: result.reason
        };
    }


    // ---------------------------------
    // Validate tool action
    // ---------------------------------

    if (
        result.action === "tool" &&
        !result.toolName
    ) {

        throw new Error(
            "LLM selected tool action without a tool name"
        );
    }


    // ---------------------------------
    // Validate tool name
    // ---------------------------------

    if (
        result.action === "tool" &&
        !toolDefinitions.some(
            (tool: any) =>
                tool.name === result.toolName
        )
    ) {

        console.error(
            "Unknown tool returned by LLM:",
            result.toolName
        );

        throw new Error(
            `LLM selected an unknown tool: ${result.toolName}`
        );
    }


    // ---------------------------------
    // Validate tool input
    // ---------------------------------

    if (
        result.action === "tool" &&
        result.input === undefined
    ) {

        throw new Error(
            "LLM did not provide tool input"
        );
    }


    // ---------------------------------
    // Validate reason
    // ---------------------------------

    if (!result.reason) {

        throw new Error(
            "LLM did not provide a reason"
        );
    }


    return {
        action: "tool",
        toolName: result.toolName,
        input: result.input,
        reason: result.reason
    };
};