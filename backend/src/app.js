import express from "express";
import cors from "cors";
import compression from "compression";
import { requestLogger, requestIdMiddleware } from "./middleware/requestLogger.js";

const app = express();

// CORS — explicitly allow the Vercel frontend and handle preflight OPTIONS requests
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["https://compilence-intelligent-platform.vercel.app"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Render health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    credentials: true,
    optionsSuccessStatus: 200, // Some browsers (IE11) choke on 204
  })
);

// Explicitly handle preflight for all routes
app.options("*", cors());
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
