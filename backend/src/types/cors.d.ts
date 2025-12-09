declare module "cors" {
  import { RequestHandler } from "express";
  interface CorsOptions {
    origin?: string | string[] | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
  }
  function cors(options?: CorsOptions): RequestHandler;
  export = cors;
}
