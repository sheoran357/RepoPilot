import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
    userId: mongoose.Types.ObjectId;
    repositoryId: mongoose.Types.ObjectId;
    issueNumber?: number;
    title: string;
    description: string;
    status: string;
}

const taskSchema = new Schema<ITask>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        repositoryId: {
            type: Schema.Types.ObjectId,
            ref: "Repository",
            required: true
        },

        issueNumber: {
            type: Number
        },

        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
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
        }
    },
    {
        timestamps: true
    }
);

const Task = mongoose.model<ITask>("Task", taskSchema);

export default Task;