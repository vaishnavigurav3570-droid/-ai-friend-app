// ============================================
// Antigravity Backend — Token Routes
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validation.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError, NotFoundError, InsufficientTokensError } from '../utils/errors.js';
import { z } from 'zod';
import { isMock, memoryStore } from '../utils/memoryStore.js';

export const tokenRoutes = Router();

const UnlockAppSchema = z.object({
  locked_app_id: z.string().uuid(),
  duration_minutes: z.number().int().refine((v) => [15, 30, 60].includes(v)),
});

/** GET /api/tokens/balance — Get current token balance */
tokenRoutes.get('/balance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (isMock) {
      return res.json({ success: true, data: { token_balance: memoryStore.profile.token_balance, streak_days: memoryStore.profile.streak_days, longest_streak: memoryStore.profile.longest_streak } });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('token_balance, streak_days, longest_streak')
      .eq('id', req.userId!)
      .single();

    if (error || !data) throw new NotFoundError('Profile');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** GET /api/tokens/history — Get token ledger (paginated) */
tokenRoutes.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from('token_ledger')
      .select('*', { count: 'exact' })
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new AppError(error.message, 400);

    res.json({
      success: true,
      data,
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/tokens/transaction — Adjust token balance directly */
tokenRoutes.post('/transaction', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, reason } = req.body;
    if (amount === undefined) throw new AppError('amount is required', 400);

    if (isMock) {
      memoryStore.profile.token_balance = Math.max(0, memoryStore.profile.token_balance + amount);
      return res.json({ success: true, balance: memoryStore.profile.token_balance, message: `Tokens adjusted by ${amount}` });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('token_balance')
      .eq('id', req.userId!)
      .single();

    const currentBalance = profile?.token_balance || 0;
    const newBalance = Math.max(0, currentBalance + amount);

    await supabaseAdmin
      .from('profiles')
      .update({ token_balance: newBalance })
      .eq('id', req.userId!);

    await supabaseAdmin
      .from('token_ledger')
      .insert({
        user_id: req.userId,
        amount,
        activity_type: amount > 0 ? 'gain' : 'spend',
        description: reason || 'Direct Adjustment'
      });

    res.json({
      success: true,
      balance: newBalance,
      message: `Tokens adjusted by ${amount}`
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/tokens/unlock — Spend tokens to unlock an app */
tokenRoutes.post(
  '/unlock',
  validate(UnlockAppSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { locked_app_id, duration_minutes } = req.body;

      // Check balance first for a better error message
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('token_balance')
        .eq('id', req.userId!)
        .single();

      const { data: app } = await supabaseAdmin
        .from('locked_apps')
        .select('unlock_cost')
        .eq('id', locked_app_id)
        .eq('user_id', req.userId!)
        .single();

      if (!app) throw new NotFoundError('Locked app');

      const cost = Math.ceil(app.unlock_cost * (duration_minutes / 15));
      if (profile && profile.token_balance < cost) {
        throw new InsufficientTokensError(cost, profile.token_balance);
      }

      // Execute atomic unlock
      const { data, error } = await supabaseAdmin.rpc('unlock_app_session', {
        p_user_id: req.userId!,
        p_locked_app_id: locked_app_id,
        p_duration_minutes: duration_minutes,
      });

      if (error) throw new AppError(error.message, 400);

      res.json({
        success: true,
        data,
        message: `🔓 Unlocked for ${duration_minutes} minutes. Enjoy responsibly!`,
      });
    } catch (err) {
      next(err);
    }
  }
);
