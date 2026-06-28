import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Brain } from 'lucide-react';

interface Message {
  sender: 'user' | 'gemini';
  text: string;
  time: string;
}

export const GeminiAnalyst: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'gemini', text: "Hello! I am your Gemini Focus Companion. I analyze your daily habits, task breakdown structure, and focus history. Ask me how to optimize your day, schedule tasks, or overcome procrastination!", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Connect to the Express backend AI runner
      const res = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text })
      });
      
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      const geminiMsg: Message = {
        sender: 'gemini',
        text: data.reply || "I analyzed your focus history. Let's make sure we schedule short breaks after heavy Pomodoro sessions to maintain a high cognitive charge.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, geminiMsg]);
    } catch {
      // Fallback AI Response if local backend is offline / API key not set
      setTimeout(() => {
        const fallbackReplies = [
          "Looking at your tasks, you have some high priority items. I recommend breaking them down using the AI Split button in the Tasks board to tackle them step-by-step.",
          "Great job logging your habits today! Maintaining a consistent daily streak is key to automating your productivity loops.",
          "Remember that Focus Tokens are meant to be spent! Spending 30 FT on a video game break guilt-free actually improves long-term task retention compared to working exhausted.",
          "Based on cognitive loading rules, you should try a 'Focus Sprint': 25 minutes of silent work, followed by a 5-minute break in the Token Shop.",
          "I suggest grouping similar tags together. Grouping 'Design' tasks and doing them sequentially reduces cognitive context-switching overhead."
        ];
        const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
        
        const geminiMsg: Message = {
          sender: 'gemini',
          text: randomReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, geminiMsg]);
      }, 1000);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ background: 'var(--gradient-brand)', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow-purple)' }}>
          <Brain size={24} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Gemini Focus Analyst</h1>
          <p className="text-muted" style={{ fontSize: '14px', marginTop: '2px' }}>Your AI companion powered by Google Gemini to analyze your goals and focus.</p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '350px' }}>
        
        {/* Messages Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              {msg.sender === 'gemini' && (
                <div style={{ background: 'rgba(108, 92, 231, 0.15)', border: '1px solid var(--border-focus)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={16} color="var(--accent-secondary)" />
                </div>
              )}
              
              <div style={{ 
                maxWidth: '70%', 
                background: msg.sender === 'user' ? 'var(--gradient-brand)' : 'rgba(255,255,255,0.03)',
                border: msg.sender === 'user' ? 'none' : '1px solid var(--border-glass)',
                borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '14px 20px',
                boxShadow: msg.sender === 'user' ? '0 4px 15px rgba(108, 92, 231, 0.3)' : 'none'
              }}>
                <p style={{ fontSize: '15px', color: '#fff', lineHeight: '1.5', whiteSpace: 'pre-line' }}>{msg.text}</p>
                <span style={{ display: 'block', fontSize: '10px', marginTop: '6px', textAlign: 'right', color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                  {msg.time}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={16} color="var(--text-primary)" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px' }}>
              <Sparkles size={16} color="var(--accent-secondary)" style={{ animation: 'spin 2s linear infinite' }} />
              <span className="text-muted" style={{ fontSize: '13px' }}>Gemini is thinking...</span>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} style={{ borderTop: '1px solid var(--border-glass)', padding: '16px 24px', display: 'flex', gap: '14px', background: 'rgba(0,0,0,0.1)' }}>
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask Gemini for productivity coaching..."
            style={{ 
              flex: 1, 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid var(--border-glass)', 
              borderRadius: '12px', 
              padding: '14px 20px', 
              color: '#fff', 
              fontSize: '15px', 
              outline: 'none',
              transition: 'var(--transition-fast)'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-glass)'}
          />
          <button type="submit" className="btn-premium" style={{ borderRadius: '12px', padding: '14px 24px' }}>
            <Send size={18} />
            Send
          </button>
        </form>

      </div>
    </div>
  );
};
