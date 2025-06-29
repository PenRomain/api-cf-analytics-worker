import { IRequest, Router } from "itty-router";
import type { Env } from "./types";
import { ExecutionContext } from "@cloudflare/workers-types";
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

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

router.post("/events/paid-click", async (request: IRequest, env: Env) => {
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

router.get("/metrics/users", async (request, env: Env) => {
  try {
    const { results } = await env.DB.prepare("SELECT * FROM new_users").all();
    return new Response(JSON.stringify({ results }, null, 2), {
      headers: {
        "content-type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (e) {
    if (e instanceof Error) {
      console.error("Users error:", e.message);
    }
    return new Response(JSON.stringify(e), { status: 500 });
  }
});

router.get("/metrics/paid_clicks", async (request, env: Env) => {
  try {
    const { results } = await env.DB.prepare("SELECT * FROM paid_clicks").all();

    return new Response(JSON.stringify({ results }, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (e) {
    if (e instanceof Error) {
      console.error("Paid-clicks error:", e.message);
    }
    return new Response(JSON.stringify(e), { status: 500 });
  }
});

router.get("/metrics/last_scenes", async (request, env: Env) => {
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM reached_last_scene",
    ).all();
    return new Response(JSON.stringify({ results }, null, 2), {
      headers: {
        "content-type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (e) {
    if (e instanceof Error) {
      console.error("Last-scene error:", e.message);
    }
    return new Response(JSON.stringify(e), { status: 500 });
  }
});

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (
      url.pathname.startsWith("/events") ||
      url.pathname.startsWith("/metrics")
    ) {
      return router.handle(request, env, ctx);
    }

    let key =
      url.pathname === "/" ? "index.2256710da6.html" : url.pathname.slice(1);

    const asset = await env.ASSET_NAMESPACE.get(key, { type: "arrayBuffer" });
    if (asset) {
      const ext = key.split(".").pop()!.toLowerCase();
      const mimes: Record<string, string> = {
        html: "text/html; charset=utf-8",
        js: "application/javascript",
        css: "text/css",
        png: "image/png",
        jpg: "image/jpeg",
        svg: "image/svg+xml",
        json: "application/json",
      };
      const contentType = mimes[ext] || "application/octet-stream";
      return new Response(asset, {
        headers: { "Content-Type": contentType, ...corsHeaders },
      });
    }

    const fallback = await env.ASSET_NAMESPACE.get("index.2256710da6.html", {
      type: "arrayBuffer",
    });
    return new Response(fallback!, {
      headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
    });
  },
};
