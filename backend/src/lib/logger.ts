import fs from "fs";
import path from "path";
import { config } from "../config.js";

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogPayload {
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

const levels: LogLevel[] = ["error", "warn", "info", "debug"];

const logsDir = path.resolve("logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function shouldLog(level: LogLevel) {
  return levels.indexOf(level) <= levels.indexOf(config.logging.level as LogLevel);
}

function writeToFile(filename: string, payload: LogPayload) {
  fs.appendFileSync(filename, JSON.stringify(payload) + "\n");
}

function log(level: LogLevel, message: string | Record<string, unknown>, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  const payload: LogPayload = {
    level,
    message: typeof message === "string" ? message : (message.message as string) ?? "",
    timestamp: new Date().toISOString(),
    ...(typeof message === "string" ? meta : message),
  } as LogPayload;

  const context = payload.context ? ` [${payload.context}]` : "";
  const reqId = payload.requestId ? ` (${payload.requestId})` : "";
  const { message: _msg, level: _lvl, ...restMeta } = payload as Record<string, unknown>;
  const rest = Object.keys(restMeta).length ? ` ${JSON.stringify(restMeta)}` : "";
  // Console output
  // eslint-disable-next-line no-console
  console.log(`${payload.timestamp} [${level}]${context}${reqId}: ${payload.message}${rest}`);

  // File outputs
  writeToFile(path.join(logsDir, "combined.log"), payload);
  if (level === "error") {
    writeToFile(path.join(logsDir, "error.log"), payload);
  }
}

export const logger = {
  log,
  error: (message: string | Record<string, unknown>, meta?: Record<string, unknown>) =>
    log("error", message, meta),
  warn: (message: string | Record<string, unknown>, meta?: Record<string, unknown>) => log("warn", message, meta),
  info: (message: string | Record<string, unknown>, meta?: Record<string, unknown>) => log("info", message, meta),
  debug: (message: string | Record<string, unknown>, meta?: Record<string, unknown>) => log("debug", message, meta),
};

export default logger;
