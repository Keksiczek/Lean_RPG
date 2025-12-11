import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

type Location = "body" | "params" | "query";

declare module "express-serve-static-core" {
  interface Request {
    validated?: {
      body?: unknown;
      params?: unknown;
      query?: unknown;
    };
  }
}

function validate(schema: ZodSchema, location: Location) {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = location === "body" ? req.body : location === "params" ? req.params : req.query;
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    if (!req.validated) {
      req.validated = {} as any;
    }

    (req.validated as any)[location] = parsed.data;
    return next();
  };
}

export const validateBody = (schema: ZodSchema) => validate(schema, "body");
export const validateParams = (schema: ZodSchema) => validate(schema, "params");
export const validateQuery = (schema: ZodSchema) => validate(schema, "query");
