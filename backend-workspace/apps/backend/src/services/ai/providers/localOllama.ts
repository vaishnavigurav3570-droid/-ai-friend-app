// ============================================
// Antigravity — Local Ollama Provider
// ============================================

import { aiProviders } from '../../../config/ai.js';
import { logger } from '../../../utils/logger.js';

const config = aiProviders.ollama;

export async function callOllama(
  systemPrompt: string,
  userPrompt: string,
  options: { json?: boolean; temperature?: number } = {}
): Promise<string> {
  const url = `${config.baseUrl}/api/generate`;

  const body = {
    model: config.model,
    prompt: userPrompt,
    system: systemPrompt,
    stream: false,
    options: {
      temperature: options.temperature ?? config.temperature,
      num_predict: config.maxTokens,
    },
    ...(options.json ? { format: 'json' } : {}),
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as any;
    return data.response || '';
  } catch (err) {
    logger.warn(`Ollama call failed: ${(err as Error).message}`);
    throw err;
  }
}
