import { API_BASE_URL } from "./constants.js";

export interface Config {
  /** Open Cloud API key (ROBLOX_API_KEY). Never logged. */
  apiKey: string | undefined;
  /** Default universe (experience) ID (ROBLOX_UNIVERSE_ID). */
  universeId: string | undefined;
  /** Default place ID (ROBLOX_PLACE_ID). */
  placeId: string | undefined;
  /** Write tools do nothing unless ROBLOX_MCP_ALLOW_WRITES=true. */
  allowWrites: boolean;
  baseUrl: string;
}

const ID_RE = /^\d{1,20}$/;

function parseId(value: string | undefined, name: string): string | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const v = value.trim();
  if (!ID_RE.test(v)) {
    throw new Error(`${name} deve contenere solo cifre.`);
  }
  return v;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    apiKey: env.ROBLOX_API_KEY?.trim() || undefined,
    universeId: parseId(env.ROBLOX_UNIVERSE_ID, "ROBLOX_UNIVERSE_ID"),
    placeId: parseId(env.ROBLOX_PLACE_ID, "ROBLOX_PLACE_ID"),
    allowWrites: (env.ROBLOX_MCP_ALLOW_WRITES ?? "").trim().toLowerCase() === "true",
    baseUrl: API_BASE_URL,
  };
}
