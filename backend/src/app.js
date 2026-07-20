import express from "express";
import cors from "cors";
import compression from "compression";
import { requestLogger, requestIdMiddleware } from "./middleware/requestLogger.js";

const app = express();

// Security & parsing middleware
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request ID & logging
app.use(requestIdMiddleware);
app.use(requestLogger);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Compliance Intelligence API Running",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

// API status
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    status: "operational",
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

export default app;
