// ============================================
// Antigravity Backend — Voice Routes
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import { parseVoiceTranscript } from '../services/ai/voiceParser.service.js';

export const voiceRoutes = Router();

/** POST /api/voice/dump — Create voice dump record */
voiceRoutes.post('/dump', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { audio_url } = req.body;
    if (!audio_url) throw new AppError('audio_url is required', 400);

    const { data, error } = await supabaseAdmin
      .from('voice_dumps')
      .insert({
        user_id: req.userId,
        audio_url,
        status: 'processing',
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);

    // TODO: Trigger async transcription job here
    // For now, the transcript can be submitted separately

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** POST /api/voice/dumps/:id/process — Process transcript for a voice dump */
voiceRoutes.post('/dumps/:id/process', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transcript } = req.body;
    if (!transcript) throw new AppError('transcript is required', 400);

    // Parse transcript into tasks
    const extractedTasks = await parseVoiceTranscript(transcript);

    // Update voice dump
    const { data, error } = await supabaseAdmin
      .from('voice_dumps')
      .update({
        transcript,
        extracted_tasks: extractedTasks,
        status: 'parsed',
      })
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    if (!data) throw new NotFoundError('Voice dump');

    // Create tasks from extracted items
    if (extractedTasks.length > 0) {
      const taskRows = extractedTasks.map((t: any, index: number) => ({
        user_id: req.userId,
        title: t.title,
        priority: t.priority || 3,
        estimated_minutes: t.estimated_minutes || 15,
        deadline: t.deadline || null,
        tags: t.tags || [],
        source: 'voice_dump' as const,
        token_reward: 10,
        order_index: index,
      }));

      await supabaseAdmin.from('tasks').insert(taskRows);
    }

    res.json({
      success: true,
      data,
      message: `🎤 Parsed ${extractedTasks.length} tasks from voice dump`,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/voice/dumps — List voice dumps */
voiceRoutes.get('/dumps', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('voice_dumps')
      .select('*')
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new AppError(error.message, 400);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** GET /api/voice/dumps/:id — Get single voice dump */
voiceRoutes.get('/dumps/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('voice_dumps')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .single();

    if (error || !data) throw new NotFoundError('Voice dump');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
