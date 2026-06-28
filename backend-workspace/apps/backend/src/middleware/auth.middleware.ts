// ============================================
// Antigravity Backend — Auth Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';

/** Extend Express Request with authenticated user */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      accessToken?: string;
    }
  }
}

/**
 * Verifies the Supabase JWT from the Authorization header.
 * Attaches userId, userEmail, and accessToken to the request.
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    // Dev bypass when running locally or key is placeholder
    const isDev = process.env.NODE_ENV !== 'production' || !env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY.includes('YOUR_');
    if (isDev && (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.includes('null') || authHeader.includes('undefined'))) {
      req.userId = '00000000-0000-0000-0000-000000000000';
      req.userEmail = 'dev@antigravity.app';
      req.accessToken = 'dev-token';
      return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7);

    // If placeholder keys are active but request had a null/expired token in dev
    if (isDev && (token === 'null' || token === 'undefined' || token === 'dev-token')) {
      req.userId = '00000000-0000-0000-0000-000000000000';
      req.userEmail = 'dev@antigravity.app';
      req.accessToken = 'dev-token';
      return next();
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    req.userId = data.user.id;
    req.userEmail = data.user.email;
    req.accessToken = token;

    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
    } else {
      next(new UnauthorizedError('Authentication failed'));
    }
  }
}
