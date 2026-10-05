import { Router } from "express";

import {
    getRunChanges
} from "../controllers/fileChangeController.js";


const router = Router();


router.get(
    "/runs/:runId/changes",
    getRunChanges
);


export default router;