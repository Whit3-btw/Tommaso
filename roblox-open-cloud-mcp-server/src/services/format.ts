import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { CHARACTER_LIMIT } from "../constants.js";

export type ResponseFormat = "markdown" | "json";

export function truncateText(
  text: string,
  limit: number = CHARACTER_LIMIT,
): { text: string; truncated: boolean } {
  if (text.length <= limit) return { text, truncated: false };
  return {
    text:
      text.slice(0, limit) +
      `\n\n[... troncato: ${text.length - limit} caratteri in meno. Usa filtri o paginazione per vedere il resto.]`,
    truncated: true,
  };
}

/** Markdown bullet list for an object of unknown shape (nested values as JSON blocks). */
export function renderFields(obj: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "object") {
      lines.push(`- **${k}**:\n\n\`\`\`json\n${JSON.stringify(v, null, 2)}\n\`\`\``);
    } else {
      lines.push(`- **${k}**: ${String(v)}`);
    }
  }
  return lines.join("\n");
}

export function ok(
  structured: Record<string, unknown>,
  markdown: string,
  format: ResponseFormat,
): CallToolResult {
  const raw = format === "json" ? JSON.stringify(structured, null, 2) : markdown;
  return { content: [{ type: "text", text: truncateText(raw).text }], structuredContent: structured };
}

export function fail(message: string): CallToolResult {
  return { isError: true, content: [{ type: "text", text: message }] };
}
