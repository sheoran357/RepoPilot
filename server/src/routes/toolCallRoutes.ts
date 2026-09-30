import { Router } from "express";
import { createToolCall } from "../controllers/toolCallController.js";

const router = Router();

router.post("/", createToolCall);

export default router;