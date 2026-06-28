-- ============================================
-- Migration 010: Atomic PL/pgSQL Functions
-- Token economy transaction functions
-- ============================================

-- ============================================
-- Function: complete_task_and_award
-- Atomically marks a task complete and awards tokens
-- ============================================
CREATE OR REPLACE FUNCTION complete_task_and_award(
  p_task_id uuid,
  p_user_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_reward integer;
  v_new_balance integer;
  v_task_title text;
  v_streak integer;
  v_streak_bonus integer := 0;
BEGIN
  -- Mark task complete and get reward
  UPDATE tasks
    SET status = 'completed',
        completed_at = now(),
        updated_at = now()
    WHERE id = p_task_id
      AND user_id = p_user_id
      AND status != 'completed'
    RETURNING token_reward, title INTO v_reward, v_task_title;

  IF v_reward IS NULL THEN
    RAISE EXCEPTION 'Task not found, unauthorized, or already completed';
  END IF;

  -- Get current streak for bonus calculation
  SELECT streak_days INTO v_streak FROM profiles WHERE id = p_user_id;
  
  -- Streak bonus: +10% per streak day, max 100%
  IF v_streak > 0 THEN
    v_streak_bonus := LEAST(v_reward, FLOOR(v_reward * LEAST(v_streak * 0.1, 1.0))::integer);
  END IF;

  -- Credit base reward + streak bonus
  UPDATE profiles
    SET token_balance = token_balance + v_reward + v_streak_bonus,
        updated_at = now()
    WHERE id = p_user_id
    RETURNING token_balance INTO v_new_balance;

  -- Append base reward ledger entry
  INSERT INTO token_ledger (user_id, amount, balance_after, type, reference_id, reference_type, description)
    VALUES (
      p_user_id,
      v_reward,
      v_new_balance - v_streak_bonus,
      'task_complete',
      p_task_id,
      'task',
      'Completed: ' || v_task_title
    );

  -- Append streak bonus ledger entry (if any)
  IF v_streak_bonus > 0 THEN
    INSERT INTO token_ledger (user_id, amount, balance_after, type, reference_id, reference_type, description)
      VALUES (
        p_user_id,
        v_streak_bonus,
        v_new_balance,
        'streak_bonus',
        p_task_id,
        'task',
        'Streak bonus (' || v_streak || ' days): ' || v_task_title
      );
  END IF;

  -- Update parent task progress if this is a subtask
  PERFORM update_parent_progress(p_task_id, p_user_id);

  RETURN jsonb_build_object(
    'new_balance', v_new_balance,
    'reward', v_reward,
    'streak_bonus', v_streak_bonus,
    'total_earned', v_reward + v_streak_bonus,
    'streak_days', v_streak
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: unlock_app_session
-- Atomically debits tokens and creates an unlock session
-- ============================================
CREATE OR REPLACE FUNCTION unlock_app_session(
  p_user_id uuid,
  p_locked_app_id uuid,
  p_duration_minutes integer
) RETURNS jsonb AS $$
DECLARE
  v_cost integer;
  v_new_balance integer;
  v_session_id uuid;
  v_app_label text;
  v_daily_used integer;
  v_daily_limit integer;
BEGIN
  -- Get app details and calculate cost (pro-rated from unlock_cost per 15 min)
  SELECT
    CEIL(unlock_cost * (p_duration_minutes::numeric / 15))::integer,
    app_label,
    daily_limit_minutes
  INTO v_cost, v_app_label, v_daily_limit
  FROM locked_apps
  WHERE id = p_locked_app_id AND user_id = p_user_id AND is_active = true;

  IF v_cost IS NULL THEN
    RAISE EXCEPTION 'Locked app not found or inactive';
  END IF;

  -- Check daily limit
  SELECT COALESCE(SUM(duration_minutes), 0) INTO v_daily_used
  FROM app_lock_sessions
  WHERE locked_app_id = p_locked_app_id
    AND user_id = p_user_id
    AND started_at >= date_trunc('day', now() AT TIME ZONE (SELECT timezone FROM profiles WHERE id = p_user_id));

  IF v_daily_used + p_duration_minutes > v_daily_limit THEN
    RAISE EXCEPTION 'Daily limit exceeded. Used: % min, Limit: % min', v_daily_used, v_daily_limit;
  END IF;

  -- Debit balance (CHECK constraint prevents negative)
  UPDATE profiles
    SET token_balance = token_balance - v_cost,
        updated_at = now()
    WHERE id = p_user_id
    RETURNING token_balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient token balance';
  END IF;

  -- Create unlock session
  INSERT INTO app_lock_sessions (
    user_id, locked_app_id, tokens_spent, duration_minutes, expires_at
  ) VALUES (
    p_user_id,
    p_locked_app_id,
    v_cost,
    p_duration_minutes,
    now() + (p_duration_minutes || ' minutes')::interval
  ) RETURNING id INTO v_session_id;

  -- Append ledger entry
  INSERT INTO token_ledger (user_id, amount, balance_after, type, reference_id, reference_type, description)
    VALUES (
      p_user_id,
      -v_cost,
      v_new_balance,
      'app_unlock',
      v_session_id,
      'app_lock_session',
      'Unlocked ' || v_app_label || ' for ' || p_duration_minutes || ' min'
    );

  RETURN jsonb_build_object(
    'session_id', v_session_id,
    'tokens_spent', v_cost,
    'new_balance', v_new_balance,
    'expires_at', now() + (p_duration_minutes || ' minutes')::interval,
    'daily_used_minutes', v_daily_used + p_duration_minutes,
    'daily_limit_minutes', v_daily_limit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: update_parent_progress
-- Recalculates parent task progress from subtasks
-- ============================================
CREATE OR REPLACE FUNCTION update_parent_progress(
  p_task_id uuid,
  p_user_id uuid
) RETURNS void AS $$
DECLARE
  v_parent_id uuid;
  v_total integer;
  v_completed integer;
  v_progress integer;
BEGIN
  SELECT parent_task_id INTO v_parent_id
  FROM tasks WHERE id = p_task_id AND user_id = p_user_id;

  IF v_parent_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total, v_completed
  FROM tasks
  WHERE parent_task_id = v_parent_id;

  -- Also update goal progress if linked
  UPDATE goals
    SET progress_pct = CASE
      WHEN (SELECT COUNT(*) FROM tasks WHERE goal_id = goals.id) > 0
      THEN (
        SELECT ROUND(
          100.0 * COUNT(*) FILTER (WHERE status = 'completed') / NULLIF(COUNT(*), 0)
        )::integer
        FROM tasks WHERE goal_id = goals.id
      )
      ELSE 0
    END
  WHERE id = (SELECT goal_id FROM tasks WHERE id = v_parent_id)
    AND (SELECT goal_id FROM tasks WHERE id = v_parent_id) IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: log_habit_and_award
-- Atomically logs a habit check-in and awards tokens
-- ============================================
CREATE OR REPLACE FUNCTION log_habit_and_award(
  p_habit_id uuid,
  p_user_id uuid,
  p_date date DEFAULT CURRENT_DATE
) RETURNS jsonb AS $$
DECLARE
  v_reward integer;
  v_new_balance integer;
  v_habit_title text;
  v_log_id uuid;
BEGIN
  -- Get habit details
  SELECT token_reward, title INTO v_reward, v_habit_title
  FROM habits
  WHERE id = p_habit_id AND user_id = p_user_id AND is_active = true;

  IF v_reward IS NULL THEN
    RAISE EXCEPTION 'Habit not found or inactive';
  END IF;

  -- Insert log (unique constraint prevents duplicates)
  INSERT INTO habit_log (habit_id, user_id, logged_date, completed)
    VALUES (p_habit_id, p_user_id, p_date, true)
    RETURNING id INTO v_log_id;

  -- Credit tokens
  UPDATE profiles
    SET token_balance = token_balance + v_reward,
        updated_at = now()
    WHERE id = p_user_id
    RETURNING token_balance INTO v_new_balance;

  -- Ledger entry
  INSERT INTO token_ledger (user_id, amount, balance_after, type, reference_id, reference_type, description)
    VALUES (
      p_user_id,
      v_reward,
      v_new_balance,
      'habit_complete',
      p_habit_id,
      'habit',
      'Habit check-in: ' || v_habit_title
    );

  RETURN jsonb_build_object(
    'new_balance', v_new_balance,
    'reward', v_reward,
    'log_id', v_log_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
