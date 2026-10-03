#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { SERVER_NAME } from "./constants.js";
import { createServer } from "./server.js";
import { RobloxClient } from "./services/client.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const client = new RobloxClient({ apiKey: config.apiKey, baseUrl: config.baseUrl });
  const server = createServer({ config, client });
  await server.connect(new StdioServerTransport());
  // stdout is reserved for the protocol: log to stderr only, never the key.
  console.error(
    `[${SERVER_NAME}] avviato | chiave API: ${config.apiKey ? "impostata" : "NON impostata"} | ` +
      `scrittura: ${config.allowWrites ? "ABILITATA" : "disabilitata"}`,
  );
}

main().catch((e) => {
  console.error(`[${SERVER_NAME}] errore fatale:`, e instanceof Error ? e.message : e);
  process.exit(1);
});
