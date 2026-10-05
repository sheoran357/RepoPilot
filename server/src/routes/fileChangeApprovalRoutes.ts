import { Router } from "express";

import {
    authenticateUser
} from "../middleware/authMiddleware.js";

import {
    approveChange
} from "../controllers/fileChangeApprovalController.js";

import {
    applyChange
} from "../controllers/fileChangeApplyController.js";

import {
    rejectChange
} from "../controllers/fileChangeRejectController.js";

const router = Router();

router.post(
    "/:changeId/approve",
    authenticateUser,
    approveChange
);

router.post(
    "/:changeId/reject",
    authenticateUser,
    rejectChange
);

router.post(
    "/:changeId/apply",
    authenticateUser,
    applyChange
);

export default router;
