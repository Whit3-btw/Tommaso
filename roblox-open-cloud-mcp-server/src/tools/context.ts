import type { Config } from "../config.js";
import { ConfigError, type RobloxClient } from "../services/client.js";

export interface ToolContext {
  config: Config;
  client: RobloxClient;
}

export function resolveUniverseId(ctx: ToolContext, given?: string): string {
  const id = given ?? ctx.config.universeId;
  if (!id) throw new ConfigError("manca l'ID dell'universo: passa universe_id oppure imposta ROBLOX_UNIVERSE_ID.");
  return id;
}

export function resolvePlaceId(ctx: ToolContext, given?: string): string {
  const id = given ?? ctx.config.placeId;
  if (!id) throw new ConfigError("manca l'ID del luogo: passa place_id oppure imposta ROBLOX_PLACE_ID.");
  return id;
}

export function parseJson(text: string): unknown {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function asRecord(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : { value: v };
}
