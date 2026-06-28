import React, { useState, useEffect, useRef } from 'react';
import { Clock, ShieldAlert, Sparkles, Download, Calendar as CalendarIcon, Mic, MicOff, Check, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { Task } from '../services/api';
import confettiRain from 'canvas-confetti';

interface DashboardProps {
  tokens: number;
  onRefreshTokens: () => void;
}

interface TimeBlock {
  id: string;
  taskTitle: string;
  day: string; // e.g. 'Monday'
  time: string; // e.g. '09:00 AM'
  duration: number; // minutes
  color: string;
  starts_at: string;
}

interface ProposedAction {
  type: 'pomodoro' | 'habit' | 'schedule' | 'task';
  title: string;
  details?: string;
  time?: string;
  date?: string;
  metadata?: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ tokens, onRefreshTokens }) => {
  // Focus Timer States (kept in background for visibility penalties)
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Distraction Shield States (Hosts Blocking)
  const [isPermissionGranted, setIsPermissionGranted] = useState(() => {
    return localStorage.getItem('ag_shield_permission') === 'granted';
  });
  const [blockedApps, setBlockedApps] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('ag_blocked_apps') || '["YouTube", "Twitter"]');
  });
  const [hostsBlocked, setHostsBlocked] = useState(false);
  const [hostsError, setHostsError] = useState<string | null>(null);

  // Calendar States
  const [calendarTasks, setCalendarTasks] = useState<Task[]>([]);
  const [calendarBlocks, setCalendarBlocks] = useState<TimeBlock[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', 
    '06:00 PM', '07:00 PM', '08:00 PM'
  ];

  // Voice Assistant States
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'confirming' | 'executing' | 'success' | 'cancelled'>('idle');
  const [voiceInput, setVoiceInput] = useState('');
  const [voiceProposal, setVoiceProposal] = useState<ProposedAction | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  // Load calendar blocks from backend
  const loadCalendarBlocks = async () => {
    try {
      const today = new Date();
      const currentDay = today.getDay();
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);
      monday.setHours(0,0,0,0);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23,59,59,999);

      const dbBlocks = await api.getCalendarBlocks(monday.toISOString(), sunday.toISOString());
      
      const colors = ['#1A73E8', '#34A853', '#EA4335', '#FBBC05', '#6C5CE7'];
      const mapped: TimeBlock[] = dbBlocks.map((b: any, idx: number) => {
        const date = new Date(b.starts_at);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const day = dayNames[date.getDay()];
        
        let hours = date.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minutesVal = date.getMinutes().toString().padStart(2, '0');
        const time = `${hours.toString().padStart(2, '0')}:${minutesVal} ${ampm}`;

        const diffMs = new Date(b.ends_at).getTime() - date.getTime();
        const duration = Math.round(diffMs / 60000);

        return {
          id: b.id,
          taskTitle: b.title,
          day,
          time,
          duration,
          color: colors[idx % colors.length],
          starts_at: b.starts_at
        };
      });

      setCalendarBlocks(mapped);
    } catch (e) {
      console.warn('Failed to load blocks from database:', e);
    }
  };

  // Sync hosts file block list with backend
  const syncHostsBlocker = async (enabled: boolean, appsToBlock: string[]) => {
    setHostsError(null);
    try {
      const res = await api.toggleShield(enabled, appsToBlock);
      if (res.success) {
        setHostsBlocked(enabled);
      } else if (res.permissionRequired) {
        setHostsError("⚠️ Permission Denied: Run App terminal cmd as Administrator to modify system hosts file!");
        setHostsBlocked(false);
      } else {
        setHostsError(`⚠️ Blocker Error: ${res.error || 'Server error'}`);
        setHostsBlocked(false);
      }
    } catch (e) {
      console.warn("Hosts sync failed:", e);
    }
  };

  // Initialize Speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceInput(transcript);
        handleProcessSpeech(transcript);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setVoiceStatus('idle');
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Load tasks and calendar blocks
  useEffect(() => {
    const loadCalendar = async () => {
      try {
        const t = await api.getTasks();
        setCalendarTasks(t.filter(task => task.status !== 'completed'));
      } catch (err) {
        console.warn('Failed to load tasks:', err);
      }
      await loadCalendarBlocks();
    };
    loadCalendar();
  }, [tokens]);

  // Tab switcher visibility protection
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && isActive) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(660, audioCtx.currentTime); 
          gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.4);
        } catch (e) {
          console.error(e);
        }

        await api.updateTokens(-5, 'Breached focus shield - switched tabs');
        onRefreshTokens();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, onRefreshTokens]);

  // Pomodoro Timer logic
  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (seconds === 0) {
          if (minutes === 0) {
            handleTimerComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, minutes, seconds]);

  const handleTimerComplete = async () => {
    setIsActive(false);
    setMinutes(25);
    setSeconds(0);
    setFocusMode(false);
    
    confettiRain({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });

    await api.updateTokens(15, 'Completed 25-minute Pomodoro focus session');
    onRefreshTokens();

    alert('🎉 Excellent focus! You earned 15 Focus Tokens.');
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
    if (!isActive) setFocusMode(true);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMinutes(25);
    setSeconds(0);
    setFocusMode(false);
  };

  // Toggle hosts blocker permission
  const handleTogglePermission = async () => {
    if (!isPermissionGranted) {
      const allow = window.confirm(
        "🛡️ SYSTEM ACCESS REQUEST:\n\nAntigravity requires system overlay / drawing permissions to configure hosts blockers. Allow?"
      );
      if (allow) {
        setIsPermissionGranted(true);
        localStorage.setItem('ag_shield_permission', 'granted');
        await syncHostsBlocker(true, blockedApps);
      }
    } else {
      setIsPermissionGranted(false);
      localStorage.setItem('ag_shield_permission', 'denied');
      await syncHostsBlocker(false, []);
    }
  };

  const handleToggleAppBlock = async (app: string) => {
    let next: string[] = [];
    if (blockedApps.includes(app)) {
      next = blockedApps.filter(a => a !== app);
    } else {
      next = [...blockedApps, app];
    }
    setBlockedApps(next);
    localStorage.setItem('ag_blocked_apps', JSON.stringify(next));
    if (isPermissionGranted) {
      await syncHostsBlocker(true, next);
    }
  };

  // Speaks output text back using browser speech synthesis
  const speakText = (text: string, callback?: () => void) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
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
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(392.00, ctx.currentTime);
        osc.frequency.setValueAtTime(329.63, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const listenForConfirmation = () => {
    if (!recognitionRef.current) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const confirmRec = new SpeechRecognition();
    confirmRec.continuous = false;
    confirmRec.lang = 'en-US';

    confirmRec.onresult = (event: any) => {
      const response = event.results[0][0].transcript.toLowerCase();
      if (response.includes('yes') || response.includes('okay') || response.includes('proceed') || response.includes('sure') || response.includes('confirm')) {
        handleExecuteProposedAction();
      } else if (response.includes('no') || response.includes('cancel') || response.includes('stop') || response.includes('never mind')) {
        handleCancelProposedAction();
      } else {
        speakText("I didn't catch that. Please click confirm or cancel.");
      }
    };

    try {
      confirmRec.start();
    } catch (e) {
      console.warn(e);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setVoiceProposal(null);
      setVoiceInput('');
      setVoiceStatus('listening');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    } else {
      setVoiceStatus('listening');
      setVoiceInput('');
      setTimeout(() => {
        const simulatedInputs = [
          "Schedule water focus block tomorrow at 3 PM",
          "Schedule study chemistry session today at 11 AM",
        ];
        const randomSim = simulatedInputs[Math.floor(Math.random() * simulatedInputs.length)];
        setVoiceInput(randomSim);
        handleProcessSpeech(randomSim);
      }, 2500);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error(err);
      }
    }
    setVoiceStatus('idle');
  };

  // Process speech and extract intent
  const handleProcessSpeech = async (text: string) => {
    setVoiceStatus('confirming');
    const cleanText = text.toLowerCase().trim();

    // 1. Pomodoro
    if (cleanText.includes('pomodoro') || cleanText.includes('timer') || cleanText.includes('focus')) {
      const prop: ProposedAction = {
        type: 'pomodoro',
        title: 'Start Pomodoro Session',
        details: 'Engage Tab Focus Shield and activate 25-minute Pomodoro timer.'
      };
      setVoiceProposal(prop);
      speakText("I detected a request to start a Pomodoro timer. Should I engage the Focus Shield now?", listenForConfirmation);
      return;
    }

    // 2. Calendar scheduling intent (Voice calendar block scheduling!)
    if (cleanText.includes('schedule') || cleanText.includes('at') || cleanText.includes('pm') || cleanText.includes('am')) {
      let title = text.replace(/schedule|at|pm|am|tomorrow|tonight|today|meeting|session/gi, '').trim();
      if (!title) title = "Focus Sprint Session";
      
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
      setVoiceProposal(prop);
      speakText(`I detected you want to schedule focus block "${prop.title}" for ${prop.date} at ${prop.time}. Should I add this to your calendar?`, listenForConfirmation);
      return;
    }

    // Default task creation
    let taskTitle = text.replace(/create task|add task|assign task|create|add/gi, '').trim();
    if (!taskTitle) taskTitle = text;

    const prop: ProposedAction = {
      type: 'task',
      title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
      details: 'Add task directly to backlog with medium priority.'
    };
    setVoiceProposal(prop);
    speakText(`Should I add task "${prop.title}" to your backlog?`, listenForConfirmation);
  };

  const handleExecuteProposedAction = async () => {
    if (!voiceProposal) return;
    setVoiceStatus('executing');

    try {
      if (voiceProposal.type === 'pomodoro') {
        localStorage.setItem('ag_trigger_timer', 'true');
        window.dispatchEvent(new Event('storage'));
      } 
      else if (voiceProposal.type === 'schedule') {
        // Create task
        const newTask = await api.createTask({
          title: voiceProposal.title,
          priority: 4,
          estimated_minutes: 45
        });

        // Parse target times
        const dateISO = voiceProposal.metadata?.dateISO || new Date().toISOString().split('T')[0];
        const timeMatch = voiceProposal.time?.match(/(\d+):(\d+)\s+(AM|PM)/);
        let hours = 14; 
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

        // Create block in DB
        await api.createCalendarBlock({
          title: `Focus: ${voiceProposal.title}`,
          starts_at: startISO,
          ends_at: endISO,
          task_id: newTask.id
        });

        // REFRESH CALENDAR BLOCKS IMMEDIATELY FOR INSTANT DISPLAY!
        await loadCalendarBlocks();
      } 
      else if (voiceProposal.type === 'task') {
        await api.createTask({
          title: voiceProposal.title,
          priority: 3
        });
      }

      setVoiceStatus('success');
      playChime('success');
      confettiRain({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      speakText("Action confirmed and executed successfully!");
      setVoiceProposal(null);
    } catch (e) {
      console.error(e);
      setVoiceStatus('idle');
      speakText("Execution failed. Please try again.");
    }
  };

  const handleCancelProposedAction = () => {
    setVoiceStatus('cancelled');
    playChime('cancel');
    speakText("Action cancelled.");
    setTimeout(() => {
      setVoiceStatus('idle');
      setVoiceProposal(null);
    }, 1500);
  };

  // AI Smart scheduling directly on the dashboard calendar
  const handleSmartSchedule = async () => {
    if (calendarTasks.length === 0) {
      alert('No pending tasks to schedule. Create some tasks in the matrix first!');
      return;
    }

    setIsScheduling(true);
    try {
      for (let idx = 0; idx < calendarTasks.length; idx++) {
        const task = calendarTasks[idx];
        const dayName = days[idx % days.length];
        const timeName = times[Math.min(idx, times.length - 1)];
        
        const dayIndex = days.indexOf(dayName);
        const today = new Date();
        const currentDay = today.getDay();
        const targetDayOfWeek = dayIndex === 6 ? 0 : dayIndex + 1;
        const delta = targetDayOfWeek - currentDay;
        const eventDate = new Date(today);
        eventDate.setDate(today.getDate() + delta);
        
        const timeMatch = timeName.match(/(\d+):(\d+)\s+(AM|PM)/);
        let hours = 9;
        if (timeMatch) {
          hours = parseInt(timeMatch[1]);
          if (timeMatch[3] === 'PM' && hours < 12) hours += 12;
          if (timeMatch[3] === 'AM' && hours === 12) hours = 0;
        }

        eventDate.setHours(hours, 0, 0, 0);
        const startISO = eventDate.toISOString();
        
        const endEventDate = new Date(eventDate);
        endEventDate.setMinutes(endEventDate.getMinutes() + (task.estimated_minutes || 45));
        const endISO = endEventDate.toISOString();

        await api.createCalendarBlock({
          title: `Focus: ${task.title}`,
          starts_at: startISO,
          ends_at: endISO,
          task_id: task.id
        });
      }

      await loadCalendarBlocks();
      confettiRain({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.8 }
      });
      alert('⚡ AI has successfully scheduled and saved focus blocks to your calendar database!');
    } catch (e) {
      console.error(e);
      alert('Failed to schedule blocks on server.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleExportICS = () => {
    if (calendarBlocks.length === 0) {
      alert('No focus blocks to export. Run the AI Time-Blocker first.');
      return;
    }

    let icsContent = 
      'BEGIN:VCALENDAR\n' +
      'VERSION:2.0\n' +
      'PRODID:-//Antigravity AI//Focus Calendar//EN\n';

    calendarBlocks.forEach(block => {
      const dayIndex = days.indexOf(block.day);
      const today = new Date();
      const currentDay = today.getDay();
      
      const targetDayOfWeek = dayIndex === 6 ? 0 : dayIndex + 1;
      const delta = targetDayOfWeek - currentDay;
      const eventDate = new Date(today);
      eventDate.setDate(today.getDate() + delta);
      
      const eventDateStr = eventDate.toISOString().split('T')[0].replace(/-/g, '');
      
      const timeMatch = block.time.match(/(\d+):(\d+)\s+(AM|PM)/);
      let hours = 9;
      let minutesVal = 0;
      if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        minutesVal = parseInt(timeMatch[2]);
        const isPM = timeMatch[3] === 'PM';
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
      }

      const startHourStr = hours.toString().padStart(2, '0');
      const startMinStr = minutesVal.toString().padStart(2, '0');
      
      const endHours = Math.floor((hours * 60 + minutesVal + block.duration) / 60);
      const endMins = (hours * 60 + minutesVal + block.duration) % 60;
      const endHourStr = endHours.toString().padStart(2, '0');
      const endMinStr = endMins.toString().padStart(2, '0');

      icsContent += 
        'BEGIN:VEVENT\n' +
        `SUMMARY:Focus Block: ${block.taskTitle}\n` +
        `DTSTART:${eventDateStr}T${startHourStr}${startMinStr}00\n` +
        `DTEND:${eventDateStr}T${endHourStr}${endMinStr}00\n` +
        `DESCRIPTION:Focused sprint block generated by Antigravity AI.\n` +
        'STATUS:CONFIRMED\n' +
        'END:VEVENT\n';
    });

    icsContent += 'END:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'focus_schedule.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('📅 Saved focus_schedule.ics! Drag this file directly into Google Calendar or double-click to sync it!');
  };

  const getBlock = (day: string, timeStr: string) => {
    const match = timeStr.match(/(\d+):(\d+)\s+(AM|PM)/);
    if (!match) return undefined;
    let targetHour = parseInt(match[1]);
    const isPM = match[3] === 'PM';
    if (isPM && targetHour < 12) targetHour += 12;
    if (!isPM && targetHour === 12) targetHour = 0;

    return calendarBlocks.find(b => {
      if (b.day !== day) return false;
      const date = new Date(b.starts_at);
      return date.getHours() === targetHour;
    });
  };

  const formatTime = (m: number, s: number) => {
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Welcome Workspace Banner */}
      <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#202124', letterSpacing: '-0.5px' }}>
          Workspace Workspace Space
        </h1>
        <p className="text-muted" style={{ fontSize: '14px', color: '#5F6368', marginTop: '2px' }}>
          Use the AI Voice assistant to add scheduled tasks natively in the calendar.
        </p>
      </div>

      {/* Main Reshaped Layout: Calendar Hero on Left (70%), Sidebar Controls on Right (30%) */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Hero Focus Calendar */}
        <div style={{ 
          background: '#FFF', 
          border: '1px solid #DADCE0', 
          borderTop: '6px solid #1A73E8', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1A73E8', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={18} /> Focus Calendar Schedule
            </h2>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleExportICS}
                disabled={calendarBlocks.length === 0}
                style={{
                  background: '#F1F3F4',
                  color: '#3C4043',
                  border: '1px solid #DADCE0',
                  borderRadius: '16px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={14} /> Export Cal
              </button>
              <button 
                onClick={handleSmartSchedule}
                disabled={isScheduling || calendarTasks.length === 0}
                style={{
                  background: '#1A73E8',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={14} /> {isScheduling ? 'Scheduling...' : 'AI Time-Block'}
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px', borderBottom: '1px solid #E8EAED', textAlign: 'left', width: '90px', fontSize: '12px', color: '#70757A' }}>Time</th>
                  {days.map(d => (
                    <th key={d} style={{ padding: '10px', borderBottom: '1px solid #E8EAED', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#202124' }}>
                      {d.substring(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {times.map(time => (
                  <tr key={time}>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #E8EAED', fontSize: '11px', fontWeight: '700', color: '#70757A' }}>{time}</td>
                    {days.map(day => {
                      const block = getBlock(day, time);
                      return (
                        <td key={day} style={{ 
                          padding: '4px', 
                          border: '1px solid #E8EAED', 
                          height: '60px', 
                          verticalAlign: 'top',
                          width: '14%'
                        }}>
                          {block ? (
                            <div style={{
                              background: 'rgba(26,115,232,0.08)',
                              borderLeft: `4px solid ${block.color}`,
                              borderRadius: '4px',
                              padding: '6px',
                              height: '100%',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#1A73E8',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'normal',
                              lineHeight: '1.2'
                            }} title={block.taskTitle}>
                              {block.taskTitle.replace('Focus: ', '')}
                              <div style={{ fontSize: '9px', color: '#5F6368', marginTop: '2px' }}>
                                {block.duration}m
                              </div>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Widgets (Voice Assistant & Blocker) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Widget 1: Google Voice Assistant (Hero Integration!) */}
          <div style={{ 
            background: '#FFF', 
            border: '1px solid #DADCE0', 
            borderTop: '6px solid #1A73E8', 
            borderRadius: '12px', 
            padding: '20px',
            boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3)'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1A73E8', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mic size={18} /> AI Voice Assistant
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '10px 0' }}>
              <button 
                onClick={voiceStatus === 'listening' ? stopListening : startListening}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: voiceStatus === 'listening' ? '#EA4335' : '#1A73E8',
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  transition: 'background-color 0.3s'
                }}
              >
                {voiceStatus === 'listening' ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              <span style={{ fontSize: '13px', fontWeight: '700', color: '#5F6368' }}>
                {voiceStatus === 'idle' && 'Click Mic to assign a task'}
                {voiceStatus === 'listening' && 'Listening... Speak now'}
                {voiceStatus === 'confirming' && 'Confirming intent...'}
                {voiceStatus === 'executing' && 'Executing task schedule...'}
                {voiceStatus === 'success' && 'Confirmed!'}
              </span>

              {voiceInput && (
                <div style={{ background: '#F1F3F4', borderRadius: '8px', padding: '10px', width: '100%', fontSize: '12px', color: '#3C4043', fontStyle: 'italic', textAlign: 'center' }}>
                  "{voiceInput}"
                </div>
              )}

              {/* Proposal Confirmation Loop */}
              {voiceStatus === 'confirming' && voiceProposal && (
                <div style={{ background: '#E8F0FE', border: '1px solid #1A73E8', borderRadius: '8px', padding: '12px', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#1A73E8' }}>Proposal: {voiceProposal.title}</span>
                  <p style={{ fontSize: '11px', color: '#5F6368' }}>{voiceProposal.details}</p>
                  
                  {voiceProposal.time && (
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#3C4043' }}>
                      Time: {voiceProposal.date} at {voiceProposal.time}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button 
                      onClick={handleExecuteProposedAction}
                      style={{ flex: 1, background: '#1A73E8', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 0', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <Check size={12} /> Confirm
                    </button>
                    <button 
                      onClick={handleCancelProposedAction}
                      style={{ flex: 1, background: '#FFF', border: '1px solid #DADCE0', color: '#5F6368', borderRadius: '4px', padding: '4px 0', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Widget 2: Local hosts website blocker controls */}
          <div style={{ 
            background: '#FFF', 
            border: '1px solid #DADCE0', 
            borderTop: '6px solid #EA4335', 
            borderRadius: '12px', 
            padding: '20px',
            boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3)'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#EA4335', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} /> OS website Blocker
            </h3>

            {/* Toggle Switch */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FDF2F2', padding: '8px 12px', borderRadius: '6px', border: '1px solid #FAD2D2', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#C53030' }}>System Redirect Block</span>
              <button 
                onClick={handleTogglePermission}
                style={{ 
                  background: isPermissionGranted && hostsBlocked ? '#34A853' : '#EA4335', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '4px', 
                  padding: '4px 10px', 
                  fontSize: '11px', 
                  fontWeight: '700', 
                  cursor: 'pointer' 
                }}
              >
                {hostsBlocked ? "Blocked" : "Block"}
              </button>
            </div>

            {/* Apps to block checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#70757A', textTransform: 'uppercase' }}>Domains blocked</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {['YouTube', 'Twitter', 'Instagram'].map(app => (
                  <label key={app} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={blockedApps.includes(app)}
                      onChange={() => handleToggleAppBlock(app)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{app}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Admin Privilege Alerts */}
            {hostsError && (
              <div style={{ marginTop: '12px', background: '#FFF3F3', border: '1px solid #FACDCD', borderRadius: '8px', padding: '10px', display: 'flex', gap: '6px' }}>
                <AlertCircle size={14} color="#EA4335" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '11px', color: '#C53030', lineHeight: '1.3' }}>{hostsError}</p>
              </div>
            )}
          </div>

          {/* Widget 3: Pomodoro Focus Timer */}
          <div style={{ 
            background: '#FFF', 
            border: '1px solid #DADCE0', 
            borderTop: '6px solid #34A853', 
            borderRadius: '12px', 
            padding: '20px',
            boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3)'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#34A853', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} /> Focus Sprint Timer
            </h3>
            
            <div style={{ display: 'flex', justifyItems: 'center', alignItems: 'center', gap: '14px' }}>
              <strong style={{ fontSize: '24px', color: '#202124' }}>{formatTime(minutes, seconds)}</strong>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={toggleTimer}
                  style={{ background: '#34A853', color: '#FFF', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {isActive ? 'Pause' : 'Start'}
                </button>
                <button 
                  onClick={resetTimer}
                  style={{ background: '#F1F3F4', border: '1px solid #DADCE0', color: '#5F6368', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Reset
                </button>
              </div>
            </div>
            
            {focusMode && (
              <p style={{ fontSize: '11px', color: '#EA4335', marginTop: '6px', fontWeight: 'bold' }}>
                ⚠️ Switching tabs will penalize you -5 Focus Tokens!
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
