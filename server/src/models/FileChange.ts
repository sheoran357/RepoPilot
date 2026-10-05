import mongoose, { Schema, Document } from "mongoose";

export interface IFileChange extends Document {
    runId: mongoose.Types.ObjectId;
    filePath: string;

    changeType: "ADDED" | "MODIFIED" | "DELETED";

    oldContent?: string;
    newContent?: string;

    additions: number;
    deletions: number;

    diff: string;

    status:
        | "PENDING"
        | "APPROVED"
        | "REJECTED"
        | "APPLIED";
}

const fileChangeSchema = new Schema<IFileChange>(
    {
        runId: {
            type: Schema.Types.ObjectId,
            ref: "AgentRun",
            required: true
        },

        filePath: {
            type: String,
            required: true
        },

        changeType: {
            type: String,
            enum: ["ADDED", "MODIFIED", "DELETED"],
            required: true
        },

        oldContent: {
            type: String
        },

        newContent: {
            type: String
        },

        additions: {
            type: Number,
            default: 0
        },

        deletions: {
            type: Number,
            default: 0
        },

        diff: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "APPROVED",
                "REJECTED",
                "APPLIED"
            ],
            default: "PENDING"
        }
    },
    {
        timestamps: true
    }
);

const FileChange = mongoose.model<IFileChange>(
    "FileChange",
    fileChangeSchema
);

export default FileChange;