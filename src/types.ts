import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
export interface Env {
  DB: D1Database;
  ASSET_NAMESPACE: KVNamespace;
  "__cf-analytics-worker-workers_sites_assets": KVNamespace;
}
