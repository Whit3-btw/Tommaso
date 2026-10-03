import { REQUEST_TIMEOUT_MS } from "../constants.js";

/** Problem with the server configuration or with a tool argument. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/** Non-2xx answer from the Roblox API. */
export class RobloxApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail?: string,
  ) {
    super(`HTTP ${status}`);
    this.name = "RobloxApiError";
  }
}

export type Query = Record<string, string | number | boolean | undefined>;

export interface RequestOptions {
  method: "GET" | "POST";
  path: string;
  query?: Query;
  headers?: Record<string, string>;
  body?: string | Uint8Array;
  timeoutMs?: number;
}

export interface ApiResponse {
  status: number;
  headers: Headers;
  text: string;
}

/**
 * Only plain, relative API paths are allowed. The host is fixed by the server,
 * so a tool argument can never redirect the API key to another site.
 */
export function assertSafePath(path: string): void {
  const bad = (): never => {
    throw new ConfigError(
      "percorso non valido: deve iniziare con '/', essere relativo a apis.roblox.com " +
        "(niente URL completi, '..' o '?' nel percorso: usa il campo query).",
    );
  };
  if (!path.startsWith("/") || path.startsWith("//")) bad();
  if (/[\u0000- \u007f\\?#]/.test(path)) bad();
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return bad();
  }
  if (/(^|\/)\.\.?(\/|$)/.test(decoded) || /[\\]/.test(decoded)) bad();
}

function extractDetail(text: string): string | undefined {
  if (!text.trim()) return undefined;
  try {
    const j = JSON.parse(text) as Record<string, unknown>;
    const errors = j.errors as Array<Record<string, unknown>> | undefined;
    const candidate =
      (typeof j.message === "string" && j.message) ||
      (typeof j.error === "string" && j.error) ||
      (typeof errors?.[0]?.message === "string" && (errors[0].message as string)) ||
      (typeof j.code === "string" && j.code) ||
      undefined;
    if (candidate) return candidate.slice(0, 300);
  } catch {
    /* not JSON */
  }
  return text.slice(0, 300);
}

export class RobloxClient {
  private readonly fetchImpl: typeof fetch;

  constructor(
    private readonly opts: { apiKey: string | undefined; baseUrl: string; fetchImpl?: typeof fetch },
  ) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async request(o: RequestOptions): Promise<ApiResponse> {
    if (!this.opts.apiKey) {
      throw new ConfigError(
        "ROBLOX_API_KEY non impostata: crea una chiave API nel Creator Hub e passala al server come variabile d'ambiente.",
      );
    }
    assertSafePath(o.path);
    const base = new URL(this.opts.baseUrl);
    const url = new URL(o.path, base);
    if (url.origin !== base.origin) {
      throw new ConfigError("l'indirizzo finale non corrisponde a apis.roblox.com.");
    }
    for (const [k, v] of Object.entries(o.query ?? {})) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), o.timeoutMs ?? REQUEST_TIMEOUT_MS);
    try {
      const init: RequestInit = {
        method: o.method,
        headers: { "x-api-key": this.opts.apiKey, ...o.headers },
        signal: controller.signal,
      };
      if (o.body !== undefined) init.body = o.body as BodyInit;
      const res = await this.fetchImpl(url, init);
      const text = await res.text();
      if (!res.ok) throw new RobloxApiError(res.status, extractDetail(text));
      return { status: res.status, headers: res.headers, text };
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Turns any error into a short message that says what to do next. Never includes the API key. */
export function describeError(err: unknown): string {
  if (err instanceof ConfigError) return `Errore di configurazione: ${err.message}`;
  if (err instanceof RobloxApiError) {
    const d = err.detail ? ` Dettaglio da Roblox: ${err.detail}` : "";
    switch (err.status) {
      case 400:
        return `Errore: richiesta non valida (400). Controlla nomi, ID e formato dei parametri.${d}`;
      case 401:
        return `Errore: chiave API non valida, scaduta o disattivata (401). Controlla la chiave nel Creator Hub e aggiorna ROBLOX_API_KEY.${d}`;
      case 403:
        return `Errore: permesso negato (403). Controlla che la chiave abbia il permesso (scope) giusto per questa operazione, che l'esperienza sia tra le risorse della chiave e che il tuo indirizzo IP sia consentito.${d}`;
      case 404:
        return `Errore: risorsa non trovata (404). Controlla ID di universo/luogo, nome del DataStore e chiave.${d}`;
      case 409:
        return `Errore: conflitto (409). La risorsa è stata modificata o è in uso: riprova.${d}`;
      case 429:
        return `Errore: troppe richieste (429). Aspetta almeno un minuto e riprova.${d}`;
      default:
        return err.status >= 500
          ? `Errore: il servizio Roblox ha avuto un problema (${err.status}). Riprova tra poco.${d}`
          : `Errore: Roblox ha risposto con codice ${err.status}.${d}`;
    }
  }
  if (err instanceof Error) {
    if (err.name === "AbortError") return "Errore: la richiesta ha superato il tempo massimo. Riprova.";
    if (err.message === "fetch failed") {
      return "Errore: impossibile raggiungere apis.roblox.com (controlla connessione, firewall o proxy).";
    }
    return `Errore: ${err.message}`;
  }
  return "Errore sconosciuto.";
}
