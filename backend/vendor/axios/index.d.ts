export interface AxiosRequestConfig {
  params?: Record<string, unknown>;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: AxiosRequestConfig;
  request: any;
}

export class AxiosError<T = any> extends Error {
  constructor(
    message?: string,
    code?: string,
    config?: AxiosRequestConfig,
    response?: AxiosResponse<T> | null,
    request?: any
  );
  code?: string;
  config?: AxiosRequestConfig;
  response?: AxiosResponse<T> | null;
  request?: any;
  isAxiosError: boolean;
}

export function isAxiosError(payload: any): payload is AxiosError;
export function post<T = any, R = AxiosResponse<T>, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<R>;

export interface AxiosInstance {
  post: typeof post;
  isAxiosError: typeof isAxiosError;
}

declare const axios: AxiosInstance;
export default axios;
