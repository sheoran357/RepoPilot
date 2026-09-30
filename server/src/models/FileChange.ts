import mongoose, { Schema, Document } from "mongoose";

export interface IFileChange extends Document {
    runId: mongoose.Types.ObjectId;
    filePath: string;
    changeType: string;
    additions: number;
    deletions: number;
    diff?: string;
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
            enum: [
                "ADDED",
                "MODIFIED",
                "DELETED"
            ],
            required: true
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
            type: String
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