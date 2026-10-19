import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Search, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';

const CONDITIONS = ['New', 'Used', 'Repair', 'Refurbish', 'Discard'];
const conditionBadge = {
  New: 'bg-green-50 text-green-700 border-green-200',
  Used: 'bg-blue-50 text-blue-700 border-blue-200',
  Repair: 'bg-amber-50 text-amber-700 border-amber-200',
  Refurbish: 'bg-purple-50 text-purple-700 border-purple-200',
  Discard: 'bg-red-50 text-red-700 border-red-200',
};
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const emptyForm = () => ({ code: '', name: '', description: '', available_qty: 0, price: 0, image_url: '', condition: 'New' });

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [condFilter, setCondFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [imageFile, setImageFile] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from('inventory_items').select('*').order('code');
    if (err) setError(err.message);
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditId(null); setForm(emptyForm()); setImageFile(null); setShowForm(true); };
  const openEdit = (it) => { setEditId(it.id); setForm({ ...emptyForm(), ...it }); setImageFile(null); setShowForm(true); };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      let image_url = form.image_url || null;
      if (imageFile) image_url = await uploadFile(imageFile, 'inventory');
      const { id, created_at, ...rest } = form;
      const payload = {
        ...rest, image_url,
        code: rest.code.trim(),
        available_qty: Number(rest.available_qty || 0),
        price: Number(rest.price || 0),
      };
      const { error: err } = editId
        ? await supabase.from('inventory_items').update(payload).eq('id', editId)
        : await supabase.from('inventory_items').insert(payload);
      if (err) throw err;
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this inventory item?')) return;
    await supabase.from('inventory_items').delete().eq('id', id);
    load();
  };

  const filtered = items.filter(i => {
    const q = query.toLowerCase();
    const match = !q || i.code?.toLowerCase().includes(q) || i.name?.toLowerCase().includes(q);
    return match && (!condFilter || i.condition === condFilter);
  });
  const totalValue = filtered.reduce((s, i) => s + Number(i.available_qty || 0) * Number(i.price || 0), 0);

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12 font-sans">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Inventory</h2>
          <p className="text-xs text-slate-400">{filtered.length} items · stock value {inr(totalValue)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input className="input-field pl-8 py-1.5 text-xs" placeholder="Search code or name..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <select className="input-field py-1.5 text-xs w-auto" value={condFilter} onChange={e => setCondFilter(e.target.value)}>
            <option value="">All conditions</option>
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={openNew} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer shrink-0"><Plus size={14} /> Add Item</button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs">{error} — has <code>supabase_migration_phase2.sql</code> been run?</div>}

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="p-6 text-center text-slate-400 text-xs">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-slate-400 text-xs">No inventory items yet. Tap “Add Item”.</p>
        ) : filtered.map(it => (
          <div key={it.id} className="card bg-white p-3 flex gap-3">
            {it.image_url
              ? <img src={it.image_url} alt={it.name} className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0" />
              : <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 shrink-0"><ImageIcon size={24} /></div>}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 text-sm truncate">{it.name}</div>
                  <div className="text-[11px] text-slate-400">{it.code}</div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${conditionBadge[it.condition] || ''}`}>{it.condition}</span>
              </div>
              <div className="text-xs text-slate-600">Qty <b>{it.available_qty}</b> · {inr(it.price)}</div>
              {it.description && <p className="text-[11px] text-slate-400 line-clamp-2">{it.description}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => openEdit(it)} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"><Edit2 size={12} /> Edit</button>
                <button onClick={() => remove(it.id)} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 text-red-600"><Trash2 size={12} /> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card bg-white overflow-x-auto hidden md:block">
        <table className="w-full text-left text-xs min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase">
              <th className="p-3 w-16">Image</th><th className="p-3">Code</th><th className="p-3">Product</th>
              <th className="p-3 text-right">Available</th><th className="p-3 text-right">Price</th><th className="p-3">Condition</th><th className="p-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="7" className="p-6 text-center text-slate-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="7" className="p-6 text-center text-slate-400">No inventory items yet.</td></tr>
            ) : filtered.map(it => (
              <React.Fragment key={it.id}>
                <tr className="hover:bg-slate-50">
                  <td className="p-3">
                    {it.image_url
                      ? <img src={it.image_url} alt={it.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                      : <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300"><ImageIcon size={16} /></div>}
                  </td>
                  <td className="p-3 font-semibold text-slate-500">{it.code}</td>
                  <td className="p-3">
                    <button onClick={() => setExpanded(expanded === it.id ? null : it.id)} className="font-bold text-slate-800 hover:text-primary-600 text-left cursor-pointer">
                      {it.name} {it.description && <span className="text-[10px] text-primary-500 font-normal">{expanded === it.id ? '▲ hide' : '▼ details'}</span>}
                    </button>
                  </td>
                  <td className="p-3 text-right font-semibold">{it.available_qty}</td>
                  <td className="p-3 text-right">{inr(it.price)}</td>
                  <td className="p-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${conditionBadge[it.condition] || ''}`}>{it.condition}</span></td>
                  <td className="p-3">
                    <div className="flex gap-2 justify-end text-slate-500">
                      <button onClick={() => openEdit(it)} className="hover:text-primary-600 cursor-pointer"><Edit2 size={14} /></button>
                      <button onClick={() => remove(it.id)} className="hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
                {expanded === it.id && (
                  <tr className="bg-slate-50/70">
                    <td></td>
                    <td colSpan="6" className="p-3 text-slate-600">
                      <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Product description</span>
                      {it.description || 'No description.'}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">{editId ? 'Edit Item' : 'Add Inventory Item'}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label>Inventory code *<input required className="input-field mt-1" placeholder="e.g. FUR-001" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></label>
                <label>Condition
                  <select className="input-field mt-1" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="col-span-2">Name of the product *<input required className="input-field mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
                <label className="col-span-2">Product description<textarea rows="3" className="input-field mt-1" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
                <label>Available qty<input type="number" inputMode="numeric" min="0" className="input-field mt-1" value={form.available_qty} onFocus={e => e.target.select()} onChange={e => setForm({ ...form, available_qty: e.target.value })} /></label>
                <label>Price (₹)<input type="number" inputMode="decimal" min="0" className="input-field mt-1" value={form.price} onFocus={e => e.target.select()} onChange={e => setForm({ ...form, price: e.target.value })} /></label>
                <label className="col-span-2">Image
                  <input type="file" accept="image/*" capture="environment" className="input-field mt-1" onChange={e => setImageFile(e.target.files[0] || null)} />
                  {form.image_url && !imageFile && <img src={form.image_url} alt="" className="mt-2 w-16 h-16 rounded-lg object-cover border" />}
                </label>
              </div>
              <div className="sheet-actions flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-1.5 px-4 cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary py-1.5 px-4 cursor-pointer disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Inventory;
