// ============================================
// Antigravity Backend — Auth Routes
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.js';
import { supabaseAdmin } from '../config/supabase.js';
import { UpdateProfileSchema, OnboardingSchema } from '../validators.js';
import { AppError, NotFoundError } from '../utils/errors.js';

export const authRoutes = Router();

/** GET /api/auth/me — Get current user profile */
authRoutes.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.userId!)
      .single();

    if (error || !data) throw new NotFoundError('Profile');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/auth/profile — Update profile */
authRoutes.put(
  '/profile',
  authMiddleware,
  validate(UpdateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(req.body)
        .eq('id', req.userId!)
        .select()
        .single();

      if (error) throw new AppError(error.message, 400);

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

/** POST /api/auth/onboarding — Complete onboarding setup */
authRoutes.post(
  '/onboarding',
  authMiddleware,
  validate(OnboardingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { display_name, timezone, locked_apps, goals } = req.body;

      // Update profile
      await supabaseAdmin
        .from('profiles')
        .update({
          display_name,
          timezone,
          onboarding_complete: true,
        })
        .eq('id', req.userId!);

      // Add locked apps
      if (locked_apps?.length) {
        const apps = locked_apps.map((app: any) => ({
          ...app,
          user_id: req.userId,
        }));
        await supabaseAdmin.from('locked_apps').insert(apps);
      }

      // Add goals
      if (goals?.length) {
        const goalRows = goals.map((goal: any) => ({
          ...goal,
          user_id: req.userId,
        }));
        await supabaseAdmin.from('goals').insert(goalRows);
      }

      // Fetch updated profile
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', req.userId!)
        .single();

      res.json({
        success: true,
        data: profile,
        message: 'Onboarding complete! Welcome to Antigravity.',
      });
    } catch (err) {
      next(err);
    }
  }
);
