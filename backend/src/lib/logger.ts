import { createLogger, format, transports } from "winston";
import { config } from "../config.js";

const logger = createLogger({
  level: config.logging.level,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "error.log", level: "error" }),
    new transports.File({ filename: "combined.log" }),
  ],
});

export default logger;
