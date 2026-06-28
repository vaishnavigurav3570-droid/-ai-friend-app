// ============================================
// Antigravity Backend — Calendar Routes
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validation.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import { z } from 'zod';

import { isMock, memoryStore } from '../utils/memoryStore.js';

export const calendarRoutes = Router();

const CreateBlockSchema = z.object({
  task_id: z.string().optional(),
  title: z.string().min(1).max(300),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  source: z.enum(['ai', 'manual']).default('manual'),
});

/** GET /api/calendar/blocks — Get blocks for date range */
calendarRoutes.get('/blocks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      throw new AppError('start_date and end_date are required', 400);
    }

    if (isMock) {
      const filtered = memoryStore.calendar_blocks.filter(b => 
        b.user_id === req.userId &&
        b.starts_at >= (start_date as string) &&
        b.starts_at <= (end_date as string)
      );
      // Attach task info if exists
      const data = filtered.map(block => {
        const task = memoryStore.tasks.find(t => t.id === block.task_id);
        return {
          ...block,
          tasks: task ? { title: task.title, priority: task.priority, status: task.status } : null
        };
      });
      return res.json({ success: true, data });
    }

    const { data, error } = await supabaseAdmin
      .from('calendar_blocks')
      .select('*, tasks(title, priority, status)')
      .eq('user_id', req.userId!)
      .gte('starts_at', start_date as string)
      .lte('ends_at', end_date as string)
      .order('starts_at', { ascending: true });

    if (error) throw new AppError(error.message, 400);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** POST /api/calendar/blocks — Create manual block */
calendarRoutes.post('/blocks', validate(CreateBlockSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (isMock) {
      const newBlock = {
        id: Math.random().toString(36).substring(2, 9),
        user_id: req.userId!,
        is_completed: false,
        created_at: new Date().toISOString(),
        ...req.body
      };
      memoryStore.calendar_blocks.push(newBlock);
      return res.status(201).json({ success: true, data: newBlock });
    }

    const { data, error } = await supabaseAdmin
      .from('calendar_blocks')
      .insert({ ...req.body, user_id: req.userId })
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/calendar/blocks/:id — Update block */
calendarRoutes.put('/blocks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (isMock) {
      const idx = memoryStore.calendar_blocks.findIndex(b => b.id === req.params.id && b.user_id === req.userId);
      if (idx === -1) throw new NotFoundError('Calendar block');
      memoryStore.calendar_blocks[idx] = { ...memoryStore.calendar_blocks[idx], ...req.body };
      return res.json({ success: true, data: memoryStore.calendar_blocks[idx] });
    }

    const { data, error } = await supabaseAdmin
      .from('calendar_blocks')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    if (!data) throw new NotFoundError('Calendar block');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/calendar/blocks/:id — Delete block */
calendarRoutes.delete('/blocks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (isMock) {
      const idx = memoryStore.calendar_blocks.findIndex(b => b.id === req.params.id && b.user_id === req.userId);
      if (idx === -1) throw new NotFoundError('Calendar block');
      memoryStore.calendar_blocks.splice(idx, 1);
      return res.json({ success: true, message: 'Block deleted' });
    }

    const { error } = await supabaseAdmin
      .from('calendar_blocks')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId!);

    if (error) throw new AppError(error.message, 400);

    res.json({ success: true, message: 'Block deleted' });
  } catch (err) {
    next(err);
  }
});
