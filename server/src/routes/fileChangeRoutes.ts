import { Router } from "express";
import { createFileChange } from "../controllers/fileChangeController.js";

const router = Router();

router.post("/", createFileChange);

export default router;