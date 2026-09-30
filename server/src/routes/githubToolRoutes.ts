import { Router } from "express";
import { listFiles } from "../controllers/githubToolController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = Router();

router.get(
    "/:owner/:repo/files",
    authenticateUser,
    listFiles
);

export default router;