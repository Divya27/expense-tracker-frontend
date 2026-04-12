import { useState, useEffect, useMemo } from 'react';
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
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.label, c]));

function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
const TODAY = new Date().toISOString().split('T')[0];

const PRESETS = [
  { label: 'Today', from: TODAY, to: TODAY },
  { label: '7 days', from: daysAgo(6), to: TODAY },
  { label: '30 days', from: daysAgo(29), to: TODAY },
  { label: 'All time', from: '2000-01-01', to: TODAY },
];

function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function friendlyDate(d) {
  if (d === TODAY) return 'Today';
  if (d === daysAgo(1)) return 'Yesterday';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

const lblStyle = { fontSize: 10, letterSpacing: 2, color: '#aaa', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 };
const inpStyle = (dark, border, color) => ({ width: '100%', background: dark ? '#222' : '#fff', border: `2px solid ${border}`, borderRadius: 12, padding: '11px 14px', fontSize: 14, color, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' });

export default function ExpenseList() {
  const { dark } = useTheme();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [activePreset, setActivePreset] = useState('30 days');
  const [fromDate, setFromDate] = useState(daysAgo(29));
  const [toDate, setToDate] = useState(TODAY);
  const [showCustom, setShowCustom] = useState(false);
  const [filterCat, setFilterCat] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [editEntry, setEditEntry] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState('');

  const bg = dark ? '#111' : '#F5F2ED';
  const card = dark ? '#1a1a1a' : '#fff';
  const text = dark ? '#F0EDE8' : '#1a1a1a';
  const border = dark ? '#2a2a2a' : '#ECE7DF';
  const sub = dark ? '#555' : '#aaa';

  async function fetchExpenses(resetPage = false) {
    setLoading(true);
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);
    try {
      const params = { from: fromDate, to: toDate, page: currentPage, limit: 20 };
      if (filterCat !== 'All') params.category = filterCat;
      const res = await api.get('/expenses', { params });
      const raw = Array.isArray(res.data.data?.expenses) ? res.data.data.expenses : [];
      setExpenses(raw.map(e => ({ ...e, amount: parseFloat(e.amount), date: e.date.split('T')[0] })));
      setPagination(res.data.data?.pagination || null);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  useEffect(() => { fetchExpenses(true); }, [fromDate, toDate, filterCat]);
  useEffect(() => { fetchExpenses(); }, [page]);

  function applyPreset(p) {
    setActivePreset(p.label);
    setFromDate(p.from);
    setToDate(p.to);
    setShowCustom(false);
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses(true);
    } catch (err) { console.error(err); }
  }

  function openEdit(e) {
    setEditEntry(e);
    setEditError('');
    setEditSuccess(false);
    setEditForm({
      description: e.description,
      amount: e.amount,
      category: e.category,
      date: e.date,
      note: e.note || '',
    });
  }

  async function handleEdit() {
    if (!editForm.description?.trim()) { setEditError('Description is required'); return; }
    if (!editForm.amount || isNaN(+editForm.amount) || +editForm.amount <= 0) {
      setEditError('Amount must be greater than 0'); return;
    }
    setEditError('');
    setEditLoading(true);
    try {
      await api.put(`/expenses/${editEntry.id}`, { ...editForm, amount: +editForm.amount });
      setEditSuccess(true);
      setTimeout(() => { setEditEntry(null); setEditSuccess(false); fetchExpenses(true); }, 1200);
    } catch (err) { console.error(err); }
    setEditLoading(false);
  }

  const sorted = useMemo(() => {
    if (!Array.isArray(expenses)) return [];
    return sortBy === 'amount'
      ? [...expenses].sort((a, b) => b.amount - a.amount)
      : [...expenses];
  }, [expenses, sortBy]);

  const grouped = useMemo(() => {
    const g = {};
    sorted.forEach(e => { (g[e.date] = g[e.date] || []).push(e); });
    return g;
  }, [sorted]);
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  const total = expenses.reduce((s, e) => s + +e.amount, 0);
  const catTotals = useMemo(() => {
    const t = {};
    expenses.forEach(e => { t[e.category] = (t[e.category] || 0) + +e.amount; });
    return Object.entries(t).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const btnStyle = (active) => ({
    background: active ? text : card, color: active ? bg : sub,
    border: `1.5px solid ${active ? text : border}`, borderRadius: 20,
    padding: '6px 14px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.2s',
  });

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: "'Sora',sans-serif", color: text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <Header title="EXPENSES" subtitle={fmt(total)} />

      <div style={{ padding: '16px 16px 100px', maxWidth: 480, margin: '0 auto' }}>

        {/* Filter card */}
        <div style={{ background: card, borderRadius: 16, padding: '14px', marginBottom: 12, border: `1px solid ${border}` }}>
          <div style={{ ...lblStyle, marginBottom: 8 }}>DATE RANGE</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {PRESETS.map(p => (
              <button key={p.label} style={btnStyle(activePreset === p.label)} onClick={() => applyPreset(p)}>{p.label}</button>
            ))}
            <button style={btnStyle(activePreset === 'custom')}
              onClick={() => { setActivePreset('custom'); setShowCustom(v => !v); }}>Custom ▾</button>
          </div>

          {showCustom && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 20px 1fr', gap: 6, alignItems: 'center', marginBottom: 10 }}>
              <input type="date" value={fromDate}
                min={`${new Date().getFullYear()}-01-01`} max={TODAY}
                onChange={e => { setFromDate(e.target.value); setActivePreset('custom'); }}
                style={{ background: dark ? '#222' : '#f9f7f4', border: `1.5px solid ${border}`, borderRadius: 10, padding: '8px 10px', fontSize: 13, color: text, outline: 'none', fontFamily: 'inherit' }} />
              <span style={{ textAlign: 'center', color: sub, fontSize: 12 }}>→</span>
              <input type="date" value={toDate}
                min={`${new Date().getFullYear()}-01-01`} max={TODAY}
                onChange={e => { setToDate(e.target.value); setActivePreset('custom'); }}
                style={{ background: dark ? '#222' : '#f9f7f4', border: `1.5px solid ${border}`, borderRadius: 10, padding: '8px 10px', fontSize: 13, color: text, outline: 'none', fontFamily: 'inherit' }} />
            </div>
          )}

          <div style={{ ...lblStyle, marginBottom: 8 }}>CATEGORY</div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button style={btnStyle(filterCat === 'All')} onClick={() => setFilterCat('All')}>All</button>
            {CATEGORIES.map(c => (
              <button key={c.label} style={btnStyle(filterCat === c.label)}
                onClick={() => setFilterCat(filterCat === c.label ? 'All' : c.label)}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div style={{ background: '#1a1a1a', borderRadius: 14, padding: '14px 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: '#555', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>FILTERED TOTAL</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#F5F2ED', letterSpacing: -0.5 }}>{fmt(total)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#555', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>ENTRIES</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#F5F2ED' }}>{expenses.length}</div>
          </div>
        </div>

        {/* Category breakdown chips */}
        {catTotals.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12, paddingBottom: 2, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {catTotals.map(([cat, amt]) => {
              const c = CAT_MAP[cat];
              return (
                <div key={cat} onClick={() => setFilterCat(filterCat === cat ? 'All' : cat)}
                  style={{ background: filterCat === cat ? c.color + '28' : c.color + '12', border: `1.5px solid ${filterCat === cat ? c.color : c.color + '33'}`, borderRadius: 12, padding: '8px 12px', flexShrink: 0, minWidth: 88, cursor: 'pointer' }}>
                  <div style={{ fontSize: 16 }}>{c.icon}</div>
                  <div style={{ fontSize: 11, color: c.color, fontWeight: 600, marginTop: 2 }}>{cat}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: text }}>{fmt(amt)}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sort + count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: sub }}>{expenses.length} result{expenses.length !== 1 ? 's' : ''}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setSortBy('date')}
              style={{ ...btnStyle(sortBy === 'date'), display: 'flex', alignItems: 'center', gap: 4 }}>
              {sortBy === 'date' ? '↓' : '↕'} Date
            </button>
            <button onClick={() => setSortBy('amount')}
              style={{ ...btnStyle(sortBy === 'amount'), display: 'flex', alignItems: 'center', gap: 4 }}>
              {sortBy === 'amount' ? '↓' : '↕'} Amount
            </button>
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', color: sub, padding: '40px 0' }}>Loading...</div>}

        {!loading && expenses.length === 0 && (
          <div style={{ textAlign: 'center', color: sub, padding: '60px 0', fontSize: 14 }}>No entries in this range</div>
        )}

        {!loading && (
          sortBy === 'date' ? (
            sortedDates.map(date => {
              const dayEntries = grouped[date];
              const dayTotal = dayEntries.reduce((s, e) => s + +e.amount, 0);
              return (
                <div key={date} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: sub, letterSpacing: 1, textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace" }}>{friendlyDate(date)}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: text }}>{fmt(dayTotal)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {dayEntries.map(e => (
                      <EntryRow key={e.id} e={e} dark={dark} text={text} border={border} sub={sub} bg={bg}
                        onDelete={handleDelete} onEdit={openEdit} showDate />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {sorted.map(e => (
                <EntryRow key={e.id} e={e} dark={dark} text={text} border={border} sub={sub} bg={bg}
                  onDelete={handleDelete} onEdit={openEdit} showDate />
              ))}
            </div>
          )
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20, alignItems: 'center' }}>
            <button disabled={!pagination.has_prev} onClick={() => setPage(p => p - 1)}
              style={{ ...btnStyle(false), opacity: pagination.has_prev ? 1 : 0.3 }}>← Prev</button>
            <span style={{ fontSize: 13, color: sub, fontFamily: "'JetBrains Mono',monospace" }}>{page} / {pagination.total_pages}</span>
            <button disabled={!pagination.has_next} onClick={() => setPage(p => p + 1)}
              style={{ ...btnStyle(false), opacity: pagination.has_next ? 1 : 0.3 }}>Next →</button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editEntry && (
        <>
          <div onClick={() => setEditEntry(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 400 }} />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 401, background: dark ? '#1a1a1a' : '#fff', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', boxShadow: '0 -8px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: dark ? '#333' : '#ddd', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: text, marginBottom: 18 }}>Edit Expense</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Category */}
              <div>
                <div style={lblStyle}>CATEGORY</div>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {CATEGORIES.map(c => {
                    const active = editForm.category === c.label;
                    return (
                      <button key={c.label}
                        onClick={() => setEditForm(f => ({ ...f, category: c.label }))}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 30, border: `2px solid ${active ? c.color : 'transparent'}`, cursor: 'pointer', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', background: active ? c.color + '18' : (dark ? '#222' : '#f5f2ed'), color: active ? c.color : sub, fontFamily: 'inherit' }}>
                        {c.icon} {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount */}
              <div>
                <div style={lblStyle}>AMOUNT</div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: sub, fontSize: 15 }}>₹</span>
                  <input style={{ ...inpStyle(dark, border, text), paddingLeft: 30 }}
                    type="number" value={editForm.amount}
                    onChange={e => { setEditForm(f => ({ ...f, amount: e.target.value })); setEditError(''); }} />
                </div>
              </div>

              {/* Description */}
              <div>
                <div style={lblStyle}>DESCRIPTION</div>
                <input style={inpStyle(dark, border, text)}
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              {/* Note */}
              <div>
                <div style={lblStyle}>NOTE</div>
                <input style={inpStyle(dark, border, text)} placeholder="Optional"
                  value={editForm.note}
                  onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} />
              </div>

              {/* Date */}
              <div>
                <div style={lblStyle}>DATE</div>
                <input type="date" style={inpStyle(dark, border, text)}
                  value={editForm.date}
                  onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
              </div>

              {/* Error */}
              {editError && (
                <div style={{ fontSize: 13, color: '#FF6B6B', background: '#FF6B6B11', padding: '10px 14px', borderRadius: 10 }}>
                  {editError}
                </div>
              )}

              {/* Success */}
              {editSuccess && (
                <div style={{ textAlign: 'center', padding: '14px', background: '#6BCB7718', borderRadius: 12, color: '#6BCB77', fontSize: 14, fontWeight: 600 }}>
                  ✓ Changes saved successfully!
                </div>
              )}

              {/* Save button */}
              {!editSuccess && (
                <button onClick={handleEdit} disabled={editLoading}
                  style={{ background: text, color: bg, border: 'none', borderRadius: 14, padding: 14, fontSize: 15, fontWeight: 600, cursor: editLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: editLoading ? 0.7 : 1, marginTop: 4 }}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}

function EntryRow({ e, dark, text, border, sub, bg, onDelete, onEdit, showDate }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const cat = CAT_MAP[e.category] || CAT_MAP['Other'];
  return (
    <div style={{ background: dark ? '#1a1a1a' : '#fff', borderRadius: 14, padding: '12px 13px', display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${border}` }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: cat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>
        {cat.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: text }}>{e.description}</div>
        <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>
          <span style={{ color: cat.color, fontWeight: 600 }}>{cat.label}</span>
          {e.note ? <> · {e.note}</> : null}
          {showDate ? <> · <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{e.date}</span></> : null}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14, color: text }}>
          ₹{Number(e.amount).toLocaleString('en-IN')}
        </div>
        {!confirmDel && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onEdit(e)}
              style={{ background: dark ? '#2a2a2a' : '#f5f2ed', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13 }}>
              ✏️
            </button>
            <button onClick={() => setConfirmDel(true)}
              style={{ background: dark ? '#2a2a2a' : '#f5f2ed', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13 }}>
              🗑️
            </button>
          </div>
        )}
        {confirmDel && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ fontSize: 11, color: '#FF6B6B', fontWeight: 500 }}>Delete?</div>
            <div style={{ display: 'flex', gap: 5 }}>
              <button onClick={() => setConfirmDel(false)}
                style={{ background: dark ? '#2a2a2a' : '#eee', border: 'none', color: sub, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
                No
              </button>
              <button onClick={() => { setConfirmDel(false); onDelete(e.id); }}
                style={{ background: '#FF6B6B', border: 'none', color: '#fff', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', fontWeight: 600 }}>
                Yes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}