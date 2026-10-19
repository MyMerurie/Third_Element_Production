import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const fmtDate = (d) => { const [y, m, day] = d.split('T')[0].split('-'); return `${day}/${m}/${y}`; };

const FILTERS = [
  { key: 'functions', label: 'Event functions', dot: 'bg-indigo-300', chip: 'bg-indigo-50 text-indigo-700' },
  { key: 'meetings', label: 'Meetings', dot: 'bg-sky-300', chip: 'bg-sky-50 text-sky-700' },
  { key: 'pickups', label: 'Rental pick-up', dot: 'bg-green-300', chip: 'bg-green-50 text-green-700' },
  { key: 'returns', label: 'Rental return', dot: 'bg-amber-300', chip: 'bg-amber-50 text-amber-700' },
  { key: 'overheads', label: 'Overheads', dot: 'bg-rose-300', chip: 'bg-rose-50 text-rose-700' },
];

const Calendar = () => {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [show, setShow] = useState({ functions: true, meetings: true, pickups: true, returns: true, overheads: true });
  const [functions, setFunctions] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [overheads, setOverheads] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    (async () => {
      const [f, m, r, o, e] = await Promise.all([
        supabase.from('event_functions').select('id,event_id,name,function_date,venue'),
        supabase.from('event_meetings').select('id,event_id,meeting_date,meeting_time,meeting_type'),
        supabase.from('rentals').select('id,customer_name,pickup_date,return_date'),
        supabase.from('overhead_expenses').select('id,date,category,payee,amount'),
        supabase.from('events').select('id,name'),
      ]);
      setFunctions(f.data || []);
      setMeetings(m.data || []);
      setRentals(r.data || []);
      setOverheads(o.data || []);
      setEvents(e.data || []);
    })();
  }, []);

  const eventName = (id) => events.find(e => e.id === id)?.name || 'Event';
  const shiftMonth = (delta) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear()); setMonth(d.getMonth()); setSelectedDay(null);
  };

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const dayData = (day) => {
    const d = iso(year, month, day);
    return {
      functions: show.functions ? functions.filter(f => f.function_date === d) : [],
      meetings: show.meetings ? meetings.filter(m => m.meeting_date?.split('T')[0] === d) : [],
      pickups: show.pickups ? rentals.filter(r => r.pickup_date === d) : [],
      returns: show.returns ? rentals.filter(r => r.return_date === d) : [],
      overheads: show.overheads ? overheads.filter(o => o.date === d) : [],
    };
  };
  const sel = selectedDay ? dayData(selectedDay) : null;
  const todayIso = iso(now.getFullYear(), now.getMonth(), now.getDate());
  const chip = (key) => FILTERS.find(f => f.key === key).chip;

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12 font-sans min-w-0">
      <button onClick={() => navigate('/more')} className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 font-semibold text-sm cursor-pointer">
        <ArrowLeft size={16} /><span>Back to More Menu</span>
      </button>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Calendar</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => shiftMonth(-1)} aria-label="Previous month" className="p-1.5 rounded-lg border bg-white cursor-pointer"><ChevronLeft size={14} /></button>
          <span className="font-bold text-sm w-36 text-center">{MONTHS[month]} {year}</span>
          <button onClick={() => shiftMonth(1)} aria-label="Next month" className="p-1.5 rounded-lg border bg-white cursor-pointer"><ChevronRight size={14} /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setShow({ ...show, [f.key]: !show[f.key] })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${show[f.key] ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <i className={`inline-block w-2 h-2 rounded-full ${show[f.key] ? f.dot : 'bg-slate-200'}`} />{f.label}
          </button>
        ))}
      </div>

      <div className="card bg-white p-3">
        <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] text-center text-[10px] font-bold uppercase text-slate-400 pb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const d = dayData(day);
            const total = d.overheads.reduce((s, r) => s + Number(r.amount || 0), 0);
            const isToday = iso(year, month, day) === todayIso;
            const dots = FILTERS.filter(f => d[f.key].length > 0);
            return (
              <button key={i} onClick={() => setSelectedDay(day)}
                className={`min-w-0 overflow-hidden min-h-[56px] sm:min-h-[92px] p-1 rounded-lg border text-left align-top cursor-pointer hover:border-primary-300 ${selectedDay === day ? 'border-primary-500 bg-primary-50' : 'border-slate-100'} ${isToday ? 'ring-1 ring-primary-300' : ''}`}>
                <span className={`text-[11px] font-bold ${isToday ? 'text-primary-600' : 'text-slate-600'}`}>{day}</span>
                {/* phones: coloured dots; larger screens: text chips */}
                <div className="flex flex-wrap gap-0.5 mt-1 sm:hidden">
                  {dots.map(f => <i key={f.key} className={`w-1.5 h-1.5 rounded-full ${f.dot}`} />)}
                </div>
                <div className="hidden sm:block space-y-0.5 mt-0.5">
                  {total > 0 && <div className={`text-[9px] leading-tight rounded px-1 truncate ${chip('overheads')}`}>{inr(total)}</div>}
                  {d.functions.length > 0 && <div className={`text-[9px] leading-tight rounded px-1 truncate ${chip('functions')}`}>{d.functions.length} function{d.functions.length > 1 ? 's' : ''}</div>}
                  {d.meetings.length > 0 && <div className={`text-[9px] leading-tight rounded px-1 truncate ${chip('meetings')}`}>{d.meetings.length} meeting{d.meetings.length > 1 ? 's' : ''}</div>}
                  {d.pickups.length > 0 && <div className={`text-[9px] leading-tight rounded px-1 truncate ${chip('pickups')}`}>Pick-up {d.pickups.length}</div>}
                  {d.returns.length > 0 && <div className={`text-[9px] leading-tight rounded px-1 truncate ${chip('returns')}`}>Return {d.returns.length}</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {sel && (
        <div className="card bg-white p-4 text-xs space-y-2">
          <h4 className="font-bold text-slate-800 text-sm">{fmtDate(iso(year, month, selectedDay))}</h4>
          {sel.functions.map(f => (
            <Link key={f.id} to={`/events/${f.event_id}`} className="block text-indigo-700 hover:underline">
              Function: {f.name} — {eventName(f.event_id)}{f.venue ? ` @ ${f.venue}` : ''}
            </Link>
          ))}
          {sel.meetings.map(m => (
            <Link key={m.id} to={`/events/${m.event_id}`} className="block text-sky-700 hover:underline">
              Meeting{m.meeting_type ? ` (${m.meeting_type})` : ''}{m.meeting_time ? ` ${m.meeting_time.slice(0, 5)}` : ''} — {eventName(m.event_id)}
            </Link>
          ))}
          {sel.pickups.map(r => <Link key={r.id} to="/rentals" className="block text-green-700 hover:underline">Rental pick-up: {r.customer_name}</Link>)}
          {sel.returns.map(r => <Link key={r.id} to="/rentals" className="block text-amber-700 hover:underline">Rental return: {r.customer_name}</Link>)}
          {sel.overheads.map(o => (
            <Link key={o.id} to="/overheads" className="flex justify-between text-rose-700 hover:underline">
              <span>{o.category}{o.payee ? ` – ${o.payee}` : ''}</span><b>{inr(o.amount)}</b>
            </Link>
          ))}
          {Object.values(sel).every(a => a.length === 0) && <p className="text-slate-400">Nothing scheduled.</p>}
        </div>
      )}
    </div>
  );
};

export default Calendar;
