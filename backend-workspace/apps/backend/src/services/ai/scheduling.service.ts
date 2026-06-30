// ============================================
// Antigravity — Scheduling AI Service
// Using OpenRouter (free models)
// ============================================

import { callAi } from './runner.js';
import { logger } from '../../utils/logger.js';
import { getSchedulingPrompt } from '../../utils/prompts/scheduling.prompt.js';

interface ScheduleBlock {
  task_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
}

/**
 * Uses AI to generate an optimal daily schedule from pending tasks.
 */
export async function generateSchedule(
  tasks: Array<{
    id: string;
    title: string;
    priority: number;
    estimated_minutes: number | null;
    deadline: string | null;
  }>,
  date: string,
  timezone: string,
  preferences?: string
): Promise<ScheduleBlock[]> {
  const { systemPrompt, userPrompt } = getSchedulingPrompt(tasks, date, timezone, preferences);

  logger.info(`Generating schedule for ${date} with ${tasks.length} tasks`);

  try {
    const response = await callAi(systemPrompt, userPrompt, { json: true, temperature: 0.5 });
    const parsed = JSON.parse(response);

    if (!Array.isArray(parsed.schedule)) {
      throw new Error('Invalid AI response: missing schedule array');
    }

    const blocks: ScheduleBlock[] = parsed.schedule.map((block: any) => ({
      task_id: block.task_id,
      title: block.title || 'Untitled Block',
      starts_at: block.starts_at,
      ends_at: block.ends_at,
    }));

    logger.info(`Schedule generated: ${blocks.length} blocks for ${date}`);
    return blocks;
  } catch (err) {
    logger.error(`Schedule generation failed: ${(err as Error).message}`);

    // Fallback: simple sequential scheduling starting at 9 AM
    const baseDate = new Date(`${date}T09:00:00`);
    let currentTime = baseDate.getTime();

    return tasks.slice(0, 8).map((task) => {
      const duration = (task.estimated_minutes || 30) * 60_000;
      const starts_at = new Date(currentTime).toISOString();
      currentTime += duration;
      const ends_at = new Date(currentTime).toISOString();
      currentTime += 10 * 60_000;

      return {
        task_id: task.id,
        title: task.title,
        starts_at,
        ends_at,
      };
    });
  }
}
