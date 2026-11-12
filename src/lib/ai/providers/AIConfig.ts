/**
 * Class Royale AI Configuration & Environment Settings
 * Defines shared configuration for Colibri local inference, timeouts, and circuit breakers.
 */

export interface AIProviderConfig {
  provider: "colibri" | "socratic";
  baseUrl: string;
  model: string;
  apiKey?: string;
  requestTimeoutMs: number;
  maxRetries: number;
  enableStreaming: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerResetMs: number;
}

export function getAIConfig(): AIProviderConfig {
  return {
    provider: ((process.env.AI_PROVIDER || "colibri").toLowerCase() as "colibri" | "socratic"),
    baseUrl: (process.env.COLIBRI_BASE_URL || "http://127.0.0.1:8080/v1").replace(/\/+$/, ""),
    model: process.env.COLIBRI_MODEL || "qwen3-coder-30b",
    apiKey: process.env.COLIBRI_API_KEY || undefined,
    requestTimeoutMs: parseInt(process.env.AI_REQUEST_TIMEOUT_MS || "120000", 10),
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || "2", 10),
    enableStreaming: process.env.AI_ENABLE_STREAMING !== "false",
    circuitBreakerThreshold: parseInt(process.env.AI_CIRCUIT_BREAKER_FAILURES || "3", 10),
    circuitBreakerResetMs: parseInt(process.env.AI_CIRCUIT_BREAKER_RESET_MS || "30000", 10),
  };
}
