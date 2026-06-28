// ============================================
// Antigravity Backend — AI Provider Config
// Multi-provider fallback chain setup
// ============================================

import { env } from './env.js';

export interface AIProviderConfig {
  name: string;
  apiKey: string;
  model: string;
  visionModel: string;
  baseUrl: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
}

export const aiProviders: Record<string, AIProviderConfig> = {
  gemini: {
    name: 'Google Gemini (Native)',
    apiKey: env.GEMINI_API_KEY || '',
    model: 'gemini-1.5-flash',
    visionModel: 'gemini-1.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    maxTokens: 4096,
    temperature: 0.7,
    enabled: true,
  },
  openrouter: {
    name: 'OpenRouter (Free)',
    apiKey: env.OPENROUTER_API_KEY || '',
    model: 'openrouter/free',
    visionModel: 'openrouter/free',
    baseUrl: 'https://openrouter.ai/api/v1',
    maxTokens: 4096,
    temperature: 0.7,
    enabled: true,
  },
  zhipu: {
    name: 'ZhipuAI (GLM)',
    apiKey: env.ZHIPU_API_KEY || '',
    model: 'GLM-4.7-Flash',
    visionModel: 'GLM-4.6V-Flash',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    maxTokens: 4096,
    temperature: 0.7,
    enabled: true,
  },
  ollama: {
    name: 'Ollama (Local)',
    apiKey: '',
    model: 'llama3.2',
    visionModel: 'llava',
    baseUrl: 'http://localhost:11434',
    maxTokens: 2048,
    temperature: 0.7,
    enabled: true,
  },
};

export function getDefaultProvider(): AIProviderConfig {
  if (aiProviders.gemini && aiProviders.gemini.enabled && aiProviders.gemini.apiKey) {
    return aiProviders.gemini;
  }
  if (aiProviders.openrouter && aiProviders.openrouter.enabled && aiProviders.openrouter.apiKey) {
    return aiProviders.openrouter;
  }
  return aiProviders.zhipu || aiProviders.openrouter;
}
