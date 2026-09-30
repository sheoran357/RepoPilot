import mongoose, { Schema, Document } from "mongoose";

export interface IAgentStep extends Document {
    runId: mongoose.Types.ObjectId;
    stepNumber: number;
    action: string;
    toolName?: string;
    input?: string;
    output?: string;
    status: string;
}

const agentStepSchema = new Schema<IAgentStep>(
    {
        runId: {
            type: Schema.Types.ObjectId,
            ref: "AgentRun",
            required: true
        },

        stepNumber: {
            type: Number,
            required: true
        },

        action: {
            type: String,
            required: true
        },

        toolName: {
            type: String
        },

        input: {
            type: String
        },

        output: {
            type: String
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "RUNNING",
                "COMPLETED",
                "FAILED"
            ],
            default: "PENDING"
        }
    },
    {
        timestamps: true
    }
);

const AgentStep = mongoose.model<IAgentStep>(
    "AgentStep",
    agentStepSchema
);

export default AgentStep;