import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { CHARACTER_LIMIT } from "../constants.js";
import { describeError } from "../services/client.js";
import { fail, ok, renderFields, truncateText } from "../services/format.js";
import {
  cursorField,
  IdSchema,
  limitField,
  placeIdField,
  responseFormatField,
  scopeField,
  universeIdField,
} from "../schemas.js";
import { asRecord, parseJson, resolvePlaceId, resolveUniverseId, type ToolContext } from "./context.js";

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true } as const;

/* ------------------------------------------------------------------ schemas */

export const GetUniverseSchema = z.object({
  universe_id: universeIdField,
  response_format: responseFormatField,
});

export const GetPlaceSchema = z.object({
  universe_id: universeIdField,
  place_id: placeIdField,
  response_format: responseFormatField,
});

export const ListDatastoresSchema = z.object({
  universe_id: universeIdField,
  prefix: z.string().max(200).optional().describe("Only return DataStores whose name starts with this prefix"),
  limit: limitField,
  cursor: cursorField,
  response_format: responseFormatField,
});

export const ListKeysSchema = z.object({
  universe_id: universeIdField,
  datastore_name: z.string().min(1).max(200).describe("Name of the DataStore"),
  scope: scopeField,
  all_scopes: z.boolean().default(false).describe("If true, list keys of every scope (the scope argument is ignored)"),
  prefix: z.string().max(200).optional().describe("Only return keys that start with this prefix"),
  limit: limitField,
  cursor: cursorField,
  response_format: responseFormatField,
});

export const GetEntrySchema = z.object({
  universe_id: universeIdField,
  datastore_name: z.string().min(1).max(200).describe("Name of the DataStore"),
  entry_key: z.string().min(1).max(500).describe("Key of the entry to read"),
  scope: scopeField,
  response_format: responseFormatField,
});

export const ApiGetSchema = z.object({
  path: z
    .string()
    .min(1)
    .max(500)
    .describe("Path on apis.roblox.com starting with '/', e.g. '/cloud/v2/universes/123'. No full URLs, no '?'."),
  query: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .describe("Query-string parameters as key/value pairs"),
  response_format: responseFormatField,
});

/* ----------------------------------------------------------------- handlers */

export async function getUniverse(ctx: ToolContext, p: z.infer<typeof GetUniverseSchema>): Promise<CallToolResult> {
  try {
    const id = resolveUniverseId(ctx, p.universe_id);
    const res = await ctx.client.request({ method: "GET", path: `/cloud/v2/universes/${id}` });
    const data = asRecord(parseJson(res.text));
    return ok({ universe: data }, `# Universe ${id}\n\n${renderFields(data)}`, p.response_format);
  } catch (e) {
    return fail(describeError(e));
  }
}

export async function getPlace(ctx: ToolContext, p: z.infer<typeof GetPlaceSchema>): Promise<CallToolResult> {
  try {
    const u = resolveUniverseId(ctx, p.universe_id);
    const pl = resolvePlaceId(ctx, p.place_id);
    const res = await ctx.client.request({ method: "GET", path: `/cloud/v2/universes/${u}/places/${pl}` });
    const data = asRecord(parseJson(res.text));
    return ok({ place: data }, `# Place ${pl} (universe ${u})\n\n${renderFields(data)}`, p.response_format);
  } catch (e) {
    return fail(describeError(e));
  }
}

export async function listDatastores(ctx: ToolContext, p: z.infer<typeof ListDatastoresSchema>): Promise<CallToolResult> {
  try {
    const id = resolveUniverseId(ctx, p.universe_id);
    const res = await ctx.client.request({
      method: "GET",
      path: `/datastores/v1/universes/${id}/standard-datastores`,
      query: { prefix: p.prefix, limit: p.limit, cursor: p.cursor },
    });
    const data = asRecord(parseJson(res.text));
    const raw = Array.isArray(data.datastores) ? (data.datastores as Array<Record<string, unknown>>) : [];
    const datastores = raw.map((d) => ({
      name: String(d.name ?? ""),
      created_time: typeof d.createdTime === "string" ? d.createdTime : undefined,
    }));
    const next = typeof data.nextPageCursor === "string" && data.nextPageCursor ? data.nextPageCursor : undefined;
    const structured = { count: datastores.length, datastores, has_more: next !== undefined, next_cursor: next };
    const lines = [`# DataStores (universe ${id})`, "", `Trovati ${datastores.length}${next ? " (ce ne sono altri: usa next_cursor)" : ""}`, ""];
    for (const d of datastores) lines.push(`- ${d.name}${d.created_time ? ` — creato ${d.created_time}` : ""}`);
    if (next) lines.push("", `next_cursor: \`${next}\``);
    return ok(structured, lines.join("\n"), p.response_format);
  } catch (e) {
    return fail(describeError(e));
  }
}

export async function listDatastoreKeys(ctx: ToolContext, p: z.infer<typeof ListKeysSchema>): Promise<CallToolResult> {
  try {
    const id = resolveUniverseId(ctx, p.universe_id);
    const res = await ctx.client.request({
      method: "GET",
      path: `/datastores/v1/universes/${id}/standard-datastores/datastore/entries`,
      query: {
        datastoreName: p.datastore_name,
        scope: p.all_scopes ? undefined : p.scope,
        allScopes: p.all_scopes ? true : undefined,
        prefix: p.prefix,
        limit: p.limit,
        cursor: p.cursor,
      },
    });
    const data = asRecord(parseJson(res.text));
    const raw = Array.isArray(data.keys) ? (data.keys as Array<Record<string, unknown>>) : [];
    const keys = raw.map((k) => ({ scope: String(k.scope ?? ""), key: String(k.key ?? "") }));
    const next = typeof data.nextPageCursor === "string" && data.nextPageCursor ? data.nextPageCursor : undefined;
    const structured = {
      datastore: p.datastore_name,
      count: keys.length,
      keys,
      has_more: next !== undefined,
      next_cursor: next,
    };
    const lines = [`# Chiavi di "${p.datastore_name}"`, "", `Trovate ${keys.length}${next ? " (ce ne sono altre: usa next_cursor)" : ""}`, ""];
    for (const k of keys) lines.push(`- \`${k.key}\` (scope: ${k.scope})`);
    if (next) lines.push("", `next_cursor: \`${next}\``);
    return ok(structured, lines.join("\n"), p.response_format);
  } catch (e) {
    return fail(describeError(e));
  }
}

export async function getDatastoreEntry(ctx: ToolContext, p: z.infer<typeof GetEntrySchema>): Promise<CallToolResult> {
  try {
    const id = resolveUniverseId(ctx, p.universe_id);
    const res = await ctx.client.request({
      method: "GET",
      path: `/datastores/v1/universes/${id}/standard-datastores/datastore/entries/entry`,
      query: { datastoreName: p.datastore_name, entryKey: p.entry_key, scope: p.scope },
    });
    const value = parseJson(res.text);
    const valueText = typeof value === "string" ? value : JSON.stringify(value);
    let shown: unknown = value;
    let truncated = false;
    if (valueText.length > CHARACTER_LIMIT) {
      shown = valueText.slice(0, CHARACTER_LIMIT);
      truncated = true;
    }
    const idsRaw = res.headers.get("roblox-entry-userids");
    let userIds: unknown;
    if (idsRaw) {
      try {
        userIds = JSON.parse(idsRaw);
      } catch {
        userIds = idsRaw;
      }
    }
    const structured = {
      datastore: p.datastore_name,
      scope: p.scope,
      key: p.entry_key,
      value: shown,
      truncated,
      version: res.headers.get("roblox-entry-version") ?? undefined,
      created_time: res.headers.get("roblox-entry-created-time") ?? undefined,
      version_created_time: res.headers.get("roblox-entry-version-created-time") ?? undefined,
      user_ids: userIds,
    };
    const body = typeof shown === "string" ? shown : JSON.stringify(shown, null, 2);
    const md = [
      `# Entry \`${p.entry_key}\` in "${p.datastore_name}" (scope: ${p.scope})`,
      "",
      structured.version ? `- **versione**: ${structured.version}` : "",
      structured.version_created_time ? `- **versione creata**: ${structured.version_created_time}` : "",
      truncated ? "- **nota**: valore troncato" : "",
      "",
      "```json",
      body,
      "```",
    ]
      .filter((l, i, a) => l !== "" || a[i - 1] !== "")
      .join("\n");
    return ok(structured, md, p.response_format);
  } catch (e) {
    return fail(describeError(e));
  }
}

export async function apiGet(ctx: ToolContext, p: z.infer<typeof ApiGetSchema>): Promise<CallToolResult> {
  try {
    const res = await ctx.client.request({ method: "GET", path: p.path, query: p.query });
    const data = parseJson(res.text);
    const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    const { text: shown, truncated } = truncateText(text);
    const structured = { status: res.status, truncated, data: truncated ? shown : data };
    return ok(structured, `# GET ${p.path} → ${res.status}\n\n\`\`\`json\n${text}\n\`\`\``, p.response_format);
  } catch (e) {
    return fail(describeError(e));
  }
}

/* ------------------------------------------------------------- registration */

export function registerReadTools(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "roblox_get_universe",
    {
      title: "Get Roblox universe info",
      description: `Read information about a Roblox universe (experience) through Open Cloud: name, description, visibility, age rating and more.

Args:
  - universe_id (string, optional): defaults to ROBLOX_UNIVERSE_ID
  - response_format ('markdown' | 'json')

Returns: the universe fields exactly as returned by Open Cloud (field names may change over time).
Errors: 401 invalid key, 403 missing permission/resource on the key, 404 wrong ID.`,
      inputSchema: GetUniverseSchema,
      annotations: READ_ONLY,
    },
    (p) => getUniverse(ctx, p),
  );

  server.registerTool(
    "roblox_get_place",
    {
      title: "Get Roblox place info",
      description: `Read information about a single place of an experience through Open Cloud.

Args:
  - universe_id (string, optional): defaults to ROBLOX_UNIVERSE_ID
  - place_id (string, optional): defaults to ROBLOX_PLACE_ID
  - response_format ('markdown' | 'json')

Returns: the place fields exactly as returned by Open Cloud.`,
      inputSchema: GetPlaceSchema,
      annotations: READ_ONLY,
    },
    (p) => getPlace(ctx, p),
  );

  server.registerTool(
    "roblox_list_datastores",
    {
      title: "List DataStores",
      description: `List the standard DataStores of an experience (names only, not their content).

Args:
  - universe_id (string, optional), prefix (string, optional), limit (1-100, default 25), cursor (string, optional)
  - response_format ('markdown' | 'json')

Returns: { count, datastores: [{ name, created_time }], has_more, next_cursor }.
Use next_cursor as cursor to get the next page.`,
      inputSchema: ListDatastoresSchema,
      outputSchema: {
        count: z.number(),
        datastores: z.array(z.object({ name: z.string(), created_time: z.string().optional() })),
        has_more: z.boolean(),
        next_cursor: z.string().optional(),
      },
      annotations: READ_ONLY,
    },
    (p) => listDatastores(ctx, p),
  );

  server.registerTool(
    "roblox_list_datastore_keys",
    {
      title: "List DataStore keys",
      description: `List the keys of one standard DataStore (keys only, not the values).

Args:
  - datastore_name (string, required), scope (default 'global') or all_scopes=true
  - prefix (string, optional), limit (1-100, default 25), cursor (string, optional), universe_id (optional)

Returns: { datastore, count, keys: [{ scope, key }], has_more, next_cursor }.
Use roblox_get_datastore_entry to read the value of a key.`,
      inputSchema: ListKeysSchema,
      outputSchema: {
        datastore: z.string(),
        count: z.number(),
        keys: z.array(z.object({ scope: z.string(), key: z.string() })),
        has_more: z.boolean(),
        next_cursor: z.string().optional(),
      },
      annotations: READ_ONLY,
    },
    (p) => listDatastoreKeys(ctx, p),
  );

  server.registerTool(
    "roblox_get_datastore_entry",
    {
      title: "Read a DataStore entry",
      description: `Read the current value of one DataStore entry. WARNING: entries often contain player data; read only what is needed.

Args:
  - datastore_name (string, required), entry_key (string, required), scope (default 'global'), universe_id (optional)

Returns: { datastore, scope, key, value, truncated, version, created_time, version_created_time, user_ids }.
Large values are truncated (truncated=true).`,
      inputSchema: GetEntrySchema,
      annotations: READ_ONLY,
    },
    (p) => getDatastoreEntry(ctx, p),
  );

  server.registerTool(
    "roblox_api_get",
    {
      title: "Generic Open Cloud GET request",
      description: `Send a read-only GET request to any documented Open Cloud endpoint on apis.roblox.com using the server's API key. Use it for endpoints that have no dedicated tool; take the path and query parameters from the official Open Cloud documentation (do not guess them).

Args:
  - path (string): starts with '/', e.g. '/cloud/v2/universes/123' (no full URLs, no '?')
  - query (object, optional): query-string parameters
  - response_format ('markdown' | 'json')

Returns: { status, truncated, data }. The host is fixed to apis.roblox.com; only GET is possible.`,
      inputSchema: ApiGetSchema,
      annotations: READ_ONLY,
    },
    (p) => apiGet(ctx, p),
  );
}

export { IdSchema };
