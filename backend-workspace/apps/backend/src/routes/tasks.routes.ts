import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validation.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import { z } from 'zod';
import { isMock, memoryStore } from '../utils/memoryStore.js';

export const taskRoutes = Router();

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  parent_task_id: z.string().optional(),
  goal_id: z.string().optional(),
  priority: z.number().int().min(1).max(5).default(3),
  estimated_minutes: z.number().int().min(1).max(120).optional(),
  deadline: z.string().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  source: z.enum(['manual', 'ai_breakdown', 'voice_dump', 'intercept']).default('manual'),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  priority: z.number().int().min(1).max(5).optional(),
  estimated_minutes: z.number().int().min(1).max(120).optional(),
  deadline: z.string().nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped', 'expired']).optional(),
  order_index: z.number().int().min(0).optional(),
});

/** GET /api/tasks — List tasks with filters */
taskRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (isMock) {
      const tasks = memoryStore.tasks.filter(t => t.user_id === req.userId);
      return res.json({ success: true, data: tasks, total: tasks.length, page: 1, limit: 20, total_pages: 1 });
    }

    const { status, priority, parent_task_id, goal_id, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact' })
      .eq('user_id', req.userId!)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (status) query = query.eq('status', status as string);
    if (priority) query = query.eq('priority', parseInt(priority as string, 10));
    if (parent_task_id === 'null') {
      query = query.is('parent_task_id', null);
    } else if (parent_task_id) {
      query = query.eq('parent_task_id', parent_task_id as string);
    }
    if (goal_id) query = query.eq('goal_id', goal_id as string);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw new AppError(error.message, 400);

    res.json({
      success: true,
      data,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/tasks/:id — Get task with subtasks */
taskRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (isMock) {
      const task = memoryStore.tasks.find(t => t.id === req.params.id && t.user_id === req.userId);
      if (!task) throw new NotFoundError('Task');
      return res.json({ success: true, data: { ...task, subtasks: [] } });
    }

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .single();

    if (error || !task) throw new NotFoundError('Task');

    // Fetch subtasks
    const { data: subtasks } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('parent_task_id', task.id)
      .eq('user_id', req.userId!)
      .order('order_index', { ascending: true });

    res.json({
      success: true,
      data: { ...task, subtasks: subtasks || [] },
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/tasks — Create task */
taskRoutes.post('/', validate(CreateTaskSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const priorityMultipliers: Record<number, number> = { 1: 3, 2: 2, 3: 1, 4: 0.7, 5: 0.5 };
    const multiplier = priorityMultipliers[req.body.priority] ?? 1;
    const tokenReward = Math.round(10 * multiplier);

    if (isMock) {
      const newTask = {
        id: Math.random().toString(36).substring(2, 9),
        user_id: req.userId!,
        status: 'pending' as const,
        token_reward: tokenReward,
        is_micro_task: !!req.body.parent_task_id,
        tags: req.body.tags || [],
        created_at: new Date().toISOString(),
        ...req.body,
      };
      memoryStore.tasks.push(newTask);
      return res.status(201).json({ success: true, data: newTask });
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        ...req.body,
        user_id: req.userId,
        token_reward: tokenReward,
        is_micro_task: !!req.body.parent_task_id,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/tasks/:id — Update task */
taskRoutes.put('/:id', validate(UpdateTaskSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (isMock) {
      const idx = memoryStore.tasks.findIndex(t => t.id === req.params.id && t.user_id === req.userId);
      if (idx === -1) throw new NotFoundError('Task');
      memoryStore.tasks[idx] = { ...memoryStore.tasks[idx], ...req.body };
      return res.json({ success: true, data: memoryStore.tasks[idx] });
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    if (!data) throw new NotFoundError('Task');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** POST /api/tasks/:id/complete — Complete task and award tokens */
taskRoutes.post('/:id/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (isMock) {
      const idx = memoryStore.tasks.findIndex(t => t.id === req.params.id && t.user_id === req.userId);
      if (idx === -1) throw new NotFoundError('Task');
      memoryStore.tasks[idx].status = 'completed';
      const earned = 10;
      memoryStore.profile.token_balance += earned;
      return res.json({ success: true, data: { total_earned: earned }, message: `🎉 Task completed! Earned ${earned} tokens.` });
    }

    const { data, error } = await supabaseAdmin.rpc('complete_task_and_award', {
      p_task_id: req.params.id,
      p_user_id: req.userId!,
    });

    if (error) throw new AppError(error.message, 400);

    res.json({
      success: true,
      data,
      message: `🎉 Task completed! Earned ${data.total_earned} tokens.`,
    });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/tasks/:id — Delete task */
taskRoutes.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (isMock) {
      const idx = memoryStore.tasks.findIndex(t => t.id === req.params.id && t.user_id === req.userId);
      if (idx === -1) throw new NotFoundError('Task');
      memoryStore.tasks.splice(idx, 1);
      return res.json({ success: true, message: 'Task deleted' });
    }

    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId!);

    if (error) throw new AppError(error.message, 400);

    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

