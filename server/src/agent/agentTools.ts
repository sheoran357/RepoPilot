import {
    listRepositoryFiles,
    getFile,
    searchCode
} from "../tools/githubTool.js";

export interface ToolContext {
    accessToken: string;
    owner: string;
    repo: string;
}

export const executeTool = async (
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
                context.repo
            );

        default:
            throw new Error(
                `Unknown tool: ${toolName}`
            );
    }
};