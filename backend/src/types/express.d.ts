import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    validatedBody?: unknown;
    validatedParams?: unknown;
    validatedQuery?: unknown;
  }
}
