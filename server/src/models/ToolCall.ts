import mongoose, { Schema, Document } from "mongoose";

export interface IToolCall extends Document {
    runId: mongoose.Types.ObjectId;
    toolName: string;
    input?: string;
    output?: string;
    status: string;
}

const toolCallSchema = new Schema<IToolCall>(
    {
        runId: {
            type: Schema.Types.ObjectId,
            ref: "AgentRun",
            required: true
        },

        toolName: {
            type: String,
            required: true
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
                "SUCCESS",
                "FAILED"
            ],
            default: "PENDING"
        }
    },
    {
        timestamps: true
    }
);

const ToolCall = mongoose.model<IToolCall>(
    "ToolCall",
    toolCallSchema
);

export default ToolCall;