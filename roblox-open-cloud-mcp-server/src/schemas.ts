import { z } from "zod";

export const IdSchema = z.string().regex(/^\d{1,20}$/, "Deve contenere solo cifre");

export const universeIdField = IdSchema.optional().describe(
  "Universe (experience) ID. If omitted, the ROBLOX_UNIVERSE_ID of the server is used.",
);

export const placeIdField = IdSchema.optional().describe(
  "Place ID. If omitted, the ROBLOX_PLACE_ID of the server is used.",
);

export const responseFormatField = z
  .enum(["markdown", "json"])
  .default("markdown")
  .describe("'markdown' for readable output, 'json' for machine-readable output");

export const limitField = z
  .number()
  .int()
  .min(1)
  .max(100)
  .default(25)
  .describe("Maximum items to return (1-100, default 25)");

export const cursorField = z
  .string()
  .max(2000)
  .optional()
  .describe("Pagination cursor returned by a previous call as next_cursor");

export const scopeField = z
  .string()
  .min(1)
  .max(100)
  .default("global")
  .describe("DataStore scope (default 'global')");
