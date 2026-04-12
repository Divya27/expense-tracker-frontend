import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import BottomNav from '../../components/BottomNav';
import api from '../../services/api';
import Header from '../../components/Header';


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
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.label, c]));

function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function fmtShort(n) {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'k';
  return '₹' + Math.round(n);
}

function getDateRange(type) {
  const today = new Date();
  const pad = n => String(n).padStart(2, '0');
  const f = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayStr = f(today);
  if (type === 'today') return { from: todayStr, to: todayStr };
  if (type === 'week') {
    const s = new Date(today); s.setDate(today.getDate() - 6);
    return { from: f(s), to: todayStr };
  }
  if (type === 'month') {
    const s = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: f(s), to: todayStr };
  }
  if (type === 'prevweek') {
    const s = new Date(today); s.setDate(today.getDate() - 13);
    const e = new Date(today); e.setDate(today.getDate() - 7);
    return { from: f(s), to: f(e) };
  }
  return { from: todayStr, to: todayStr };
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return {
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: d.toISOString().split('T')[0],
      amount: 0,
    };
  });
}

function normalize(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(e => ({
    ...e,
    amount: parseFloat(e.amount),
    date: e.date.split('T')[0],
  }));
}

// ── Bar Chart ──────────────────────────────────────────
function BarChart({ days, dark, text, sub }) {
  const max = Math.max(...days.map(d => d.amount), 1);
  const today = new Date().toISOString().split('T')[0];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
      {days.map((d, i) => {
        const pct = d.amount / max;
        const isToday = d.date === today;
        const barH = Math.max(pct * 72, d.amount > 0 ? 8 : 3);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: d.amount > 0 ? (isToday ? '#FF6B6B' : text) : 'transparent', fontWeight: isToday ? 700 : 400, whiteSpace: 'nowrap' }}>
              {d.amount > 0 ? fmtShort(Math.round(d.amount)) : '.'}
            </div>
            <div style={{ width: '100%', borderRadius: '5px 5px 3px 3px', height: barH, background: isToday ? 'linear-gradient(180deg,#FF6B6B,#ff4444)' : (dark ? '#2a2a2a' : '#E8E2D9'), boxShadow: isToday ? '0 2px 8px rgba(255,107,107,0.4)' : 'none', transition: 'height 0.6s cubic-bezier(.34,1.56,.64,1)' }} />
            <div style={{ fontSize: 10, color: isToday ? '#FF6B6B' : sub, fontWeight: isToday ? 700 : 400, fontFamily: "'JetBrains Mono',monospace" }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Donut ──────────────────────────────────────────────
function DonutChart({ breakdown, total, dark, text }) {
  const size = 120, cx = 60, cy = 60, r = 44, strokeW = 18;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const segments = Object.entries(breakdown).map(([cat, val]) => {
    const dash = (val / total) * circumference;
    const seg = { cat, dash, offset };
    offset += dash;
    return seg;
  });
  return (
    <svg width={size} height={size}>
      {segments.length === 0 && <circle cx={cx} cy={cy} r={r} fill="none" stroke={dark ? '#2a2a2a' : '#E5DFD5'} strokeWidth={strokeW} />}
      {segments.map(({ cat, dash, offset: off }) => (
        <circle key={cat} cx={cx} cy={cy} r={r} fill="none"
          stroke={CAT_MAP[cat]?.color || '#aaa'} strokeWidth={strokeW}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={circumference / 4 - off}
          style={{ transition: 'all 0.6s ease' }} />
      ))}
      <text x={cx} y={cy - 7} textAnchor="middle" fill={dark ? '#555' : '#aaa'} fontSize="9" fontFamily="'JetBrains Mono',monospace">TOTAL</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill={text} fontSize="11" fontFamily="'JetBrains Mono',monospace" fontWeight="700">
        {total >= 100000 ? '₹' + (total / 100000).toFixed(1) + 'L' : total >= 1000 ? '₹' + (total / 1000).toFixed(1) + 'k' : fmt(total)}
      </text>
    </svg>
  );
}

// ── Skeleton ───────────────────────────────────────────
function Skeleton({ w = '100%', h = 16, r = 8, dark }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: dark ? '#2a2a2a' : '#E8E2D9', animation: 'pulse 1.5s ease-in-out infinite' }} />;
}

// ── Main ───────────────────────────────────────────────
export default function Dashboard() {
  const { dark } = useTheme();
  const { user } = useAuth();
  const [period, setPeriod] = useState('month');
  const [expenses, setExpenses] = useState([]);
  const [last7, setLast7] = useState(getLast7Days());
  const [prevWeekTotal, setPrevWeekTotal] = useState(0);
  const [currWeekTotal, setCurrWeekTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const bg = dark ? '#111' : '#F5F2ED';
  const card = dark ? '#1a1a1a' : '#fff';
  const text = dark ? '#F0EDE8' : '#1a1a1a';
  const border = dark ? '#2a2a2a' : '#ECE7DF';
  const sub = dark ? '#555' : '#aaa';
  const muted = dark ? '#333' : '#f0ece6';

  async function fetchData() {
    setLoading(true);
    try {
      // main period
      const { from, to } = getDateRange(period);
      const res = await api.get('/expenses', { params: { from, to, limit: 100 } });
      const main = normalize(res.data.data?.expenses);
      setExpenses(main);

      // last 7 days bar chart
      const { from: f7, to: t7 } = getDateRange('week');
      const res7 = await api.get('/expenses', { params: { from: f7, to: t7, limit: 100 } });
      const days = getLast7Days();
      normalize(res7.data.data?.expenses).forEach(e => {
        const day = days.find(d => d.date === e.date);
        if (day) day.amount += e.amount;
      });
      setLast7(days);
      setCurrWeekTotal(days.reduce((s, d) => s + d.amount, 0));

      // prev 7 days for comparison
      const { from: fp, to: tp } = getDateRange('prevweek');
      const resp = await api.get('/expenses', { params: { from: fp, to: tp, limit: 100 } });
      const prevTotal = normalize(resp.data.data?.expenses).reduce((s, e) => s + e.amount, 0);
      setPrevWeekTotal(prevTotal);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [period]);

  // ── computed ──
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const breakdown = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {});
  const catSorted = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

  const { from, to } = getDateRange(period);
  const dayCount = Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1);
  const dailyAvg = total / dayCount;
  const biggest = expenses.length > 0 ? expenses.reduce((m, e) => e.amount > m.amount ? e : m, expenses[0]) : null;
  const recent = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  // week vs week
  const weekDiff = prevWeekTotal > 0 ? ((currWeekTotal - prevWeekTotal) / prevWeekTotal) * 100 : null;
  const weekUp = weekDiff !== null && weekDiff > 0;
  const weekColor = weekDiff === null ? sub : weekUp ? '#FF6B6B' : '#6BCB77';
  const weekIcon = weekDiff === null ? '—' : weekUp ? '↑' : '↓';
  const weekLabel = weekDiff === null ? 'No prev data' : `${weekIcon} ${Math.abs(weekDiff).toFixed(0)}% vs last week`;
  const weekSub = weekDiff === null ? '' : weekUp ? 'Spending more' : 'Spending less 🎉';

  const PERIODS = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: '7 Days' },
    { key: 'month', label: 'This Month' },
  ];

  const pill = (active) => ({
    background: active ? text : 'none', color: active ? bg : sub,
    border: `1.5px solid ${active ? text : border}`,
    borderRadius: 20, padding: '6px 16px', fontSize: 12,
    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
  });

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: "'Sora',sans-serif", color: text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fu { animation: fadeUp 0.35s ease forwards; }
      `}</style>

      {/* Header */}
      <Header title="DASHBOARD" subtitle={`Hi ${user?.first_name} 👋`} />

      <div style={{ padding: '16px 16px 100px', maxWidth: 480, margin: '0 auto' }}>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {PERIODS.map(p => (
            <button key={p.key} style={pill(period === p.key)} onClick={() => setPeriod(p.key)}>{p.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton h={100} r={20} dark={dark} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Skeleton h={90} r={16} dark={dark} />
              <Skeleton h={90} r={16} dark={dark} />
              <Skeleton h={90} r={16} dark={dark} />
              <Skeleton h={90} r={16} dark={dark} />
            </div>
            <Skeleton h={140} r={16} dark={dark} />
            <Skeleton h={160} r={16} dark={dark} />
          </div>
        ) : (
          <div className="fu">

            {/* Hero total */}
            <div style={{ background: '#1a1a1a', borderRadius: 20, padding: '24px 24px 20px', marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,107,107,0.08)' }} />
              <div style={{ position: 'absolute', bottom: -30, right: 30, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,107,107,0.05)' }} />
              <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', marginBottom: 8 }}>
                {period === 'today' ? "Today's Spend" : period === 'week' ? 'Last 7 Days' : 'This Month'}
              </div>
              <div style={{ fontSize: 40, fontWeight: 700, color: '#F5F2ED', letterSpacing: -1.5, lineHeight: 1, marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>
                {fmt(Math.round(total))}
              </div>
              <div style={{ fontSize: 12, color: '#555' }}>across {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}</div>
            </div>

            {/* 4 stat cards — 2x2 grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>

              {/* Daily average */}
              <div style={{ background: card, borderRadius: 16, padding: '16px', border: `1px solid ${border}`, borderLeft: '3px solid #4ECDC4' }}>
                <div style={{ fontSize: 11, color: sub, marginBottom: 6 }}>Daily Average</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#4ECDC4', fontFamily: "'JetBrains Mono',monospace" }}>{fmtShort(Math.round(dailyAvg))}</div>
                <div style={{ fontSize: 11, color: sub, marginTop: 3 }}>per day</div>
              </div>

              {/* Transactions */}
              <div style={{ background: card, borderRadius: 16, padding: '16px', border: `1px solid ${border}`, borderLeft: '3px solid #B197FC' }}>
                <div style={{ fontSize: 11, color: sub, marginBottom: 6 }}>Transactions</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#B197FC', fontFamily: "'JetBrains Mono',monospace" }}>{expenses.length}</div>
                <div style={{ fontSize: 11, color: sub, marginTop: 3 }}>entries logged</div>
              </div>

              {/* Biggest expense */}
              <div style={{ background: card, borderRadius: 16, padding: '16px', border: `1px solid ${border}`, borderLeft: '3px solid #FFD93D' }}>
                <div style={{ fontSize: 11, color: sub, marginBottom: 6 }}>Biggest Expense</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#FFD93D', fontFamily: "'JetBrains Mono',monospace", letterSpacing: -0.5 }}>
                  {biggest ? fmtShort(biggest.amount) : '—'}
                </div>
                <div style={{ fontSize: 11, color: sub, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {biggest ? biggest.description : 'No data'}
                </div>
              </div>

              {/* Week vs week */}
              <div style={{ background: card, borderRadius: 16, padding: '16px', border: `1px solid ${border}`, borderLeft: `3px solid ${weekColor}` }}>
                <div style={{ fontSize: 11, color: sub, marginBottom: 6 }}>This vs Last Week</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: weekColor, fontFamily: "'JetBrains Mono',monospace", letterSpacing: -0.5 }}>
                  {weekDiff !== null ? `${weekIcon} ${Math.abs(weekDiff).toFixed(0)}%` : '—'}
                </div>
                <div style={{ fontSize: 11, color: sub, marginTop: 3 }}>{weekSub || 'No prev data'}</div>
              </div>

            </div>

            {/* Bar chart */}
            <div style={{ background: card, borderRadius: 16, padding: '18px 16px 14px', border: `1px solid ${border}`, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: sub, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase' }}>LAST 7 DAYS</div>
                <div style={{ fontSize: 11, color: '#FF6B6B', fontWeight: 600 }}>● Today</div>
              </div>
              <BarChart days={last7} dark={dark} text={text} sub={sub} />
            </div>

            {/* Category breakdown */}
            {catSorted.length > 0 && (
              <div style={{ background: card, borderRadius: 16, padding: '18px 16px', border: `1px solid ${border}`, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: sub, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', marginBottom: 16 }}>SPENDING BY CATEGORY</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {catSorted.map(([cat, amt]) => {
                    const c = CAT_MAP[cat];
                    const pct = total > 0 ? (amt / total) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                            <span style={{ fontSize: 16 }}>{c?.icon}</span>
                            <span style={{ fontWeight: 500 }}>{cat}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, color: sub }}>{pct.toFixed(0)}%</span>
                            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: c?.color }}>{fmt(Math.round(amt))}</span>
                          </div>
                        </div>
                        <div style={{ height: 5, background: muted, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: c?.color, borderRadius: 4, transition: 'width 0.7s cubic-bezier(.34,1.56,.64,1)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent transactions */}
            {recent.length > 0 && (
              <div style={{ background: card, borderRadius: 16, padding: '18px 16px', border: `1px solid ${border}` }}>
                <div style={{ fontSize: 11, color: sub, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', marginBottom: 16 }}>RECENT TRANSACTIONS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {recent.map((e, i) => {
                    const c = CAT_MAP[e.category];
                    return (
                      <div key={e.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 11, background: c?.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{c?.icon}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.description}</div>
                            <div style={{ fontSize: 11, color: sub, marginTop: 1 }}>
                              <span style={{ color: c?.color, fontWeight: 500 }}>{c?.label}</span> · {e.date}
                            </div>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: text, flexShrink: 0 }}>{fmt(e.amount)}</div>
                        </div>
                        {i < recent.length - 1 && <div style={{ height: 1, background: border, marginTop: 12, marginLeft: 48 }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {expenses.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: text, marginBottom: 6 }}>No expenses yet</div>
                <div style={{ fontSize: 13, color: sub }}>Start logging to see your dashboard</div>
              </div>
            )}

          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}