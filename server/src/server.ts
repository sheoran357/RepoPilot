import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import testRoutes from "./routes/testRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import repositoryRoutes from "./routes/repositoryRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import agentRunRoutes from "./routes/agentRunRoutes.js";
import agentStepRoutes from "./routes/agentStepRoutes.js";
import toolCallRoutes from "./routes/toolCallRoutes.js";
import fileChangeRoutes from "./routes/fileChangeRoutes.js";
import testRunRoutes from "./routes/testRunRoutes.js";
import pullRequestRoutes from "./routes/pullRequestRoutes.js";
import githubAuthRoutes from "./routes/githubAuthRoutes.js";
import githubRepositoryRoutes from "./routes/githubRepositoryRoutes.js";
import githubIssueRoutes from "./routes/githubIssueRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import githubWebhookRoutes from "./routes/githubWebhookRoutes.js";
import githubToolRoutes from "./routes/githubToolRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(
    express.json({
        verify: (req: any, res, buf) => {
            req.rawBody = buf;
        }
    })
);



app.use(
    "/api/github/tools",
    githubToolRoutes
);

app.use(
    "/api/webhooks",
    githubWebhookRoutes
);

app.use("/api", testRoutes);

app.use("/api/auth", githubAuthRoutes);

app.use(
    "/api/github/repositories",
    githubRepositoryRoutes
);

app.use(
    "/api/github/issues",
    githubIssueRoutes
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/repositories", repositoryRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/agent-runs", agentRunRoutes);
app.use("/api/agent-steps", agentStepRoutes);
app.use("/api/tool-calls", toolCallRoutes);
app.use("/api/file-changes", fileChangeRoutes);
app.use("/api/test-runs", testRunRoutes);
app.use("/api/pull-requests", pullRequestRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "RepoPilot API is running"
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();