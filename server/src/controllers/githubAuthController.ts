import { Request, Response } from "express";
import axios from "axios";

import User from "../models/User.js";

import { generateToken } from "../utils/jwt.js";

import {
    getGithubUser
} from "../services/githubService.js";

export const githubLogin = (
    req: Request,
    res: Response
) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const callbackUrl = process.env.GITHUB_CALLBACK_URL;

    if (!clientId || !callbackUrl) {
        return res.status(500).json({
            message: "GitHub configuration is missing"
        });
    }

    const githubUrl =
        `https://github.com/login/oauth/authorize` +
        `?client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(callbackUrl)}`;

    res.redirect(githubUrl);
};

export const githubCallback = async (
    req: Request,
    res: Response
) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({
                message: "GitHub authorization code is missing"
            });
        }

        // Exchange GitHub authorization code
        // for GitHub access token
        const tokenResponse = await axios.post(
            "https://github.com/login/oauth/access_token",
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret:
                    process.env.GITHUB_CLIENT_SECRET,
                code
            },
            {
                headers: {
                    Accept: "application/json"
                }
            }
        );

        const accessToken =
            tokenResponse.data.access_token;

        if (!accessToken) {
            return res.status(400).json({
                message: "Failed to get GitHub access token"
            });
        }

        // Get GitHub user information
        const githubUser =
            await getGithubUser(accessToken);

        // Create or update RepoPilot user
        const user = await User.findOneAndUpdate(
            {
                githubId: githubUser.id.toString()
            },
            {
                githubId: githubUser.id.toString(),
                username: githubUser.login,
                email: githubUser.email,
                avatarUrl: githubUser.avatar_url,

                // Keep GitHub token on backend
                githubAccessToken: accessToken
            },
            {
                new: true,
                upsert: true
            }
        );

        if (!user) {
            return res.status(500).json({
                message: "Failed to create or update user"
            });
        }

        // Generate RepoPilot JWT
        const token = generateToken(
            user._id.toString()
        );

        // Redirect user to React frontend
        const frontendUrl =
            process.env.FRONTEND_URL ||
            "http://localhost:5173";

        return res.redirect(
            `${frontendUrl}/auth/callback?token=${token}`
        );

    } catch (error) {
        console.error(
            "GitHub authentication error:",
            error
        );

        return res.status(500).json({
            message: "GitHub authentication failed"
        });
    }
};