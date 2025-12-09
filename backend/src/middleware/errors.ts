/**
 * Custom HttpError class pro strukturované error handling
 */
export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: Record<string, any>
  ) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    Object.setPrototypeOf(this, HttpError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error
 */
export class ValidationError extends HttpError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, "VALIDATION_ERROR", details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Not found error
 */
export class NotFoundError extends HttpError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends HttpError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends HttpError {
  constructor(message: string = "Access forbidden") {
    super(message, 403, "FORBIDDEN");
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
