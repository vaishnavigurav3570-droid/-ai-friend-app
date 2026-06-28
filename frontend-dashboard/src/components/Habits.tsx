import React, { useState, useEffect } from 'react';
import { Flame, Check, Plus } from 'lucide-react';
import { api } from '../services/api';
import type { Habit } from '../services/api';
import confetti from 'canvas-confetti';

interface HabitsProps {
  onRefreshTokens: () => void;
}

export const Habits: React.FC<HabitsProps> = ({ onRefreshTokens }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [reward, setReward] = useState(5);

  const loadHabits = async () => {
    const data = await api.getHabits();
    setHabits(data);
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const handleCheckHabit = async (id: string, rewardVal: number) => {
    // Check local state first to see if already logged today
    const habit = habits.find(h => h.id === id);
    const todayStr = new Date().toISOString().split('T')[0];
    if (habit && habit.last_logged_date === todayStr) {
      alert('Already completed this habit today!');
      return;
    }

    // Trigger confetti burst
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 }
    });

    await api.logHabit(id);
    await api.updateTokens(rewardVal, `Logged habit: ${habit?.title}`);
    onRefreshTokens();
    loadHabits();
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await api.createHabit(newTitle, Number(reward));
    setNewTitle('');
    loadHabits();
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Habit Tracker</h1>
        <p className="text-muted" style={{ marginTop: '4px' }}>Build long-term habits. Complete them daily to maintain your streaks.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '40px', alignItems: 'start' }}>
        
        {/* Habit List Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {habits.map((habit) => {
            const isCompletedToday = habit.last_logged_date === todayStr;

            return (
              <div 
                key={habit.id} 
                className="glass-panel" 
                style={{ 
                  padding: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  minHeight: '200px',
                  border: isCompletedToday ? '1px solid var(--accent-success)' : '1px solid var(--border-glass)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{habit.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: habit.streak > 0 ? 'var(--accent-warning)' : 'var(--text-muted)' }}>
                      <Flame size={18} fill={habit.streak > 0 ? 'var(--accent-warning)' : 'transparent'} />
                      <span style={{ fontSize: '14px', fontWeight: '700' }}>{habit.streak}d</span>
                    </div>
                  </div>
                  
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', color: 'var(--accent-secondary)' }}>
                    +{habit.token_reward} FT
                  </span>
                </div>

                <div style={{ marginTop: '24px' }}>
                  {isCompletedToday ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--accent-success)', background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.2)', padding: '10px', borderRadius: '12px', fontWeight: '700', fontSize: '14px' }}>
                      <Check size={16} /> Completed Today
                    </div>
                  ) : (
                    <button 
                      className="btn-premium" 
                      style={{ width: '100%', padding: '10px' }} 
                      onClick={() => handleCheckHabit(habit.id, habit.token_reward)}
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar New Habit Form */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>New Habit</h3>
          
          <form onSubmit={handleCreateHabit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Habit Title</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Read for 15 minutes" 
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Token Reward</label>
              <input 
                type="number" 
                min="1" 
                max="50"
                value={reward}
                onChange={e => setReward(Number(e.target.value))}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <button type="submit" className="btn-premium" style={{ width: '100%', marginTop: '10px' }}>
              <Plus size={18} /> Create Habit
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
