import { AIProvider } from "./types";
import { OpenRouterProvider } from "./openrouter";

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const providerType = (process.env.AI_PROVIDER || "openrouter").toLowerCase();

  switch (providerType) {
    case "openrouter":
    default:
      cachedProvider = new OpenRouterProvider();
      break;

    // Future provider plug-ins can be registered seamlessly here:
    // case "openai":
    //   cachedProvider = new OpenAIProvider();
    //   break;
    // case "gemini":
    //   cachedProvider = new GeminiProvider();
    //   break;
    // case "anthropic":
    //   cachedProvider = new AnthropicProvider();
    //   break;
    // case "local":
    //   cachedProvider = new LocalModelProvider();
    //   break;
  }

  return cachedProvider;
}

export function setCustomAIProvider(customProvider: AIProvider) {
  cachedProvider = customProvider;
}
