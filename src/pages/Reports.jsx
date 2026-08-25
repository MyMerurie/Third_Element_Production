import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, Calendar, Filter, Download, Printer, 
  IndianRupee, TrendingUp, TrendingDown, FileText, Check, AlertCircle 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const cleanStr = dateString.split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
};

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState(null); // null, 'budget', 'daybook', 'budget_vs_actual', 'profitability'
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Loaded DB data
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [clientPayments, setClientPayments] = useState([]);
  const [vendorPayments, setVendorPayments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);

  // Sub-report states
  const [selectedEventId, setSelectedEventId] = useState('');
  
  // Daybook filters
  const [daybookStartDate, setDaybookStartDate] = useState('');
  const [daybookEndDate, setDaybookEndDate] = useState('');
  const [daybookAccountId, setDaybookAccountId] = useState('');
  
  // Profitability filters
  const [profitYear, setProfitYear] = useState('');
  const [profitMonth, setProfitMonth] = useState('');

  // Budget calculations
  const [taxRate, setTaxRate] = useState(18); // default 18% GST
  const [discountAmount, setDiscountAmount] = useState(0);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadBaseData = async () => {
    setLoading(true);
    try {
      const [
        resEvents, resClients, resVendors, resExpenses, 
        resClientPay, resVendorPay, resCategories, resAccounts, resMethods
      ] = await Promise.all([
        supabase.from('events').select('*').order('name'),
        supabase.from('clients').select('*'),
        supabase.from('vendors').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('client_payments').select('*'),
        supabase.from('vendor_payments').select('*'),
        supabase.from('master_expense_categories').select('*'),
        supabase.from('master_accounts').select('*'),
        supabase.from('master_payment_methods').select('*')
      ]);

      if (resEvents.data) setEvents(resEvents.data);
      if (resClients.data) setClients(resClients.data);
      if (resVendors.data) setVendors(resVendors.data);
      if (resExpenses.data) setExpenses(resExpenses.data);
      if (resClientPay.data) setClientPayments(resClientPay.data);
      if (resVendorPay.data) setVendorPayments(resVendorPay.data);
      if (resCategories.data) setCategories(resCategories.data);
      if (resAccounts.data) setAccounts(resAccounts.data);
      if (resMethods.data) setPaymentMethods(resMethods.data);

      if (resEvents.data && resEvents.data.length > 0) {
        setSelectedEventId(resEvents.data[0].id);
      }
    } catch (err) {
      console.error(err);
      showNotification("Error loading data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  // Fetch budget items when selected event changes
  useEffect(() => {
    if (selectedEventId) {
      supabase.from('budget_items')
        .select('*')
        .eq('event_id', selectedEventId)
        .then(({ data }) => {
          if (data) setBudgetItems(data);
        });
    }
  }, [selectedEventId]);

  const reportsList = [
    { id: 'budget', title: 'Budget Report', desc: 'Pre-event costing, markup estimation, tax/discount quotations' },
    { id: 'daybook', title: 'Master Day Book', desc: 'Central accounting ledger of cash inflows and outflows' },
    { id: 'budget_vs_actual', title: 'Budget vs Actual', desc: 'Compare projected category budgets with actual transaction expenses' },
    { id: 'profitability', title: 'Profitability Report', desc: 'Profit margins and revenue success rate per event' },
  ];

  // Helper Excel Export
  const exportExcel = (jsonData, fileName) => {
    try {
      const ws = XLSX.utils.json_to_sheet(jsonData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showNotification("Excel exported successfully!");
    } catch (err) {
      console.error(err);
      showNotification("Export failed", "error");
    }
  };

  // ----------------------------------------------------
  // REPORT 1: BUDGET REPORT DATA PREP
  // ----------------------------------------------------
  const currentEvent = events.find(e => e.id === selectedEventId);
  const currentClient = currentEvent ? clients.find(c => c.id === currentEvent.client_id) : null;
  
  const budgetByCategory = categories.map(cat => {
    const items = budgetItems.filter(b => b.category_id === cat.id);
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.estimated_cost || 0)), 0);
    return { ...cat, items, subtotal };
  }).filter(c => c.items.length > 0);

  const rawBudgetSubtotal = budgetByCategory.reduce((sum, c) => sum + c.subtotal, 0);
  const taxAmount = Number(((rawBudgetSubtotal * taxRate) / 100).toFixed(2));
  const finalQuoteAmount = rawBudgetSubtotal + taxAmount - Number(discountAmount);

  const handleExportBudgetReport = () => {
    const rows = [];
    budgetByCategory.forEach(cat => {
      rows.push({ Category: cat.name.toUpperCase(), Item: '', Qty: '', Unit: '', 'Unit Cost': '', Total: '' });
      
      cat.items.forEach(item => {
        if (item.is_sub_header) {
          rows.push({ Category: `  > ${item.description}`, Item: '', Qty: '', Unit: '', 'Unit Cost': '', Total: '' });
        } else {
          const v = vendors.find(vend => vend.id === item.vendor_id);
          rows.push({
            Category: '',
            Item: item.description,
            Vendor: v ? v.name : 'Self',
            Qty: item.quantity,
            Unit: item.unit,
            'Unit Cost': item.estimated_cost,
            Total: Number(item.quantity || 1) * Number(item.estimated_cost || 0)
          });
        }
      });
      rows.push({ Category: `Subtotal ${cat.name}`, Item: '', Qty: '', Unit: '', 'Unit Cost': '', Total: cat.subtotal });
    });
    rows.push({});
    rows.push({ Category: 'BUDGET SUBTOTAL', Total: rawBudgetSubtotal });
    rows.push({ Category: `GST (${taxRate}%)`, Total: taxAmount });
    rows.push({ Category: 'DISCOUNT', Total: Number(discountAmount) });
    rows.push({ Category: 'FINAL QUOTATION TOTAL', Total: finalQuoteAmount });

    exportExcel(rows, `budget_report_${currentEvent?.name.replace(/\s+/g, '_')}`);
  };

  // ----------------------------------------------------
  // REPORT 2: MASTER DAY BOOK PREP
  // ----------------------------------------------------
  const getDaybookTransactions = () => {
    const txs = [];

    // 1. Client Payments (Inflow - Credit)
    clientPayments.forEach(p => {
      const evt = events.find(e => e.id === p.event_id);
      const method = paymentMethods.find(m => m.id === p.payment_method_id);
      
      txs.push({
        id: p.id,
        date: p.date,
        type: 'Credit',
        event: evt ? evt.name : 'Client Payment',
        particular: 'Payment Received from Client' + (p.notes ? ` (${p.notes})` : ''),
        credit: Number(p.amount_received),
        debit: 0,
        debit: 0,
        account: p.account || 'N/A',
        method: method ? method.name : 'N/A',
        reference: p.reference_number || '-',
        narration: p.narration || '',
        sourceTable: 'client_payments'
      });
    });

    // 2. Expenses (Outflow - Debit)
    expenses.forEach(e => {
      const evt = events.find(evt => evt.id === e.event_id);
      const acc = accounts.find(a => a.id === e.account_id);
      const method = paymentMethods.find(m => m.id === e.payment_method_id);
      const cat = categories.find(c => c.id === e.category_id);
      const vend = vendors.find(v => v.id === e.vendor_id);
      
      txs.push({
        id: e.id,
        date: e.date,
        type: 'Debit',
        event: evt ? evt.name : 'Expense',
        particular: `Expense: ${cat ? cat.name : 'General'} (${vend ? vend.name : 'Self'}) - ${e.remarks || ''}`,
        credit: 0,
        debit: Number(e.amount),
        debit: Number(e.amount),
        account: acc ? acc.name : 'N/A',
        method: method ? method.name : 'N/A',
        reference: '-',
        narration: e.narration || '',
        sourceTable: 'expenses'
      });
    });

    // 3. Vendor Payments (Outflow - Debit)
    vendorPayments.forEach(vp => {
      const evt = events.find(evt => evt.id === vp.event_id);
      const acc = accounts.find(a => a.id === vp.account_id);
      const method = paymentMethods.find(m => m.id === vp.payment_method_id);
      const vend = vendors.find(v => v.id === vp.vendor_id);

      txs.push({
        id: vp.id,
        date: vp.date,
        type: 'Debit',
        event: evt ? evt.name : 'Vendor Payment',
        particular: `Payment Out to Vendor: ${vend ? vend.name : 'Vendor'}`,
        credit: 0,
        debit: Number(vp.amount),
        debit: Number(vp.amount),
        account: acc ? acc.name : 'N/A',
        method: method ? method.name : 'N/A',
        reference: vp.reference_number || '-',
        narration: vp.narration || '',
        sourceTable: 'vendor_payments'
      });
    });

    // Sort descending by date
    let filteredTxs = txs.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filters
    if (daybookStartDate) filteredTxs = filteredTxs.filter(t => t.date >= daybookStartDate);
    if (daybookEndDate) filteredTxs = filteredTxs.filter(t => t.date <= daybookEndDate);
    if (daybookAccountId) {
      const accObj = accounts.find(a => a.id === daybookAccountId);
      if (accObj) filteredTxs = filteredTxs.filter(t => t.account === accObj.name);
    }

    return filteredTxs;
  };

  const daybookTransactions = getDaybookTransactions();
  const totalDebit = daybookTransactions.reduce((sum, t) => sum + t.debit, 0);
  const totalCredit = daybookTransactions.reduce((sum, t) => sum + t.credit, 0);
  const netDaybookBalance = totalCredit - totalDebit;

  const handleUpdateNarration = async (id, sourceTable, newNarration) => {
    try {
      const { error } = await supabase.from(sourceTable).update({ narration: newNarration }).eq('id', id);
      if (error) throw error;
      
      // Update local state
      if (sourceTable === 'client_payments') {
        setClientPayments(prev => prev.map(p => p.id === id ? { ...p, narration: newNarration } : p));
      } else if (sourceTable === 'expenses') {
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, narration: newNarration } : e));
      } else if (sourceTable === 'vendor_payments') {
        setVendorPayments(prev => prev.map(vp => vp.id === id ? { ...vp, narration: newNarration } : vp));
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to save narration", "error");
    }
  };

  const handleExportDaybook = () => {
    const formatted = daybookTransactions.map(t => ({
      Date: t.date,
      Type: t.type,
      Event: t.event,
      Particular: t.particular,
      Debit: t.debit || '',
      Credit: t.credit || '',
      Account: t.account,
      Method: t.method,
      Reference: t.reference,
      Narration: t.narration
    }));
    exportExcel(formatted, "master_day_book");
  };

  // ----------------------------------------------------
  // REPORT 3: BUDGET VS ACTUAL PREP
  // ----------------------------------------------------
  const getBudgetVsActualData = () => {
    if (!selectedEventId) return [];
    
    // Group actual costs by category from budgetItems (qty * actual_cost)
    const actualByCategory = {};
    budgetItems.forEach(bi => {
      if (!actualByCategory[bi.category_id]) actualByCategory[bi.category_id] = 0;
      actualByCategory[bi.category_id] += (Number(bi.quantity || 1) * Number(bi.actual_cost || 0));
    });

    // Group budget items (estimated costs) by category
    const budgetMap = {};
    budgetItems.forEach(bi => {
      if (!budgetMap[bi.category_id]) budgetMap[bi.category_id] = 0;
      budgetMap[bi.category_id] += (Number(bi.quantity || 1) * Number(bi.estimated_cost || 0));
    });

    // Build comparison
    return categories.map(cat => {
      const budgeted = budgetMap[cat.id] || 0;
      const actual = actualByCategory[cat.id] || 0;
      const difference = budgeted - actual;
      const variancePercent = budgeted > 0 ? ((actual - budgeted) / budgeted) * 100 : (actual > 0 ? 100 : 0);
      
      let status = 'On Budget';
      if (difference < 0) status = 'Over Budget';
      else if (difference > 0) status = 'Under Budget';

      return {
        id: cat.id,
        category: cat.name,
        budgeted,
        actual,
        difference,
        variancePercent,
        status
      };
    }).filter(c => c.budgeted > 0 || c.actual > 0);
  };

  const bvsData = getBudgetVsActualData();
  const bvsTotalBudget = bvsData.reduce((sum, item) => sum + item.budgeted, 0);
  const bvsTotalActual = bvsData.reduce((sum, item) => sum + item.actual, 0);
  const bvsTotalDiff = bvsTotalBudget - bvsTotalActual;
  const bvsVariancePercent = bvsTotalBudget > 0 ? ((bvsTotalActual - bvsTotalBudget) / bvsTotalBudget) * 100 : (bvsTotalActual > 0 ? 100 : 0);

  // Simple insights
  const overBudgetCats = bvsData.filter(i => i.status === 'Over Budget').sort((a, b) => a.difference - b.difference); // largest negative difference first
  const highestOverspent = overBudgetCats[0] || null;

  const underBudgetCats = bvsData.filter(i => i.status === 'Under Budget').sort((a, b) => b.difference - a.difference); // largest positive difference first
  const highestSaved = underBudgetCats[0] || null;

  const handleExportBvs = () => {
    const formatted = bvsData.map(i => ({
      Category: i.category,
      Budgeted: i.budgeted,
      Actual: i.actual,
      Difference: i.difference,
      'Variance %': i.variancePercent.toFixed(1) + '%',
      Status: i.status
    }));
    exportExcel(formatted, `budget_vs_actual_${currentEvent?.name.replace(/\s+/g, '_')}`);
  };

  // ----------------------------------------------------
  // REPORT 4: PROFITABILITY REPORT PREP
  // ----------------------------------------------------
  const getProfitabilityData = () => {
    const eventStats = events.map(evt => {
      // closing budget for this event (Revenue)
      const rev = Number(evt.budget_actual || 0);

      // actual cost for this event (Cost)
      const cost = Number(evt.budget_actual_cost || 0);

      const netProfit = rev - cost;
      const profitMargin = rev > 0 ? (netProfit / rev) * 100 : 0;
      
      const client = clients.find(c => c.id === evt.client_id);
      
      return {
        id: evt.id,
        name: evt.name,
        client: client ? client.name : 'Unknown',
        revenue: rev,
        expenses: cost,
        profit: netProfit,
        margin: profitMargin,
        status: evt.status,
        date: evt.created_at
      };
    });

    let filtered = eventStats;

    // Filters
    if (profitYear) {
      filtered = filtered.filter(e => e.date && new Date(e.date).getFullYear().toString() === profitYear);
    }
    if (profitMonth) {
      filtered = filtered.filter(e => e.date && new Date(e.date).getMonth().toString() === profitMonth);
    }

    return filtered;
  };

  const profitabilityData = getProfitabilityData();
  const overallRevenue = profitabilityData.reduce((sum, e) => sum + e.revenue, 0);
  const overallExpenses = profitabilityData.reduce((sum, e) => sum + e.expenses, 0);
  const overallProfit = overallRevenue - overallExpenses;
  const overallMargin = overallRevenue > 0 ? (overallProfit / overallRevenue) * 100 : 0;

  const handleExportProfitability = () => {
    const formatted = profitabilityData.map(e => ({
      Event: e.name,
      Client: e.client,
      Revenue: e.revenue,
      Expenses: e.expenses,
      Profit: e.profit,
      'Margin %': e.margin.toFixed(1) + '%',
      Status: e.status
    }));
    exportExcel(formatted, "event_profitability_report");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-white flex items-center space-x-2 transition-all duration-300 bg-green-500 border-green-600`}>
          <Check size={18} />
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex justify-between items-center">
        {selectedReport ? (
          <button 
            onClick={() => setSelectedReport(null)}
            className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold text-sm cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Reports</span>
          </button>
        ) : (
          <h2 className="text-xl font-bold text-slate-800">Financial Reports & Audits</h2>
        )}
      </div>

      {/* REPORT LANDING SELECTOR */}
      {!selectedReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportsList.map((report) => (
            <div 
              key={report.id} 
              onClick={() => setSelectedReport(report.id)}
              className="card p-5 hover:border-primary-500 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between h-40 bg-white"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <h3 className="font-bold text-slate-800 group-hover:text-primary-600 text-md">{report.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{report.desc}</p>
              </div>
              <span className="text-xs font-semibold text-primary-600 self-end flex items-center">View Report &rarr;</span>
            </div>
          ))}
        </div>
      )}

      {/* REPORT WINDOWS */}
      {selectedReport === 'budget' && (
        <div className="space-y-4">
          {/* Controls Card */}
          <div className="card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold text-slate-600">Select Event:</label>
              <select 
                className="input-field py-1.5 px-3 text-xs w-64 bg-slate-50 border-slate-200"
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
              >
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={handleExportBudgetReport}
                className="btn-secondary flex-1 md:flex-none flex items-center justify-center space-x-1 py-1.5 text-xs bg-white cursor-pointer"
              >
                <Download size={14} /> <span>Excel</span>
              </button>
              <button 
                onClick={() => window.print()}
                className="btn-secondary flex-1 md:flex-none flex items-center justify-center space-x-1 py-1.5 text-xs bg-white cursor-pointer"
              >
                <Printer size={14} /> <span>Print</span>
              </button>
            </div>
          </div>

          {/* Printable Report Document */}
          <div className="card p-8 bg-white space-y-6 border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none">
            {/* Header info */}
            <div className="flex justify-between border-b border-slate-200 pb-5">
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-primary-600 tracking-wider">Project Quotation Costing</span>
                <h3 className="text-xl font-bold text-slate-800">{currentEvent?.name}</h3>
                <p className="text-xs text-slate-500">Client: {currentClient?.name || 'N/A'} | Phone: {currentClient?.phone || 'N/A'}</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>Serial ID: {currentEvent?.event_id_serial || 'TBD'}</p>
                <p>Status: {currentEvent?.status}</p>
                <p>Date: {new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            {/* List items by Category */}
            {budgetByCategory.length === 0 ? (
              <p className="text-center text-slate-400 py-12 text-sm">No items in the budget sheet.</p>
            ) : (
              <div className="space-y-6">
                {budgetByCategory.map(cat => (
                  <div key={cat.id} className="space-y-2">
                    <h4 className="font-bold text-xs uppercase text-slate-600 bg-slate-100 px-2 py-1 rounded">
                      {cat.name}
                    </h4>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400">
                          <th className="py-1.5">Description</th>
                          <th className="py-1.5 text-center w-16">Qty</th>
                          <th className="py-1.5 w-16">Unit</th>
                          <th className="py-1.5 text-right w-28">Est. Cost (₹)</th>
                          <th className="py-1.5 text-right w-28 pr-2">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {cat.items.map(item => (
                          <tr key={item.id}>
                            <td className="py-2 pl-0.5">{item.description}</td>
                            <td className="py-2 text-center">{item.quantity}</td>
                            <td className="py-2">{item.unit}</td>
                            <td className="py-2 text-right">₹{Number(item.estimated_cost).toLocaleString('en-IN')}</td>
                            <td className="py-2 text-right pr-2">₹{(Number(item.quantity) * Number(item.estimated_cost)).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                        <tr className="font-bold text-slate-800 bg-slate-50/50">
                          <td colSpan="4" className="py-2 text-right pr-4">Category Sub-total:</td>
                          <td className="py-2 text-right pr-2">₹{cat.subtotal.toLocaleString('en-IN')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations and Final Summary Block */}
            <div className="flex justify-end border-t border-slate-200 pt-5 print:break-inside-avoid">
              <div className="w-80 space-y-3 text-xs text-slate-700">
                <div className="flex justify-between font-bold">
                  <span>Gross Cost Subtotal:</span>
                  <span>₹{rawBudgetSubtotal.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-1">
                    <span>Tax rate (%) :</span>
                    <input 
                      type="number"
                      value={taxRate}
                      onChange={e => setTaxRate(Number(e.target.value))}
                      className="w-12 border rounded px-1.5 py-0.5 text-center print:hidden"
                    />
                    <span className="hidden print:inline">{taxRate}%</span>
                  </div>
                  <span>₹{taxAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-1">
                    <span>Discount (₹) :</span>
                    <input 
                      type="number"
                      value={discountAmount}
                      onChange={e => setDiscountAmount(Number(e.target.value))}
                      className="w-20 border rounded px-1.5 py-0.5 text-right print:hidden"
                    />
                    <span className="hidden print:inline">₹{discountAmount}</span>
                  </div>
                  <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between font-extrabold text-sm border-t border-slate-200 pt-2 text-slate-800 bg-slate-50 p-2.5 rounded-lg">
                  <span>Quotation Grand Total:</span>
                  <span>₹{finalQuoteAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: MASTER DAY BOOK */}
      {selectedReport === 'daybook' && (
        <div className="space-y-4">
          {/* Filters Card */}
          <div className="card p-4 space-y-4 bg-white">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <label className="font-semibold text-slate-600">Start Date:</label>
                <input 
                  type="date" 
                  value={daybookStartDate}
                  onChange={e => setDaybookStartDate(e.target.value)}
                  className="input-field py-1 px-2 border-slate-200"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="font-semibold text-slate-600">End Date:</label>
                <input 
                  type="date" 
                  value={daybookEndDate}
                  onChange={e => setDaybookEndDate(e.target.value)}
                  className="input-field py-1 px-2 border-slate-200"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="font-semibold text-slate-600">Filter Account:</label>
                <select 
                  className="input-field py-1 px-2 border-slate-200"
                  value={daybookAccountId}
                  onChange={e => setDaybookAccountId(e.target.value)}
                >
                  <option value="">All Accounts</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleExportDaybook}
                className="btn-secondary py-1.5 px-3 flex items-center space-x-1 cursor-pointer bg-white"
              >
                <Download size={14} /> <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Aggregates Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 bg-green-50 border-green-100 text-center">
              <span className="block text-[10px] text-green-700 font-bold uppercase tracking-wider">Total Debited Cashflow</span>
              <span className="text-lg font-bold text-green-700">₹{totalCredit.toLocaleString('en-IN')}</span>
            </div>
            <div className="card p-4 bg-red-50 border-red-100 text-center">
              <span className="block text-[10px] text-red-700 font-bold uppercase tracking-wider">Total Credited Spending</span>
              <span className="text-lg font-bold text-red-700">₹{totalDebit.toLocaleString('en-IN')}</span>
            </div>
            <div className="card p-4 bg-slate-50 border-slate-200 text-center">
              <span className="block text-[10px] text-slate-600 font-bold uppercase tracking-wider">Net Cash Book Balance</span>
              <span className={`text-lg font-bold ${netDaybookBalance >= 0 ? 'text-primary-600' : 'text-rose-600'}`}>
                ₹{netDaybookBalance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Transactions Ledger */}
          <div className="card p-5 bg-white overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 pl-2">Date</th>
                  <th className="py-2.5">Event Project</th>
                  <th className="py-2.5">Particular Details</th>
                  <th className="py-2.5 text-right w-24">Debit (Out)</th>
                  <th className="py-2.5 text-right w-24">Cash Inflow (Cr)</th>
                  <th className="py-2.5 pl-4 w-48">Narration</th>
                  <th className="py-2.5 w-32 pl-4">Account Used</th>
                  <th className="py-2.5 w-24">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {daybookTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400">No transactions recorded in this period.</td>
                  </tr>
                ) : (
                  daybookTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="py-3 pl-2">{formatDate(tx.date)}</td>
                      <td className="py-3 font-semibold">{tx.event}</td>
                      <td className="py-3 max-w-[200px] truncate">{tx.particular}</td>
                      <td className="py-3 text-right font-bold text-red-600">
                        {tx.debit > 0 ? `₹${tx.debit.toLocaleString('en-IN')}` : ''}
                      </td>
                      <td className="py-3 text-right font-bold text-green-600">
                        {tx.credit > 0 ? `₹${tx.credit.toLocaleString('en-IN')}` : ''}
                      </td>
                      <td className="py-2 pl-4">
                        <input
                          type="text"
                          className="w-full bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-primary-500 rounded px-2 py-1 outline-none transition-all text-sm"
                          value={tx.narration}
                          placeholder="Add notes..."
                          onChange={(e) => {
                            // Optimistic UI Update trick - we need to update state immediately to not lose focus
                            if (tx.sourceTable === 'client_payments') {
                              setClientPayments(prev => prev.map(p => p.id === tx.id ? { ...p, narration: e.target.value } : p));
                            } else if (tx.sourceTable === 'expenses') {
                              setExpenses(prev => prev.map(ex => ex.id === tx.id ? { ...ex, narration: e.target.value } : ex));
                            } else if (tx.sourceTable === 'vendor_payments') {
                              setVendorPayments(prev => prev.map(vp => vp.id === tx.id ? { ...vp, narration: e.target.value } : vp));
                            }
                          }}
                          onBlur={(e) => handleUpdateNarration(tx.id, tx.sourceTable, e.target.value)}
                        />
                      </td>
                      <td className="py-3 pl-4 font-medium text-slate-500">{tx.account}</td>
                      <td className="py-3 text-slate-500">{tx.method}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 3: BUDGET VS ACTUAL */}
      {selectedReport === 'budget_vs_actual' && (
        <div className="space-y-4">
          {/* Controls Card */}
          <div className="card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold text-slate-600">Select Event:</label>
              <select 
                className="input-field py-1.5 px-3 text-xs w-64 bg-slate-50 border-slate-200"
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
              >
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={handleExportBvs}
              className="btn-secondary flex items-center space-x-1 py-1.5 text-xs bg-white cursor-pointer"
            >
              <Download size={14} /> <span>Export Excel</span>
            </button>
          </div>

          {/* Aggregates Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="card p-4 bg-slate-50 text-center">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Budget Projected</span>
              <span className="text-lg font-bold text-slate-800">₹{bvsTotalBudget.toLocaleString('en-IN')}</span>
            </div>
            <div className="card p-4 bg-slate-50 text-center">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Actual Expenses</span>
              <span className="text-lg font-bold text-slate-800">₹{bvsTotalActual.toLocaleString('en-IN')}</span>
            </div>
            <div className="card p-4 bg-slate-50 text-center">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Variance Diff</span>
              <span className={`text-lg font-bold ${bvsTotalDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {bvsTotalDiff >= 0 ? `₹${bvsTotalDiff.toLocaleString('en-IN')}` : `-₹${Math.abs(bvsTotalDiff).toLocaleString('en-IN')}`}
              </span>
            </div>
            <div className="card p-4 bg-slate-50 text-center">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Utilized</span>
              <span className={`text-lg font-bold ${bvsVariancePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {bvsTotalBudget > 0 ? ((bvsTotalActual / bvsTotalBudget) * 100).toFixed(1) + '%' : '0%'}
              </span>
            </div>
          </div>

          {/* Category comparison grid */}
          <div className="card p-5 bg-white overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 pl-2">Expense Category</th>
                  <th className="py-2.5 text-right w-28">Budget Projected (₹)</th>
                  <th className="py-2.5 text-right w-28">Actual Spent (₹)</th>
                  <th className="py-2.5 text-right w-28">Difference (₹)</th>
                  <th className="py-2.5 text-right w-20">Variance %</th>
                  <th className="py-2.5 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {bvsData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-400">No budget data linked to this event.</td>
                  </tr>
                ) : (
                  bvsData.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3 pl-2 font-bold text-slate-800">{item.category}</td>
                      <td className="py-3 text-right">₹{item.budgeted.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right">₹{item.actual.toLocaleString('en-IN')}</td>
                      <td className={`py-3 text-right font-semibold ${item.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.difference >= 0 ? `₹${item.difference.toLocaleString('en-IN')}` : `-₹${Math.abs(item.difference).toLocaleString('en-IN')}`}
                      </td>
                      <td className="py-3 text-right font-medium">{item.variancePercent.toFixed(1)}%</td>
                      <td className="py-3 text-center">
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          item.status === 'Under Budget' ? 'bg-green-50 text-green-700 border-green-250' : 
                          item.status === 'Over Budget' ? 'bg-red-50 text-red-700 border-red-250' :
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Simple Insights Column */}
          {bvsData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-4 bg-white flex items-start space-x-3">
                <AlertCircle className="text-rose-500 shrink-0" size={20} />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-slate-800 uppercase">Highest Overspending Area</h4>
                  <p className="text-xs text-slate-500">
                    {highestOverspent 
                      ? `Your operations exceeded budget in "${highestOverspent.category}" by ₹${Math.abs(highestOverspent.difference).toLocaleString('en-IN')} (${highestOverspent.variancePercent.toFixed(1)}% overspent).`
                      : 'Excellent! No category exceeded the projected budget estimates.'}
                  </p>
                </div>
              </div>
              <div className="card p-4 bg-white flex items-start space-x-3">
                <TrendingUp className="text-green-500 shrink-0" size={20} />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-slate-800 uppercase">Highest Cost Savings Area</h4>
                  <p className="text-xs text-slate-500">
                    {highestSaved 
                      ? `Your operations saved ₹${highestSaved.difference.toLocaleString('en-IN')} in "${highestSaved.category}" (under spent by ${Math.abs(highestSaved.variancePercent).toFixed(1)}%).`
                      : 'No cost savings category recorded.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REPORT 4: PROFITABILITY REPORT */}
      {selectedReport === 'profitability' && (
        <div className="space-y-4">
          {/* Controls Card */}
          <div className="card p-4 flex flex-wrap items-center gap-4 text-xs bg-white">
            <div className="flex items-center space-x-2">
              <label className="font-semibold text-slate-600">Filter Year:</label>
              <select 
                value={profitYear} 
                onChange={e => setProfitYear(e.target.value)}
                className="input-field py-1 px-2 border-slate-200 w-24"
              >
                <option value="">All</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="font-semibold text-slate-600">Filter Month:</label>
              <select 
                value={profitMonth} 
                onChange={e => setProfitMonth(e.target.value)}
                className="input-field py-1 px-2 border-slate-200 w-28"
              >
                <option value="">All</option>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                  <option key={idx} value={idx.toString()}>{m}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleExportProfitability}
              className="btn-secondary py-1.5 px-3 flex items-center space-x-1 cursor-pointer bg-white"
            >
              <Download size={14} /> <span>Export Excel</span>
            </button>
          </div>

          {/* Aggregates Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="card p-4 bg-slate-50 text-center">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Total Revenue Inflow</span>
              <span className="text-lg font-bold text-slate-800">₹{overallRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="card p-4 bg-slate-50 text-center">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Total Actual Cost</span>
              <span className="text-lg font-bold text-slate-800">₹{overallExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="card p-4 bg-green-50 border-green-150 text-center">
              <span className="block text-[10px] text-green-700 font-bold uppercase">Overall Net Profit</span>
              <span className="text-lg font-bold text-green-700">₹{overallProfit.toLocaleString('en-IN')}</span>
            </div>
            <div className="card p-4 bg-primary-50 border-primary-150 text-center">
              <span className="block text-[10px] text-primary-700 font-bold uppercase">Profit Margin</span>
              <span className="text-lg font-bold text-primary-700">{overallMargin.toFixed(1)}%</span>
            </div>
          </div>

          {/* Profitability Table */}
          <div className="card p-5 bg-white overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 pl-2">Event Project</th>
                  <th className="py-2.5">Client</th>
                  <th className="py-2.5 text-right w-24">Revenue (₹)</th>
                  <th className="py-2.5 text-right w-24">Expenses (₹)</th>
                  <th className="py-2.5 text-right w-24">Net Profit (₹)</th>
                  <th className="py-2.5 text-right w-24">Margin (%)</th>
                  <th className="py-2.5 w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {profitabilityData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400">No events found matching dates.</td>
                  </tr>
                ) : (
                  profitabilityData.map(evt => (
                    <tr key={evt.id} className="hover:bg-slate-50/50">
                      <td className="py-3 pl-2 font-bold text-slate-800">{evt.name}</td>
                      <td className="py-3 font-semibold text-slate-500">{evt.client}</td>
                      <td className="py-3 text-right">₹{evt.revenue.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right text-rose-600">₹{evt.expenses.toLocaleString('en-IN')}</td>
                      <td className={`py-3 text-right font-bold ${evt.profit >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                        {evt.profit >= 0 ? `₹${evt.profit.toLocaleString('en-IN')}` : `-₹${Math.abs(evt.profit).toLocaleString('en-IN')}`}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-700">{evt.margin.toFixed(1)}%</td>
                      <td className="py-3 text-center">
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          evt.profit > 0 ? 'bg-green-50 text-green-700 border-green-250' : 
                          evt.profit < 0 ? 'bg-rose-50 text-rose-700 border-rose-250' :
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {evt.profit > 0 ? 'Profitable' : evt.profit < 0 ? 'Loss Making' : 'Breakeven'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
