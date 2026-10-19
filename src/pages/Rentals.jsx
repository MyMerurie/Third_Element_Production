import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Printer, X, Search, Phone, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => {
  if (!d) return '-';
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
};
const today = () => new Date().toISOString().split('T')[0];
const emptyItem = () => ({ particulars: '', quantity: 1, rate: 0 });
const emptyForm = () => ({
  customer_name: '', phone: '', rental_address: '',
  pickup_date: today(), return_date: '',
  labour_charges: 0, transport_charges: 0, status: 'Booked',
  items: [emptyItem()],
});

const itemsTotal = (items) => items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.rate || 0), 0);
const grandTotal = (r, items) => itemsTotal(items) + Number(r.labour_charges || 0) + Number(r.transport_charges || 0);

const Rentals = () => {
  const [rentals, setRentals] = useState([]);
  const [rentalItems, setRentalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [invoiceFor, setInvoiceFor] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const [r, i] = await Promise.all([
      supabase.from('rentals').select('*').order('created_at', { ascending: false }),
      supabase.from('rental_items').select('*').order('created_at'),
    ]);
    if (r.error) setError(r.error.message);
    setRentals(r.data || []);
    setRentalItems(i.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditId(null); setForm(emptyForm()); setShowForm(true); };
  const openEdit = (r) => {
    setEditId(r.id);
    const items = rentalItems.filter(i => i.rental_id === r.id);
    setForm({ ...r, items: items.length ? items : [emptyItem()] });
    setShowForm(true);
  };

  const setItem = (idx, key, val) =>
    setForm(f => ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, [key]: val } : it)) }));

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const { items, id, created_at, ...rental } = form;
    const payload = {
      ...rental,
      pickup_date: rental.pickup_date || null,
      return_date: rental.return_date || null,
      labour_charges: Number(rental.labour_charges || 0),
      transport_charges: Number(rental.transport_charges || 0),
    };
    let rentalId = editId;
    if (editId) {
      const { error: err } = await supabase.from('rentals').update(payload).eq('id', editId);
      if (err) return setError(err.message);
      await supabase.from('rental_items').delete().eq('rental_id', editId);
    } else {
      const { data, error: err } = await supabase.from('rentals').insert(payload).select().single();
      if (err) return setError(err.message);
      rentalId = data.id;
      const invoice_no = `RENT-${String(rentals.length + 1).padStart(4, '0')}`;
      await supabase.from('rentals').update({ invoice_no }).eq('id', rentalId);
    }
    const rows = items.filter(i => i.particulars.trim()).map(i => ({
      rental_id: rentalId, particulars: i.particulars.trim(),
      quantity: Number(i.quantity || 0), rate: Number(i.rate || 0),
    }));
    if (rows.length) {
      const { error: err } = await supabase.from('rental_items').insert(rows);
      if (err) return setError(err.message);
    }
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this rental record?')) return;
    await supabase.from('rentals').delete().eq('id', id);
    load();
  };

  const filtered = rentals.filter(r => {
    const q = query.toLowerCase();
    return !q || r.customer_name?.toLowerCase().includes(q) || r.phone?.includes(q) || r.invoice_no?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12 font-sans">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between print:hidden">
        <h2 className="text-xl font-bold text-slate-800">Rentals</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input className="input-field pl-8 py-1.5 text-xs" placeholder="Search customer, phone, invoice..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <button onClick={openNew} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer shrink-0">
            <Plus size={14} /> New Rental
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs print:hidden">{error} — has <code>supabase_migration_phase2.sql</code> been run?</div>}

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3 print:hidden">
        {loading ? (
          <p className="p-6 text-center text-slate-400 text-xs">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-slate-400 text-xs">No rentals yet. Tap “New Rental”.</p>
        ) : filtered.map(r => {
          const items = rentalItems.filter(i => i.rental_id === r.id);
          return (
            <div key={r.id} className="card bg-white p-4 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">{r.customer_name}</div>
                  <div className="text-[11px] text-slate-400">{r.invoice_no || '-'} · {r.status}</div>
                </div>
                <div className="font-bold text-slate-800 shrink-0">{inr(grandTotal(r, items))}</div>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                {r.phone && <a href={`tel:${r.phone}`} className="flex items-center gap-2 text-primary-600"><Phone size={12} />{r.phone}</a>}
                {r.rental_address && <div className="flex items-start gap-2"><MapPin size={12} className="mt-0.5 shrink-0" />{r.rental_address}</div>}
                <div>Pick-up <b>{fmtDate(r.pickup_date)}</b> → Return <b>{fmtDate(r.return_date)}</b></div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setInvoiceFor(r)} className="btn-secondary py-2 px-2 text-xs flex items-center justify-center gap-1"><Printer size={14} /> Invoice</button>
                <button onClick={() => openEdit(r)} className="btn-secondary py-2 px-2 text-xs flex items-center justify-center gap-1"><Edit2 size={14} /> Edit</button>
                <button onClick={() => remove(r.id)} className="btn-secondary py-2 px-2 text-xs flex items-center justify-center gap-1 text-red-600"><Trash2 size={14} /> Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card bg-white overflow-x-auto print:hidden hidden md:block">
        <table className="w-full text-left text-xs min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase">
              <th className="p-3">Invoice</th><th className="p-3">Customer</th><th className="p-3">Pick-up</th>
              <th className="p-3">Return</th><th className="p-3 text-right">Total</th><th className="p-3">Status</th><th className="p-3 w-28"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="7" className="p-6 text-center text-slate-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="7" className="p-6 text-center text-slate-400">No rentals yet.</td></tr>
            ) : filtered.map(r => {
              const items = rentalItems.filter(i => i.rental_id === r.id);
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-500">{r.invoice_no || '-'}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{r.customer_name}</div>
                    <div className="text-slate-400 flex items-center gap-2"><Phone size={10} />{r.phone || '-'}</div>
                    {r.rental_address && <div className="text-slate-400 flex items-center gap-2 truncate max-w-[220px]"><MapPin size={10} />{r.rental_address}</div>}
                  </td>
                  <td className="p-3">{fmtDate(r.pickup_date)}</td>
                  <td className="p-3">{fmtDate(r.return_date)}</td>
                  <td className="p-3 text-right font-bold">{inr(grandTotal(r, items))}</td>
                  <td className="p-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-200">{r.status}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2 justify-end text-slate-500">
                      <button title="Invoice" onClick={() => setInvoiceFor(r)} className="hover:text-primary-600 cursor-pointer"><Printer size={14} /></button>
                      <button title="Edit" onClick={() => openEdit(r)} className="hover:text-primary-600 cursor-pointer"><Edit2 size={14} /></button>
                      <button title="Delete" onClick={() => remove(r.id)} className="hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden" onClick={() => setShowForm(false)}>
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-bold text-sm text-slate-800">{editId ? 'Edit Rental' : 'New Rental'}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label>Customer name *<input required className="input-field mt-1" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} /></label>
                <label>Phone number<input type="tel" inputMode="tel" className="input-field mt-1" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
                <label className="sm:col-span-2">Rental address<input className="input-field mt-1" value={form.rental_address || ''} onChange={e => setForm({ ...form, rental_address: e.target.value })} /></label>
                <label>Date of pick-up<input type="date" className="input-field mt-1" value={form.pickup_date || ''} onChange={e => setForm({ ...form, pickup_date: e.target.value })} /></label>
                <label>Date of return<input type="date" className="input-field mt-1" value={form.return_date || ''} onChange={e => setForm({ ...form, return_date: e.target.value })} /></label>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-600">Particulars</span>
                  <button type="button" onClick={() => setForm({ ...form, items: [...form.items, emptyItem()] })} className="text-primary-600 font-bold cursor-pointer">+ Add row</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((it, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 p-2 space-y-2 bg-slate-50/50">
                      <div className="flex gap-2">
                        <input className="input-field flex-1" placeholder="Particulars (item name)" value={it.particulars} onChange={e => setItem(idx, 'particulars', e.target.value)} />
                        {form.items.length > 1 && (
                          <button type="button" aria-label="Remove row" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })} className="px-2 text-slate-400 hover:text-red-500 cursor-pointer"><X size={16} /></button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className="text-[10px] uppercase text-slate-400">Qty
                          <input type="number" inputMode="decimal" min="0" className="input-field mt-0.5" value={it.quantity} onFocus={e => e.target.select()} onChange={e => setItem(idx, 'quantity', e.target.value)} />
                        </label>
                        <label className="text-[10px] uppercase text-slate-400">Rate
                          <input type="number" inputMode="decimal" min="0" className="input-field mt-0.5" value={it.rate} onFocus={e => e.target.select()} onChange={e => setItem(idx, 'rate', e.target.value)} />
                        </label>
                        <div className="text-right">
                          <span className="block text-[10px] uppercase text-slate-400">Amount</span>
                          <span className="font-bold text-sm">{inr(Number(it.quantity || 0) * Number(it.rate || 0))}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm({ ...form, items: [...form.items, emptyItem()] })} className="w-full py-2.5 rounded-xl border-2 border-dashed border-primary-200 text-primary-600 font-bold cursor-pointer">+ Add another item</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label>Labour charges<input type="number" min="0" className="input-field mt-1" value={form.labour_charges} onChange={e => setForm({ ...form, labour_charges: e.target.value })} /></label>
                <label>Transport charges<input type="number" min="0" className="input-field mt-1" value={form.transport_charges} onChange={e => setForm({ ...form, transport_charges: e.target.value })} /></label>
                <label>Status
                  <select className="input-field mt-1" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {['Booked', 'Picked Up', 'Returned', 'Closed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </label>
              </div>

              <div className="sheet-actions flex justify-between items-center gap-3 pt-3 border-t border-slate-100">
                <span className="font-bold text-sm shrink-0">Total: {inr(grandTotal(form, form.items))}</span>
                <div className="flex gap-2 flex-1 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-1.5 px-4 cursor-pointer">Cancel</button>
                  <button type="submit" className="btn-primary py-1.5 px-4 cursor-pointer">Save</button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Invoice (printable) */}
      {invoiceFor && (() => {
        const items = rentalItems.filter(i => i.rental_id === invoiceFor.id);
        const sub = itemsTotal(items);
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4 print:static print:bg-white print:p-0" onClick={() => setInvoiceFor(null)}>
            <div className="bg-white max-w-3xl mx-auto rounded-xl shadow-xl p-8 text-sm print:shadow-none print:rounded-none" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start print:hidden mb-4">
                <button onClick={() => window.print()} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer"><Printer size={14} /> Print / Save PDF</button>
                <button onClick={() => setInvoiceFor(null)} className="text-slate-400"><X size={18} /></button>
              </div>
              <div className="flex justify-between border-b pb-4">
                <div>
                  <h1 className="text-xl font-bold text-primary-600">Third Element Productions</h1>
                  <p className="text-xs text-slate-500">Rental Invoice</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold">{invoiceFor.invoice_no}</p>
                  <p>Date: {fmtDate(today())}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 py-4 text-xs">
                <div>
                  <p className="text-slate-400 uppercase text-[10px]">Billed to</p>
                  <p className="font-bold text-sm">{invoiceFor.customer_name}</p>
                  <p>{invoiceFor.phone}</p>
                  <p>{invoiceFor.rental_address}</p>
                </div>
                <div className="text-right">
                  <p><span className="text-slate-400">Pick-up:</span> {fmtDate(invoiceFor.pickup_date)}</p>
                  <p><span className="text-slate-400">Return:</span> {fmtDate(invoiceFor.return_date)}</p>
                </div>
              </div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-y border-slate-300 bg-slate-50 text-left">
                    <th className="p-2">#</th><th className="p-2">Particulars</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Rate</th><th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={it.id} className="border-b border-slate-100">
                      <td className="p-2">{i + 1}</td><td className="p-2">{it.particulars}</td>
                      <td className="p-2 text-right">{it.quantity}</td><td className="p-2 text-right">{inr(it.rate)}</td>
                      <td className="p-2 text-right">{inr(it.quantity * it.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="ml-auto w-64 mt-4 space-y-1 text-xs">
                <div className="flex justify-between"><span>Sub-total</span><span>{inr(sub)}</span></div>
                <div className="flex justify-between"><span>Labour</span><span>{inr(invoiceFor.labour_charges)}</span></div>
                <div className="flex justify-between"><span>Transport</span><span>{inr(invoiceFor.transport_charges)}</span></div>
                <div className="flex justify-between font-bold text-sm border-t pt-2"><span>Total</span><span>{inr(grandTotal(invoiceFor, items))}</span></div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Rentals;
