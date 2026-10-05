import { Router } from "express";

import {
    approveChange
} from "../controllers/fileChangeApprovalController.js";

const router = Router();

router.post(
    "/:changeId/approve",
    approveChange
);

export default router;