import mongoose, { Schema, Document } from "mongoose";

export interface IExecution extends Document {
    runId: mongoose.Types.ObjectId;
    command: string;
    status:
        | "PENDING"
        | "RUNNING"
        | "COMPLETED"
        | "FAILED";
    stdout?: string;
    stderr?: string;
    exitCode?: number | null;
    duration?: number;
}

const executionSchema = new Schema<IExecution>(
    {
        runId: {
            type: Schema.Types.ObjectId,
            ref: "AgentRun",
            required: true
        },
        command: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["PENDING","RUNNING","COMPLETED","FAILED"],
            default: "PENDING"
        },
        stdout: {
            type: String,
            default: ""
        },
        stderr: {
            type: String,
            default: ""
        },
        exitCode: {
            type: Number,
            default: null
        },
        duration: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

const Execution = mongoose.model<IExecution>(
    "Execution",
    executionSchema
);

export default Execution;
