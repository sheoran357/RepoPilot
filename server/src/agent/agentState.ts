export interface AgentState {
    taskId: string;

    runId: string;

    goal: string;

    currentStep: number;

    status: string;

    plan: string[];

    observations: string[];

    filesInspected: string[];

    searchResults: {
        name: string;
        path: string;
        url: string;
    }[];

    toolHistory: {
        toolName: string;
        input: any;
        output: any;
    }[];
}