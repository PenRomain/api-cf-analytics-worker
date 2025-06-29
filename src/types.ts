import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
export interface Env {
  DB: D1Database;
  __STATIC_CONTENT: {
    fetch(request: Request): Promise<Response>;
  };
  ASSETS: KVNamespace;
}
