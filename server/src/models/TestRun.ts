import mongoose, { Schema, Document } from "mongoose";

export interface ITestRun extends Document {
    runId: mongoose.Types.ObjectId;
    command: string;
    status: string;
    output?: string;
    duration?: number;
}

const testRunSchema = new Schema<ITestRun>(
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
            enum: [
                "RUNNING",
                "PASSED",
                "FAILED"
            ],
            default: "RUNNING"
        },

        output: {
            type: String
        },

        duration: {
            type: Number
        }
    },
    {
        timestamps: true
    }
);

const TestRun = mongoose.model<ITestRun>(
    "TestRun",
    testRunSchema
);

export default TestRun;