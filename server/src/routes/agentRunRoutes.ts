import { Router } from "express";
import { createAgentRun,
    runAgent
 } from "../controllers/agentRunController.js";


 import {
    authenticateUser
} from "../middleware/authMiddleware.js";

const router = Router();
router.post(
    "/run",
    authenticateUser,
    runAgent
);

router.post("/", createAgentRun);

export default router;