// ============================================
// Antigravity — OpenRouter Provider (Free Models)
// OpenAI-compatible API at openrouter.ai/api/v1
// ============================================

import { aiProviders } from '../../../config/ai.js';
import { logger } from '../../../utils/logger.js';

const config = aiProviders.openrouter;

/**
 * Call OpenRouter API (OpenAI-compatible) using free models.
 * Primary: meta-llama/llama-3.1-8b-instruct:free
 * Vision:  meta-llama/llama-3.2-11b-vision-instruct:free
 */
export async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  options: { json?: boolean; temperature?: number; model?: string } = {}
): Promise<string> {
  if (!config.apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const model = options.model || config.model;
  const url = `${config.baseUrl}/chat/completions`;

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  // If JSON is requested, add instruction to system prompt
  const effectiveSystemPrompt = options.json
    ? `${systemPrompt}\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no explanatory text.`
    : systemPrompt;

  messages[0].content = effectiveSystemPrompt;

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: config.maxTokens,
    temperature: options.temperature ?? config.temperature,
    stream: false,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'HTTP-Referer': 'https://antigravity.app',
          'X-Title': 'Antigravity',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as any;
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error('Empty response from OpenRouter');
      }

      // Strip any markdown code fences if present (common with free models)
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }

      return cleaned.trim();
    } catch (err) {
      lastError = err as Error;
      logger.warn(`OpenRouter attempt ${attempt + 1} failed: ${lastError.message}`);
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('OpenRouter API call failed after 3 attempts');
}

/**
 * Call OpenRouter with a vision prompt using a free vision model.
 */
export async function callOpenRouterVision(
  systemPrompt: string,
  userPrompt: string,
  imageUrl: string,
  options: { temperature?: number } = {}
): Promise<string> {
  if (!config.apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const url = `${config.baseUrl}/chat/completions`;

  const body = {
    model: config.visionModel,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    max_tokens: config.maxTokens,
    temperature: options.temperature ?? config.temperature,
    stream: false,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'HTTP-Referer': 'https://antigravity.app',
      'X-Title': 'Antigravity',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter Vision error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || '';
}
