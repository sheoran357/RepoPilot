import {
    runCommand as executeCommand
} from "../services/executionService.js";

export const runCommand = async (
    runId: string,
    command: string,
    workingDirectory: string
) => {
    return await executeCommand(
        runId,
        command,
        workingDirectory
    );
};
