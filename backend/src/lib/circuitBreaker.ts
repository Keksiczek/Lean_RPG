export interface CircuitBreakerConfig {
  failureThreshold?: number; // Open circuit after N failures
  resetTimeout?: number; // How long to stay open before testing again (ms)
  monitoringInterval?: number; // Reserved for future monitoring hooks
}

export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private readonly config: Required<CircuitBreakerConfig>;

  constructor(config: CircuitBreakerConfig = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      resetTimeout: config.resetTimeout ?? 60_000,
      monitoringInterval: config.monitoringInterval ?? 5_000,
    };
  }

  public isAvailable(): boolean {
    if (this.state === 'closed') {
      return true;
    }

    if (this.state === 'open') {
      const timeSinceFailure = Date.now() - (this.lastFailureTime ?? Date.now());
      if (timeSinceFailure > this.config.resetTimeout) {
        this.state = 'half-open';
        this.successCount = 0;
        return true;
      }
      return false;
    }

    if (this.state === 'half-open') {
      return true;
    }

    return false;
  }

  public recordSuccess(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;

    if (this.state === 'half-open') {
      this.state = 'closed';
      this.successCount = 0;
    }
  }

  public recordFailure(): void {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }

  public getState(): { state: CircuitBreakerState; failureCount: number; lastFailure: Date | null } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime) : null,
    };
  }

  public reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}
