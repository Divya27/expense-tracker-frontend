import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

export default function SignUp() {
  const { dark } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const bg = dark ? '#111' : '#F5F2ED';
  const card = dark ? '#1a1a1a' : '#fff';
  const text = dark ? '#F0EDE8' : '#1a1a1a';
  const border = dark ? '#2a2a2a' : '#E5DFD5';
  const sub = dark ? '#666' : '#aaa';

  async function handleSubmit() {
    setError('');
    if (!form.first_name || !form.last_name || !form.email || !form.password)
      return setError('All fields are required');
    if (form.password !== form.confirm_password)
      return setError('Passwords do not match');
    if (form.password.length < 6)
      return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.post('/auth/register', {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
      });
      navigate('/signin', { state: { message: 'Account created! Please sign in.' } });
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
          <div style={{ fontSize: 10, letterSpacing: 3, color: sub, textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>EXPENSE TRACKER</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: text, letterSpacing: -0.5 }}>Create account</h1>
          <p style={{ fontSize: 14, color: sub, marginTop: 4 }}>Start tracking your expenses</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={lbl(sub)}>FIRST NAME</div>
              <input style={inp(dark, border, text)} placeholder="firstname"
                value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div>
              <div style={lbl(sub)}>LAST NAME</div>
              <input style={inp(dark, border, text)} placeholder="lastname"
                value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
            </div>
          </div>

          <div>
            <div style={lbl(sub)}>EMAIL</div>
            <input style={inp(dark, border, text)} placeholder="you@gmail.com" type="email"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          <div>
            <div style={lbl(sub)}>PASSWORD</div>
            <input style={inp(dark, border, text)} placeholder="Min 6 characters" type="password"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>

          <div>
            <div style={lbl(sub)}>CONFIRM PASSWORD</div>
            <input style={inp(dark, border, text)} placeholder="Repeat password" type="password"
              value={form.confirm_password} onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          {error && <div style={{ fontSize: 13, color: '#FF6B6B', background: '#FF6B6B11', padding: '10px 14px', borderRadius: 10 }}>{error}</div>}

          <button onClick={handleSubmit} disabled={loading}
            style={{ background: text, color: bg, border: 'none', borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: sub, marginTop: 4 }}>
            Already have an account?{' '}
            <Link to="/signin" style={{ color: text, fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
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