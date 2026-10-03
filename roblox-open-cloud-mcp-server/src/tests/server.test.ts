import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { Config } from "../config.js";
import { createServer } from "../server.js";
import { assertSafePath, RobloxClient } from "../services/client.js";

const KEY = "secret-test-key";

interface Call {
  url: URL;
  init: RequestInit;
}
interface Reply {
  status?: number;
  body?: unknown;
  raw?: string;
  headers?: Record<string, string>;
}

async function setup(opts: { allowWrites?: boolean; apiKey?: string | undefined; reply?: (c: Call) => Reply } = {}) {
  const calls: Call[] = [];
  const fakeFetch = (async (input: URL | string, init?: RequestInit) => {
    const call: Call = { url: new URL(String(input)), init: init ?? {} };
    calls.push(call);
    const r = opts.reply?.(call) ?? {};
    return new Response(r.raw ?? JSON.stringify(r.body ?? {}), { status: r.status ?? 200, headers: r.headers });
  }) as typeof fetch;
  const apiKey = "apiKey" in opts ? opts.apiKey : KEY;
  const config: Config = {
    apiKey,
    universeId: "111",
    placeId: "222",
    allowWrites: opts.allowWrites ?? false,
    baseUrl: "https://apis.roblox.com",
  };
  const server = createServer({ config, client: new RobloxClient({ apiKey, baseUrl: config.baseUrl, fetchImpl: fakeFetch }) });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await Promise.all([server.connect(st), client.connect(ct)]);
  return {
    calls,
    client,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const textOf = (r: any): string => (r.content as Array<{ text?: string }>).map((c) => c.text ?? "").join("\n");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const structured = (r: any): any => r.structuredContent;
const header = (c: Call, name: string): string | null => new Headers(c.init.headers).get(name);

test("espone gli 8 strumenti con le annotazioni giuste", async () => {
  const t = await setup();
  const { tools } = await t.client.listTools();
  const names = tools.map((x) => x.name).sort();
  assert.deepEqual(names, [
    "roblox_api_get",
    "roblox_get_datastore_entry",
    "roblox_get_place",
    "roblox_get_universe",
    "roblox_list_datastore_keys",
    "roblox_list_datastores",
    "roblox_publish_message",
    "roblox_upload_place_version",
  ]);
  for (const tool of tools) {
    const writes = tool.name === "roblox_publish_message" || tool.name === "roblox_upload_place_version";
    assert.equal(tool.annotations?.readOnlyHint, !writes, tool.name);
  }
  await t.close();
});

test("get_universe chiama l'URL giusto con la chiave nell'header", async () => {
  const t = await setup({ reply: () => ({ body: { displayName: "Cattura le Lucciole", visibility: "PUBLIC" } }) });
  const r = await t.client.callTool({ name: "roblox_get_universe", arguments: {} });
  assert.notEqual(r.isError, true);
  assert.equal(t.calls[0].url.href, "https://apis.roblox.com/cloud/v2/universes/111");
  assert.equal(header(t.calls[0], "x-api-key"), KEY);
  assert.match(textOf(r), /Cattura le Lucciole/);
  assert.equal(structured(r).universe.visibility, "PUBLIC");
  assert.ok(!textOf(r).includes(KEY));
  await t.close();
});

test("list_datastore_keys applica i filtri e restituisce il cursore", async () => {
  const t = await setup({
    reply: () => ({ body: { keys: [{ scope: "global", key: "Player_1" }], nextPageCursor: "abc" } }),
  });
  const r = await t.client.callTool({
    name: "roblox_list_datastore_keys",
    arguments: { datastore_name: "PlayerData", prefix: "Player_", limit: 10 },
  });
  const u = t.calls[0].url;
  assert.equal(u.pathname, "/datastores/v1/universes/111/standard-datastores/datastore/entries");
  assert.equal(u.searchParams.get("datastoreName"), "PlayerData");
  assert.equal(u.searchParams.get("scope"), "global");
  assert.equal(u.searchParams.get("prefix"), "Player_");
  assert.equal(u.searchParams.get("limit"), "10");
  assert.deepEqual(structured(r).keys, [{ scope: "global", key: "Player_1" }]);
  assert.equal(structured(r).has_more, true);
  assert.equal(structured(r).next_cursor, "abc");
  await t.close();
});

test("list_datastores legge nomi e paginazione", async () => {
  const t = await setup({ reply: () => ({ body: { datastores: [{ name: "Coins", createdTime: "2026-01-01T00:00:00Z" }] } }) });
  const r = await t.client.callTool({ name: "roblox_list_datastores", arguments: {} });
  assert.equal(structured(r).count, 1);
  assert.equal(structured(r).datastores[0].name, "Coins");
  assert.equal(structured(r).has_more, false);
  await t.close();
});

test("get_datastore_entry legge valore e intestazioni, e tronca i valori enormi", async () => {
  const t = await setup({
    reply: () => ({
      raw: '{"coins":5}',
      headers: { "roblox-entry-version": "9", "roblox-entry-userids": "[123]" },
    }),
  });
  const r = await t.client.callTool({
    name: "roblox_get_datastore_entry",
    arguments: { datastore_name: "PlayerData", entry_key: "Player_1" },
  });
  const u = t.calls[0].url;
  assert.equal(u.pathname, "/datastores/v1/universes/111/standard-datastores/datastore/entries/entry");
  assert.equal(u.searchParams.get("entryKey"), "Player_1");
  assert.deepEqual(structured(r).value, { coins: 5 });
  assert.equal(structured(r).version, "9");
  assert.deepEqual(structured(r).user_ids, [123]);
  await t.close();

  const big = await setup({ reply: () => ({ raw: JSON.stringify({ data: "x".repeat(30000) }) }) });
  const r2 = await big.client.callTool({
    name: "roblox_get_datastore_entry",
    arguments: { datastore_name: "D", entry_key: "K" },
  });
  assert.equal(structured(r2).truncated, true);
  assert.ok(textOf(r2).length < 26000);
  await big.close();
});

test("gli errori sono chiari e non contengono la chiave", async () => {
  const t = await setup({ reply: () => ({ status: 403, body: { message: "Insufficient scope" } }) });
  const r = await t.client.callTool({ name: "roblox_get_universe", arguments: {} });
  assert.equal(r.isError, true);
  assert.match(textOf(r), /permesso negato \(403\)/);
  assert.match(textOf(r), /Insufficient scope/);
  assert.ok(!textOf(r).includes(KEY));
  await t.close();

  const t429 = await setup({ reply: () => ({ status: 429 }) });
  const r2 = await t429.client.callTool({ name: "roblox_get_universe", arguments: {} });
  assert.match(textOf(r2), /troppe richieste/);
  await t429.close();
});

test("senza chiave API spiega cosa fare e non fa richieste", async () => {
  const t = await setup({ apiKey: undefined });
  const r = await t.client.callTool({ name: "roblox_get_universe", arguments: {} });
  assert.equal(r.isError, true);
  assert.match(textOf(r), /ROBLOX_API_KEY/);
  assert.equal(t.calls.length, 0);
  await t.close();
});

test("roblox_api_get rifiuta percorsi pericolosi senza uscire verso altri siti", async () => {
  for (const bad of ["//evil.com/x", "https://evil.com/x", "/cloud/../secret", "/a/%2e%2e/b", "cloud/v2", "/a?x=1", "/a\\b"]) {
    assert.throws(() => assertSafePath(bad), Error, bad);
  }
  assert.doesNotThrow(() => assertSafePath("/cloud/v2/universes/123"));

  const t = await setup();
  const r = await t.client.callTool({ name: "roblox_api_get", arguments: { path: "//evil.com/x" } });
  assert.equal(r.isError, true);
  assert.equal(t.calls.length, 0);

  const good = await setup({ reply: () => ({ body: { ok: true } }) });
  const r2 = await good.client.callTool({
    name: "roblox_api_get",
    arguments: { path: "/cloud/v2/universes/5", query: { maxPageSize: 3 } },
  });
  assert.equal(good.calls[0].url.href, "https://apis.roblox.com/cloud/v2/universes/5?maxPageSize=3");
  assert.equal(good.calls[0].init.method, "GET");
  assert.equal(structured(r2).status, 200);
  await t.close();
  await good.close();
});

test("le scritture sono disabilitate di default, ma il dry_run funziona", async () => {
  const t = await setup({ allowWrites: false });
  const r = await t.client.callTool({
    name: "roblox_publish_message",
    arguments: { topic: "Shutdown", message: "ciao", confirm: true },
  });
  assert.equal(r.isError, true);
  assert.match(textOf(r), /ROBLOX_MCP_ALLOW_WRITES=true/);

  const dry = await t.client.callTool({
    name: "roblox_publish_message",
    arguments: { topic: "Shutdown", message: "ciao", dry_run: true },
  });
  assert.notEqual(dry.isError, true);
  assert.equal(structured(dry).dry_run, true);
  assert.equal(t.calls.length, 0);
  await t.close();
});

test("publish_message richiede conferma e invia JSON al topic giusto", async () => {
  const t = await setup({ allowWrites: true });
  const noConfirm = await t.client.callTool({
    name: "roblox_publish_message",
    arguments: { topic: "Shutdown", message: "ciao" },
  });
  assert.equal(noConfirm.isError, true);
  assert.match(textOf(noConfirm), /confirm=true/);
  assert.equal(t.calls.length, 0);

  const r = await t.client.callTool({
    name: "roblox_publish_message",
    arguments: { topic: "Evento Speciale", message: "ciao", confirm: true },
  });
  assert.notEqual(r.isError, true);
  assert.equal(t.calls[0].init.method, "POST");
  assert.equal(t.calls[0].url.pathname, "/messaging-service/v1/universes/111/topics/Evento%20Speciale");
  assert.equal(t.calls[0].init.body, JSON.stringify({ message: "ciao" }));
  assert.equal(header(t.calls[0], "content-type"), "application/json");
  await t.close();
});

test("upload_place_version: Saved di default, Published richiede doppia conferma", async () => {
  const dir = await mkdtemp(join(tmpdir(), "roblox-mcp-"));
  const file = join(dir, "game.rbxl");
  await writeFile(file, Buffer.from([1, 2, 3, 4]));
  try {
    const t = await setup({ allowWrites: true, reply: () => ({ body: { versionNumber: 7 } }) });

    const bad = await t.client.callTool({ name: "roblox_upload_place_version", arguments: { file_path: join(dir, "x.txt"), confirm: true } });
    assert.equal(bad.isError, true);
    assert.match(textOf(bad), /\.rbxl/);

    const dry = await t.client.callTool({ name: "roblox_upload_place_version", arguments: { file_path: file, dry_run: true } });
    assert.equal(structured(dry).file_size_bytes, 4);
    assert.equal(t.calls.length, 0);

    const noConfirm = await t.client.callTool({ name: "roblox_upload_place_version", arguments: { file_path: file } });
    assert.equal(noConfirm.isError, true);

    const live = await t.client.callTool({
      name: "roblox_upload_place_version",
      arguments: { file_path: file, version_type: "Published", confirm: true },
    });
    assert.equal(live.isError, true);
    assert.match(textOf(live), /confirm_publish=true/);
    assert.equal(t.calls.length, 0);

    const saved = await t.client.callTool({ name: "roblox_upload_place_version", arguments: { file_path: file, confirm: true } });
    assert.notEqual(saved.isError, true);
    const c = t.calls[0];
    assert.equal(c.init.method, "POST");
    assert.equal(c.url.pathname, "/universes/v1/111/places/222/versions");
    assert.equal(c.url.searchParams.get("versionType"), "Saved");
    assert.equal(header(c, "content-type"), "application/octet-stream");
    assert.equal((c.init.body as Uint8Array).length, 4);
    assert.equal(structured(saved).version_number, 7);

    const published = await t.client.callTool({
      name: "roblox_upload_place_version",
      arguments: { file_path: file, version_type: "Published", confirm: true, confirm_publish: true },
    });
    assert.notEqual(published.isError, true);
    assert.equal(t.calls[1].url.searchParams.get("versionType"), "Published");
    await t.close();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("avvio reale via stdio: elenca gli strumenti e spiega la chiave mancante", async () => {
  const entry = fileURLToPath(new URL("../index.js", import.meta.url));
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [entry],
    env: { ...(process.env as Record<string, string>), ROBLOX_API_KEY: "", ROBLOX_MCP_ALLOW_WRITES: "" },
    stderr: "ignore",
  });
  const client = new Client({ name: "smoke", version: "1.0.0" });
  await client.connect(transport);
  const { tools } = await client.listTools();
  assert.equal(tools.length, 8);
  const r = await client.callTool({ name: "roblox_get_universe", arguments: { universe_id: "1" } });
  assert.equal(r.isError, true);
  assert.match(textOf(r), /ROBLOX_API_KEY/);
  await client.close();
});
