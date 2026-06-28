import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Check, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

interface ProposedAction {
  type: 'pomodoro' | 'habit' | 'schedule' | 'task';
  title: string;
  details?: string;
  time?: string;
  date?: string;
  metadata?: any;
}

export const VoiceDump: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'confirming' | 'executing' | 'success' | 'cancelled'>('idle');
  const [inputText, setInputText] = useState('');
  const [proposal, setProposal] = useState<ProposedAction | null>(null);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setRecognitionSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false; // Stop after single statement
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleProcessSpeech(transcript);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setStatus('idle');
      };

      rec.onend = () => {
        // Do not reset if confirming, as we might start a new recognition loop for yes/no
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Listen specifically for Yes/No confirmations
  const listenForConfirmation = () => {
    if (!recognitionRef.current) return;
    
    // Create new temporary recognition instance for yes/no
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const confirmRec = new SpeechRecognition();
    confirmRec.continuous = false;
    confirmRec.lang = 'en-US';

    confirmRec.onresult = (event: any) => {
      const response = event.results[0][0].transcript.toLowerCase();
      console.log('Confirmation voice response:', response);
      if (response.includes('yes') || response.includes('okay') || response.includes('proceed') || response.includes('sure') || response.includes('confirm')) {
        handleExecuteProposedAction();
      } else if (response.includes('no') || response.includes('cancel') || response.includes('stop') || response.includes('never mind')) {
        handleCancelProposedAction();
      } else {
        speakText("I didn't catch that. Please click proceed or cancel.");
      }
    };

    confirmRec.onerror = () => {
      // Quietly fail and let user click buttons
    };

    try {
      confirmRec.start();
    } catch (e) {
      console.warn(e);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setProposal(null);
      setInputText('');
      setStatus('listening');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    } else {
      // Simulate if browser does not support mic API
      setStatus('listening');
      setInputText('');
      setTimeout(() => {
        const simulatedInputs = [
          "Schedule math study session tomorrow at 3 PM",
          "Start Pomodoro timer now",
          "Log my daily water habit",
          "Create task submit the hackathon draft"
        ];
        const randomSim = simulatedInputs[Math.floor(Math.random() * simulatedInputs.length)];
        setInputText(randomSim);
        handleProcessSpeech(randomSim);
      }, 2000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Failed to stop recognition:', err);
      }
    }
    setStatus('idle');
  };

  // Speaks output text back using browser speech synthesis
  const speakText = (text: string, callback?: () => void) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel any active speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      if (callback) {
        utterance.onend = callback;
      }
      window.speechSynthesis.speak(utterance);
    } else if (callback) {
      callback();
    }
  };

  // Synthesize alarm/chime sounds
  const playChime = (type: 'success' | 'cancel') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(392.00, ctx.currentTime); // G4
        osc.frequency.setValueAtTime(329.63, ctx.currentTime + 0.15); // E4
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Process speech and extract intent
  const handleProcessSpeech = async (text: string) => {
    setStatus('confirming');
    const cleanText = text.toLowerCase().trim();

    // 1. Pomodoro intent
    if (cleanText.includes('pomodoro') || cleanText.includes('timer') || cleanText.includes('focus')) {
      const prop: ProposedAction = {
        type: 'pomodoro',
        title: 'Start Pomodoro Session',
        details: 'Engage Tab Focus Shield and activate 25-minute Pomodoro timer.'
      };
      setProposal(prop);
      speakText("I detected a request to start a Pomodoro timer. Should I engage the Focus Shield now?", listenForConfirmation);
      return;
    }

    // 2. Habit logging intent
    if (cleanText.includes('habit') || cleanText.includes('water') || cleanText.includes('workout')) {
      // Find active habits to see if we can map
      const habits = await api.getHabits();
      let matchedHabit = habits[0] || { id: '1', title: 'Drink 3L of Water' };
      
      if (cleanText.includes('water')) {
        matchedHabit = habits.find(h => h.title.toLowerCase().includes('water')) || matchedHabit;
      } else if (cleanText.includes('workout') || cleanText.includes('exercise')) {
        matchedHabit = habits.find(h => h.title.toLowerCase().includes('exercise') || h.title.toLowerCase().includes('stretch')) || matchedHabit;
      }

      const prop: ProposedAction = {
        type: 'habit',
        title: `Log Habit: ${matchedHabit.title}`,
        details: `Log habit streak increment for "${matchedHabit.title}".`,
        metadata: { id: matchedHabit.id, title: matchedHabit.title }
      };
      setProposal(prop);
      speakText(`I detected you want to log your ${matchedHabit.title} habit. Should I increment your streak?`, listenForConfirmation);
      return;
    }

    // 3. Task & Calendar scheduling intent
    if (cleanText.includes('schedule') || cleanText.includes('at') || cleanText.includes('pm') || cleanText.includes('am')) {
      // Extract task title
      let title = text
        .replace(/schedule|at|pm|am|tomorrow|tonight|today|meeting|session/gi, '')
        .trim();
      if (!title) title = "Focus Meeting Session";
      
      // Parse time if stated (rough parse)
      const timeMatch = cleanText.match(/(\d+)\s*(pm|am)/i);
      const timeStr = timeMatch ? `${timeMatch[1]}:00 ${timeMatch[2].toUpperCase()}` : '02:00 PM';
      
      const isTomorrow = cleanText.includes('tomorrow');
      const dateStr = isTomorrow 
        ? new Date(Date.now() + 86400000).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const prop: ProposedAction = {
        type: 'schedule',
        title: title.charAt(0).toUpperCase() + title.slice(1),
        details: 'Create a priority task and block out a focus session on your calendar.',
        time: timeStr,
        date: isTomorrow ? 'Tomorrow' : 'Today',
        metadata: { dateISO: dateStr }
      };
      setProposal(prop);
      speakText(`I detected you want to schedule focus block "${prop.title}" for ${prop.date} at ${prop.time}. Should I add this to your calendar?`, listenForConfirmation);
      return;
    }

    // 4. Default task creation intent
    let taskTitle = text
      .replace(/create task|add task|assign task|create|add/gi, '')
      .trim();
    if (!taskTitle) taskTitle = text;

    const prop: ProposedAction = {
      type: 'task',
      title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
      details: 'Add task directly to backlog with medium priority.'
    };
    setProposal(prop);
    speakText(`Should I add task "${prop.title}" to your backlog?`, listenForConfirmation);
  };

  // Perform actual API updates on database
  const handleExecuteProposedAction = async () => {
    if (!proposal) return;
    setStatus('executing');

    try {
      if (proposal.type === 'pomodoro') {
        // Dispatch custom event to app.tsx or dashboard to activate timer
        localStorage.setItem('ag_trigger_timer', 'true');
        window.dispatchEvent(new Event('storage'));
      } 
      else if (proposal.type === 'habit') {
        await api.logHabit(proposal.metadata.id);
      } 
      else if (proposal.type === 'schedule') {
        // Create the task
        const newTask = await api.createTask({
          title: proposal.title,
          priority: 4,
          estimated_minutes: 45
        });

        // Parse target time to format starts_at/ends_at ISO strings
        const dateISO = proposal.metadata?.dateISO || new Date().toISOString().split('T')[0];
        const timeMatch = proposal.time?.match(/(\d+):(\d+)\s+(AM|PM)/);
        let hours = 14; // default 2 PM
        let minutesVal = 0;
        if (timeMatch) {
          hours = parseInt(timeMatch[1]);
          minutesVal = parseInt(timeMatch[2]);
          if (timeMatch[3] === 'PM' && hours < 12) hours += 12;
          if (timeMatch[3] === 'AM' && hours === 12) hours = 0;
        }

        const [year, month, day] = dateISO.split('-').map(Number);
        const startDate = new Date(year, month - 1, day, hours, minutesVal);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();

        // Create the calendar block
        await api.createCalendarBlock({
          title: `Focus: ${proposal.title}`,
          starts_at: startISO,
          ends_at: endISO,
          task_id: newTask.id
        });
      } 
      else if (proposal.type === 'task') {
        await api.createTask({
          title: proposal.title,
          priority: 3
        });
      }

      setStatus('success');
      playChime('success');
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      speakText("Action confirmed and executed successfully!");
    } catch (e) {
      console.error(e);
      setStatus('idle');
      speakText("Execution failed. Please try again.");
    }
  };

  const handleCancelProposedAction = () => {
    setStatus('cancelled');
    playChime('cancel');
    speakText("Action cancelled.");
    setTimeout(() => {
      setStatus('idle');
      setProposal(null);
    }, 1500);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Sparkles color="var(--accent-primary)" size={32} /> Conversational Voice Agent
        </h1>
        <p className="text-muted" style={{ marginTop: '6px', fontSize: '15px' }}>
          An intelligent interactive companion. Talk to perform actions, schedule blocks, log habits, and trigger focus timers.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Holographic Microphone Controller */}
        <div className="glass-panel" style={{ 
          padding: '50px 30px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '340px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          
          {/* Animated Glow Rings when listening */}
          {status === 'listening' && (
            <>
              <div style={{ position: 'absolute', width: '220px', height: '220px', borderRadius: '50%', border: '2px solid var(--accent-secondary)', opacity: 0.4, animation: 'pulseGlow 2s infinite ease-in-out' }} />
              <div style={{ position: 'absolute', width: '270px', height: '270px', borderRadius: '50%', border: '1px dashed var(--accent-primary)', opacity: 0.2, animation: 'pulseGlow 3s infinite linear' }} />
            </>
          )}

          {/* Active Proposal Overlay Rings */}
          {status === 'confirming' && (
            <div style={{ position: 'absolute', width: '230px', height: '230px', borderRadius: '50%', background: 'rgba(108, 92, 231, 0.04)', animation: 'pulseGlow 3s infinite ease' }} />
          )}

          {/* Microphone Button */}
          <button 
            onClick={status === 'listening' ? stopListening : startListening}
            disabled={status === 'confirming' || status === 'executing'}
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              border: 'none',
              background: status === 'listening' ? 'var(--accent-warning)' : 'var(--gradient-brand)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2,
              boxShadow: status === 'listening' 
                ? '0 0 25px rgba(255, 118, 117, 0.5)' 
                : '0 8px 25px rgba(88, 70, 224, 0.3)',
              transition: 'var(--transition-smooth)'
            }}
          >
            {status === 'listening' ? <MicOff size={36} /> : <Mic size={36} />}
          </button>

          <h3 style={{ marginTop: '24px', fontWeight: '800', fontSize: '18px', zIndex: 2 }}>
            {status === 'idle' && 'Click microphone to command'}
            {status === 'listening' && 'Listening... say a command!'}
            {status === 'confirming' && 'Confirm action by voice or tap'}
            {status === 'executing' && 'Executing database transactions...'}
            {status === 'success' && '✨ Action Completed Successfully!'}
            {status === 'cancelled' && 'Action Cancelled.'}
          </h3>

          <p className="text-muted" style={{ fontSize: '13px', marginTop: '6px', textAlign: 'center', maxWidth: '400px', zIndex: 2 }}>
            {status === 'listening' && 'Try: "Schedule homework tomorrow at 3 PM" or "Start focus timer"'}
            {status === 'confirming' && 'Say "Yes" / "Okay" or press the button below'}
            {status === 'idle' && (recognitionSupported ? 'Speech recognition engine is ready.' : 'Browser speech unsupported. Press mic to run simulated prompts.')}
          </p>

          {/* Live Transcript Display */}
          {inputText && (
            <div style={{ 
              marginTop: '30px', 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid var(--border-glass)', 
              borderRadius: '12px', 
              padding: '12px 20px', 
              maxWidth: '90%',
              fontSize: '14px',
              fontStyle: 'italic',
              fontWeight: '500',
              textAlign: 'center',
              zIndex: 2
            }}>
              "{inputText}"
            </div>
          )}
        </div>

        {/* Confirmation Panel (Triggered by state proposal) */}
        {status === 'confirming' && proposal && (
          <div className="glass-panel pulse-glow" style={{ padding: '30px', borderLeft: '4px solid var(--accent-primary)', animation: 'slideIn 0.3s ease' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> Proposed Agent Action
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }} className="text-muted">Action Type</span>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '700', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    color: '#fff',
                    background: proposal.type === 'pomodoro' ? 'var(--accent-secondary)' : proposal.type === 'habit' ? 'var(--accent-success)' : 'var(--accent-primary)'
                  }}>
                    {proposal.type.toUpperCase()}
                  </span>
                </div>
                
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{proposal.title}</h4>
                <p className="text-muted" style={{ fontSize: '13px', marginTop: '4px' }}>{proposal.details}</p>
                
                {proposal.time && (
                  <div style={{ display: 'flex', gap: '14px', marginTop: '12px', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                    <div>
                      <span className="text-muted">Day:</span> <strong style={{ color: 'var(--text-primary)' }}>{proposal.date}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Target Time:</span> <strong style={{ color: 'var(--text-primary)' }}>{proposal.time}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Confirmation Controls */}
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" style={{ width: '120px' }} onClick={handleCancelProposedAction}>
                <X size={16} /> Cancel (No)
              </button>
              <button className="btn-premium" style={{ width: '160px' }} onClick={handleExecuteProposedAction}>
                <Check size={16} /> Proceed (Yes)
              </button>
            </div>
            
            <p className="text-muted" style={{ fontSize: '11px', textAlign: 'center', marginTop: '14px', fontStyle: 'italic' }}>
              🎤 Say "Yes" / "Okay" to confirm or "No" to cancel via voice!
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
