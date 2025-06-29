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

// export default {
//   async fetch(
//     request: Request,
//     env: Env,
//     ctx: ExecutionContext,
//   ): Promise<Response> {
//     const url = new URL(request.url);

//     if (
//       url.pathname.startsWith("/events") ||
//       url.pathname.startsWith("/metrics")
//     ) {
//       return router.handle(request, env, ctx);
//     }

//     const resp = await getAssetFromKV(
//       { request, waitUntil: ctx.waitUntil },
//       { ASSET_NAMESPACE: env.ASSET_NAMESPACE },
//     );
//     console.log("%csrc/index.ts:164 resp", "color: #007acc;", resp);
//     return resp;

//     //   let resp = await env.ASSET_NAMESPACE.get("index.html")

//     //   // const value = await env.NAMESPACE.get("first-key");

//     //   // const values = await env.NAMESPACE.get(["first-key", "second-key"]);

//     //   // const valueWithMetadata = await env.NAMESPACE.getWithMetadata("first-key");
//     //   // const valuesWithMetadata = await env.NAMESPACE.getWithMetadata(["first-key", "second-key"]);
//     //   if (resp) {
//     //     const indexReq = new Request(
//     //       new URL("/index.html", request.url).href,
//     //       request,
//     //     );
//     //     // @ts-ignore
//     //     resp = await env.ASSETS.fetch?.(indexReq);
//     //   }
//     //   return resp;
//   },
// };

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

    try {
      return await getAssetFromKV(
        { request, waitUntil: ctx.waitUntil },
        { ASSET_NAMESPACE: env["__cf-analytics-worker-workers_sites_assets"] },
      );
    } catch {
      const indexReq = new Request(
        new URL("/index.html", request.url).href,
        request,
      );
      return await getAssetFromKV(
        { request: indexReq, waitUntil: ctx.waitUntil },
        { ASSET_NAMESPACE: env["__cf-analytics-worker-workers_sites_assets"] },
      );
    }
  },
};
