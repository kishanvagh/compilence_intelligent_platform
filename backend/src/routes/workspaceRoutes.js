import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  removeMember,
} from "../controllers/workspaceController.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createWorkspace);
router.get("/", getWorkspaces);
router.get("/:id", getWorkspace);
router.put("/:id", updateWorkspace);
router.delete("/:id", deleteWorkspace);
router.post("/:id/members", addMember);
router.delete("/:id/members/:memberId", removeMember);

export default router;