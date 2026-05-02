// modules/ai/factory.ts
import { saasConfig } from '@/saas.config';
import { AIProvider } from './interface';
import { OpenAIAdapter } from './adapters/openai';

export function createAIProvider(): AIProvider {
  const provider = saasConfig.features.ai.provider;

  switch (provider) {
    case 'openai':
      return new OpenAIAdapter();
    // Future providers can be added here:
    // case 'anthropic':
    //   return new AnthropicAdapter();
    // case 'openrouter':
    //   return new OpenRouterAdapter();
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

// Get default model for current provider
export function getDefaultModel(): string {
  const provider = saasConfig.features.ai.provider;
  const defaultModel = saasConfig.features.ai.defaultModel;

  if (defaultModel) return defaultModel;

  switch (provider) {
    case 'openai':
      return 'gpt-4o-mini';
    // Future providers:
    // case 'anthropic':
    //   return 'claude-3-5-sonnet-20241022';
    // case 'openrouter':
    //   return 'openai/gpt-4o-mini';
    default:
      return 'gpt-4o-mini';
  }
}
