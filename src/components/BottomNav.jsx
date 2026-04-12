import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const TABS = [
  { path: '/log', icon: '✏️', label: 'Log' },
  { path: '/list', icon: '📋', label: 'List' },
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/insights', icon: '🤖', label: 'AI' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark } = useTheme();

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: dark ? '#1a1a1a' : '#fff',
      borderTop: `1px solid ${dark ? '#2a2a2a' : '#ECE7DF'}`,
      zIndex: 100,
      paddingBottom: 4,
    }}>
      {/* constrain to max-width same as content */}
      <div style={{
        maxWidth: 480,
        margin: '0 auto',
        display: 'flex',
      }}>
        {TABS.map(tab => {
          const active = location.pathname === tab.path;
          return (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              style={{
                flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 0 6px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
                color: active ? (dark ? '#fff' : '#1a1a1a') : '#aaa',
              }}>
              <span style={{ fontSize: 20 }}>{tab.icon}</span>
              <span style={{ fontSize: 10, fontFamily: "'Sora',sans-serif", fontWeight: active ? 600 : 400 }}>
                {tab.label}
              </span>
              {active && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: dark ? '#fff' : '#1a1a1a', marginTop: 1 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}