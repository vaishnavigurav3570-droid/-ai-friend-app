// ============================================
// Antigravity — Scheduling Prompt Template
// ============================================

export function getSchedulingPrompt(
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
) {
  const systemPrompt = `You are a productivity AI that creates optimal daily schedules. You time-block tasks into a day based on priority, deadlines, and estimated duration.

RULES:
1. Schedule during productive hours (9:00 AM - 9:00 PM) unless the user's preferences say otherwise.
2. High-priority and deadline-approaching tasks go first.
3. Add 10-minute buffers between tasks.
4. Include a lunch break around 12:30 PM - 1:00 PM unless user preferences state otherwise.
5. Don't exceed 6 hours of total focused work.
6. Group similar tasks together when possible.
7. Put easier tasks later in the day.
8. CRITICAL: If the user provides schedule preferences, you MUST time-block around their existing commitments (e.g. do not schedule tasks during their gym time, meetings, or sleep hours).

RESPOND WITH VALID JSON ONLY:
{
  "schedule": [
    {
      "task_id": "uuid-here",
      "title": "Task title",
      "starts_at": "2025-01-15T09:00:00+05:30",
      "ends_at": "2025-01-15T09:30:00+05:30"
    }
  ]
}`;

  const taskList = tasks
    .map((t) => `  - ID: ${t.id} | Title: "${t.title}" | Priority: P${t.priority} | Est: ${t.estimated_minutes || 30}min | Deadline: ${t.deadline || 'None'}`)
    .join('\n');

  const prefText = preferences 
    ? `\nUSER'S DAILY SCHEDULE PREFERENCES:\n"${preferences}"\n\nMake sure to respect the user's commitments and do not schedule tasks over them.`
    : '';

  const userPrompt = `Create an optimal schedule for ${date} (timezone: ${timezone}).${prefText}

TASKS TO SCHEDULE:
${taskList}

Generate a time-blocked schedule for the day.`;

  return { systemPrompt, userPrompt };
}
