import { Router } from "express";

import {
    createTask
} from "../controllers/taskController.js";

import {
    authenticateUser
} from "../middleware/authMiddleware.js";

const router = Router();

router.post(
    "/",
    authenticateUser,
    createTask
);

export default router;