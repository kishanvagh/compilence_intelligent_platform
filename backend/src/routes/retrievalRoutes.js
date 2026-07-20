// src/routes/retrievalRoutes.js

import express from "express";

import {
  searchDocuments,
} from "../controllers/retrievalController.js";

const router = express.Router();

router.post(
  "/search",
  searchDocuments
);

export default router;