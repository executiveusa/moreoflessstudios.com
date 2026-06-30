/**
 * OpenRouter client: unified interface for multiple AI models
 * Supports Claude, Llama 2, Mixtral, and 100+ open-source models
 * Enables cost optimization and fallback routing
 */

export type ModelProvider = 'openai' | 'openrouter';

export const AVAILABLE_MODELS = {
  // Premium (Claude)
  'claude-opus-4-8': {
    name: 'Claude Opus 4.8',
    costPer1k: 0.015,
    category: 'premium',
    latency: 'high',
  },
  'claude-sonnet-4-6': {
    name: 'Claude Sonnet 4.6',
    costPer1k: 0.003,
    category: 'premium',
    latency: 'medium',
  },
  'claude-haiku-4-5': {
    name: 'Claude Haiku 4.5',
    costPer1k: 0.0008,
    category: 'premium',
    latency: 'low',
  },

  // Free/Cheap (OpenRouter)
  'meta-llama/llama-2-70b-chat': {
    name: 'Llama 2 70B',
    costPer1k: 0,
    category: 'free',
    latency: 'medium',
  },
  'mistralai/mixtral-8x7b-instruct': {
    name: 'Mixtral 8x7B',
    costPer1k: 0.00054,
    category: 'cheap',
    latency: 'medium',
  },
  'nousresearch/nous-hermes-2-mixtral-8x7b-dpo': {
    name: 'Nous Hermes 2 Mixtral',
    costPer1k: 0.00054,
    category: 'cheap',
    latency: 'medium',
  },
  'mistralai/mistral-7b-instruct': {
    name: 'Mistral 7B',
    costPer1k: 0.00014,
    category: 'cheap',
    latency: 'low',
  },

  // Ultra-cheap
  'google/flan-t5-xl': {
    name: 'Google Flan T5 XL',
    costPer1k: 0.0001,
    category: 'ultra-cheap',
    latency: 'low',
  },
};

export type ModelId = keyof typeof AVAILABLE_MODELS;

/**
 * Select best model based on user tier and requirements
 */
export function selectModel(
  userTier: 'free' | 'creator' | 'studio' | 'professional',
  requiresToolUse: boolean = false
): ModelId {
  // Tool use requires Claude (for now)
  if (requiresToolUse) {
    if (userTier === 'free') return 'claude-haiku-4-5';
    if (userTier === 'creator') return 'claude-haiku-4-5';
    if (userTier === 'studio') return 'claude-sonnet-4-6';
    return 'claude-opus-4-8';
  }

  // Text-only: optimize for cost
  if (userTier === 'free') return 'meta-llama/llama-2-70b-chat';
  if (userTier === 'creator') return 'mistralai/mixtral-8x7b-instruct';
  if (userTier === 'studio') return 'claude-sonnet-4-6';
  return 'claude-opus-4-8';
}

/**
 * Call OpenRouter API with fallback
 */
export async function callOpenRouter(
  model: ModelId,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt?: string,
  tools?: unknown[]
): Promise<{
  content: string;
  model: string;
  costUsd: number;
  cached: boolean;
}> {
  const isClaudeModel = model.startsWith('claude');
  const apiKey = isClaudeModel
    ? process.env.ANTHROPIC_API_KEY
    : process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(`Missing API key for model ${model}`);
  }

  // Use OpenRouter for non-Claude models
  if (!isClaudeModel) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Title': 'more-of-less-studio',
      },
      body: JSON.stringify({
        model,
        messages: systemPrompt
          ? [{ role: 'system', content: systemPrompt }, ...messages]
          : messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenRouter API error');
    }

    return {
      content: data.choices[0].message.content,
      model,
      costUsd: (data.usage.total_tokens / 1000) * (AVAILABLE_MODELS[model]?.costPer1k || 0),
      cached: false,
    };
  }

  // For Claude, use Anthropic SDK directly
  const { Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages: messages as Parameters<typeof client.messages.create>[0]['messages'],
    tools: tools as any,
  });

  return {
    content:
      response.content[0].type === 'text'
        ? response.content[0].text
        : JSON.stringify(response.content),
    model,
    costUsd: (response.usage.input_tokens * 0.001 + response.usage.output_tokens * 0.003) / 1000,
    cached: false,
  };
}

/**
 * Estimate cost for a model inference
 */
export function estimateModelCost(model: ModelId, tokenCount: number): number {
  const config = AVAILABLE_MODELS[model];
  if (!config) return 0;
  return (tokenCount / 1000) * config.costPer1k;
}
