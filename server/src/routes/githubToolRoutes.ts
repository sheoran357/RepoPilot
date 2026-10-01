import { Router } from "express";
import {
    readFile,
    listFiles,
    searchRepositoryCode
} from "../controllers/githubToolController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = Router();

router.get(
    "/:owner/:repo",
    authenticateUser,
    listFiles
);

router.get(
    "/:owner/:repo/file/*path",
    authenticateUser,
    readFile
);

router.get(
    "/:owner/:repo/search",
    authenticateUser,
    searchRepositoryCode
);


export default router;