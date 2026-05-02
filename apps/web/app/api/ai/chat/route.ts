/**
 * AI Chat Streaming API Route
 *
 * Provides a streaming endpoint for AI completions with:
 * - Session-based authentication
 * - Credit checking and deduction
 * - Token usage tracking
 * - Real-time streaming responses
 *
 * POST /api/ai/chat
 * Body: { messages: Message[], model?: string, systemPrompt?: string }
 * Returns: Text stream (Server-Sent Events style)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { streamCompletion } from "@/modules/ai/service";
import { NotEnoughCreditsError, RateLimitError } from "@/modules/shared/errors";
import type { Message } from "@/modules/ai/interface";
import { checkRateLimit } from "@/modules/shared/middleware/rate-limit/service";
import { getRateLimitIdentifier } from "@/modules/shared/utils/ip";
import { saasConfig } from "@/saas.config";

export const runtime = "nodejs"; // Use Node.js runtime for streaming

/**
 * POST /api/ai/chat
 * Stream AI completions with credit checking
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to use AI features." },
        { status: 401 }
      );
    }

    // 2. Apply rate limiting (AI operations are expensive)
    const identifier = getRateLimitIdentifier(req, session.userId);
    try {
      await checkRateLimit(identifier, saasConfig.rateLimits.ai);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message: error.message,
            code: "RATE_LIMIT_EXCEEDED",
          },
          { status: 429 } // 429 Too Many Requests
        );
      }
      throw error;
    }

    // 3. Parse request body
    let body: { messages: Message[]; model?: string; systemPrompt?: string };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { messages, model, systemPrompt } = body;

    // 4. Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    // 5. Get organization ID from session
    const orgId = session.activeOrganizationId;
    const userId = session.userId;

    // 6. Start streaming completion
    let stream: AsyncIterable<string>;
    let finalize: () => Promise<void>;

    try {
      const result = await streamCompletion(orgId, userId, {
        messages,
        model,
        systemPrompt,
      });

      stream = result.stream;
      finalize = result.finalize;
    } catch (error) {
      // Handle credit errors specially
      if (error instanceof NotEnoughCreditsError) {
        return NextResponse.json(
          {
            error: "Not enough credits",
            message: error.message,
            code: "NOT_ENOUGH_CREDITS",
          },
          { status: 402 } // 402 Payment Required
        );
      }

      // Re-throw other errors to be caught by outer catch
      throw error;
    }

    // 7. Create readable stream for response
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Stream chunks to client
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(chunk));
          }

          // Close stream
          controller.close();

          // Finalize (log usage after stream completes)
          await finalize();
        } catch (error) {
          console.error("[AI Stream Error]", error);
          controller.error(error);
        }
      },
    });

    // 8. Return streaming response
    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[AI Chat API Error]", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
