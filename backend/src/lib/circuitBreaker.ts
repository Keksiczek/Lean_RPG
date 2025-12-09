export type CircuitState = "closed" | "open" | "half_open";

export class CircuitBreaker {
  private failureCount = 0;
  private state: CircuitState = "closed";
  private nextAttempt = 0;

  constructor(
    private readonly failureThreshold: number,
    private readonly resetTimeoutMs: number
  ) {}

  canRequest(): boolean {
    if (this.state === "open" && Date.now() < this.nextAttempt) {
      return false;
    }

    if (this.state === "open" && Date.now() >= this.nextAttempt) {
      this.state = "half_open";
      return true;
    }

    return true;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = "closed";
  }

  recordFailure() {
    this.failureCount += 1;
    if (this.failureCount >= this.failureThreshold) {
      this.state = "open";
      this.nextAttempt = Date.now() + this.resetTimeoutMs;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount() {
    return this.failureCount;
  }
}
