export interface FailedAttemptError {
  attemptNumber: number;
  retriesLeft: number;
  message: string;
  name: string;
}

export interface PRetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  onFailedAttempt?: (error: FailedAttemptError) => void;
}

export class AbortError extends Error {}

export default function pRetry<T>(
  input: () => Promise<T> | T,
  options?: PRetryOptions
): Promise<T>;
