import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

export default function SignIn() {
  const { login } = useAuth();
  const { dark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const successMsg = location.state?.message;

  const bg = dark ? '#111' : '#F5F2ED';
  const text = dark ? '#F0EDE8' : '#1a1a1a';
  const border = dark ? '#2a2a2a' : '#E5DFD5';
  const sub = dark ? '#666' : '#aaa';

  async function handleSubmit() {
    setError('');
    if (!form.email || !form.password) return setError('Email and password required');
    setLoading(true);
    try {
      const res = await api.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, form);
      login(res.data.data.token, res.data.data.user);
      navigate('/log');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 20px', fontFamily: "'Sora', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>
      <div style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 37, letterSpacing: 3, color: sub, textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: 6, fontWeight: 800 }}>EXPENSE TRACKER</div>
          {/* <h1 style={{ fontSize: 12, fontWeight: 700, color: text, letterSpacing: -0.5 }}>Welcome back</h1> */}
          <p style={{ fontSize: 14, color: sub, marginTop: 4 }}>Sign in to your account</p>
        </div>

        {successMsg && (
          <div style={{ fontSize: 13, color: '#6BCB77', background: '#6BCB7711', padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>{successMsg}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={lbl(sub)}>EMAIL</div>
            <input style={inp(dark, border, text)} placeholder="you@gmail.com" type="email"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          <div>
            <div style={lbl(sub)}>PASSWORD</div>
            <input style={inp(dark, border, text)} placeholder="Your password" type="password"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          {error && <div style={{ fontSize: 13, color: '#FF6B6B', background: '#FF6B6B11', padding: '10px 14px', borderRadius: 10 }}>{error}</div>}

          <button onClick={handleSubmit} disabled={loading}
            style={{ background: text, color: bg, border: 'none', borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: sub, marginTop: 4 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: text, fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const lbl = (sub) => ({ fontSize: 10, letterSpacing: 2, color: sub, textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 });
const inp = (dark, border, text) => ({
  width: '100%', background: dark ? '#222' : '#fff', border: `2px solid ${border}`,
  borderRadius: 12, padding: '12px 14px', fontSize: 14, color: text,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
});