import mongoose, { Schema, Document } from "mongoose";

export interface IPullRequest extends Document {
    runId: mongoose.Types.ObjectId;
    repositoryId: mongoose.Types.ObjectId;
    number: number;
    title: string;
    url: string;
    status: string;
}

const pullRequestSchema = new Schema<IPullRequest>(
    {
        runId: {
            type: Schema.Types.ObjectId,
            ref: "AgentRun",
            required: true
        },

        repositoryId: {
            type: Schema.Types.ObjectId,
            ref: "Repository",
            required: true
        },

        number: {
            type: Number,
            required: true
        },

        title: {
            type: String,
            required: true
        },

        url: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: [
                "OPEN",
                "MERGED",
                "CLOSED"
            ],
            default: "OPEN"
        }
    },
    {
        timestamps: true
    }
);

const PullRequest = mongoose.model<IPullRequest>(
    "PullRequest",
    pullRequestSchema
);

export default PullRequest;