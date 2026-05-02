// modules/ai/interface.ts
export interface AIProvider {
  /**
   * Generate a completion (non-streaming)
   */
  complete(params: CompletionParams): Promise<CompletionResult>;

  /**
   * Generate a streaming completion
   */
  stream(params: CompletionParams): Promise<StreamResult>;

  /**
   * Estimate cost for an operation
   */
  estimateCost(model: string, inputTokens: number, outputTokens: number): number;

  /**
   * List available models
   */
  listModels(): Promise<ModelInfo[]>;
}

export interface CompletionParams {
  model: string;
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionResult {
  content: string;
  usage: TokenUsage;
  finishReason: 'stop' | 'length' | 'content_filter';
}

export interface StreamResult {
  stream: AsyncIterable<string>;
  getUsage: () => Promise<TokenUsage>;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  inputCostPer1M: number;  // USD per 1M tokens
  outputCostPer1M: number; // USD per 1M tokens
}
