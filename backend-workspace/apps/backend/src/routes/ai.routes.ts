// ============================================
// Antigravity Backend — AI Routes
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import { getDefaultProvider } from '../config/ai.js';
import { generateTaskBreakdown } from '../services/ai/taskBreakdown.service.js';
import { generateSchedule } from '../services/ai/scheduling.service.js';
import { parseVoiceTranscript } from '../services/ai/voiceParser.service.js';
import { callAi } from '../services/ai/runner.js';
import { logger } from '../utils/logger.js';

export const aiRoutes = Router();

/** POST /api/ai/breakdown — Break a task into micro-tasks */
aiRoutes.post('/breakdown', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { task_id } = req.body;
    if (!task_id) throw new AppError('task_id is required', 400);

    // Fetch the parent task
    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', task_id)
      .eq('user_id', req.userId!)
      .single();

    if (error || !task) throw new NotFoundError('Task');

    // Generate micro-tasks via AI
    const microTasks = await generateTaskBreakdown(task);

    // Insert micro-tasks as subtasks
    const subtasks = microTasks.map((mt, index) => ({
      user_id: req.userId,
      parent_task_id: task_id,
      goal_id: task.goal_id,
      title: mt.title,
      description: mt.description,
      priority: task.priority,
      estimated_minutes: mt.estimated_minutes,
      token_reward: mt.token_reward,
      source: 'ai_breakdown' as const,
      is_micro_task: true,
      order_index: index,
      tags: task.tags,
      deadline: task.deadline,
      ai_metadata: { generated_by: getDefaultProvider().name },
    }));

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('tasks')
      .insert(subtasks)
      .select();

    if (insertError) throw new AppError(insertError.message, 400);

    logger.info(`AI breakdown: ${task.title} → ${microTasks.length} micro-tasks`, {
      userId: req.userId,
      taskId: task_id,
    });

    res.json({
      success: true,
      data: inserted,
      message: `🧠 Broken down into ${microTasks.length} micro-tasks!`,
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/ai/schedule — Generate AI calendar schedule */
aiRoutes.post('/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, task_ids } = req.body;
    if (!date) throw new AppError('date is required', 400);

    // Fetch pending tasks
    let query = supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('user_id', req.userId!)
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: true })
      .order('deadline', { ascending: true, nullsFirst: false });

    if (task_ids?.length) {
      query = query.in('id', task_ids);
    }

    const { data: tasks } = await query;
    if (!tasks?.length) {
      res.json({ success: true, data: [], message: 'No tasks to schedule' });
      return;
    }

    // Get user profile for timezone
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('timezone')
      .eq('id', req.userId!)
      .single();

    // Generate schedule
    const blocks = await generateSchedule(tasks, date, profile?.timezone || 'Asia/Kolkata');

    // Insert calendar blocks
    const blockRows = blocks.map((b) => ({
      user_id: req.userId,
      task_id: b.task_id,
      title: b.title,
      starts_at: b.starts_at,
      ends_at: b.ends_at,
      source: 'ai' as const,
    }));

    const { data: inserted, error } = await supabaseAdmin
      .from('calendar_blocks')
      .insert(blockRows)
      .select();

    if (error) throw new AppError(error.message, 400);

    res.json({
      success: true,
      data: inserted,
      message: `📅 Scheduled ${blocks.length} time blocks for ${date}`,
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/ai/parse-voice — Parse voice transcript into tasks */
aiRoutes.post('/parse-voice', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transcript } = req.body;
    if (!transcript) throw new AppError('transcript is required', 400);

    const extractedTasks = await parseVoiceTranscript(transcript);

    res.json({
      success: true,
      data: extractedTasks,
      message: `🎤 Extracted ${extractedTasks.length} tasks from your voice dump`,
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/ai/vision-parse — Multimodal schedule image planner */
aiRoutes.post('/vision-parse', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { image } = req.body; // base64 encoded image data URL
    if (!image) throw new AppError('image base64 data is required', 400);

    const systemPrompt = "You are Gemini Vision, a schedule digitizer. Analyze the uploaded image (schedule, list, email screenshot, syllabus) and extract all actionable tasks. Respond ONLY with a valid JSON containing a key 'tasks' which is an array of objects. Each object must have keys: 'title' (string), 'priority' (number 1-5), and 'estimated_minutes' (number). No code blocks, no markdown formatting.";
    const userPrompt = "Parse the schedule text from this image.";

    const response = await callAi(systemPrompt, userPrompt, { 
      vision: true, 
      imageUrl: image,
      json: true 
    });

    const parsed = JSON.parse(response);
    res.json({
      success: true,
      data: parsed.tasks || [],
      message: `📸 Extracted ${parsed.tasks?.length || 0} tasks from image!`
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/ai/chat — Chat assistant companion */
aiRoutes.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    if (!message) throw new AppError('message is required', 400);

    const systemPrompt = "You are Gemini, a helpful AI Focus companion built for the Antigravity productivity app. Analyze the user's workload, keep your replies short and actionable.";
    const reply = await callAi(systemPrompt, message);

    res.json({ success: true, reply });
  } catch (err) {
    next(err);
  }
});

