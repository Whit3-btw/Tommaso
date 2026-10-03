import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SERVER_NAME, SERVER_VERSION } from "./constants.js";
import type { ToolContext } from "./tools/context.js";
import { registerReadTools } from "./tools/read.js";
import { registerWriteTools } from "./tools/write.js";

export function createServer(ctx: ToolContext): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        "Tools for the Roblox Open Cloud API using the user's API key. Read tools are always available. " +
        "roblox_publish_message and roblox_upload_place_version change things and only work when the server was " +
        "started with ROBLOX_MCP_ALLOW_WRITES=true: always ask the user before using them, try dry_run first, and prefer " +
        "version_type 'Saved' over 'Published'. DataStore entries may contain player data: read only what is needed. " +
        "Take endpoint paths for roblox_api_get from the official documentation instead of guessing.",
    },
  );
  registerReadTools(server, ctx);
  registerWriteTools(server, ctx);
  return server;
}
