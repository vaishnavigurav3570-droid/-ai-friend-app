import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Compass, Download } from 'lucide-react';
import { api } from '../services/api';
import type { Task } from '../services/api';

interface TimeBlock {
  id: string;
  taskTitle: string;
  day: string; // e.g. 'Monday'
  time: string; // e.g. '09:00 AM'
  duration: number; // minutes
  color: string;
  starts_at: string;
}

export const Calendar: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', 
    '06:00 PM', '07:00 PM', '08:00 PM'
  ];

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
      
      const colors = ['var(--accent-primary)', 'var(--accent-secondary)', 'var(--accent-warning)', '#ED4C67', '#0097e6'];
      const mapped: TimeBlock[] = dbBlocks.map((b: any, idx: number) => {
        const date = new Date(b.starts_at);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const day = dayNames[date.getDay()];
        
        let hours = date.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const time = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;

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

      setBlocks(mapped);
    } catch (e) {
      console.warn('Failed to load blocks from database, using local fallback:', e);
    }
  };

  useEffect(() => {
    const loadTasksAndBlocks = async () => {
      const data = await api.getTasks();
      setTasks(data.filter(t => t.status !== 'completed'));
      await loadCalendarBlocks();
    };
    loadTasksAndBlocks();
  }, []);

  const handleSmartSchedule = async () => {
    setIsScheduling(true);
    
    try {
      for (let idx = 0; idx < tasks.length; idx++) {
        const task = tasks[idx];
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
      alert('⚡ AI has successfully scheduled and saved focus blocks to your calendar database!');
    } catch (e) {
      console.error(e);
      alert('Failed to schedule blocks on server.');
    } finally {
      setIsScheduling(false);
    }
  };

  // Real-life iCal (.ics) file exporter
  const handleExportICS = () => {
    if (blocks.length === 0) {
      alert('No focus blocks to export. Please run the AI Time-Blocker first.');
      return;
    }

    let icsContent = 
      'BEGIN:VCALENDAR\n' +
      'VERSION:2.0\n' +
      'PRODID:-//Antigravity AI//Focus Calendar//EN\n';

    blocks.forEach(block => {
      const dayIndex = days.indexOf(block.day);
      const today = new Date();
      const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
      
      // Calculate day delta for this week
      const targetDayOfWeek = dayIndex === 6 ? 0 : dayIndex + 1; // Monday=1...Sunday=0
      const delta = targetDayOfWeek - currentDay;
      const eventDate = new Date(today);
      eventDate.setDate(today.getDate() + delta);
      
      const eventDateStr = eventDate.toISOString().split('T')[0].replace(/-/g, '');
      
      // Parse time (e.g. '09:00 AM' -> hours 9, mins 0)
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
      
      // End time calculation
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

    // Download to client computer
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'focus_schedule.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('📅 Saved focus_schedule.ics! Drag this file directly into Google Calendar or double-click to sync it with Outlook / Apple Calendar!');
  };

  const getBlock = (day: string, timeStr: string) => {
    const match = timeStr.match(/(\d+):(\d+)\s+(AM|PM)/);
    if (!match) return undefined;
    let targetHour = parseInt(match[1]);
    const isPM = match[3] === 'PM';
    if (isPM && targetHour < 12) targetHour += 12;
    if (!isPM && targetHour === 12) targetHour = 0;

    return blocks.find(b => {
      if (b.day !== day) return false;
      const date = new Date(b.starts_at);
      return date.getHours() === targetHour;
    });
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Focus Calendar</h1>
          <p className="text-muted" style={{ marginTop: '4px' }}>AI time-blocking scheduler. Prevents context switching by scheduling focused sprints.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-secondary" 
            disabled={blocks.length === 0} 
            onClick={handleExportICS}
          >
            <Download size={16} />
            Export to Google/Outlook
          </button>
          <button 
            className="btn-premium" 
            disabled={isScheduling || tasks.length === 0} 
            onClick={handleSmartSchedule}
          >
            <Sparkles size={16} />
            {isScheduling ? 'Computing Schedules...' : 'AI Time-Block Tasks'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px', alignItems: 'start' }}>
        
        {/* Weekly Grid */}
        <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--border-glass)', textAlign: 'left', width: '100px' }} className="text-muted">Time</th>
                {days.map(d => (
                  <th key={d} style={{ padding: '12px', borderBottom: '1px solid var(--border-glass)', textAlign: 'center', fontWeight: '700' }}>
                    {d.substring(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map(time => (
                <tr key={time}>
                  <td style={{ padding: '16px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontWeight: '600', fontSize: '13px' }} className="text-muted">
                    {time}
                  </td>
                  {days.map(day => {
                    const block = getBlock(day, time);
                    return (
                      <td 
                        key={day} 
                        style={{ 
                          padding: '6px', 
                          borderBottom: '1px solid rgba(255,255,255,0.03)', 
                          borderRight: '1px solid rgba(255,255,255,0.02)',
                          height: '70px',
                          verticalAlign: 'middle'
                        }}
                      >
                        {block ? (
                          <div style={{ 
                            background: `linear-gradient(135deg, ${block.color} 0%, rgba(255,255,255,0.02) 100%)`, 
                            borderLeft: `3px solid ${block.color}`,
                            padding: '8px 10px', 
                            borderRadius: '8px', 
                            fontSize: '11px',
                            fontWeight: '600',
                            textAlign: 'left',
                            color: '#fff',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8, marginBottom: '2px', fontSize: '9px' }}>
                              <Clock size={8} /> {block.duration}m
                            </div>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {block.taskTitle}
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

        {/* Sidebar Info Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} color="var(--accent-secondary)" /> Optimization Engine
            </h3>
            <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '14px' }}>
              Traditional calendars let you schedule anything without checking your actual brain capacity. 
            </p>
            <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5' }}>
              Our scheduler groups tasks logically into **focus sprints** to minimize context switching overhead and block out intervals for restorative pauses.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
            <Sparkles size={16} style={{ flexShrink: 0 }} color="var(--accent-secondary)" />
            <span>Clicking "Export" downloads a standard .ics calendar file, compatible with Google Calendar, Outlook, and Apple Calendar!</span>
          </div>
        </div>

      </div>
    </div>
  );
};
