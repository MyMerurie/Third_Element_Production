import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
  'Godown Rent', 'Labour Room Rent', 'Water Bill', 'Electricity Bill', 'Wi-Fi',
  'Miscellaneous', 'Compliance Fees', 'Partner Conveyance & Food', 'Other Office Expenses',
];
const PARTNER_SALARY = 'Partner Salary';
const LABOUR_SALARY = 'Labour Salary';
const TABS = ['Calendar', 'Fixed Expenses', 'Partner Salaries', 'Labour Salaries'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => { const [y, m, day] = d.split('T')[0].split('-'); return `${day}/${m}/${y}`; };
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const monthKey = (d) => d.slice(0, 7);

const Overheads = () => {
  const now = new Date();
  const [tab, setTab] = useState('Calendar');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [rows, setRows] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  const load = async () => {
    const [o, f, r] = await Promise.all([
      supabase.from('overhead_expenses').select('*').order('date', { ascending: false }),
      supabase.from('event_functions').select('id,name,function_date,venue'),
      supabase.from('rentals').select('id,customer_name,pickup_date,return_date'),
    ]);
    if (o.error) setError(o.error.message);
    setRows(o.data || []);
    setFunctions(f.data || []);
    setRentals(r.data || []);
  };
  useEffect(() => { load(); }, []);

  const shiftMonth = (delta) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear()); setMonth(d.getMonth()); setSelectedDay(null);
  };

  const openAdd = (category, defaults = {}) => {
    setForm({ date: iso(year, month, Math.min(now.getDate(), 28)), category, payee: '', description: '', amount: '', ...defaults });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const { error: err } = await supabase.from('overhead_expenses').insert({ ...form, amount: Number(form.amount || 0) });
    if (err) return setError(err.message);
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    await supabase.from('overhead_expenses').delete().eq('id', id);
    load();
  };

  const mk = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthRows = rows.filter(r => monthKey(r.date) === mk);
  const monthTotal = monthRows.reduce((s, r) => s + Number(r.amount || 0), 0);

  // ---- Calendar ----
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const dayData = (day) => {
    const d = iso(year, month, day);
    return {
      expenses: rows.filter(r => r.date === d),
      funcs: functions.filter(f => f.function_date === d),
      pickups: rentals.filter(r => r.pickup_date === d),
      returns: rentals.filter(r => r.return_date === d),
    };
  };
  const sel = selectedDay ? dayData(selectedDay) : null;

  const MonthNav = () => (
    <div className="flex items-center gap-2">
      <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-lg border bg-white cursor-pointer"><ChevronLeft size={14} /></button>
      <span className="font-bold text-sm w-36 text-center">{MONTHS[month]} {year}</span>
      <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-lg border bg-white cursor-pointer"><ChevronRight size={14} /></button>
    </div>
  );

  const ExpenseTable = ({ list, showPayee }) => (
    <>
    <div className="md:hidden space-y-2">
      {list.length === 0 ? (
        <p className="p-6 text-center text-slate-400 text-xs">No entries for {MONTHS[month]} {year}.</p>
      ) : list.map(r => (
        <div key={r.id} className="card bg-white p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-slate-800 truncate">{r.category}{showPayee && r.payee ? ` – ${r.payee}` : ''}</div>
            <div className="text-[11px] text-slate-400 truncate">{fmtDate(r.date)}{r.description ? ` · ${r.description}` : ''}</div>
          </div>
          <b className="text-sm">{inr(r.amount)}</b>
          <button aria-label="Delete" onClick={() => remove(r.id)} className="p-2 text-slate-400 hover:text-red-600 cursor-pointer"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
    <div className="card bg-white overflow-x-auto hidden md:block">
      <table className="w-full text-left text-xs min-w-[520px]">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400 uppercase">
            <th className="p-3">Date</th><th className="p-3">Category</th>
            {showPayee && <th className="p-3">Name</th>}
            <th className="p-3">Description</th><th className="p-3 text-right">Amount</th><th className="p-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {list.length === 0 ? (
            <tr><td colSpan="6" className="p-6 text-center text-slate-400">No entries for {MONTHS[month]} {year}.</td></tr>
          ) : list.map(r => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="p-3">{fmtDate(r.date)}</td><td className="p-3 font-semibold">{r.category}</td>
              {showPayee && <td className="p-3">{r.payee || '-'}</td>}
              <td className="p-3 text-slate-500">{r.description || '-'}</td>
              <td className="p-3 text-right font-bold">{inr(r.amount)}</td>
              <td className="p-3"><button onClick={() => remove(r.id)} className="text-slate-400 hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );

  const salaryList = (cat) => monthRows.filter(r => r.category === cat);
  const fixedList = monthRows.filter(r => r.category !== PARTNER_SALARY && r.category !== LABOUR_SALARY);
  const sum = (l) => l.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12 font-sans min-w-0">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Overheads</h2>
          <p className="text-xs text-slate-400">Fixed expenses for {MONTHS[month]} {year}: <b className="text-slate-600">{inr(monthTotal)}</b></p>
        </div>
        <MonthNav />
      </div>

      <div className="flex space-x-1 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer ${tab === t ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs">{error} — has <code>supabase_migration_phase2.sql</code> been run?</div>}

      {tab === 'Calendar' && (
        <div className="space-y-3">
          <div className="card bg-white p-3">
            <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] text-center text-[10px] font-bold uppercase text-slate-400 pb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const d = dayData(day);
                const total = d.expenses.reduce((s, r) => s + Number(r.amount || 0), 0);
                const isToday = iso(year, month, day) === iso(now.getFullYear(), now.getMonth(), now.getDate());
                return (
                  <button key={i} onClick={() => setSelectedDay(day)}
                    className={`min-w-0 overflow-hidden min-h-[56px] sm:min-h-[84px] p-1 rounded-lg border text-left align-top cursor-pointer hover:border-primary-300 ${selectedDay === day ? 'border-primary-500 bg-primary-50' : 'border-slate-100'} ${isToday ? 'ring-1 ring-primary-300' : ''}`}>
                    <span className={`text-[11px] font-bold ${isToday ? 'text-primary-600' : 'text-slate-600'}`}>{day}</span>
                    <div className="space-y-0.5 mt-0.5">
                      {total > 0 && <div className="text-[9px] leading-tight rounded px-1 bg-rose-50 text-rose-700 truncate">{inr(total)}</div>}
                      {d.funcs.length > 0 && <div className="text-[9px] leading-tight rounded px-1 bg-indigo-50 text-indigo-700 truncate">{d.funcs.length} function{d.funcs.length > 1 ? 's' : ''}</div>}
                      {d.pickups.length > 0 && <div className="text-[9px] leading-tight rounded px-1 bg-green-50 text-green-700 truncate">Pick-up {d.pickups.length}</div>}
                      {d.returns.length > 0 && <div className="text-[9px] leading-tight rounded px-1 bg-amber-50 text-amber-700 truncate">Return {d.returns.length}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 pt-3">
              <span><i className="inline-block w-2 h-2 rounded bg-rose-300 mr-1" />Overheads</span>
              <span><i className="inline-block w-2 h-2 rounded bg-indigo-300 mr-1" />Event functions</span>
              <span><i className="inline-block w-2 h-2 rounded bg-green-300 mr-1" />Rental pick-up</span>
              <span><i className="inline-block w-2 h-2 rounded bg-amber-300 mr-1" />Rental return</span>
            </div>
          </div>

          {sel && (
            <div className="card bg-white p-4 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-800">{fmtDate(iso(year, month, selectedDay))}</h4>
                <button onClick={() => openAdd(CATEGORIES[0], { date: iso(year, month, selectedDay) })} className="btn-primary py-1 px-2.5 text-[10px] flex items-center gap-1 cursor-pointer"><Plus size={10} /> Add expense</button>
              </div>
              {sel.expenses.map(r => <div key={r.id} className="flex justify-between"><span>{r.category}{r.payee ? ` – ${r.payee}` : ''}</span><b>{inr(r.amount)}</b></div>)}
              {sel.funcs.map(f => <div key={f.id} className="text-indigo-700">Function: {f.name}{f.venue ? ` @ ${f.venue}` : ''}</div>)}
              {sel.pickups.map(r => <div key={r.id} className="text-green-700">Rental pick-up: {r.customer_name}</div>)}
              {sel.returns.map(r => <div key={r.id} className="text-amber-700">Rental return: {r.customer_name}</div>)}
              {!sel.expenses.length && !sel.funcs.length && !sel.pickups.length && !sel.returns.length && <p className="text-slate-400">Nothing scheduled.</p>}
            </div>
          )}
        </div>
      )}

      {tab === 'Fixed Expenses' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => openAdd(CATEGORIES[0])} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer"><Plus size={14} /> Add Expense</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map(c => {
              const t = sum(fixedList.filter(r => r.category === c));
              return (
                <button key={c} onClick={() => openAdd(c)} className="card bg-white p-3 text-left hover:border-primary-300 cursor-pointer">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold truncate">{c}</span>
                  <span className="text-sm font-bold text-slate-700">{inr(t)}</span>
                </button>
              );
            })}
          </div>
          <ExpenseTable list={fixedList} />
        </div>
      )}

      {tab === 'Partner Salaries' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Total for month: <b>{inr(sum(salaryList(PARTNER_SALARY)))}</b></span>
            <button onClick={() => openAdd(PARTNER_SALARY)} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer"><Plus size={14} /> Add Salary</button>
          </div>
          <ExpenseTable list={salaryList(PARTNER_SALARY)} showPayee />
        </div>
      )}

      {tab === 'Labour Salaries' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Total for month: <b>{inr(sum(salaryList(LABOUR_SALARY)))}</b></span>
            <button onClick={() => openAdd(LABOUR_SALARY)} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer"><Plus size={14} /> Add Salary</button>
          </div>
          <ExpenseTable list={salaryList(LABOUR_SALARY)} showPayee />
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="bg-white w-full max-w-md rounded-2xl shadow-xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">Add Overhead Entry</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <label className="block">Category
                <select className="input-field mt-1" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {[...CATEGORIES, PARTNER_SALARY, LABOUR_SALARY].map(c => <option key={c}>{c}</option>)}
                </select>
              </label>
              {(form.category === PARTNER_SALARY || form.category === LABOUR_SALARY) && (
                <label className="block">Name<input required className="input-field mt-1" value={form.payee} onChange={e => setForm({ ...form, payee: e.target.value })} /></label>
              )}
              <div className="grid grid-cols-2 gap-3">
                <label>Date<input required type="date" className="input-field mt-1" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
                <label>Amount (₹)<input required autoFocus type="number" inputMode="decimal" min="0" className="input-field mt-1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></label>
              </div>
              <label className="block">Description<input className="input-field mt-1" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
              <div className="sheet-actions flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-1.5 px-4 cursor-pointer">Cancel</button>
                <button type="submit" className="btn-primary py-1.5 px-4 cursor-pointer">Save</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Overheads;
