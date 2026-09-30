import { Router } from "express";
import { createAgentStep } from "../controllers/agentStepController.js";

const router = Router();

router.post("/", createAgentStep);

export default router;