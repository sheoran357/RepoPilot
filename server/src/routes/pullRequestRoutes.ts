import { Router } from "express";
import { createPullRequest } from "../controllers/pullRequestController.js";

const router = Router();

router.post("/", createPullRequest);

export default router;