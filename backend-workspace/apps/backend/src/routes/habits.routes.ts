// ============================================
// Antigravity Backend — Habit Routes
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validation.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import { z } from 'zod';
import { isMock, memoryStore } from '../utils/memoryStore.js';

export const habitRoutes = Router();

const CreateHabitSchema = z.object({
  title: z.string().min(1).max(200),
  frequency: z.enum(['daily', 'weekdays', 'weekly', 'custom']).default('daily'),
  custom_days: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  token_reward: z.number().int().min(1).max(100).default(5),
  reminder_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
});

const UpdateHabitSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  frequency: z.enum(['daily', 'weekdays', 'weekly', 'custom']).optional(),
  custom_days: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  token_reward: z.number().int().min(1).max(100).optional(),
  reminder_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
  is_active: z.boolean().optional(),
});

/** GET /api/habits — List habits */
habitRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (isMock) {
      const habits = memoryStore.habits.filter(h => h.user_id === req.userId);
      return res.json({ success: true, data: habits });
    }

    const { data: habits, error } = await supabaseAdmin
      .from('habits')
      .select('*')
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 400);

    // Get today's log for each habit
    const today = new Date().toISOString().split('T')[0];
    const { data: todayLogs } = await supabaseAdmin
      .from('habit_log')
      .select('habit_id')
      .eq('user_id', req.userId!)
      .eq('logged_date', today);

    const loggedToday = new Set((todayLogs || []).map((l) => l.habit_id));
    const habitsWithStatus = (habits || []).map((h) => ({
      ...h,
      completed_today: loggedToday.has(h.id),
    }));

    res.json({ success: true, data: habitsWithStatus });
  } catch (err) {
    next(err);
  }
});

/** POST /api/habits — Create habit */
habitRoutes.post('/', validate(CreateHabitSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('habits')
      .insert({ ...req.body, user_id: req.userId })
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/habits/:id — Update habit */
habitRoutes.put('/:id', validate(UpdateHabitSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('habits')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    if (!data) throw new NotFoundError('Habit');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** POST /api/habits/:id/log — Log habit completion and award tokens */
habitRoutes.post('/:id/log', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (isMock) {
      const habit = memoryStore.habits.find(h => h.id === req.params.id && h.user_id === req.userId);
      if (!habit) throw new NotFoundError('Habit');
      const today = new Date().toISOString().split('T')[0];
      if (habit.last_logged_date !== today) {
        habit.streak += 1;
        habit.last_logged_date = today;
      }
      memoryStore.profile.token_balance += habit.token_reward;
      return res.json({ success: true, data: { reward: habit.token_reward, streak: habit.streak }, message: `✅ Habit logged! Earned ${habit.token_reward} tokens.` });
    }

    const date = req.body?.date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin.rpc('log_habit_and_award', {
      p_habit_id: req.params.id,
      p_user_id: req.userId!,
      p_date: date,
    });

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        throw new AppError('Already logged for this date', 409);
      }
      throw new AppError(error.message, 400);
    }

    res.json({
      success: true,
      data,
      message: `✅ Habit logged! Earned ${data.reward} tokens.`,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/habits/:id/history — Get habit log history */
habitRoutes.get('/:id/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = Math.min(365, parseInt(req.query.days as string, 10) || 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabaseAdmin
      .from('habit_log')
      .select('*')
      .eq('habit_id', req.params.id)
      .eq('user_id', req.userId!)
      .gte('logged_date', startDate.toISOString().split('T')[0])
      .order('logged_date', { ascending: false });

    if (error) throw new AppError(error.message, 400);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
