import mongoose, { Schema, Document } from "mongoose";

export interface IRepository extends Document {
    userId: mongoose.Types.ObjectId;
    githubId: number;
    name: string;
    fullName: string;
    url: string;
    defaultBranch: string;
}

const repositorySchema = new Schema<IRepository>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        githubId: {
            type: Number,
            required: true
        },

        name: {
            type: String,
            required: true
        },

        fullName: {
            type: String,
            required: true
        },

        url: {
            type: String,
            required: true
        },

        defaultBranch: {
            type: String,
            default: "main"
        }
    },
    {
        timestamps: true
    }
);

const Repository = mongoose.model<IRepository>(
    "Repository",
    repositorySchema
);

export default Repository;