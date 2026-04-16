import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import BottomNav from '../../components/BottomNav';
import Header from '../../components/Header';
import api from '../../services/api';

function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
const TODAY = new Date().toISOString().split('T')[0];

const QUICK_PROMPTS = [
  'Where can I cut costs?',
  'Am I overspending on any category?',
  'Give me a savings plan',
  'What are my spending patterns?',
  'How does my spending compare to averages?',
  'What is my biggest financial risk?',
];

export default function AIInsights() {
  const { dark } = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expenseContext, setExpenseContext] = useState('');
  const [loadingContext, setLoadingContext] = useState(true);
  const chatEndRef = useRef(null);

  const bg = dark ? '#111' : '#F5F2ED';
  const card = dark ? '#1a1a1a' : '#fff';
  const text = dark ? '#F0EDE8' : '#1a1a1a';
  const border = dark ? '#2a2a2a' : '#ECE7DF';
  const sub = dark ? '#555' : '#aaa';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // fetch last 30 days expenses to build context
  useEffect(() => {
    async function loadContext() {
      setLoadingContext(true);
      try {
        const res = await api.get(`${process.env.REACT_APP_API_URL}/api/expenses`, {
          params: { from: daysAgo(29), to: TODAY, limit: 100 }
        });
        const raw = Array.isArray(res.data.data?.expenses)
          ? res.data.data.expenses : [];
        const expenses = raw.map(e => ({
          ...e,
          amount: parseFloat(e.amount),
          date: e.date.split('T')[0],
        }));

        const total = expenses.reduce((s, e) => s + e.amount, 0);
        const breakdown = expenses.reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        }, {});
        const topCats = Object.entries(breakdown)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, amt]) => `${cat}: ₹${Math.round(amt).toLocaleString('en-IN')} (${((amt / total) * 100).toFixed(0)}%)`)
          .join(', ');

        const recent = [...expenses]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10)
          .map(e => `${e.date}: ${e.description} (${e.category}) — ₹${e.amount}`)
          .join('\n');

        const biggest = expenses.length > 0
          ? expenses.reduce((m, e) => e.amount > m.amount ? e : m, expenses[0])
          : null;

        const context = `
User expense data (last 30 days):
- Total spent: ₹${Math.round(total).toLocaleString('en-IN')}
- Number of transactions: ${expenses.length}
- Daily average: ₹${Math.round(total / 30).toLocaleString('en-IN')}
- Biggest expense: ${biggest ? `${biggest.description} (${biggest.category}) — ₹${biggest.amount}` : 'None'}
- Category breakdown: ${topCats || 'No data'}

Recent transactions:
${recent || 'No transactions'}
        `.trim();

        setExpenseContext(context);
      } catch (err) {
        console.error(err);
        setExpenseContext('No expense data available.');
      }
      setLoadingContext(false);
    }
    loadContext();
  }, []);

  async function sendMessage(userText) {
    if (!userText.trim() || loading) return;
    const userMsg = { role: 'user', content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1000,
          messages: [
            {
              role: 'system',
              content: `You are a sharp, friendly personal finance AI assistant.
You have access to the user's real expense data below. Give concise, specific, actionable insights.
Use plain language. Be direct. Use ₹ for currency. Keep responses focused and useful.
Never be preachy. If asked for tips, give concrete numbers and actions.

${expenseContext}`,
            },
            ...newMessages.map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      });
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'Sorry, could not generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Could not connect. Please try again.' }]);
    }
    setLoading(false);
  }

  async function getAutoInsights() {
    await sendMessage('Analyse my spending for the last 30 days. Give me 3 specific insights and 2 actionable tips to save money. Be specific with numbers.');
  }

  return (
    <div style={{ height: '100vh', background: bg, fontFamily: "'Sora',sans-serif", color: text, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      .msg { animation: fadeUp 0.25s ease forwards; }
    `}</style>

      {/* Header — fixed at top, never moves */}
      <div style={{ flexShrink: 0 }}>
        <Header title="AI INSIGHTS" subtitle="Your personal finance AI" />
      </div>

      {/* Scrollable middle section */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', maxWidth: 480, width: '100%', margin: '0 auto', padding: '16px 16px 8px', gap: 12 }}>

        {/* Context loading */}
        {loadingContext && (
          <div style={{ background: card, borderRadius: 12, padding: '12px 16px', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c4dff', animation: 'blink 1s ease-in-out infinite' }} />
            <span style={{ fontSize: 13, color: sub }}>Loading your expense data...</span>
          </div>
        )}

        {/* Auto insights button */}
        {!loadingContext && (
          <button onClick={getAutoInsights} disabled={loading}
            style={{ background: 'linear-gradient(135deg,#7c4dff,#c651a0)', border: 'none', color: '#fff', borderRadius: 14, padding: '13px 20px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 16 }}>✦</span> Auto Analyse My Spending
          </button>
        )}

        {/* Empty state */}
        {messages.length === 0 && !loadingContext && (
          <div style={{ margin: 'auto', textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Ask me anything</div>
            <div style={{ fontSize: 13, color: sub }}>I have access to your last 30 days of expenses</div>
          </div>
        )}

        {/* Messages */}
        {messages.map((m, i) => (
          <div key={i} className="msg" style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: m.role === 'user'
              ? 'linear-gradient(135deg,#7c4dff,#c651a0)'
              : card,
            border: m.role === 'assistant' ? `1px solid ${border}` : 'none',
            padding: '12px 16px',
            borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            fontSize: 14, lineHeight: 1.65,
            color: m.role === 'user' ? '#fff' : text,
            whiteSpace: 'pre-wrap',
            flexShrink: 0,
          }}>
            {m.content}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ alignSelf: 'flex-start', background: card, border: `1px solid ${border}`, padding: '14px 18px', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c4dff', animation: `blink 1s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom — quick prompts + input, fixed at bottom */}
      <div style={{ flexShrink: 0, background: bg, borderTop: `1px solid ${border}`, paddingBottom: 64 }}>
        <div style={{ maxWidth: 480, width: '100%', margin: '0 auto', padding: '10px 16px' }}>

          {/* Quick prompts */}
          {!loadingContext && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {QUICK_PROMPTS.map(q => (
                <button key={q} onClick={() => sendMessage(q)} disabled={loading}
                  style={{ background: card, border: `1.5px solid ${border}`, borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', color: text, opacity: loading ? 0.5 : 1 }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && sendMessage(input)}
              placeholder="Ask about your spending..."
              style={{ flex: 1, background: card, border: `2px solid ${border}`, borderRadius: 12, padding: '11px 14px', fontSize: 14, color: text, outline: 'none', fontFamily: 'inherit' }}
            />
            <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
              style={{ background: 'linear-gradient(135deg,#7c4dff,#c651a0)', border: 'none', borderRadius: 12, padding: '11px 16px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading || !input.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}>
              Send →
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}