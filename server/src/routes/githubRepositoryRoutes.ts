import { Router } from "express";

import {
    syncRepositories,
    getUserRepositories
} from "../controllers/githubRepositoryController.js";

import {
    authenticateUser
} from "../middleware/authMiddleware.js";

const router = Router();

router.post(
    "/sync",
    authenticateUser,
    syncRepositories
    
);

router.get(
    "/",
    authenticateUser,
    getUserRepositories
);

export default router;