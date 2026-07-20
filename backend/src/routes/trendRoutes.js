import express
from "express";

import authMiddleware
from "../middleware/authMiddleware.js";

import {
  getTrendDashboard,
}
from "../controllers/trendController.js";

const router =
  express.Router();

router.get(
  "/",
  authMiddleware,
  getTrendDashboard
);

export default router;