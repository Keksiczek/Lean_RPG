import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    GEMINI_API_KEY: z.string().optional(),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    LOG_LEVEL: z
      .enum(["error", "warn", "info", "debug"])
      .default(process.env.NODE_ENV === "production" ? "info" : "debug"),
    ENABLE_HTTP_LOGS: z
      .union([z.boolean(), z.string()])
      .default(true)
      .transform((value) => {
        if (typeof value === "boolean") return value;
        return value === "true" || value === "1";
      }),
    APP_NAME: z.string().default("Lean RPG Backend"),
  })
  .transform((env) => ({
    ...env,
    GEMINI_API_KEY: env.GEMINI_API_KEY || undefined,
  }));

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten());
  throw new Error("Environment validation failed");
}

const env = parsed.data;

export const config = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
  app: {
    name: env.APP_NAME,
    port: env.PORT,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
  },
  database: {
    url: env.DATABASE_URL,
  },
  gemini: {
    apiKey: env.GEMINI_API_KEY,
  },
  redis: {
    url: env.REDIS_URL,
  },
  logging: {
    level: env.LOG_LEVEL,
    enableHttpLogs: env.ENABLE_HTTP_LOGS,
  },
} as const;

export type AppConfig = typeof config;
