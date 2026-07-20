import { createRequestLogger, logPerformance } from "../services/core/logger.service.js";

/**
 * Request logging middleware
 * Adds request ID, logs all requests, and tracks performance
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const log = createRequestLogger(req);

  // Log incoming request
  log.info("Incoming request", {
    query: req.query,
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - startTime;

    log.info("Request completed", {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });

    // Log performance for slow requests
    if (duration > 1000) {
      logPerformance("slow_request", duration, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
      });
    }

    return originalSend.call(this, body);
  };

  next();
};

/**
 * Add request ID to response headers
 */
export const requestIdMiddleware = (req, res, next) => {
  const requestId = req.requestId || req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("X-Request-ID", requestId);
  next();
};

export default requestLogger;