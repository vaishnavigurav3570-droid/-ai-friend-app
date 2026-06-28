// ============================================
// Antigravity — AI Runner (Fallback Chain)
// ============================================

import { callGemini } from './providers/gemini.js';
import { callOpenRouter, callOpenRouterVision } from './providers/openrouter.js';
import { callZhipu, callZhipuVision } from './providers/zhipu.js';
import { aiProviders } from '../../config/ai.js';
import { logger } from '../../utils/logger.js';

/**
 * Executes an AI call with automatic fallback between providers.
 * Tries Native Gemini first, falls back to OpenRouter, then ZhipuAI.
 */
export async function callAi(
  systemPrompt: string,
  userPrompt: string,
  options: { json?: boolean; temperature?: number; vision?: boolean; imageUrl?: string } = {}
): Promise<string> {
  const errors: Error[] = [];

  // Attempt 1: Native Google Gemini
  if (aiProviders.gemini.enabled && aiProviders.gemini.apiKey) {
    try {
      logger.info('Calling AI via Native Google Gemini...');
      // Note: If vision is requested, Gemini handles it natively via its prompt content parts
      return await callGemini(systemPrompt, userPrompt, options);
    } catch (err: any) {
      logger.warn(`Native Gemini failed: ${err.message}. Falling back to OpenRouter.`);
      errors.push(err);
    }
  }

  // Attempt 2: OpenRouter
  if (aiProviders.openrouter.enabled && aiProviders.openrouter.apiKey) {
    try {
      logger.info('Calling AI via OpenRouter...');
      if (options.vision && options.imageUrl) {
        return await callOpenRouterVision(systemPrompt, userPrompt, options.imageUrl, options);
      } else {
        return await callOpenRouter(systemPrompt, userPrompt, options);
      }
    } catch (err: any) {
      logger.warn(`OpenRouter failed: ${err.message}. Falling back to ZhipuAI.`);
      errors.push(err);
    }
  }

  // Attempt 3: ZhipuAI
  if (aiProviders.zhipu.enabled && aiProviders.zhipu.apiKey) {
    try {
      logger.info('Calling AI via ZhipuAI...');
      if (options.vision && options.imageUrl) {
        return await callZhipuVision(systemPrompt, userPrompt, options.imageUrl, options);
      } else {
        return await callZhipu(systemPrompt, userPrompt, options);
      }
    } catch (err: any) {
      logger.warn(`ZhipuAI failed: ${err.message}.`);
      errors.push(err);
    }
  }

  // If all providers failed or none configured
  logger.error('All AI providers failed or none are configured.');
  throw new Error(`AI generation failed. Errors: ${errors.map((e) => e.message).join(' | ')}`);
}
