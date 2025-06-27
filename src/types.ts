import type { D1Database } from "@cloudflare/workers-types";

export type Env = {
  ANALYTICS_DB: D1Database;
};
