import React, { useState, useEffect } from 'react';
import { ShoppingBag, CreditCard, Plus } from 'lucide-react';
import { api } from '../services/api';
import type { ShopItem } from '../services/api';

interface ShopProps {
  tokens: number;
  onRefreshTokens: () => void;
}

export const Shop: React.FC<ShopProps> = ({ tokens, onRefreshTokens }) => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [cost, setCost] = useState(50);
  const [category, setCategory] = useState<'entertainment' | 'break' | 'custom'>('custom');

  const loadShop = async () => {
    const data = await api.getShopItems();
    setItems(data);
  };

  useEffect(() => {
    loadShop();
  }, []);

  const handlePurchase = async (id: string) => {
    try {
      await api.buyShopItem(id);
      onRefreshTokens();
      alert('🎉 Purchase successful! Enjoy your reward.');
    } catch (e: any) {
      alert(e.message || 'Purchase failed.');
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: ShopItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle,
      description: newDesc,
      cost: Number(cost),
      category
    };

    const local = JSON.parse(localStorage.getItem('ag_shop') || '[]');
    localStorage.setItem('ag_shop', JSON.stringify([...local, newItem]));
    
    setNewTitle('');
    setNewDesc('');
    loadShop();
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Token Shop</h1>
          <p className="text-muted" style={{ marginTop: '4px' }}>Redeem your hard-earned Focus Tokens for guilt-free breaks.</p>
        </div>
        <div className="glass-panel" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShoppingBag size={18} color="var(--accent-secondary)" />
          <span style={{ fontWeight: '700' }} className="text-gradient">{tokens} FT Available</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '40px', alignItems: 'start' }}>
        
        {/* Shop Items Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {items.map((item) => {
            const canAfford = tokens >= item.cost;

            return (
              <div 
                key={item.id} 
                className="glass-panel" 
                style={{ 
                  padding: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  minHeight: '220px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{item.title}</h3>
                  <p className="text-muted" style={{ fontSize: '14px', marginBottom: '16px', lineHeight: '1.4' }}>{item.description}</p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <span style={{ fontWeight: '800', fontSize: '18px', color: 'var(--text-primary)' }}>
                      {item.cost} <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-secondary)' }}>FT</span>
                    </span>

                    <button 
                      className="btn-premium" 
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: '13px',
                        background: canAfford ? 'var(--gradient-brand)' : 'var(--text-muted)',
                        boxShadow: canAfford ? '0 4px 15px rgba(108, 92, 231, 0.4)' : 'none',
                        cursor: canAfford ? 'pointer' : 'not-allowed'
                      }}
                      disabled={!canAfford}
                      onClick={() => handlePurchase(item.id)}
                    >
                      <CreditCard size={14} />
                      Buy Break
                    </button>
                  </div>
                  {!canAfford && (
                    <p className="text-muted" style={{ fontSize: '11px', textAlign: 'right', marginTop: '6px', color: 'var(--accent-warning)' }}>
                      Earn {item.cost - tokens} more FT to unlock
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar New Custom Reward Form */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Custom Reward</h3>
          
          <form onSubmit={handleCreateReward} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Reward Name</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. 1 Episode of Anime" 
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Description</label>
              <textarea 
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="How does this reward help you recharge?" 
                rows={2}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', resize: 'none', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Token Cost</label>
                <input 
                  type="number" 
                  min="5" 
                  max="1000"
                  step="5"
                  value={cost}
                  onChange={e => setCost(Number(e.target.value))}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Category</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  style={{ background: '#120E2E', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none' }}
                >
                  <option value="entertainment">Entertainment</option>
                  <option value="break">Break</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-premium" style={{ width: '100%', marginTop: '10px' }}>
              <Plus size={18} /> Add Reward
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
