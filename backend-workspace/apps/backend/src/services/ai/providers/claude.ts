// ============================================
// Antigravity — Claude AI Provider
// ============================================

import { aiProviders } from '../../../config/ai.js';
import { logger } from '../../../utils/logger.js';

const config = aiProviders.claude;

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  options: { json?: boolean; temperature?: number } = {}
): Promise<string> {
  if (!config.enabled) {
    throw new Error('Claude API key not configured');
  }

  const url = `${config.baseUrl}/messages`;

  const body = {
    model: config.model,
    max_tokens: config.maxTokens,
    temperature: options.temperature ?? config.temperature,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt },
    ],
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as any;
      const text = data.content?.[0]?.text;

      if (!text) {
        throw new Error('Empty response from Claude');
      }

      return text;
    } catch (err) {
      lastError = err as Error;
      logger.warn(`Claude attempt ${attempt + 1} failed: ${lastError.message}`);
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Claude API call failed after 3 attempts');
}
