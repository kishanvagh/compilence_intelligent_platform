import winston from "winston";
import { v4 as uuidv4 } from "uuid";

const { combine, timestamp, printf, colorize, json } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  printf(({ level, message, timestamp, requestId, ...meta }) => {
    const reqId = requestId ? ` [${requestId}]` : "";
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}${reqId}: ${message}${metaStr}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp(), json()),
  defaultMeta: { service: "compliance-intelligence" },
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880,
      maxFiles: 10,
    }),
    new winston.transports.File({
      filename: "logs/audit.log",
      level: "audit",
      maxsize: 5242880,
      maxFiles: 10,
    }),
  ],
});

// Add custom audit level
winston.addColors({
  audit: "magenta",
});

logger.audit = (message, meta = {}) => {
  logger.log({
    level: "audit",
    message,
    ...meta,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Create a child logger with a request ID for tracing
 */
export const createRequestLogger = (req) => {
  const requestId = req?.headers?.["x-request-id"] || uuidv4();
  req.requestId = requestId;

  return logger.child({
    requestId,
    method: req?.method,
    url: req?.originalUrl,
    ip: req?.ip,
    userId: req?.user?._id?.toString(),
  });
};

/**
 * Log performance metrics
 */
export const logPerformance = (operation, durationMs, meta = {}) => {
  logger.info(`PERF: ${operation}`, {
    operation,
    durationMs,
    ...meta,
    type: "performance",
  });
};

/**
 * Log audit events for compliance
 */
export const logAudit = (action, userId, resource, details = {}) => {
  logger.audit(`AUDIT: ${action}`, {
    action,
    userId: userId?.toString(),
    resource,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

export default logger;