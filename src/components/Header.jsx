import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Header({ title, subtitle }) {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const avatarRef = useRef(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  function handleAvatarClick() {
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setShowMenu(v => !v);
  }

  return (
    <>
      <div style={{ background: '#1a1a1a', padding: '20px 20px 22px', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '12px 12px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

            {/* Left */}
            <div>
              {title ? (
                <>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: '#555', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', marginBottom: 4 }}>{title}</div>
                  {subtitle && <div style={{ fontSize: 20, fontWeight: 700, color: '#F5F2ED' }}>{subtitle}</div>}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>{greeting},</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#F5F2ED' }}>{user?.first_name} {user?.last_name} 👋</div>
                </>
              )}
            </div>

            {/* Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={toggleDark}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 20, padding: '6px 10px', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>
                {dark ? '☀️' : '🌙'}
              </button>

              {/* Avatar */}
              <div
                ref={avatarRef}
                onClick={handleAvatarClick}
                style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#7c4dff,#c651a0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', flexShrink: 0, userSelect: 'none' }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {showMenu && (
        <div onClick={() => setShowMenu(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 298 }} />
      )}

      {/* Dropdown — positioned exactly below avatar */}
      {showMenu && (
        <div style={{
          position: 'fixed',
          top: menuPos.top,
          right: menuPos.right,
          zIndex: 299,
          background: '#222',
          borderRadius: 14,
          border: '1px solid #333',
          minWidth: 220,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          {/* Profile info */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #2a2a2a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#7c4dff,#c651a0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#F0EDE8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={() => { setShowMenu(false); logout(); }}
            style={{ width: '100%', background: 'none', border: 'none', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#FF6B6B', fontSize: 14, fontFamily: "'Sora',sans-serif", fontWeight: 500, textAlign: 'left' }}>
            <span style={{ fontSize: 16 }}>🚪</span> Logout
          </button>
        </div>
      )}
    </>
  );
}