// ============================================
// Antigravity — Task Breakdown AI Service
// Using OpenRouter (free models)
// ============================================

import { callAi } from './runner.js';
import { logger } from '../../utils/logger.js';
import { getTaskBreakdownPrompt } from '../../utils/prompts/taskBreakdown.prompt.js';

interface MicroTask {
  title: string;
  description: string;
  estimated_minutes: number;
  token_reward: number;
}

/**
 * Uses AI to break a task into 3-7 actionable micro-tasks (5-15 min each).
 */
export async function generateTaskBreakdown(task: {
  title: string;
  description?: string | null;
  priority: number;
  estimated_minutes?: number | null;
  deadline?: string | null;
  tags?: string[];
}): Promise<MicroTask[]> {
  const { systemPrompt, userPrompt } = getTaskBreakdownPrompt(task);

  logger.info(`Generating task breakdown for: "${task.title}"`);

  try {
    const response = await callAi(systemPrompt, userPrompt, { json: true, temperature: 0.6 });
    const parsed = JSON.parse(response);

    if (!Array.isArray(parsed.micro_tasks)) {
      throw new Error('Invalid AI response: missing micro_tasks array');
    }

    const microTasks: MicroTask[] = parsed.micro_tasks
      .slice(0, 7)
      .map((mt: any, index: number) => ({
        title: String(mt.title || `Step ${index + 1}`),
        description: String(mt.description || ''),
        estimated_minutes: Math.max(5, Math.min(15, Number(mt.estimated_minutes) || 10)),
        token_reward: Math.max(5, Math.min(20, Number(mt.token_reward) || 10)),
      }));

    if (microTasks.length < 2) {
      throw new Error('AI generated fewer than 2 micro-tasks');
    }

    logger.info(`Task breakdown complete: ${microTasks.length} micro-tasks generated`);
    return microTasks;
  } catch (err) {
    logger.error(`Task breakdown failed: ${(err as Error).message}`);
    
    // Fallback: generate simple time-based splits
    const totalMinutes = task.estimated_minutes || 30;
    const chunkCount = Math.max(3, Math.min(6, Math.ceil(totalMinutes / 10)));
    const chunkMinutes = Math.ceil(totalMinutes / chunkCount);

    return Array.from({ length: chunkCount }, (_, i) => ({
      title: `Part ${i + 1} of "${task.title}"`,
      description: `Work on this for approximately ${chunkMinutes} minutes`,
      estimated_minutes: chunkMinutes,
      token_reward: 10,
    }));
  }
}
