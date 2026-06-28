// ============================================
// Antigravity — Voice Parser AI Service
// Using OpenRouter (free models)
// ============================================

import { callAi } from './runner.js';
import { logger } from '../../utils/logger.js';
import { getVoiceParsePrompt } from '../../utils/prompts/voiceParse.prompt.js';

interface ExtractedTask {
  title: string;
  priority: number;
  estimated_minutes: number;
  deadline: string | null;
  tags: string[];
}

/**
 * Parses a voice transcript and extracts structured task objects.
 */
export async function parseVoiceTranscript(transcript: string): Promise<ExtractedTask[]> {
  const { systemPrompt, userPrompt } = getVoiceParsePrompt(transcript);

  logger.info(`Parsing voice transcript (${transcript.length} chars)`);

  try {
    const response = await callAi(systemPrompt, userPrompt, { json: true, temperature: 0.4 });
    const parsed = JSON.parse(response);

    if (!Array.isArray(parsed.tasks)) {
      throw new Error('Invalid AI response: missing tasks array');
    }

    const tasks: ExtractedTask[] = parsed.tasks.map((t: any) => ({
      title: String(t.title || 'Untitled task'),
      priority: Math.max(1, Math.min(5, Number(t.priority) || 3)),
      estimated_minutes: Math.max(5, Math.min(120, Number(t.estimated_minutes) || 15)),
      deadline: t.deadline || null,
      tags: Array.isArray(t.tags) ? t.tags.map(String) : [],
    }));

    logger.info(`Voice parse complete: ${tasks.length} tasks extracted`);
    return tasks;
  } catch (err) {
    logger.error(`Voice parsing failed: ${(err as Error).message}`);

    // Fallback: split by sentences and create basic tasks
    const sentences = transcript
      .split(/[.!?\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3);

    return sentences.slice(0, 10).map((sentence) => ({
      title: sentence.charAt(0).toUpperCase() + sentence.slice(1),
      priority: 3,
      estimated_minutes: 15,
      deadline: null,
      tags: [],
    }));
  }
}
