'use client';

/**
 * AI Chat Component
 *
 * A reusable chat interface with:
 * - Real-time streaming responses
 * - Message history display
 * - Loading and error states
 * - Auto-scroll to bottom
 * - Credit error handling
 *
 * Uses Vercel AI SDK's useChat hook for streaming management
 */

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ChatProps {
  systemPrompt?: string;
  model?: string;
  placeholder?: string;
  className?: string;
}

export function Chat({
  systemPrompt,
  model,
  placeholder = 'Type your message...',
  className
}: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [input, setInput] = useState('');

  // Use AI SDK v5 useChat hook
  const { messages, sendMessage, status, error, stop } = useChat({
    onError: (err) => {
      // Check if it's a credit error (402 status)
      if (err.message.includes('402') || err.message.toLowerCase().includes('credit')) {
        setCreditError('You do not have enough credits to complete this request. Please upgrade your plan or purchase more credits.');
      }
    }
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear credit error when user types
  useEffect(() => {
    if (input && creditError) {
      setCreditError(null);
    }
  }, [input, creditError]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    setCreditError(null);
    sendMessage({ text: input });
    setInput(''); // Clear input after sending
  };

  return (
    <Card className={`flex flex-col h-[600px] ${className || ''}`}>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Start a conversation by typing a message below
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">
                {message.parts.map((part, idx) => {
                  if (part.type === 'text') {
                    return <span key={idx}>{part.text}</span>;
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <div className="flex items-center space-x-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
              </div>
            </div>
          </div>
        )}

        {/* Credit Error Display */}
        {creditError && (
          <div className="flex justify-center">
            <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 max-w-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Insufficient Credits</p>
                <p>{creditError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Generic Error Display */}
        {error && !creditError && (
          <div className="flex justify-center">
            <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 max-w-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Error</p>
                <p>{'An error occurred. Please try again.'}</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      <CardFooter className="p-4 border-t">
        <form onSubmit={onSubmit} className="flex w-full gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
