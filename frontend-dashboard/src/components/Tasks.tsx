import React, { useState, useEffect } from 'react';
import { Plus, Check, BrainCircuit, Calendar, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { Task } from '../services/api';
import confetti from 'canvas-confetti';

interface TasksProps {
  onRefreshTokens: () => void;
}

export const Tasks: React.FC<TasksProps> = ({ onRefreshTokens }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [priority, setPriority] = useState(3);
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  const loadTasks = async () => {
    setIsLoading(true);
    const data = await api.getTasks();
    setTasks(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await api.createTask({
      title: newTitle,
      description: newDesc,
      priority: Number(priority),
      estimated_minutes: Number(estimatedMinutes),
      tags: ['Work']
    });

    setNewTitle('');
    setNewDesc('');
    loadTasks();
  };

  const handleCompleteTask = async (id: string, isSubtask: boolean) => {
    const reward = isSubtask ? 3 : 8; // Complete subtask rewards 3 tokens, primary task rewards 8
    
    // Confetti
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });

    await api.updateTask(id, { status: 'completed' });
    await api.updateTokens(reward, `Completed task: ${tasks.find(t => t.id === id)?.title}`);
    onRefreshTokens();
    loadTasks();
  };

  const handleAIDecomposition = async (id: string) => {
    setLoadingTaskId(id);
    try {
      await api.breakdownTask(id);
      loadTasks();
    } catch (e) {
      alert('AI breakdown failed. Try again.');
    } finally {
      setLoadingTaskId(null);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Task Manager</h1>
          <p className="text-muted" style={{ marginTop: '4px' }}>Break tasks down with AI and earn focus tokens.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '40px', alignItems: 'start' }}>
        
        {/* Task List */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Active Backlog</h2>
          
          {isLoading ? (
            <p className="text-muted">Loading tasks...</p>
          ) : tasks.filter(t => t.status !== 'completed').length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Check size={48} style={{ margin: '0 auto 16px', display: 'block', color: 'var(--accent-secondary)' }} />
              <p style={{ fontWeight: '600' }}>All clear! You have no pending tasks.</p>
              <p style={{ fontSize: '14px', marginTop: '4px' }} className="text-muted">Add a new task in the sidebar to get started.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tasks.filter(t => t.status !== 'completed').map((task) => (
                <div key={task.id} className="glass-panel" style={{ 
                  padding: '20px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  borderLeft: `4px solid ${
                    task.priority >= 4 ? 'var(--accent-warning)' : 
                    task.priority === 3 ? 'var(--accent-primary)' : 
                    'var(--accent-secondary)'
                  }`
                }}>
                  <div style={{ flex: 1, marginRight: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{task.title}</h3>
                      {task.tags?.map(tag => (
                        <span key={tag} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', fontWeight: '600', color: 'var(--accent-secondary)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    {task.description && (
                      <p className="text-muted" style={{ fontSize: '14px', marginTop: '6px' }}>{task.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px' }} className="text-muted">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {task.estimated_minutes || 0} mins
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={12} /> Priority: {task.priority}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* AI Breakdown Button */}
                    {!task.tags.includes('AI-Breakdown') && (
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '10px 14px', fontSize: '13px' }}
                        disabled={loadingTaskId !== null}
                        onClick={() => handleAIDecomposition(task.id)}
                      >
                        <BrainCircuit size={16} color="var(--accent-secondary)" />
                        {loadingTaskId === task.id ? 'Analyzing...' : 'AI Split'}
                      </button>
                    )}

                    {/* Complete Button */}
                    <button 
                      className="btn-premium" 
                      style={{ padding: '10px 16px', background: 'var(--accent-success)', boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)' }}
                      onClick={() => handleCompleteTask(task.id, task.tags.includes('AI-Breakdown'))}
                    >
                      <Check size={16} />
                      Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Finished Tasks Section */}
          {tasks.filter(t => t.status === 'completed').length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-secondary)' }}>Finished Recently</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0.6 }}>
                {tasks.filter(t => t.status === 'completed').slice(0, 5).map(task => (
                  <div key={task.id} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontWeight: '500' }}>{task.title}</span>
                    <span style={{ color: 'var(--accent-success)', fontWeight: '600', fontSize: '13px' }}>Completed</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Creation Form */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>New Task</h3>
          
          <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Title</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="What are you working on?" 
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Description</label>
              <textarea 
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Details or subtasks..." 
                rows={3}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', resize: 'none', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Priority (1-5)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="5"
                  value={priority}
                  onChange={e => setPriority(Number(e.target.value))}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Est. Mins</label>
                <input 
                  type="number" 
                  min="5" 
                  max="480"
                  step="5"
                  value={estimatedMinutes}
                  onChange={e => setEstimatedMinutes(Number(e.target.value))}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-premium" style={{ width: '100%', marginTop: '10px' }}>
              <Plus size={18} /> Add Task
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
