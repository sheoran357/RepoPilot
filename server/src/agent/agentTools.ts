import {
    listRepositoryFiles,
    getFile,
    searchCode
} from "../tools/githubTool.js";

import {
    editFile,
    createFile,
    deleteFile
} from "../tools/codingTool.js";

import {
    runCommand
} from "../tools/executionTool.js";


export interface ToolContext {
    accessToken: string;
    owner: string;
    repo: string;
    workingDirectory?: string;
}


export const executeTool = async (
    runId: string,
    toolName: string,
    input: any,
    context: ToolContext
) => {

    switch (toolName) {

        case "search_code":
            return await searchCode(
                context.accessToken,
                context.owner,
                context.repo,
                input.searchTerm
            );

        case "get_file":
            return await getFile(
                context.accessToken,
                context.owner,
                context.repo,
                input.path
            );

        case "list_files":
            return await listRepositoryFiles(
                context.accessToken,
                context.owner,
                context.repo,
                input.path || ""
            );

        case "edit_file":
            return await editFile(
                runId,
                context.accessToken,
                context.owner,
                context.repo,
                input.path,
                input.newContent
            );

        case "create_file":
            return await createFile(
                runId,
                input.path,
                input.newContent
            );

        case "delete_file":
            return await deleteFile(
                runId,
                context.accessToken,
                context.owner,
                context.repo,
                input.path
            );

        case "run_command":
            if (!context.workingDirectory) {
                throw new Error(
                    "Execution workspace is not configured"
                );
            }

            return await runCommand(
                runId,
                input.command,
                context.workingDirectory
            );

        default:
            throw new Error(
                `Unknown tool: ${toolName}`
            );
    }
};
