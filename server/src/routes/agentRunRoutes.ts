import { Router } from "express";
import { createAgentRun } from "../controllers/agentRunController.js";

const router = Router();

router.post("/", createAgentRun);

export default router;