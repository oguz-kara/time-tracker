/**
 * AI Service Layer
 *
 * Contains all business logic for AI operations:
 * - Credit-aware AI completions (streaming and non-streaming)
 * - Usage tracking and logging
 * - Integration with billing system
 * - Cost estimation
 *
 * All AI operations check entitlements and deduct credits before proceeding.
 */

import { db } from "@jetframe/db";
import { aiUsage } from "@jetframe/db/schema/ai";
import { createAIProvider, getDefaultModel } from "./factory";
import { deductCredits, checkEntitlement } from "@/modules/billing/service";
import { NotEnoughCreditsError, AIProviderError } from "@/modules/shared/errors";
import { saasConfig } from "@/saas.config";
import type { Message, CompletionResult } from "./interface";

// === CREDIT COSTS ===

/**
 * Credit costs per model (how many credits are deducted per AI request)
 * These values should match saasConfig.ai.creditCosts but are duplicated here
 * for type safety and ease of use
 */
const CREDIT_COSTS: Record<string, number> = saasConfig.ai.creditCosts;

/**
 * Get credit cost for a specific model
 */
function getCreditCost(model: string): number {
  return CREDIT_COSTS[model] || CREDIT_COSTS['default'];
}

// === COMPLETION OPERATIONS ===

/**
 * Generate a non-streaming AI completion
 *
 * Flow:
 * 1. Check entitlement (subscription status + credits)
 * 2. Call AI provider
 * 3. Deduct credits
 * 4. Log usage to ai_usage table
 *
 * @throws NotEnoughCreditsError if insufficient credits
 * @throws AIProviderError if AI provider fails
 */
export async function generateCompletion(
  orgId: string,
  userId: string,
  params: {
    messages: Message[];
    model?: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<CompletionResult> {
  const model = params.model || getDefaultModel();
  const creditCost = getCreditCost(model);

  // Step 1: Check entitlement before calling API
  const entitlement = await checkEntitlement(orgId, 'ai', creditCost);
  if (!entitlement.allowed) {
    throw new NotEnoughCreditsError(entitlement.reason);
  }

  // Step 2: Call AI provider
  const ai = createAIProvider();
  let result: CompletionResult;

  try {
    result = await ai.complete({
      model,
      messages: params.messages,
      systemPrompt: params.systemPrompt,
      maxTokens: params.maxTokens,
      temperature: params.temperature,
    });
  } catch (error) {
    throw new AIProviderError('Failed to generate completion', { cause: error });
  }

  // Step 3: Deduct credits
  await deductCredits(orgId, creditCost, `AI: ${model}`, {
    model,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
  });

  // Step 4: Log usage for analytics
  await logUsage(orgId, userId, model, result.usage, creditCost);

  return result;
}

/**
 * Generate a streaming AI completion
 *
 * Flow:
 * 1. Check entitlement (subscription status + credits)
 * 2. Pre-deduct credits (optimistic)
 * 3. Call AI provider for stream
 * 4. Return stream and finalize callback
 *
 * Note: Credits are deducted upfront to prevent abuse. If stream fails,
 * credits are not refunded (this is intentional to prevent retry attacks).
 *
 * @throws NotEnoughCreditsError if insufficient credits
 * @throws AIProviderError if AI provider fails
 */
export async function streamCompletion(
  orgId: string,
  userId: string,
  params: {
    messages: Message[];
    model?: string;
    systemPrompt?: string;
    maxTokens?: number;
  }
): Promise<{ stream: AsyncIterable<string>; finalize: () => Promise<void> }> {
  const model = params.model || getDefaultModel();
  const creditCost = getCreditCost(model);

  // Step 1: Pre-check entitlement
  const entitlement = await checkEntitlement(orgId, 'ai', creditCost);
  if (!entitlement.allowed) {
    throw new NotEnoughCreditsError(entitlement.reason);
  }

  // Step 2: Pre-deduct credits (optimistic)
  await deductCredits(orgId, creditCost, `AI Stream: ${model}`, {
    model,
    note: 'Pre-deducted for streaming completion',
  });

  // Step 3: Call AI provider
  const ai = createAIProvider();
  let result;

  try {
    result = await ai.stream({
      model,
      messages: params.messages,
      systemPrompt: params.systemPrompt,
      maxTokens: params.maxTokens,
    });
  } catch (error) {
    throw new AIProviderError('Failed to start stream', { cause: error });
  }

  // Step 4: Return stream and finalize callback
  return {
    stream: result.stream,
    finalize: async () => {
      // Log usage after stream completes
      const usage = await result.getUsage();
      await logUsage(orgId, userId, model, usage, creditCost);
    },
  };
}

// === USAGE TRACKING ===

/**
 * Log AI usage to database for analytics and cost tracking
 */
async function logUsage(
  orgId: string,
  userId: string,
  model: string,
  usage: { inputTokens: number; outputTokens: number; totalTokens: number },
  creditsUsed: number
) {
  await db.insert(aiUsage).values({
    organizationId: orgId,
    userId,
    model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
    creditsUsed,
  });
}

/**
 * Get AI usage statistics for an organization
 *
 * @param orgId Organization ID
 * @param days Number of days to look back (default: 30)
 * @returns Usage statistics including total tokens, credits, and breakdown by model
 */
export async function getUsageStats(orgId: string, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const usage = await db.query.aiUsage.findMany({
    where: (aiUsage, { eq, gte, and }) =>
      and(
        eq(aiUsage.organizationId, orgId),
        gte(aiUsage.createdAt, startDate)
      ),
    orderBy: (aiUsage, { desc }) => [desc(aiUsage.createdAt)],
  });

  // Calculate aggregates
  const totalTokens = usage.reduce((sum, u) => sum + u.totalTokens, 0);
  const totalCredits = usage.reduce((sum, u) => sum + u.creditsUsed, 0);

  // Breakdown by model
  const byModel = usage.reduce((acc, u) => {
    if (!acc[u.model]) {
      acc[u.model] = { tokens: 0, credits: 0, requests: 0 };
    }
    acc[u.model].tokens += u.totalTokens;
    acc[u.model].credits += u.creditsUsed;
    acc[u.model].requests += 1;
    return acc;
  }, {} as Record<string, { tokens: number; credits: number; requests: number }>);

  return {
    totalTokens,
    totalCredits,
    totalRequests: usage.length,
    byModel,
    history: usage,
  };
}

/**
 * Estimate cost for an AI operation
 * Useful for showing users how many credits an operation will cost
 */
export async function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): Promise<{ credits: number; costUSD: number }> {
  const ai = createAIProvider();
  const costUSD = ai.estimateCost(model, inputTokens, outputTokens);
  const credits = getCreditCost(model);

  return { credits, costUSD };
}
