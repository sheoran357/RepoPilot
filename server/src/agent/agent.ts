import { AgentState } from "./agentState.js";

export class Agent {
    private state: AgentState;

    constructor(state: AgentState) {
        this.state = state;
    }

    getState() {
        return this.state;
    }

    updateStep() {
        this.state.currentStep += 1;
    }

    addObservation(
        observation: string
    ) {
        this.state.observations.push(
            observation
        );
    }

    addInspectedFile(
        filePath: string
    ) {
        if (
            !this.state.filesInspected.includes(
                filePath
            )
        ) {
            this.state.filesInspected.push(
                filePath
            );
        }
    }

    setPlan(plan: string[]) {
        this.state.plan = plan;
    }

    addToolHistory(
        toolName: string,
        input: any,
        output: any
    ) {
        this.state.toolHistory.push({
            toolName,
            input,
            output
        });
    }

    complete() {
        this.state.status = "COMPLETED";
    }

    fail() {
        this.state.status = "FAILED";
    }
}