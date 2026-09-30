import { Router } from "express";
import { createTestRun } from "../controllers/testRunController.js";

const router = Router();

router.post("/", createTestRun);

export default router;