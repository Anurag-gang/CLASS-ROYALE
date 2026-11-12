/**
 * Colibri Client Provider Abstraction
 * File: src/lib/socrates/colibriClient.ts
 *
 * Dedicated, self-contained inference client connecting the Socrates AI Workspace
 * to the locally hosted Colibri OpenAI-compatible engine (Qwen3-Coder-30B-A3B).
 *
 * Architecture Principles:
 * 1. Strict Isolation: Zero coupling to CR Intelligence or legacy mock engines.
 * 2. Dynamic Model Discovery: Probes /v1/models with TTL caching and graceful fallback.
 * 3. Transparent Offline Signaling: Emits typed ColibriOfflineError (503) instead of silent mock fallbacks.
 * 4. Streaming & Disconnect Propagation: Pipes AbortSignal through fetch, triggering Colibri's
 *    client_disconnected() socket check to immediately halt hardware inference.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ColibriHealthStatus {
  online: boolean;
  status: "ok" | "offline" | "restarting" | "engine_down";
  model: string;
  endpoint: string;
  latencyMs?: number;
  details?: Record<string, unknown>;
}

export interface ColibriStreamOptions {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  model?: string;
}

export interface ColibriUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ColibriChatResponse {
  content: string;
  role: "assistant";
  model: string;
  usage?: ColibriUsage;
  latencyMs: number;
}

export interface ColibriClientOptions {
  baseUrl?: string;
  defaultModel?: string;
  apiKey?: string;
  healthTimeoutMs?: number;
  requestTimeoutMs?: number;
  modelCacheTtlMs?: number;
}

// ---------------------------------------------------------------------------
// Error Taxonomy
// ---------------------------------------------------------------------------

export class ColibriError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly endpoint?: string;

  constructor(message: string, code: string, status: number = 500, endpoint?: string) {
    super(message);
    this.name = "ColibriError";
    this.code = code;
    this.status = status;
    this.endpoint = endpoint;
  }
}

export class ColibriOfflineError extends ColibriError {
  constructor(endpoint: string, cause?: unknown) {
    super(
      `Colibri Qwen inference service is currently offline or unreachable at ${endpoint}. Please ensure the local Colibri engine is running.`,
      "COLIBRI_OFFLINE",
      503,
      endpoint
    );
    this.name = "ColibriOfflineError";
    if (cause) this.cause = cause;
  }
}

export class ColibriTimeoutError extends ColibriError {
  constructor(endpoint: string, timeoutMs: number) {
    super(
      `Colibri inference request timed out after ${timeoutMs}ms at ${endpoint}.`,
      "COLIBRI_TIMEOUT",
      504,
      endpoint
    );
    this.name = "ColibriTimeoutError";
  }
}

export class ColibriStreamError extends ColibriError {
  constructor(message: string, status: number = 500, endpoint?: string) {
    super(message, "COLIBRI_STREAM_ERROR", status, endpoint);
    this.name = "ColibriStreamError";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isOfflineNetworkError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as Record<string, any>;
  const code = anyErr?.cause?.code || anyErr?.code;
  if (
    code === "ECONNREFUSED" ||
    code === "EACCES" ||
    code === "ENOTFOUND" ||
    code === "ECONNRESET" ||
    code === "EHOSTUNREACH" ||
    code === "UND_ERR_CONNECT_TIMEOUT"
  ) {
    return true;
  }
  const message = String(anyErr?.message || "").toLowerCase();
  if (
    message.includes("fetch failed") ||
    message.includes("econnrefused") ||
    message.includes("network error") ||
    message.includes("failed to fetch")
  ) {
    return true;
  }
  return false;
}

export function combineSignals(
  signalA?: AbortSignal,
  signalB?: AbortSignal
): { signal: AbortSignal; cleanup: () => void } {
  if (!signalA && !signalB) {
    const controller = new AbortController();
    return { signal: controller.signal, cleanup: () => {} };
  }
  if (signalA && !signalB) {
    return { signal: signalA, cleanup: () => {} };
  }
  if (!signalA && signalB) {
    return { signal: signalB, cleanup: () => {} };
  }

  // Modern Node 20+ supports AbortSignal.any
  if (typeof AbortSignal.any === "function") {
    return {
      signal: AbortSignal.any([signalA!, signalB!]),
      cleanup: () => {},
    };
  }

  // Fallback for environments lacking AbortSignal.any
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signalA!.addEventListener("abort", onAbort, { once: true });
  signalB!.addEventListener("abort", onAbort, { once: true });

  if (signalA!.aborted || signalB!.aborted) {
    controller.abort();
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      signalA!.removeEventListener("abort", onAbort);
      signalB!.removeEventListener("abort", onAbort);
    },
  };
}

// ---------------------------------------------------------------------------
// ColibriClient Class
// ---------------------------------------------------------------------------

export class ColibriClient {
  private readonly options: ColibriClientOptions;
  private readonly apiKey?: string;
  private readonly healthTimeoutMs: number;
  private readonly requestTimeoutMs: number;
  private readonly modelCacheTtlMs: number;

  private cachedModel: string | null = null;
  private cachedModelTimestamp = 0;

  constructor(options: ColibriClientOptions = {}) {
    this.options = { ...options };
    this.apiKey = options.apiKey || process.env.COLIBRI_API_KEY || undefined;
    this.healthTimeoutMs = options.healthTimeoutMs ?? 1500;
    this.requestTimeoutMs =
      options.requestTimeoutMs ??
      parseInt(process.env.AI_REQUEST_TIMEOUT_MS || "360000", 10);
    this.modelCacheTtlMs = options.modelCacheTtlMs ?? 30000;
  }

  public getBaseUrl(): string {
    const rawBase = (
      this.options.baseUrl ||
      process.env.COLIBRI_BASE_URL ||
      "http://127.0.0.1:8080/v1"
    ).replace(/\/+$/, "");

    if (rawBase.endsWith("/v1")) {
      return rawBase;
    }
    return `${rawBase}/v1`;
  }

  public getRootUrl(): string {
    const rawBase = (
      this.options.baseUrl ||
      process.env.COLIBRI_BASE_URL ||
      "http://127.0.0.1:8080/v1"
    ).replace(/\/+$/, "");

    if (rawBase.endsWith("/v1")) {
      return rawBase.slice(0, -3);
    }
    return rawBase;
  }

  public getDefaultModel(): string {
    if (this.options.defaultModel) {
      return this.options.defaultModel;
    }
    if (
      process.env.COLIBRI_MODEL &&
      process.env.COLIBRI_MODEL !== "qwen3-coder-30b"
    ) {
      return process.env.COLIBRI_MODEL;
    }
    return "qwen3-coder-30b-a3b-colibri";
  }

  // Backward compatible property getters
  public get baseUrl(): string {
    return this.getBaseUrl();
  }

  public get rootUrl(): string {
    return this.getRootUrl();
  }

  public get v1Url(): string {
    return this.getBaseUrl();
  }

  public get defaultModel(): string {
    return this.getDefaultModel();
  }

  public clearModelCache(): void {
    this.cachedModel = null;
    this.cachedModelTimestamp = 0;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Socrates-AI-Workspace/1.0",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /**
   * Probes /health endpoint to verify engine liveness.
   * Returns clean ColibriHealthStatus without throwing.
   */
  public async checkHealth(): Promise<ColibriHealthStatus> {
    const startTime = performance.now();
    const rootUrl = this.getRootUrl();
    const v1Url = this.getBaseUrl();
    const defaultModel = this.getDefaultModel();

    try {
      const res = await fetch(`${rootUrl}/health`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(this.healthTimeoutMs),
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (res.ok) {
        let details: Record<string, unknown> | undefined;
        try {
          details = await res.json();
        } catch {
          details = undefined;
        }

        const model = await this.resolveActiveModel();
        return {
          online: true,
          status: "ok",
          model,
          endpoint: v1Url,
          latencyMs,
          details,
        };
      }

      // Colibri returns 503 when engine is restarting or down
      let statusText: "restarting" | "engine_down" = "engine_down";
      try {
        const data = await res.json();
        if (data?.status === "restarting") {
          statusText = "restarting";
        }
      } catch {}

      return {
        online: false,
        status: statusText,
        model: defaultModel,
        endpoint: v1Url,
        latencyMs,
      };
    } catch {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        online: false,
        status: "offline",
        model: defaultModel,
        endpoint: v1Url,
        latencyMs,
      };
    }
  }

  /**
   * Dynamically discovers the active model served by Colibri via /v1/models.
   * Caches result for modelCacheTtlMs. Falls back gracefully to defaultModel.
   */
  public async resolveActiveModel(): Promise<string> {
    const now = Date.now();
    if (this.cachedModel && now - this.cachedModelTimestamp < this.modelCacheTtlMs) {
      return this.cachedModel;
    }

    const v1Url = this.getBaseUrl();
    const defaultModel = this.getDefaultModel();

    try {
      const res = await fetch(`${v1Url}/models`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(2000),
      });

      if (res.ok) {
        const data = await res.json();
        const firstId = data?.data?.[0]?.id;
        if (typeof firstId === "string" && firstId.trim().length > 0) {
          this.cachedModel = firstId.trim();
          this.cachedModelTimestamp = now;
          return this.cachedModel;
        }
      }
    } catch {
      // Graceful fallback to configured default model
    }

    return defaultModel;
  }

  /**
   * Streams chat completions from Colibri OpenAI SSE endpoint.
   * Yields content deltas incrementally.
   * Propagates client AbortSignal to trigger Colibri's socket disconnect detection.
   */
  public async *streamChat(
    messages: ChatMessage[],
    options?: ColibriStreamOptions
  ): AsyncGenerator<string, void, unknown> {
    if (!messages || messages.length === 0) {
      throw new ColibriStreamError("Cannot stream chat with empty messages array.", 400);
    }

    // Check early abort
    if (options?.signal?.aborted) {
      throw options.signal.reason || new DOMException("Operation aborted", "AbortError");
    }

    const v1Url = this.getBaseUrl();
    const model = options?.model || (await this.resolveActiveModel());
    const fetchController = new AbortController();
    let hasConnected = false;

    const connectTimer = setTimeout(() => {
      if (!hasConnected) {
        fetchController.abort(new ColibriTimeoutError(v1Url, this.requestTimeoutMs));
      }
    }, this.requestTimeoutMs);

    const onCallerAbort = () => {
      fetchController.abort(options?.signal?.reason || new DOMException("Operation aborted by client", "AbortError"));
    };
    if (options?.signal) {
      options.signal.addEventListener("abort", onCallerAbort, { once: true });
    }

    const payload = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.5,
      max_tokens: options?.maxTokens ?? 512,
      stream: true,
    };

    let res: Response;
    try {
      res = await fetch(`${v1Url}/chat/completions`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        signal: fetchController.signal,
      });
      hasConnected = true;
    } catch (err: unknown) {
      if (options?.signal?.aborted) {
        throw options.signal.reason || new DOMException("Operation aborted by client", "AbortError");
      }
      if (
        fetchController.signal.aborted ||
        (err as any)?.name === "TimeoutError" ||
        (err as any)?.code === 23 ||
        err instanceof ColibriTimeoutError
      ) {
        throw new ColibriTimeoutError(v1Url, this.requestTimeoutMs);
      }
      if (isOfflineNetworkError(err)) {
        throw new ColibriOfflineError(v1Url, err);
      }
      throw new ColibriStreamError(
        `Failed to connect to Colibri: ${err instanceof Error ? err.message : String(err)}`,
        500,
        v1Url
      );
    } finally {
      clearTimeout(connectTimer);
      if (options?.signal) {
        options.signal.removeEventListener("abort", onCallerAbort);
      }
    }

    if (!res.ok) {
      if (res.status === 503) {
        throw new ColibriOfflineError(v1Url);
      }
      let errText = "";
      try {
        errText = await res.text();
      } catch {}
      throw new ColibriStreamError(
        `Colibri HTTP ${res.status}: ${errText || "Inference stream error"}`,
        res.status,
        v1Url
      );
    }

    if (!res.body) {
      throw new ColibriStreamError("Colibri returned an empty response body stream.", 500, v1Url);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    // Chunk activity timeout (180s inactivity limit between chunks while stream is reading)
    const CHUNK_INACTIVITY_TIMEOUT_MS = 180000;

    const onStreamAbort = () => {
      try {
        reader.cancel("Client aborted stream");
      } catch {}
    };
    if (options?.signal) {
      options.signal.addEventListener("abort", onStreamAbort, { once: true });
    }

    try {
      while (true) {
        if (options?.signal?.aborted) {
          throw options.signal.reason || new DOMException("Operation aborted by client", "AbortError");
        }

        let timeoutId: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new ColibriTimeoutError(v1Url, CHUNK_INACTIVITY_TIMEOUT_MS));
          }, CHUNK_INACTIVITY_TIMEOUT_MS);
        });

        let readResult: ReadableStreamReadResult<Uint8Array>;
        try {
          readResult = await Promise.race([reader.read(), timeoutPromise]);
        } finally {
          clearTimeout(timeoutId);
        }

        const { done, value } = readResult;
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line || line.startsWith(":") || line === "data: [DONE]") {
            continue;
          }

          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            try {
              const chunk = JSON.parse(jsonStr);
              const deltaContent = chunk?.choices?.[0]?.delta?.content;
              if (deltaContent) {
                yield deltaContent;
              }
            } catch {
              // Partial or malformed SSE line — skip
            }
          }
        }
      }

      // Flush remainder
      if (buffer.trim().startsWith("data: ") && buffer.trim() !== "data: [DONE]") {
        try {
          const chunk = JSON.parse(buffer.trim().slice(6).trim());
          const deltaContent = chunk?.choices?.[0]?.delta?.content;
          if (deltaContent) {
            yield deltaContent;
          }
        } catch {}
      }
    } catch (err: unknown) {
      if (options?.signal?.aborted) {
        throw options.signal.reason || new DOMException("Operation aborted by client", "AbortError");
      }
      if (isOfflineNetworkError(err)) {
        throw new ColibriOfflineError(v1Url, err);
      }
      throw err;
    } finally {
      if (options?.signal) {
        options.signal.removeEventListener("abort", onStreamAbort);
      }
      try {
        reader.releaseLock();
      } catch {}
    }
  }

  /**
   * Non-streaming chat completion for direct query-response dialectics.
   */
  public async chat(
    messages: ChatMessage[],
    options?: ColibriStreamOptions
  ): Promise<ColibriChatResponse> {
    if (!messages || messages.length === 0) {
      throw new ColibriError("Cannot execute chat with empty messages array.", "INVALID_INPUT", 400);
    }

    if (options?.signal?.aborted) {
      throw options.signal.reason || new DOMException("Operation aborted", "AbortError");
    }

    const startTime = performance.now();
    const v1Url = this.getBaseUrl();
    const model = options?.model || (await this.resolveActiveModel());
    const timeoutSignal = AbortSignal.timeout(this.requestTimeoutMs);
    const { signal: combinedSignal, cleanup } = combineSignals(options?.signal, timeoutSignal);

    const payload = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.5,
      max_tokens: options?.maxTokens ?? 512,
      stream: false,
    };

    let res: Response;
    try {
      res = await fetch(`${v1Url}/chat/completions`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        signal: combinedSignal,
      });
    } catch (err: unknown) {
      cleanup();
      if (options?.signal?.aborted) {
        throw options.signal.reason || new DOMException("Operation aborted by client", "AbortError");
      }
      if (timeoutSignal.aborted) {
        throw new ColibriTimeoutError(v1Url, this.requestTimeoutMs);
      }
      if (isOfflineNetworkError(err)) {
        throw new ColibriOfflineError(v1Url, err);
      }
      throw new ColibriError(
        `Failed to connect to Colibri: ${err instanceof Error ? err.message : String(err)}`,
        "FETCH_FAILED",
        500,
        v1Url
      );
    }

    cleanup();

    if (!res.ok) {
      if (res.status === 503) {
        throw new ColibriOfflineError(v1Url);
      }
      let errText = "";
      try {
        errText = await res.text();
      } catch {}
      throw new ColibriError(
        `Colibri HTTP ${res.status}: ${errText || "Inference error"}`,
        "COLIBRI_HTTP_ERROR",
        res.status,
        v1Url
      );
    }

    const data = await res.json();
    const latencyMs = Math.round(performance.now() - startTime);
    const choice = data?.choices?.[0];
    const content = choice?.message?.content || "";

    return {
      content,
      role: "assistant",
      model: data?.model || model,
      usage: data?.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
          }
        : undefined,
      latencyMs,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

export const colibriClient = new ColibriClient();
