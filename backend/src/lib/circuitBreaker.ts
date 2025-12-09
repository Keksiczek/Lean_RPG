import logger from "./logger.js";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  successThreshold?: number;
}

export class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private state: CircuitState = "CLOSED";
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly successThreshold: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 60_000;
    this.successThreshold = options.successThreshold ?? 2;
    logger.info("Circuit breaker initialized", {
      context: "circuit-breaker",
      config: {
        failureThreshold: this.failureThreshold,
        resetTimeoutMs: this.resetTimeoutMs,
        successThreshold: this.successThreshold,
      },
    });
  }

  getState(): CircuitState {
    if (this.state === "OPEN") {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure > this.resetTimeoutMs) {
        logger.info("Circuit breaker timeout reached, moving to HALF_OPEN", {
          context: "circuit-breaker",
        });
        this.state = "HALF_OPEN";
        this.successCount = 0;
      }
    }
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.getState();
    if (state === "OPEN") {
      logger.warn("Circuit breaker OPEN, rejecting request", {
        context: "circuit-breaker",
      });
      throw new Error("Circuit breaker is OPEN");
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordSuccess() {
    if (this.state === "HALF_OPEN") {
      this.successCount += 1;
      logger.info("Circuit breaker HALF_OPEN success", {
        context: "circuit-breaker",
        successCount: this.successCount,
        successThreshold: this.successThreshold,
      });
      if (this.successCount >= this.successThreshold) {
        this.state = "CLOSED";
        this.failureCount = 0;
        this.successCount = 0;
        logger.info("Circuit breaker CLOSED after successful probes", {
          context: "circuit-breaker",
        });
      }
    } else {
      this.failureCount = 0;
    }
  }

  private recordFailure() {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();
    logger.warn("Circuit breaker failure recorded", {
      context: "circuit-breaker",
      failureCount: this.failureCount,
    });
    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      logger.error("Circuit breaker opened", {
        context: "circuit-breaker",
        failureCount: this.failureCount,
      });
    }
  }
}
