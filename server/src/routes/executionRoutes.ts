import { Router } from "express";

import {
    getRunExecution
} from "../controllers/executionController.js";

import {
    authenticateUser
} from "../middleware/authMiddleware.js";

const router = Router();

router.get(
    "/runs/:runId",
    authenticateUser,
    getRunExecution
);

export default router;
