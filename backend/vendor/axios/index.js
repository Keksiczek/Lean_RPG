class AxiosError extends Error {
  constructor(message, code, config, response, request) {
    super(message);
    this.name = 'AxiosError';
    this.code = code;
    this.config = config;
    this.response = response;
    this.request = request;
    this.isAxiosError = true;
  }
}

function isAxiosError(error) {
  return !!(error && (error.isAxiosError || error instanceof AxiosError));
}

function buildUrl(url, params = {}) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined);
  if (!entries.length) return url;
  const searchParams = new URLSearchParams();
  for (const [key, value] of entries) {
    searchParams.append(key, String(value));
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${searchParams.toString()}`;
}

async function post(url, data, config = {}) {
  const controller = new AbortController();
  let timeoutId;
  if (config.timeout) {
    timeoutId = setTimeout(() => controller.abort(), config.timeout);
  }

  try {
    const response = await fetch(buildUrl(url, config.params), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(config.headers || {}) },
      body: data !== undefined ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });

    const responseData = await response.json();
    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config,
      request: null,
    };
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new AxiosError(`timeout of ${config.timeout}ms exceeded`, 'ECONNABORTED', config, null, null);
    }
    if (isAxiosError(error)) throw error;
    throw new AxiosError(error?.message || 'Axios request failed', undefined, config, error?.response, error?.request);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

const axios = { post, isAxiosError };

export { AxiosError, isAxiosError, post };
export default axios;
