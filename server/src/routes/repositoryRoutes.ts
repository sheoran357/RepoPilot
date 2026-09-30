import { Router } from "express";
import { createRepository } from "../controllers/repositoryController.js";

const router = Router();

router.post("/", createRepository);

export default router;