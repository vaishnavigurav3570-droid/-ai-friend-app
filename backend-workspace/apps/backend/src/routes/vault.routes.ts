// ============================================
// Antigravity Backend — Vault Routes
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validation.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import { z } from 'zod';

export const vaultRoutes = Router();

const LockAppSchema = z.object({
  package_name: z.string().min(1).max(300),
  app_label: z.string().min(1).max(100),
  icon_url: z.string().url().optional(),
  unlock_cost: z.number().int().min(1).max(1000).default(50),
  daily_limit_minutes: z.number().int().min(5).max(480).default(60),
});

const UpdateLockedAppSchema = z.object({
  unlock_cost: z.number().int().min(1).max(1000).optional(),
  is_active: z.boolean().optional(),
  daily_limit_minutes: z.number().int().min(5).max(480).optional(),
});

/** GET /api/vault/apps — List locked apps */
vaultRoutes.get('/apps', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('locked_apps')
      .select('*')
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 400);

    // Fetch today's usage for each app
    const appsWithUsage = await Promise.all(
      (data || []).map(async (app) => {
        const { data: sessions } = await supabaseAdmin
          .from('app_lock_sessions')
          .select('duration_minutes')
          .eq('locked_app_id', app.id)
          .eq('user_id', req.userId!)
          .gte('started_at', new Date().toISOString().split('T')[0]);

        const todayMinutes = (sessions || []).reduce((sum, s) => sum + s.duration_minutes, 0);

        return { ...app, today_usage_minutes: todayMinutes };
      })
    );

    res.json({ success: true, data: appsWithUsage });
  } catch (err) {
    next(err);
  }
});

/** POST /api/vault/apps — Add app to vault */
vaultRoutes.post('/apps', validate(LockAppSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('locked_apps')
      .insert({ ...req.body, user_id: req.userId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('This app is already in your Vault', 409);
      }
      throw new AppError(error.message, 400);
    }

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/vault/apps/:id — Update locked app settings */
vaultRoutes.put(
  '/apps/:id',
  validate(UpdateLockedAppSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('locked_apps')
        .update(req.body)
        .eq('id', req.params.id)
        .eq('user_id', req.userId!)
        .select()
        .single();

      if (error) throw new AppError(error.message, 400);
      if (!data) throw new NotFoundError('Locked app');

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

/** DELETE /api/vault/apps/:id — Remove app from vault */
vaultRoutes.delete('/apps/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabaseAdmin
      .from('locked_apps')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId!);

    if (error) throw new AppError(error.message, 400);

    res.json({ success: true, message: 'App removed from Vault' });
  } catch (err) {
    next(err);
  }
});

/** GET /api/vault/sessions — List active sessions */
vaultRoutes.get('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_lock_sessions')
      .select('*, locked_apps(app_label, package_name, icon_url)')
      .eq('user_id', req.userId!)
      .eq('status', 'active')
      .order('expires_at', { ascending: true });

    if (error) throw new AppError(error.message, 400);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** POST /api/vault/sessions/:id/end — End session early */
vaultRoutes.post('/sessions/:id/end', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_lock_sessions')
      .update({
        status: 'ended_early',
        actual_end_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .eq('status', 'active')
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    if (!data) throw new NotFoundError('Active session');

    res.json({
      success: true,
      data,
      message: 'Session ended early. Great self-control! 💪',
    });
  } catch (err) {
    next(err);
  }
});
