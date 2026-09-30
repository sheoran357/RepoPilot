import { Router } from "express";

import {
    getCurrentUser
} from "../controllers/authController.js";

import {
    authenticateUser
} from "../middleware/authMiddleware.js";

const router = Router();

router.get(
    "/me",
    authenticateUser,
    getCurrentUser
);

export default router;