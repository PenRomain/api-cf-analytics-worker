import { IRequest, Router } from "itty-router";
import type { Env } from "./types";
import { ExecutionContext } from "@cloudflare/workers-types";

const router = Router();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

router.options("*", () => new Response(null, { headers: corsHeaders }));

router.post("/events/users", async (request: IRequest, env: Env) => {
  try {
    const { userId, ts } = await request.json();
    if (!userId || !ts)
      return new Response("Invalid payload", {
        status: 400,
        headers: corsHeaders,
      });
    const stmt = env.ANALYTICS_DB.prepare(
      "INSERT OR IGNORE INTO new_users (user_id, ts) VALUES (?, ?)",
    );
    await stmt.bind(userId, ts).run();
    return new Response("OK", { headers: corsHeaders });
  } catch {
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});

router.post("/events/paid-clicks", async (request: IRequest, env: Env) => {
  try {
    const { userId, ts } = await request.json();
    if (!userId || !ts)
      return new Response("Invalid payload", {
        status: 400,
        headers: corsHeaders,
      });
    const stmt = env.ANALYTICS_DB.prepare(
      "INSERT INTO paid_clicks (user_id, ts) VALUES (?, ?)",
    );
    await stmt.bind(userId, ts).run();
    return new Response("OK", { headers: corsHeaders });
  } catch {
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});

router.post("/events/last-scene", async (request: IRequest, env: Env) => {
  try {
    const { userId, ts } = await request.json();
    if (!userId || !ts)
      return new Response("Invalid payload", {
        status: 400,
        headers: corsHeaders,
      });
    const stmt = env.ANALYTICS_DB.prepare(
      "INSERT OR IGNORE INTO reached_last_scene (user_id, ts) VALUES (?, ?)",
    );
    await stmt.bind(userId, ts).run();
    return new Response("OK", { headers: corsHeaders });
  } catch {
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});

router.get("/metrics/users", async (request: IRequest, env: Env) => {
  const { results } = await env.ANALYTICS_DB.prepare(
    "SELECT COUNT(*) AS count FROM new_users",
  ).all();
  return new Response(JSON.stringify({ users: results[0].count }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});

router.get("/metrics/paid-clicks", async (request: IRequest, env: Env) => {
  const { results } = await env.ANALYTICS_DB.prepare(
    "SELECT COUNT(*) AS count FROM paid_clicks",
  ).all();
  return new Response(JSON.stringify({ paidClicks: results[0].count }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});

router.get("/metrics/last-scene", async (request: IRequest, env: Env) => {
  const { results } = await env.ANALYTICS_DB.prepare(
    "SELECT COUNT(*) AS count FROM reached_last_scene",
  ).all();
  return new Response(JSON.stringify({ lastSceneUsers: results[0].count }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});

export default {
  async fetch(
    request: IRequest,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    return router.handle(request, env, ctx);
  },
};
