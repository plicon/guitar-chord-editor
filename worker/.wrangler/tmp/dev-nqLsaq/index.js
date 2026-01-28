var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-XuFC9B/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/utils/id.ts
function generateId() {
  return crypto.randomUUID();
}
__name(generateId, "generateId");

// src/db/charts.ts
function rowToChart(row) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    key: row.key,
    timeSignature: row.time_signature,
    tempo: row.tempo,
    chords: JSON.parse(row.chords),
    strummingPattern: row.strumming_pattern ? JSON.parse(row.strumming_pattern) : void 0,
    notes: row.notes,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}
__name(rowToChart, "rowToChart");
async function listCharts(db, params = {}) {
  const limit = params.limit || 50;
  const offset = params.offset || 0;
  const countResult = await db.prepare("SELECT COUNT(*) as count FROM chord_charts").first();
  const total = countResult?.count || 0;
  const results = await db.prepare("SELECT * FROM chord_charts ORDER BY updated_at DESC LIMIT ? OFFSET ?").bind(limit, offset).all();
  return {
    data: results.results.map(rowToChart),
    total,
    limit,
    offset
  };
}
__name(listCharts, "listCharts");
async function getChart(db, id) {
  const result = await db.prepare("SELECT * FROM chord_charts WHERE id = ?").bind(id).first();
  return result ? rowToChart(result) : null;
}
__name(getChart, "getChart");
async function createChart(db, data) {
  const id = generateId();
  const now = Date.now();
  await db.prepare(
    `INSERT INTO chord_charts (
        id, title, artist, key, time_signature, tempo,
        chords, strumming_pattern, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    data.title,
    data.artist || null,
    data.key || null,
    data.timeSignature || null,
    data.tempo || null,
    JSON.stringify(data.chords),
    data.strummingPattern ? JSON.stringify(data.strummingPattern) : null,
    data.notes || null,
    now,
    now
  ).run();
  const chart = await getChart(db, id);
  if (!chart) {
    throw new Error("Failed to create chart");
  }
  return chart;
}
__name(createChart, "createChart");
async function updateChart(db, id, data) {
  const existing = await getChart(db, id);
  if (!existing) {
    return null;
  }
  const now = Date.now();
  const updates = [];
  const values = [];
  if (data.title !== void 0) {
    updates.push("title = ?");
    values.push(data.title);
  }
  if (data.artist !== void 0) {
    updates.push("artist = ?");
    values.push(data.artist);
  }
  if (data.key !== void 0) {
    updates.push("key = ?");
    values.push(data.key);
  }
  if (data.timeSignature !== void 0) {
    updates.push("time_signature = ?");
    values.push(data.timeSignature);
  }
  if (data.tempo !== void 0) {
    updates.push("tempo = ?");
    values.push(data.tempo);
  }
  if (data.chords !== void 0) {
    updates.push("chords = ?");
    values.push(JSON.stringify(data.chords));
  }
  if (data.strummingPattern !== void 0) {
    updates.push("strumming_pattern = ?");
    values.push(JSON.stringify(data.strummingPattern));
  }
  if (data.notes !== void 0) {
    updates.push("notes = ?");
    values.push(data.notes);
  }
  updates.push("updated_at = ?");
  values.push(now);
  values.push(id);
  await db.prepare(`UPDATE chord_charts SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  return getChart(db, id);
}
__name(updateChart, "updateChart");
async function deleteChart(db, id) {
  const result = await db.prepare("DELETE FROM chord_charts WHERE id = ?").bind(id).run();
  return result.meta.changes > 0;
}
__name(deleteChart, "deleteChart");
async function searchCharts(db, query, params = {}) {
  const limit = params.limit || 50;
  const offset = params.offset || 0;
  const searchPattern = `%${query}%`;
  const countResult = await db.prepare(
    "SELECT COUNT(*) as count FROM chord_charts WHERE title LIKE ? OR artist LIKE ?"
  ).bind(searchPattern, searchPattern).first();
  const total = countResult?.count || 0;
  const results = await db.prepare(
    "SELECT * FROM chord_charts WHERE title LIKE ? OR artist LIKE ? ORDER BY updated_at DESC LIMIT ? OFFSET ?"
  ).bind(searchPattern, searchPattern, limit, offset).all();
  return {
    data: results.results.map(rowToChart),
    total,
    limit,
    offset
  };
}
__name(searchCharts, "searchCharts");

// src/utils/responses.ts
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(error, status = 400, details) {
  const body = { error };
  if (details) {
    body.details = details;
  }
  return jsonResponse(body, status);
}
__name(errorResponse, "errorResponse");
function notFoundResponse(resource) {
  return errorResponse(`${resource} not found`, 404);
}
__name(notFoundResponse, "notFoundResponse");
function methodNotAllowedResponse(allowed) {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      Allow: allowed.join(", ")
    }
  });
}
__name(methodNotAllowedResponse, "methodNotAllowedResponse");
function healthCheckResponse() {
  return jsonResponse({
    status: "healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    version: "1.0.0"
  });
}
__name(healthCheckResponse, "healthCheckResponse");

// src/routes/charts.ts
async function handleCharts(request, env, pathParts) {
  const method = request.method;
  if (pathParts.length === 3 && method === "GET") {
    const id = pathParts[2];
    const chart = await getChart(env.DB, id);
    if (!chart) {
      return notFoundResponse("Chart");
    }
    return jsonResponse(chart);
  }
  if (pathParts.length === 3 && method === "PUT") {
    const id = pathParts[2];
    try {
      const data = await request.json();
      const chart = await updateChart(env.DB, id, data);
      if (!chart) {
        return notFoundResponse("Chart");
      }
      return jsonResponse(chart);
    } catch (error) {
      return errorResponse("Invalid request body", 400, error);
    }
  }
  if (pathParts.length === 3 && method === "DELETE") {
    const id = pathParts[2];
    const deleted = await deleteChart(env.DB, id);
    if (!deleted) {
      return notFoundResponse("Chart");
    }
    return jsonResponse({ success: true });
  }
  if (pathParts.length === 2 && method === "GET") {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    if (query) {
      const result2 = await searchCharts(env.DB, query, { limit, offset });
      return jsonResponse(result2);
    }
    const result = await listCharts(env.DB, { limit, offset });
    return jsonResponse(result);
  }
  if (pathParts.length === 2 && method === "POST") {
    try {
      const data = await request.json();
      if (!data.title || !data.chords) {
        return errorResponse("Missing required fields: title, chords", 400);
      }
      const chart = await createChart(env.DB, data);
      return jsonResponse(chart, 201);
    } catch (error) {
      return errorResponse("Invalid request body", 400, error);
    }
  }
  return methodNotAllowedResponse(["GET", "POST", "PUT", "DELETE"]);
}
__name(handleCharts, "handleCharts");

// src/db/chordPresets.ts
function rowToPreset(row) {
  return {
    id: row.id,
    name: row.name,
    frets: JSON.parse(row.frets),
    fingers: JSON.parse(row.fingers),
    barreInfo: row.barre_info ? JSON.parse(row.barre_info) : void 0,
    createdAt: new Date(row.created_at).toISOString()
  };
}
__name(rowToPreset, "rowToPreset");
async function listChordPresets(db, params = {}) {
  const limit = params.limit || 100;
  const offset = params.offset || 0;
  const countResult = await db.prepare("SELECT COUNT(*) as count FROM chord_presets").first();
  const total = countResult?.count || 0;
  const results = await db.prepare("SELECT * FROM chord_presets ORDER BY name ASC LIMIT ? OFFSET ?").bind(limit, offset).all();
  return {
    data: results.results.map(rowToPreset),
    total,
    limit,
    offset
  };
}
__name(listChordPresets, "listChordPresets");
async function getChordPreset(db, id) {
  const result = await db.prepare("SELECT * FROM chord_presets WHERE id = ?").bind(id).first();
  return result ? rowToPreset(result) : null;
}
__name(getChordPreset, "getChordPreset");
async function searchChordPresets(db, query, params = {}) {
  const limit = params.limit || 100;
  const offset = params.offset || 0;
  const searchPattern = `%${query}%`;
  const countResult = await db.prepare("SELECT COUNT(*) as count FROM chord_presets WHERE name LIKE ?").bind(searchPattern).first();
  const total = countResult?.count || 0;
  const results = await db.prepare("SELECT * FROM chord_presets WHERE name LIKE ? ORDER BY name ASC LIMIT ? OFFSET ?").bind(searchPattern, limit, offset).all();
  return {
    data: results.results.map(rowToPreset),
    total,
    limit,
    offset
  };
}
__name(searchChordPresets, "searchChordPresets");

// src/db/strummingPresets.ts
function rowToPreset2(row) {
  return {
    id: row.id,
    name: row.name,
    pattern: JSON.parse(row.pattern),
    description: row.description,
    createdAt: new Date(row.created_at).toISOString()
  };
}
__name(rowToPreset2, "rowToPreset");
async function listStrummingPresets(db, params = {}) {
  const limit = params.limit || 100;
  const offset = params.offset || 0;
  const countResult = await db.prepare("SELECT COUNT(*) as count FROM strumming_presets").first();
  const total = countResult?.count || 0;
  const results = await db.prepare("SELECT * FROM strumming_presets ORDER BY name ASC LIMIT ? OFFSET ?").bind(limit, offset).all();
  return {
    data: results.results.map(rowToPreset2),
    total,
    limit,
    offset
  };
}
__name(listStrummingPresets, "listStrummingPresets");
async function getStrummingPreset(db, id) {
  const result = await db.prepare("SELECT * FROM strumming_presets WHERE id = ?").bind(id).first();
  return result ? rowToPreset2(result) : null;
}
__name(getStrummingPreset, "getStrummingPreset");
async function searchStrummingPresets(db, query, params = {}) {
  const limit = params.limit || 100;
  const offset = params.offset || 0;
  const searchPattern = `%${query}%`;
  const countResult = await db.prepare("SELECT COUNT(*) as count FROM strumming_presets WHERE name LIKE ?").bind(searchPattern).first();
  const total = countResult?.count || 0;
  const results = await db.prepare("SELECT * FROM strumming_presets WHERE name LIKE ? ORDER BY name ASC LIMIT ? OFFSET ?").bind(searchPattern, limit, offset).all();
  return {
    data: results.results.map(rowToPreset2),
    total,
    limit,
    offset
  };
}
__name(searchStrummingPresets, "searchStrummingPresets");

// src/routes/presets.ts
async function handleChordPresets(request, env, pathParts) {
  const method = request.method;
  if (pathParts.length === 4 && method === "GET") {
    const id = pathParts[3];
    const preset = await getChordPreset(env.DB, id);
    if (!preset) {
      return notFoundResponse("Chord preset");
    }
    return jsonResponse(preset);
  }
  if (pathParts.length === 3 && method === "GET") {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    if (query) {
      const result2 = await searchChordPresets(env.DB, query, { limit, offset });
      return jsonResponse(result2);
    }
    const result = await listChordPresets(env.DB, { limit, offset });
    return jsonResponse(result);
  }
  return methodNotAllowedResponse(["GET"]);
}
__name(handleChordPresets, "handleChordPresets");
async function handleStrummingPresets(request, env, pathParts) {
  const method = request.method;
  if (pathParts.length === 4 && method === "GET") {
    const id = pathParts[3];
    const preset = await getStrummingPreset(env.DB, id);
    if (!preset) {
      return notFoundResponse("Strumming preset");
    }
    return jsonResponse(preset);
  }
  if (pathParts.length === 3 && method === "GET") {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    if (query) {
      const result2 = await searchStrummingPresets(env.DB, query, { limit, offset });
      return jsonResponse(result2);
    }
    const result = await listStrummingPresets(env.DB, { limit, offset });
    return jsonResponse(result);
  }
  return methodNotAllowedResponse(["GET"]);
}
__name(handleStrummingPresets, "handleStrummingPresets");

// src/utils/cors.ts
var DEFAULT_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
var DEFAULT_HEADERS = ["Content-Type", "Authorization"];
function getCorsHeaders(request, options) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = Array.isArray(options.origin) ? options.origin : [options.origin];
  const isAllowed = options.origin === "*" || allowedOrigins.some(
    (allowed) => allowed === "*" || origin === allowed || origin.endsWith(allowed)
  );
  if (!isAllowed) {
    return {};
  }
  const headers = {
    "Access-Control-Allow-Origin": options.origin === "*" ? "*" : origin,
    "Access-Control-Allow-Methods": (options.methods || DEFAULT_METHODS).join(", "),
    "Access-Control-Allow-Headers": (options.allowedHeaders || DEFAULT_HEADERS).join(", ")
  };
  if (options.exposedHeaders?.length) {
    headers["Access-Control-Expose-Headers"] = options.exposedHeaders.join(", ");
  }
  if (options.credentials) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  if (options.maxAge) {
    headers["Access-Control-Max-Age"] = options.maxAge.toString();
  }
  return headers;
}
__name(getCorsHeaders, "getCorsHeaders");
function handleCorsPreflightRequest(request, options) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, options)
  });
}
__name(handleCorsPreflightRequest, "handleCorsPreflightRequest");
function addCorsHeaders(response, request, options) {
  const corsHeaders = getCorsHeaders(request, options);
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
__name(addCorsHeaders, "addCorsHeaders");

// src/index.ts
function getCorsConfig(env) {
  const allowedOrigins = env.ENVIRONMENT === "production" ? ["https://fretkit.io", "https://www.fretkit.io"] : ["http://localhost:5173", "http://localhost:3000", "*"];
  return {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400
    // 24 hours
  };
}
__name(getCorsConfig, "getCorsConfig");
var src_default = {
  async fetch(request, env) {
    const corsConfig = getCorsConfig(env);
    if (request.method === "OPTIONS") {
      return handleCorsPreflightRequest(request, corsConfig);
    }
    try {
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (url.pathname === "/health" || url.pathname === "/") {
        const response2 = healthCheckResponse();
        return addCorsHeaders(response2, request, corsConfig);
      }
      if (pathParts[0] === "api") {
        let response2;
        if (pathParts[1] === "charts") {
          response2 = await handleCharts(request, env, pathParts);
        } else if (pathParts[1] === "presets" && pathParts[2] === "chords") {
          response2 = await handleChordPresets(request, env, pathParts);
        } else if (pathParts[1] === "presets" && pathParts[2] === "strumming") {
          response2 = await handleStrummingPresets(request, env, pathParts);
        } else {
          response2 = errorResponse("Not Found", 404);
        }
        return addCorsHeaders(response2, request, corsConfig);
      }
      const response = errorResponse("Not Found", 404);
      return addCorsHeaders(response, request, corsConfig);
    } catch (error) {
      console.error("Worker error:", error);
      const response = errorResponse(
        "Internal Server Error",
        500,
        env.ENVIRONMENT === "development" ? error : void 0
      );
      return addCorsHeaders(response, request, corsConfig);
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-XuFC9B/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-XuFC9B/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
