class AbortError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AbortError';
  }
}

async function pRetry(fn, options = {}) {
  const retries = options.retries ?? 0;
  const factor = options.factor ?? 2;
  const minTimeout = options.minTimeout ?? 1000;
  const maxTimeout = options.maxTimeout ?? Infinity;

  let attemptNumber = 1;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      const shouldStop = attemptNumber > retries;
      const delay = Math.min(minTimeout * Math.pow(factor, attemptNumber - 1), maxTimeout);
      const retriesLeft = Math.max(retries - attemptNumber + 1, 0);

      if (options.onFailedAttempt) {
        options.onFailedAttempt({
          attemptNumber,
          retriesLeft,
          message: error?.message || 'Unknown error',
          name: error?.name || 'Error',
        });
      }

      if (shouldStop) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      attemptNumber += 1;
    }
  }
}

export { AbortError };
export default pRetry;
