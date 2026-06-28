// ============================================
// Antigravity — Gemini AI Provider
// ============================================

import { aiProviders } from '../../../config/ai.js';
import { logger } from '../../../utils/logger.js';

const config = aiProviders.gemini;

interface GeminiRequest {
  contents: Array<{
    role: string;
    parts: Array<any>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
}

/**
 * Call Gemini API and return the text response.
 * Natively supports Base64 image payloads for multimodal Vision tasks.
 */
export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  options: { json?: boolean; temperature?: number; vision?: boolean; imageUrl?: string } = {}
): Promise<string> {
  if (!config.enabled) {
    throw new Error('Gemini API key not configured');
  }

  const url = `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`;

  // Formulate contents parts
  const parts: any[] = [{ text: `${systemPrompt}\n\n${userPrompt}` }];

  // If vision is requested and base64 image is provided
  if (options.vision && options.imageUrl && options.imageUrl.startsWith('data:')) {
    try {
      const match = options.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
        logger.info(`Gemini Vision: Appending multimodal image data (${mimeType})`);
      }
    } catch (e: any) {
      logger.error(`Failed to parse base64 image: ${e.message}`);
    }
  }

  const body: GeminiRequest = {
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? config.temperature,
      maxOutputTokens: config.maxTokens,
      ...(options.json ? { responseMimeType: 'application/json' } : {}),
    },
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      return text;
    } catch (err) {
      lastError = err as Error;
      logger.warn(`Gemini attempt ${attempt + 1} failed: ${lastError.message}`);
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Gemini API call failed after 3 attempts');
}
