import { Router } from "express";

import {
    syncRepositoryIssues
} from "../controllers/githubIssueController.js";

import {
    authenticateUser
} from "../middleware/authMiddleware.js";

const router = Router();

router.post(
    "/sync/:repositoryId",
    authenticateUser,
    syncRepositoryIssues
);

export default router;