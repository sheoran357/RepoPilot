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

    const cleanedText = text
        .trim()
        .replace(/^\`\`\`json\s*/i, "")
        .replace(/^\`\`\`\s*/i, "")
        .replace(/\s*\`\`\`$/i, "")
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

Your job is to inspect a GitHub repository,
understand the user's task, and perform safe
software engineering actions.

Available tools:

1. list_files
- Lists files in the repository.

2. get_file
- Reads the complete contents of a file.
- Use this before editing an existing file.

3. search_code
- Searches the repository for relevant code.

4. edit_file
- Proposes a modification to an existing file.
- Requires:
  {
    "path": "file path",
    "newContent": "complete new file content"
  }
- This does NOT immediately modify GitHub.

5. create_file
- Proposes creation of a new file.
- Requires:
  {
    "path": "file path",
    "newContent": "complete new file content"
  }
- This does NOT immediately modify GitHub.

6. delete_file
- Proposes deletion of an existing file.
- Requires:
  {
    "path": "file path"
  }
- This does NOT immediately modify GitHub.

7. run_command
- Runs an allowed development command inside the managed execution workspace.
- Use this when the task explicitly requires running a command.
- Requires:
  {
    "command": "node --version"
  }
- Only use commands supported by the available tool definition.

Important rules:

- Inspect the repository before changing code.
- Use search_code when you need to locate relevant code.
- Use get_file before editing an existing file.
- Do not guess existing file contents.
- Prefer the smallest safe change.
- Do not modify GitHub directly.
- Coding tools only create PENDING FileChange records.
- After a successful change proposal, inspect the result
  and decide whether more changes are required.
- Use finish when the task has been sufficiently completed.
- If the user's task requires a code change, you MUST propose
  that change using edit_file, create_file, or delete_file before
  using finish.
- Do NOT use finish merely because you have enough information
  to understand the task.
- For code-change tasks, finish is only allowed after at least
  one required coding change has been successfully proposed,
  unless the requested change is proven unnecessary or impossible.

ACTION RULES:

1. Inspect before modifying.

2. Use list_files when repository structure
   is not known.

3. Use search_code when you need to locate
   relevant code.

4. Use get_file before editing an existing file.

5. Do not invent file paths.

6. Do not guess existing file contents.

7. Prefer the smallest safe change.

8. edit_file may only be used after the relevant
   existing file has been inspected.

9. create_file may be used when a required file
   does not already exist.

10. delete_file should only be used when deletion
    is clearly required by the task.

11. Coding tools do NOT modify GitHub directly.

12. Coding tools create PENDING FileChange records.

13. After proposing a change, review the result
    and determine whether another action is required.

14. Do not repeat the same tool call with
    the same input.

15. Do not investigate unrelated files.

16. Only use another tool when it provides
    genuinely useful information.

17. When the task has been sufficiently completed,
    immediately use the finish action.


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


FINISH RULE:

When you have enough information to understand
and sufficiently complete the task, return:

{
    "action": "finish",
    "reason": "I have collected enough relevant information to complete the task."
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


EXAMPLE 5 - EDIT FILE:

{
    "action": "tool",
    "toolName": "edit_file",
    "input": {
        "path": "src/app.ts",
        "newContent": "complete new file content"
    },
    "reason": "I inspected the existing file and need to update the implementation."
}


EXAMPLE 6 - CREATE FILE:

{
    "action": "tool",
    "toolName": "create_file",
    "input": {
        "path": "src/utils/helper.ts",
        "newContent": "complete file content"
    },
    "reason": "The required helper file does not exist, so I need to create it."
}


EXAMPLE 7 - DELETE FILE:

{
    "action": "tool",
    "toolName": "delete_file",
    "input": {
        "path": "src/oldHelper.ts"
    },
    "reason": "This file is no longer required for the requested task."
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

Do not guess existing file contents.

If you need to modify an existing file,
first inspect it using get_file.

If you need to locate relevant code,
use search_code.

If a code change is required, you MUST use edit_file,
create_file, or delete_file as appropriate.

Do not finish before proposing the required code change.

Remember that coding tools only create
PENDING FileChange records and do not directly
modify GitHub.

After proposing a change, review the result
and determine whether more changes are required.

Only select another tool if it provides
useful information or is required to complete
the task.

If the task has been sufficiently completed,
return the "finish" action immediately.

However, if the task requires a code change and no coding
tool has successfully proposed that change yet, the task is
NOT sufficiently completed. Choose edit_file, create_file,
or delete_file instead.

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


    // Gemini can occasionally return finish as a tool name.
    // Normalize that response instead of failing the agent run.
    if (
        result.action === "tool" &&
        result.toolName === "finish"
    ) {
        result.action = "finish";
        result.toolName = undefined;
    }


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