import { readFile, stat } from "node:fs/promises";
import { extname } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { MAX_PLACE_FILE_BYTES, UPLOAD_TIMEOUT_MS } from "../constants.js";
import { describeError } from "../services/client.js";
import { fail, ok } from "../services/format.js";
import { placeIdField, universeIdField } from "../schemas.js";
import { asRecord, parseJson, resolvePlaceId, resolveUniverseId, type ToolContext } from "./context.js";

const WRITES_DISABLED =
  "Errore: le operazioni di scrittura sono disabilitate. Per attivarle imposta ROBLOX_MCP_ALLOW_WRITES=true " +
  "nella configurazione del server e riavvia Claude. (Con dry_run=true puoi controllare la richiesta senza inviarla.)";

export const PublishMessageSchema = z.object({
  universe_id: universeIdField,
  topic: z.string().min(1).max(200).describe("Messaging topic that the game subscribes to"),
  message: z.string().min(1).describe("Message text sent to all live servers of the experience"),
  dry_run: z.boolean().default(false).describe("If true, validate and show what would be sent without sending"),
  confirm: z.boolean().default(false).describe("Must be true to really send the message (ask the user first)"),
});

export const UploadPlaceVersionSchema = z.object({
  universe_id: universeIdField,
  place_id: placeIdField,
  file_path: z.string().min(1).max(1024).describe("Path to a .rbxl or .rbxlx place file on this computer"),
  version_type: z
    .enum(["Saved", "Published"])
    .default("Saved")
    .describe("'Saved' creates a version without making it live (default). 'Published' makes it LIVE for players."),
  dry_run: z.boolean().default(false).describe("If true, check the file and show what would be uploaded without uploading"),
  confirm: z.boolean().default(false).describe("Must be true to really upload (ask the user first)"),
  confirm_publish: z
    .boolean()
    .default(false)
    .describe("Must ALSO be true when version_type is 'Published' (goes live immediately)"),
});

export async function publishMessage(ctx: ToolContext, p: z.infer<typeof PublishMessageSchema>): Promise<CallToolResult> {
  try {
    if (!ctx.config.allowWrites && !p.dry_run) return fail(WRITES_DISABLED);
    const id = resolveUniverseId(ctx, p.universe_id);
    if (p.dry_run) {
      return ok(
        { dry_run: true, universe_id: id, topic: p.topic, message_length: p.message.length },
        `Simulazione: verrebbe inviato un messaggio di ${p.message.length} caratteri al topic "${p.topic}" dell'universo ${id}. Nessuna richiesta inviata.`,
        "markdown",
      );
    }
    if (!p.confirm) {
      return fail("Errore: per inviare davvero il messaggio serve confirm=true. Chiedi conferma all'utente prima.");
    }
    await ctx.client.request({
      method: "POST",
      path: `/messaging-service/v1/universes/${id}/topics/${encodeURIComponent(p.topic)}`,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: p.message }),
    });
    return ok(
      { published: true, universe_id: id, topic: p.topic },
      `Messaggio inviato al topic "${p.topic}" dell'universo ${id}.`,
      "markdown",
    );
  } catch (e) {
    return fail(describeError(e));
  }
}

export async function uploadPlaceVersion(ctx: ToolContext, p: z.infer<typeof UploadPlaceVersionSchema>): Promise<CallToolResult> {
  try {
    const ext = extname(p.file_path).toLowerCase();
    if (ext !== ".rbxl" && ext !== ".rbxlx") {
      return fail("Errore: il file deve avere estensione .rbxl o .rbxlx.");
    }
    if (p.file_path.includes("\u0000")) return fail("Errore: percorso del file non valido.");
    if (!ctx.config.allowWrites && !p.dry_run) return fail(WRITES_DISABLED);

    const u = resolveUniverseId(ctx, p.universe_id);
    const pl = resolvePlaceId(ctx, p.place_id);

    let size: number;
    try {
      const s = await stat(p.file_path);
      if (!s.isFile()) return fail("Errore: il percorso indicato non è un file.");
      size = s.size;
    } catch {
      return fail("Errore: file non trovato o non leggibile. Controlla il percorso.");
    }
    if (size === 0) return fail("Errore: il file è vuoto.");
    if (size > MAX_PLACE_FILE_BYTES) {
      return fail(`Errore: il file supera il limite di sicurezza dello strumento (${MAX_PLACE_FILE_BYTES / 1024 / 1024} MB).`);
    }
    const contentType = ext === ".rbxlx" ? "application/xml" : "application/octet-stream";

    if (p.dry_run) {
      return ok(
        { dry_run: true, universe_id: u, place_id: pl, version_type: p.version_type, file_size_bytes: size, content_type: contentType },
        `Simulazione: verrebbe caricato ${p.file_path} (${size} byte) come versione "${p.version_type}" del luogo ${pl} (universo ${u}). Nessuna richiesta inviata.`,
        "markdown",
      );
    }
    if (!p.confirm) {
      return fail("Errore: per caricare davvero il file serve confirm=true. Chiedi conferma all'utente prima.");
    }
    if (p.version_type === "Published" && !p.confirm_publish) {
      return fail(
        "Errore: version_type 'Published' manda il gioco LIVE subito. Serve anche confirm_publish=true, dopo aver chiesto conferma esplicita all'utente. Con 'Saved' la versione non va live.",
      );
    }

    const body = await readFile(p.file_path);
    const res = await ctx.client.request({
      method: "POST",
      path: `/universes/v1/${u}/places/${pl}/versions`,
      query: { versionType: p.version_type },
      headers: { "content-type": contentType },
      body,
      timeoutMs: UPLOAD_TIMEOUT_MS,
    });
    const data = asRecord(parseJson(res.text));
    const versionNumber = typeof data.versionNumber === "number" ? data.versionNumber : undefined;
    return ok(
      { uploaded: true, universe_id: u, place_id: pl, version_type: p.version_type, version_number: versionNumber, file_size_bytes: size },
      `Caricata la versione ${versionNumber ?? "(numero non restituito)"} del luogo ${pl} come "${p.version_type}".` +
        (p.version_type === "Saved" ? " Non è live: pubblicala da Studio o ripeti con 'Published' dopo la conferma." : " È LIVE."),
      "markdown",
    );
  } catch (e) {
    return fail(describeError(e));
  }
}

export function registerWriteTools(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "roblox_publish_message",
    {
      title: "Publish a message to live servers",
      description: `Send a message through the Roblox Messaging Service to all running servers of the experience (the game must subscribe to the topic). WRITE operation: disabled unless the server runs with ROBLOX_MCP_ALLOW_WRITES=true.

Args:
  - topic (string), message (string), universe_id (optional)
  - dry_run (boolean): check without sending
  - confirm (boolean): must be true to send. ALWAYS ask the user before sending.

Returns: { published, universe_id, topic }.`,
      inputSchema: PublishMessageSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    (p) => publishMessage(ctx, p),
  );

  server.registerTool(
    "roblox_upload_place_version",
    {
      title: "Upload a place file as a new version",
      description: `Upload a .rbxl/.rbxlx file as a new version of a place. WRITE operation: disabled unless the server runs with ROBLOX_MCP_ALLOW_WRITES=true.

version_type 'Saved' (default) only saves a version (not live; it appears in Version History). 'Published' makes it LIVE for players and needs confirm_publish=true on top of confirm=true. ALWAYS ask the user before uploading, and prefer 'Saved'.

Args:
  - file_path (string), version_type ('Saved' | 'Published'), universe_id/place_id (optional)
  - dry_run (boolean): check the file without uploading; confirm (boolean); confirm_publish (boolean)

Returns: { uploaded, universe_id, place_id, version_type, version_number, file_size_bytes }.
Roblox limits this endpoint to about 10 requests per minute per key.`,
      inputSchema: UploadPlaceVersionSchema,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    },
    (p) => uploadPlaceVersion(ctx, p),
  );
}
