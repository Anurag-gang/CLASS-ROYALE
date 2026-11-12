/**
 * Class Royale AI Provider Factory
 * Dynamically resolves between Colibri local inference and the Socratic fallback engine.
 * Ensures zero downtime for students, even if Colibri is loading, restarting, or downloading.
 */

import { AIProvider } from "./AIProvider";
import { ColibriProvider } from "./ColibriProvider";
import { SocraticFallbackProvider } from "./SocraticFallbackProvider";
import { getAIConfig } from "./AIConfig";

export interface AIProviderTelemetry {
  activeProviderId: string;
  configuredProvider: string;
  isColibriHealthy: boolean;
  isFallbackActive: boolean;
  colibriModel: string;
  baseUrl: string;
  timestamp: string;
}

export class AIProviderFactory {
  private static colibriInstance: ColibriProvider | null = null;
  private static fallbackInstance: SocraticFallbackProvider | null = null;
  private static lastHealthCheckTime = 0;
  private static cachedColibriHealth = false;
  private static readonly HEALTH_CACHE_TTL_MS = 10000; // 10 seconds cache

  public static getColibriProvider(): ColibriProvider {
    if (!this.colibriInstance) {
      this.colibriInstance = new ColibriProvider();
    }
    return this.colibriInstance;
  }

  public static getFallbackProvider(): SocraticFallbackProvider {
    if (!this.fallbackInstance) {
      this.fallbackInstance = new SocraticFallbackProvider();
    }
    return this.fallbackInstance;
  }

  /**
   * Returns the primary AI Provider based on configuration and live health check.
   * If Colibri is configured but unreachable, seamlessly fails over to SocraticFallbackProvider.
   */
  public static async getProvider(preferColibri = false): Promise<AIProvider> {
    const config = getAIConfig();
    const shouldTryColibri = preferColibri || config.provider === "colibri";

    if (!shouldTryColibri) {
      return this.getFallbackProvider();
    }

    const colibri = this.getColibriProvider();
    const now = Date.now();

    // Cache healthcheck to avoid hammering Colibri /health on every single chat request
    if (now - this.lastHealthCheckTime < this.HEALTH_CACHE_TTL_MS) {
      if (this.cachedColibriHealth) {
        return colibri;
      }
      return this.getFallbackProvider();
    }

    this.lastHealthCheckTime = now;
    const isHealthy = await colibri.isHealthy();
    this.cachedColibriHealth = isHealthy;

    if (isHealthy) {
      return colibri;
    }

    console.warn(
      `[AIProviderFactory] Colibri local server (${config.baseUrl}) is currently unavailable. Operating in Socratic Fallback mode.`
    );
    return this.getFallbackProvider();
  }

  /**
   * Diagnostic telemetry for dashboard, Socrates, and CR Intelligence
   */
  public static async getTelemetry(): Promise<AIProviderTelemetry> {
    const config = getAIConfig();
    const colibri = this.getColibriProvider();
    const isColibriHealthy = await colibri.isHealthy();
    const activeProvider = await this.getProvider();
    const colibriModel = await colibri.getModelId();

    return {
      activeProviderId: activeProvider.id,
      configuredProvider: config.provider,
      isColibriHealthy,
      isFallbackActive: activeProvider.id !== colibri.id,
      colibriModel,
      baseUrl: config.baseUrl,
      timestamp: new Date().toISOString(),
    };
  }
}
