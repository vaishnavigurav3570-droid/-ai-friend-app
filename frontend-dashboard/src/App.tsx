import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  ShoppingBag, 
  Sparkles, 
  Coins, 
  BrainCircuit, 
  Mic, 
  Terminal, 
  Sun, 
  Moon,
  Menu,
  Search,
  Settings,
  HelpCircle
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import { Calendar } from './components/Calendar';
import { VoiceDump } from './components/VoiceDump';
import { AgentRunner } from './components/AgentRunner';
import { Shop } from './components/Shop';
import { GeminiAnalyst } from './components/GeminiAnalyst';
import { api } from './services/api';

function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'matrix' | 'calendar' | 'voice' | 'agent' | 'shop' | 'analyst'>('dashboard');
  const [tokens, setTokens] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('ag_theme') as 'dark' | 'light') || 'light';
  });

  const refreshTokens = async () => {
    setIsSyncing(true);
    const balance = await api.getTokens();
    setTokens(balance);
    setIsSyncing(false);
  };

  useEffect(() => {
    refreshTokens();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ag_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const renderTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard tokens={tokens} onRefreshTokens={refreshTokens} />;
      case 'matrix':
        return <EisenhowerMatrix onRefreshTokens={refreshTokens} />;
      case 'calendar':
        return <Calendar />;
      case 'voice':
        return <VoiceDump />;
      case 'agent':
        return <AgentRunner />;
      case 'shop':
        return <Shop tokens={tokens} onRefreshTokens={refreshTokens} />;
      case 'analyst':
        return <GeminiAnalyst />;
      default:
        return <Dashboard tokens={tokens} onRefreshTokens={refreshTokens} />;
    }
  };

  return (
    <div className="app-container" style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: "'Outfit', Roboto, Arial, sans-serif"
    }}>
      
      {/* Google Products Top App Bar (Header) */}
      <header style={{
        height: '64px',
        borderBottom: '1px solid var(--border-glass)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 10,
        position: 'sticky',
        top: 0,
        boxShadow: '0 1px 2px 0 rgba(60,64,67,0.05)'
      }}>
        {/* Logo & Collapse menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: '50%',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Menu size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              background: 'var(--gradient-brand)', 
              borderRadius: '8px', 
              padding: '6px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <span style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              fontFamily: "'Product Sans', 'Outfit', sans-serif", 
              letterSpacing: '-0.3px',
              color: 'var(--text-primary)'
            }}>
              Antigravity
            </span>
          </div>
        </div>

        {/* Google Style Central Search Bar */}
        <div style={{ 
          flex: 1, 
          maxWidth: '720px', 
          margin: '0 30px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div style={{
            position: 'absolute',
            left: '16px',
            color: 'var(--text-secondary)',
            pointerEvents: 'none'
          }}>
            <Search size={18} />
          </div>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, calendar schedules, or focus habits..."
            style={{
              width: '100%',
              height: '46px',
              background: theme === 'light' ? '#F1F3F4' : 'rgba(255,255,255,0.03)',
              border: 'none',
              borderRadius: '24px',
              padding: '0 16px 0 48px',
              fontSize: '15px',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'background-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'light' ? '#FFF' : 'rgba(255,255,255,0.06)';
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(60,64,67,0.2), 0 4px 8px 3px rgba(60,64,67,0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'light' ? '#F1F3F4' : 'rgba(255,255,255,0.03)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          
          {/* Token Indicator Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-active-tab)',
            border: '1px solid var(--border-glass)',
            borderRadius: '20px',
            padding: '6px 14px',
            fontWeight: '700',
            fontSize: '14px',
            color: 'var(--accent-primary)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <Coins size={14} className={isSyncing ? 'spin' : ''} />
            <span>{tokens} FT</span>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-glass)',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <HelpCircle size={20} className="text-secondary" style={{ cursor: 'pointer' }} />
          <Settings size={20} className="text-secondary" style={{ cursor: 'pointer' }} />

          {/* Google Account Profile Circle */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1A73E8 0%, #34A853 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '13px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            V
          </div>

        </div>
      </header>

      {/* Main Container Layout */}
      <div style={{ display: 'flex', flex: 1 }}>
        
        {/* Google Products Sidebar Navigation */}
        <aside style={{ 
          width: isSidebarCollapsed ? '72px' : '256px', 
          borderRight: '1px solid var(--border-glass)', 
          background: 'var(--bg-secondary)',
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          padding: '16px 12px',
          flexShrink: 0,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            
            <button 
              onClick={() => setCurrentTab('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                background: currentTab === 'dashboard' ? 'var(--bg-active-tab)' : 'transparent',
                border: 'none',
                borderRadius: '24px',
                color: currentTab === 'dashboard' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                padding: '12px 18px',
                cursor: 'pointer',
                fontWeight: currentTab === 'dashboard' ? '700' : '500',
                fontSize: '14px',
                transition: 'var(--transition-fast)',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                position: 'relative'
              }}
              title="Dashboard"
            >
              <LayoutDashboard size={20} color={currentTab === 'dashboard' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
              {!isSidebarCollapsed && <span>Dashboard</span>}
            </button>

            <button 
              onClick={() => setCurrentTab('matrix')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                background: currentTab === 'matrix' ? 'var(--bg-active-tab)' : 'transparent',
                border: 'none',
                borderRadius: '24px',
                color: currentTab === 'matrix' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                padding: '12px 18px',
                cursor: 'pointer',
                fontWeight: currentTab === 'matrix' ? '700' : '500',
                fontSize: '14px',
                transition: 'var(--transition-fast)',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start'
              }}
              title="Priority Matrix"
            >
              <CheckSquare size={20} color={currentTab === 'matrix' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
              {!isSidebarCollapsed && <span>Priority Matrix</span>}
            </button>

            <button 
              onClick={() => setCurrentTab('voice')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                background: currentTab === 'voice' ? 'var(--bg-active-tab)' : 'transparent',
                border: 'none',
                borderRadius: '24px',
                color: currentTab === 'voice' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                padding: '12px 18px',
                cursor: 'pointer',
                fontWeight: currentTab === 'voice' ? '700' : '500',
                fontSize: '14px',
                transition: 'var(--transition-fast)',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start'
              }}
              title="Conversational Voice Agent"
            >
              <Mic size={20} color={currentTab === 'voice' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
              {!isSidebarCollapsed && <span>Voice Assistant</span>}
            </button>

            <button 
              onClick={() => setCurrentTab('agent')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                background: currentTab === 'agent' ? 'var(--bg-active-tab)' : 'transparent',
                border: 'none',
                borderRadius: '24px',
                color: currentTab === 'agent' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                padding: '12px 18px',
                cursor: 'pointer',
                fontWeight: currentTab === 'agent' ? '700' : '500',
                fontSize: '14px',
                transition: 'var(--transition-fast)',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start'
              }}
              title="Task Agent"
            >
              <Terminal size={20} color={currentTab === 'agent' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
              {!isSidebarCollapsed && <span>Task Agent</span>}
            </button>

            <button 
              onClick={() => setCurrentTab('shop')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                background: currentTab === 'shop' ? 'var(--bg-active-tab)' : 'transparent',
                border: 'none',
                borderRadius: '24px',
                color: currentTab === 'shop' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                padding: '12px 18px',
                cursor: 'pointer',
                fontWeight: currentTab === 'shop' ? '700' : '500',
                fontSize: '14px',
                transition: 'var(--transition-fast)',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start'
              }}
              title="Shop"
            >
              <ShoppingBag size={20} color={currentTab === 'shop' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
              {!isSidebarCollapsed && <span>Shop</span>}
            </button>

            <button 
              onClick={() => setCurrentTab('analyst')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                background: currentTab === 'analyst' ? 'var(--bg-active-tab)' : 'transparent',
                border: 'none',
                borderRadius: '24px',
                color: currentTab === 'analyst' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                padding: '12px 18px',
                cursor: 'pointer',
                fontWeight: currentTab === 'analyst' ? '700' : '500',
                fontSize: '14px',
                transition: 'var(--transition-fast)',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start'
              }}
              title="Focus Analyst"
            >
              <BrainCircuit size={20} color={currentTab === 'analyst' ? 'var(--accent-secondary)' : 'var(--text-secondary)'} />
              {!isSidebarCollapsed && <span>Focus Analyst</span>}
            </button>

          </div>

          {/* Sidebar Footer */}
          {!isSidebarCollapsed && (
            <div style={{ 
              padding: '12px', 
              fontSize: '11px', 
              textAlign: 'center',
              borderTop: '1px solid var(--border-glass)'
            }} className="text-muted">
              Google Workspace Partner
            </div>
          )}
        </aside>

        {/* Main Content Workspace Area */}
        <main style={{ 
          flex: 1, 
          overflowY: 'auto', 
          maxHeight: 'calc(100vh - 64px)', 
          background: 'var(--bg-primary)',
          transition: 'background-color 0.4s ease'
        }}>
          {renderTab()}
        </main>

      </div>
    </div>
  );
}

export default App;
