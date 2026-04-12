import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import BottomNav from '../../components/BottomNav';
import Header from '../../components/Header';
import api from '../../services/api';

const CATEGORIES = [
  { label: 'Food', icon: '🍜', color: '#FF6B6B' },
  { label: 'Transport', icon: '🚇', color: '#4ECDC4' },
  { label: 'Shopping', icon: '🛍️', color: '#FFD93D' },
  { label: 'Health', icon: '💊', color: '#6BCB77' },
  { label: 'Entertainment', icon: '🎬', color: '#FF922B' },
  { label: 'Utilities', icon: '⚡', color: '#74C0FC' },
  { label: 'Housing', icon: '🏠', color: '#B197FC' },
  { label: 'Other', icon: '📦', color: '#A9A9A9' },
];

const TODAY = new Date().toISOString().split('T')[0];

export default function LogExpense() {
  const { dark } = useTheme();
  const [form, setForm] = useState({ description: '', amount: '', category: 'Food', date: TODAY, note: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  const bg = dark ? '#111' : '#F5F2ED';
  const card = dark ? '#1a1a1a' : '#fff';
  const text = dark ? '#F0EDE8' : '#1a1a1a';
  const border = dark ? '#2a2a2a' : '#E5DFD5';
  const sub = dark ? '#555' : '#aaa';

  function validate() {
    const e = {};
    if (!form.description.trim()) e.description = true;
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = true;
    return e;
  }

  async function handleAdd() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setApiError('');
    try {
      await api.post('/expenses', { ...form, amount: +form.amount });
      setForm({ description: '', amount: '', category: 'Food', date: TODAY, note: '' });
      setErrors({});
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to save expense');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: "'Sora',sans-serif", color: text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select, textarea { font-family: 'Sora', sans-serif; }
      `}</style>

      <Header />

      <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>

        {/* Category */}
        <div style={{ marginBottom: 18 }}>
          <div style={lbl(sub)}>CATEGORY</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {CATEGORIES.map(c => {
              const active = form.category === c.label;
              return (
                <button key={c.label}
                  onClick={() => setForm(f => ({ ...f, category: c.label }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 30, border: `2px solid ${active ? c.color : 'transparent'}`, cursor: 'pointer', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', background: active ? c.color + '18' : card, color: active ? c.color : sub, fontFamily: 'inherit' }}>
                  {c.icon} {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: 12 }}>
          <div style={lbl(sub)}>AMOUNT</div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: sub, fontSize: 15, fontWeight: 600 }}>₹</span>
            <input style={{ ...inp(dark, errors.amount ? '#FF6B6B' : border, text), paddingLeft: 32 }}
              type="number" placeholder="0.00" value={form.amount}
              onChange={e => { setForm(f => ({ ...f, amount: e.target.value })); setErrors(er => ({ ...er, amount: false })); }} />
          </div>
          {errors.amount && <div style={err}>Amount must be greater than 0</div>}
        </div>

        {/* Description */}
        <div style={{ marginBottom: 12 }}>
          <div style={lbl(sub)}>DESCRIPTION</div>
          <input style={inp(dark, errors.description ? '#FF6B6B' : border, text)}
            placeholder="What did you spend on?"
            value={form.description}
            onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(er => ({ ...er, description: false })); }} />
          {errors.description && <div style={err}>Add a description</div>}
        </div>

        {/* Note */}
        <div style={{ marginBottom: 12 }}>
          <div style={lbl(sub)}>NOTE <span style={{ color: sub, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>(optional)</span></div>
          <textarea style={{ ...inp(dark, border, text), resize: 'none', lineHeight: 1.5 }}
            rows={2} placeholder="Any extra details…"
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
        </div>

        {/* Date */}
        <div style={{ marginBottom: 24 }}>
          <div style={lbl(sub)}>DATE</div>
          <input style={inp(dark, border, text)} type="date" value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>

        {apiError && (
          <div style={{ fontSize: 13, color: '#FF6B6B', background: '#FF6B6B11', padding: '10px 14px', borderRadius: 10, marginBottom: 12 }}>
            {apiError}
          </div>
        )}

        <button onClick={handleAdd} disabled={loading}
          style={{ width: '100%', background: text, color: bg, border: 'none', borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Saving...' : success ? '✓ Saved!' : 'Save Expense'}
        </button>

        {success && (
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: '#6BCB77', fontWeight: 500 }}>
            Entry added successfully ✓
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

const lbl = (sub) => ({ fontSize: 10, letterSpacing: 2, color: sub, textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 });
const inp = (dark, border, color) => ({ width: '100%', background: dark ? '#222' : '#fff', border: `2px solid ${border}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' });
const err = { fontSize: 12, color: '#FF6B6B', marginTop: 4 };