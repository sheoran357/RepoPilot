import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    githubId: string;
    username: string;
    email?: string;
    avatarUrl?: string;
    githubAccessToken?: string;
}

const userSchema = new Schema<IUser>(
    {
        githubId: {
            type: String,
            required: true,
            unique: true
        },
        username: {
            type: String,
            required: true
        },
        email: {
            type: String
        },
        avatarUrl: {
            type: String
        },
        githubAccessToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model<IUser>(
    "User",
    userSchema
);

export default User;