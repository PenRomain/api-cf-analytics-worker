import { IRequest, Router } from "itty-router";
import { renderHtml } from "./renderHtml";
import type { Env } from "./types";
import { ExecutionContext } from "@cloudflare/workers-types";

const router = Router();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

router.options("*", () => new Response(null, { headers: corsHeaders }));

router.post("/events/user", async (request: IRequest, env: Env) => {
  try {
    const { userId, ts } = await request.json();
    if (!userId || !ts)
      return new Response("Invalid payload", {
        status: 400,
        headers: corsHeaders,
      });
    const stmt = env.DB.prepare(
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
    const stmt = env.DB.prepare(
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
    const stmt = env.DB.prepare(
      "INSERT OR IGNORE INTO reached_last_scene (user_id, ts) VALUES (?, ?)",
    );
    await stmt.bind(userId, ts).run();
    return new Response("OK", { headers: corsHeaders });
  } catch {
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});

router.get("/", async (request, env: Env) => {
  try {
    const { results: newUsers } = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM new_users",
    ).all();
    const { results: paidClicks } = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM paid_clicks",
    ).all();
    const { results: reachedLastScene } = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM reached_last_scene",
    ).all();
    return new Response(
      renderHtml(
        JSON.stringify({ newUsers, paidClicks, reachedLastScene }, null, 2),
      ),
      {
        headers: {
          "content-type": "text/html",
        },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify(e), { status: 500 });
  }
});

router.get("/metrics/users/:userId", async (request, env: Env) => {
  const { userId } = request.params;

  try {
    const { results } = await env.DB.prepare(
      "SELECT COUNT(1) AS cnt FROM new_users WHERE user_id = ?",
    )
      .bind(userId)
      .all();
    const exists = (results[0].cnt as number) > 0;
    if (exists) {
      return new Response(null, { status: 200 });
    } else {
      return new Response(null, { status: 404 });
    }
  } catch (e) {
    return new Response("Internal Server Error", { status: 500 });
  }
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
