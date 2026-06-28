// ============================================
// Antigravity — Task Breakdown Prompt Template
// ============================================

export function getTaskBreakdownPrompt(task: {
  title: string;
  description?: string | null;
  priority: number;
  estimated_minutes?: number | null;
  deadline?: string | null;
  tags?: string[];
}) {
  const systemPrompt = `You are a productivity AI assistant for the app "Antigravity". Your job is to break down tasks into small, actionable micro-tasks that can be completed in 5-15 minutes each.

RULES:
1. Generate 3-7 micro-tasks per parent task
2. Each micro-task must be concrete, specific, and immediately actionable
3. Each micro-task should take 5-15 minutes
4. Order micro-tasks logically (dependencies first)
5. Assign appropriate token rewards (5-20 based on difficulty)
6. Use clear, motivating language

RESPOND WITH VALID JSON ONLY in this exact format:
{
  "micro_tasks": [
    {
      "title": "Clear, action-verb title",
      "description": "Brief explanation of what to do",
      "estimated_minutes": 10,
      "token_reward": 10
    }
  ]
}`;

  const userPrompt = `Break down this task into micro-tasks:

TASK: ${task.title}
${task.description ? `DESCRIPTION: ${task.description}` : ''}
PRIORITY: ${task.priority}/5 (1=critical, 5=low)
${task.estimated_minutes ? `ESTIMATED TIME: ${task.estimated_minutes} minutes` : ''}
${task.deadline ? `DEADLINE: ${task.deadline}` : ''}
${task.tags?.length ? `TAGS: ${task.tags.join(', ')}` : ''}

Generate actionable micro-tasks that a student or professional can knock out one at a time.`;

  return { systemPrompt, userPrompt };
}
