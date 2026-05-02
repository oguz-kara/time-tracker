// modules/ai/adapters/openai.ts
import { openai } from '@ai-sdk/openai';
import { generateText, streamText, type LanguageModelUsage } from 'ai';
import { AIProvider, CompletionParams, CompletionResult, StreamResult, ModelInfo, TokenUsage } from '../interface';

/**
 * Convert LanguageModelUsage to TokenUsage
 * The AI SDK v5 LanguageModelV2Usage already has the same property names
 */
function convertUsage(usage: LanguageModelUsage): TokenUsage {
  return {
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    totalTokens: usage.totalTokens ?? 0,
  };
}

export class OpenAIAdapter implements AIProvider {

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const { model, messages, maxTokens = 1000, temperature = 0.7, systemPrompt } = params;

    const allMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    const result = await generateText({
      model: openai(model),
      messages: allMessages,
      maxOutputTokens: maxTokens,
      temperature,
    });

    return {
      content: result.text,
      usage: convertUsage(result.usage),
      finishReason: result.finishReason as 'stop' | 'length' | 'content_filter',
    };
  }

  async stream(params: CompletionParams): Promise<StreamResult> {
    const { model, messages, maxTokens = 1000, systemPrompt } = params;

    const allMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    const result = await streamText({
      model: openai(model),
      messages: allMessages,
      maxOutputTokens: maxTokens,
    });

    let usage: TokenUsage | null = null;

    // Create async iterable from stream
    const stream = (async function* () {
      for await (const chunk of result.textStream) {
        yield chunk;
      }
      // Capture usage after stream completes
      const finalUsage = await result.usage;
      usage = convertUsage(finalUsage);
    })();

    return {
      stream,
      getUsage: async () => {
        // Wait for stream to complete if not already
        if (!usage) {
          for await (const _ of stream) { /* consume stream */ }
        }
        return usage!;
      },
    };
  }

  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 2.5, output: 10 },
      'gpt-4o-mini': { input: 0.15, output: 0.6 },
      'gpt-4-turbo': { input: 10, output: 30 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    };

    const rates = pricing[model] || pricing['gpt-4o-mini'];
    return (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        contextWindow: 128000,
        inputCostPer1M: 2.5,
        outputCostPer1M: 10,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        contextWindow: 128000,
        inputCostPer1M: 0.15,
        outputCostPer1M: 0.6,
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        contextWindow: 128000,
        inputCostPer1M: 10,
        outputCostPer1M: 30,
      },
    ];
  }
}
