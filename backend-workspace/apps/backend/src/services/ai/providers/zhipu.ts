// ============================================
// Antigravity — ZhipuAI (GLM) Provider
// OpenAI-compatible API for GLM-4.7-Flash
// ============================================

import { aiProviders } from '../../../config/ai.js';
import { logger } from '../../../utils/logger.js';

const config = aiProviders.zhipu;

/**
 * Call ZhipuAI API (OpenAI-compatible) and return the text response.
 * Uses GLM-4.7-Flash for text tasks and GLM-4.6V-Flash for vision.
 */
export async function callZhipu(
  systemPrompt: string,
  userPrompt: string,
  options: { json?: boolean; temperature?: number; vision?: boolean } = {}
): Promise<string> {
  if (!config.apiKey) {
    throw new Error('ZhipuAI API key not configured');
  }

  const model = options.vision ? config.visionModel : config.model;
  const url = `${config.baseUrl}/chat/completions`;

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: config.maxTokens,
    temperature: options.temperature ?? config.temperature,
    stream: false,
  };

  // Force JSON output if requested
  if (options.json) {
    body.response_format = { type: 'json_object' };
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ZhipuAI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as any;
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error('Empty response from ZhipuAI');
      }

      return text;
    } catch (err) {
      lastError = err as Error;
      logger.warn(`ZhipuAI attempt ${attempt + 1} failed: ${lastError.message}`);
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('ZhipuAI API call failed after 3 attempts');
}

/**
 * Call ZhipuAI with a vision prompt (GLM-4.6V-Flash).
 * Accepts a base64-encoded image or image URL.
 */
export async function callZhipuVision(
  systemPrompt: string,
  userPrompt: string,
  imageUrl: string,
  options: { temperature?: number } = {}
): Promise<string> {
  if (!config.apiKey) {
    throw new Error('ZhipuAI API key not configured');
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
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ZhipuAI Vision error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || '';
}
