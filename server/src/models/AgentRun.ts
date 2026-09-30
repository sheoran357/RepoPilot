import mongoose, { Schema, Document } from "mongoose";

export interface IAgentRun extends Document {
    taskId: mongoose.Types.ObjectId;
    status: string;
    startedAt?: Date;
    completedAt?: Date;
    tokensUsed: number;
    executionTime: number;
}

const agentRunSchema = new Schema<IAgentRun>(
    {
        taskId: {
            type: Schema.Types.ObjectId,
            ref: "Task",
            required: true
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
        },

        startedAt: {
            type: Date
        },

        completedAt: {
            type: Date
        },

        tokensUsed: {
            type: Number,
            default: 0
        },

        executionTime: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

const AgentRun = mongoose.model<IAgentRun>(
    "AgentRun",
    agentRunSchema
);

export default AgentRun;