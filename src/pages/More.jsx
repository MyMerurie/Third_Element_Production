import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, Filter, Plus, Edit2, Trash2, Check, X,
  IndianRupee, TrendingUp, TrendingDown, Users, Settings, FileText, Phone, Mail, User, Download
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

const More = () => {
  const [selectedSubView, setSelectedSubView] = useState(null); // null, 'vendor_ledger', 'client_ledger', 'outstanding', 'masters'
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Core Data States
  const [vendors, setVendors] = useState([]);
  const [clients, setClients] = useState([]);
  const [events, setEvents] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [clientPayments, setClientPayments] = useState([]);
  const [vendorPayments, setVendorPayments] = useState([]);
  
  // Master Lists Configuration State
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [methods, setMethods] = useState([]);
  const [staff, setStaff] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);

  // Detail View State (e.g., specific vendor or client selected)
  const [selectedEntityId, setSelectedEntityId] = useState(null);

  // Master Lists Configurator State
  const [selectedMasterTable, setSelectedMasterTable] = useState('master_lead_sources');
  const [masterQuery, setMasterQuery] = useState('');
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [masterForm, setMasterForm] = useState({});
  const [masterEditId, setMasterEditId] = useState(null);

  // Search queries for ledgers
  const [vendorQuery, setVendorQuery] = useState('');
  const [clientQuery, setClientQuery] = useState('');

  // Recording Payment Modal state in Ledgers
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState('client'); // 'client' or 'vendor'
  const [paymentForm, setPaymentForm] = useState({
    event_id: '',
    vendor_id: '',
    client_id: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method_id: '',
    account_id: '',
    account: '',
    reference_number: '',
    notes: ''
  });

  // Vendor direct transactions & adjustments modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [vendorExpenseForm, setVendorExpenseForm] = useState({
    client_id: '',
    event_id: '',
    category_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
    payment_method_id: '',
    account_id: ''
  });

  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    target_outstanding: '',
    date: new Date().toISOString().split('T')[0],
    remarks: 'Outstanding balance adjustment'
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        resVendors, resClients, resEvents, resExpenses,
        resClientPay, resVendorPay, resCategories, resAccounts,
        resMethods, resStaff, resLeadSources, resFunctions, resBudgetItems
      ] = await Promise.all([
        supabase.from('vendors').select('*').order('name'),
        supabase.from('clients').select('*').order('name'),
        supabase.from('events').select('*').order('name'),
        supabase.from('expenses').select('*'),
        supabase.from('client_payments').select('*'),
        supabase.from('vendor_payments').select('*'),
        supabase.from('master_expense_categories').select('*').order('name'),
        supabase.from('master_accounts').select('*').order('name'),
        supabase.from('master_payment_methods').select('*').order('name'),
        supabase.from('staff').select('*').order('name'),
        supabase.from('master_lead_sources').select('*').order('name'),
        supabase.from('event_functions').select('*'),
        supabase.from('budget_items').select('*')
      ]);

      if (resVendors.data) setVendors(resVendors.data);
      if (resClients.data) setClients(resClients.data);
      if (resEvents.data) setEvents(resEvents.data);
      if (resExpenses.data) setExpenses(resExpenses.data);
      if (resClientPay.data) setClientPayments(resClientPay.data);
      if (resVendorPay.data) setVendorPayments(resVendorPay.data);
      if (resCategories.data) setCategories(resCategories.data);
      if (resAccounts.data) setAccounts(resAccounts.data);
      if (resMethods.data) setMethods(resMethods.data);
      if (resStaff.data) setStaff(resStaff.data);
      if (resLeadSources.data) setLeadSources(resLeadSources.data);
      if (resFunctions.data) setFunctions(resFunctions.data);
      if (resBudgetItems.data) setBudgetItems(resBudgetItems.data);

    } catch (err) {
      console.error(err);
      showNotification("Error loading data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowPaymentModal(false);
        setShowMasterModal(false);
        setShowExpenseModal(false);
        setShowAdjustmentModal(false);
        setMasterEditId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const menuItems = [
    { id: 'vendor_ledger', icon: <Users size={20} />, label: 'Vendor Ledger', desc: 'Track vendor running balances, expenses, and paid invoices' },
    { id: 'client_ledger', icon: <Users size={20} />, label: 'Client Ledger', desc: 'Manage client invoices, schedules, and inflow receipts' },
    { id: 'outstanding', icon: <FileText size={20} />, label: 'Outstanding Payments', desc: 'Central view of overdue receivables and payables' },
    { id: 'masters', icon: <Settings size={20} />, label: 'Master Lists Configurator', desc: 'Add, edit, or delete reference options' },
  ];

  // ----------------------------------------------------
  // CLIENT LEDGER CALCULATIONS
  // ----------------------------------------------------
  const getClientLedgerRows = () => {
    return clients.map(c => {
      // Find events for client
      const clientEvents = events.filter(e => e.client_id === c.id);
      const totalInvoice = clientEvents.reduce((sum, e) => sum + Number(e.budget_actual || 0), 0);
      const totalReceived = clientPayments.filter(p => p.client_id === c.id).reduce((sum, p) => sum + Number(p.amount_received || 0), 0);
      const outstanding = totalInvoice - totalReceived;
      
      return {
        ...c,
        totalInvoice,
        totalReceived,
        outstanding,
        eventsCount: clientEvents.length
      };
    }).filter(c => {
      if (!clientQuery) return true;
      return c.name.toLowerCase().includes(clientQuery.toLowerCase()) || c.phone.includes(clientQuery);
    });
  };

  // ----------------------------------------------------
  // VENDOR LEDGER CALCULATIONS
  // ----------------------------------------------------
  const getVendorLedgerRows = () => {
    return vendors.map(v => {
      // Find budget items assigned to vendor (Credits to vendor)
      const vendBudgets = budgetItems.filter(b => b.vendor_id === v.id);
      const totalBilled = vendBudgets.reduce((sum, b) => sum + (Number(b.quantity || 1) * Number(b.estimated_cost || 0)), 0);
      
      // Find payments made to vendor (Debits)
      const vendPays = vendorPayments.filter(p => p.vendor_id === v.id);
      const totalPaid = vendPays.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      
      const outstanding = totalBilled - totalPaid;
      const cat = categories.find(c => c.id === v.category_id);

      return {
        ...v,
        categoryName: cat ? cat.name : 'General',
        totalBilled,
        totalPaid,
        outstanding
      };
    }).filter(v => {
      if (!vendorQuery) return true;
      return v.name.toLowerCase().includes(vendorQuery.toLowerCase()) || v.phone?.includes(vendorQuery);
    });
  };

  // ----------------------------------------------------
  // RECORD PAYMENT FORM SUBMIT
  // ----------------------------------------------------
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const amt = Number(paymentForm.amount);
      if (paymentType === 'client') {
        const selectedEvent = events.find(evt => evt.id === paymentForm.event_id);
        if (!selectedEvent) throw new Error("Event not found");

        const { error: pErr } = await supabase.from('client_payments').insert({
          event_id: paymentForm.event_id,
          client_id: selectedEvent.client_id,
          date: paymentForm.date,
          amount_received: amt,
          payment_method_id: paymentForm.payment_method_id,
          account: paymentForm.account,
          reference_number: paymentForm.reference_number,
          notes: paymentForm.notes
        });
        if (pErr) throw pErr;

        // Update event balance
        const newReceived = Number(selectedEvent.amount_received || 0) + amt;
        const newOut = Math.max(0, Number(selectedEvent.budget_estimated || 0) - newReceived);
        await supabase.from('events').update({
          amount_received: newReceived,
          amount_outstanding: newOut
        }).eq('id', selectedEvent.id);

        showNotification("Client payment recorded!");
      } else {
        const { error: pErr } = await supabase.from('vendor_payments').insert({
          event_id: paymentForm.event_id || null,
          vendor_id: paymentForm.vendor_id,
          date: paymentForm.date,
          amount: amt,
          payment_method_id: paymentForm.payment_method_id,
          account_id: paymentForm.account_id,
          reference_number: paymentForm.reference_number
        });
        if (pErr) throw pErr;

        showNotification("Vendor payment recorded!");
      }

      setShowPaymentModal(false);
      loadAllData();
    } catch (err) {
      showNotification("Failed: " + err.message, "error");
    }
  };

  const handleRecordVendorExpense = async (e) => {
    e.preventDefault();
    try {
      const amt = Number(vendorExpenseForm.amount);
      if (!amt || amt <= 0) throw new Error("Amount must be greater than zero");
      if (!vendorExpenseForm.category_id) throw new Error("Please select an expense category");

      const { error } = await supabase.from('budget_items').insert({
        event_id: vendorExpenseForm.event_id || null,
        vendor_id: selectedEntityId,
        category_id: vendorExpenseForm.category_id,
        estimated_cost: amt,
        quantity: 1,
        unit: 'Qty',
        description: vendorExpenseForm.remarks || 'Direct vendor invoice',
        function_id: vendorExpenseForm.function_id || null
      });

      if (error) throw error;
      showNotification("Expense invoice recorded!");
      setShowExpenseModal(false);
      setVendorExpenseForm({
        client_id: '',
        event_id: '',
        category_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        remarks: '',
        payment_method_id: '',
        account_id: '',
        function_id: ''
      });
      loadAllData();
    } catch (err) {
      showNotification("Failed: " + err.message, "error");
    }
  };

  const handleRecordVendorAdjustment = async (e) => {
    e.preventDefault();
    try {
      const targetVal = Number(adjustmentForm.target_outstanding);
      if (isNaN(targetVal) || targetVal < 0) throw new Error("Target outstanding must be a valid non-negative number");

      const vExpenses = budgetItems.filter(b => b.vendor_id === selectedEntityId);
      const vPays = vendorPayments.filter(p => p.vendor_id === selectedEntityId);
      const currentCredits = vExpenses.reduce((sum, b) => sum + (Number(b.quantity || 1) * Number(b.estimated_cost || 0)), 0);
      const currentDebits = vPays.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const currentOutstanding = currentCredits - currentDebits;

      const diff = targetVal - currentOutstanding;
      if (diff === 0) {
        showNotification("Outstanding is already at this value.");
        setShowAdjustmentModal(false);
        return;
      }

      if (diff > 0) {
        // We owe MORE, so insert a budget item (Credit)
        const vendorObj = vendors.find(vend => vend.id === selectedEntityId);
        let categoryId = vendorObj?.category_id;
        if (!categoryId && categories.length > 0) {
          categoryId = categories[0].id;
        }
        if (!categoryId) throw new Error("No expense category found to associate with adjustment");

        const { error } = await supabase.from('budget_items').insert({
          event_id: null,
          vendor_id: selectedEntityId,
          category_id: categoryId,
          estimated_cost: diff,
          quantity: 1,
          unit: 'Qty',
          description: adjustmentForm.remarks || 'Outstanding balance adjustment'
        });
        if (error) throw error;
      } else {
        // We owe LESS, so insert a payment (Debit)
        const methodId = methods[0]?.id;
        const accountId = accounts[0]?.id;

        const { error } = await supabase.from('vendor_payments').insert({
          event_id: null,
          vendor_id: selectedEntityId,
          date: adjustmentForm.date,
          amount: Math.abs(diff),
          payment_method_id: methodId || null,
          account_id: accountId || null,
          reference_number: 'ADJUSTMENT'
        });
        if (error) throw error;
      }

      showNotification("Outstanding balance adjusted successfully!");
      setShowAdjustmentModal(false);
      setAdjustmentForm({
        target_outstanding: '',
        date: new Date().toISOString().split('T')[0],
        remarks: 'Outstanding balance adjustment'
      });
      loadAllData();
    } catch (err) {
      showNotification("Adjustment failed: " + err.message, "error");
    }
  };

  // ----------------------------------------------------
  // MASTER LISTS CRUD OPERATIONS
  // ----------------------------------------------------
  const getMasterTableColumns = () => {
    switch (selectedMasterTable) {
      case 'master_lead_sources':
      case 'master_expense_categories':
      case 'master_payment_methods':
      case 'master_accounts':
        return ['name'];
      case 'staff':
        return ['name', 'role'];
      case 'clients':
        return ['name', 'phone', 'email'];
      case 'vendors':
        return ['name', 'phone', 'email', 'total_business', 'status'];
      default:
        return [];
    }
  };

  const getMasterRows = () => {
    let rows = [];
    switch (selectedMasterTable) {
      case 'master_lead_sources': rows = leadSources; break;
      case 'master_expense_categories': rows = categories; break;
      case 'master_payment_methods': rows = methods; break;
      case 'master_accounts': rows = accounts; break;
      case 'staff': rows = staff; break;
      case 'clients': rows = clients; break;
      case 'vendors': 
        rows = vendors.map(v => {
          const vendBudgets = budgetItems.filter(b => b.vendor_id === v.id);
          const totalBilled = vendBudgets.reduce((sum, b) => sum + (Number(b.quantity || 1) * Number(b.estimated_cost || 0)), 0);
          return {
            ...v,
            total_business: `₹${totalBilled.toLocaleString('en-IN')}`
          };
        });
        break;
    }

    if (masterQuery) {
      return rows.filter(r => r.name.toLowerCase().includes(masterQuery.toLowerCase()));
    }
    return rows;
  };

  const handleSaveMasterRow = async (e) => {
    e.preventDefault();
    try {
      if (masterEditId) {
        // Edit Row
        const { error } = await supabase.from(selectedMasterTable).update(masterForm).eq('id', masterEditId);
        if (error) throw error;
        showNotification("Item updated!");
      } else {
        // Add Row
        const { error } = await supabase.from(selectedMasterTable).insert(masterForm);
        if (error) throw error;
        showNotification("New item added!");
      }
      setShowMasterModal(false);
      setMasterEditId(null);
      setMasterForm({});
      loadAllData();
    } catch (err) {
      showNotification("Save failed: " + err.message, "error");
    }
  };

  const handleDeleteMasterRow = async (rowId) => {
    if (!window.confirm("Are you sure you want to delete this configuration item? This can break records that reference this category.")) return;
    try {
      const { error } = await supabase.from(selectedMasterTable).delete().eq('id', rowId);
      if (error) throw error;
      showNotification("Item deleted.");
      loadAllData();
    } catch (err) {
      showNotification("Delete failed: " + err.message, "error");
    }
  };

  const handleDeleteVendor = async (vId) => {
    if (!window.confirm("Are you sure you want to delete this vendor profile? This might break linked expense or budget records.")) return;
    try {
      const { error } = await supabase.from('vendors').delete().eq('id', vId);
      if (error) throw error;
      showNotification("Vendor profile deleted.");
      setSelectedEntityId(null);
      loadAllData();
    } catch (err) {
      showNotification("Delete failed: " + err.message, "error");
    }
  };

  // Excel export for ledgers
  const handleExportVendorLedger = () => {
    const data = getVendorLedgerRows().map(v => ({
      Vendor: v.name,
      Category: v.categoryName,
      Phone: v.phone || '',
      'Total Billed (₹)': v.totalBilled,
      'Total Paid (₹)': v.totalPaid,
      'Outstanding (₹)': v.outstanding
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendor Ledger");
    XLSX.writeFile(wb, `vendor_ledger_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleExportClientLedger = () => {
    const data = getClientLedgerRows().map(c => ({
      Client: c.name,
      Phone: c.phone || '',
      Email: c.email || '',
      'Total Billed (₹)': c.totalInvoice,
      'Total Received (₹)': c.totalReceived,
      'Outstanding (₹)': c.outstanding
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Client Ledger");
    XLSX.writeFile(wb, `client_ledger_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-white flex items-center space-x-2 transition-all duration-300 bg-green-500 border-green-600`}>
          <Check size={18} />
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      {/* Header back row */}
      <div className="flex justify-between items-center">
        {selectedSubView ? (
          <button 
            onClick={() => { setSelectedSubView(null); setSelectedEntityId(null); }}
            className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold text-sm cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to More Menu</span>
          </button>
        ) : (
          <h2 className="text-xl font-bold text-slate-800">More Tools & Configuration</h2>
        )}
      </div>

      {/* MORE OPTIONS LANDING LIST */}
      {!selectedSubView && (
        <div className="space-y-3">
          {menuItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedSubView(item.id)}
              className="card p-4 flex items-center space-x-4 cursor-pointer hover:bg-slate-50 border border-slate-100 hover:shadow-sm transition-all bg-white"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                {item.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-sm">{item.label}</h4>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <span className="text-xs font-semibold text-primary-600">&rarr;</span>
            </div>
          ))}
        </div>
      )}

      {/* SUBVIEWS */}

      {/* SUBVIEW 1: VENDOR LEDGER */}
      {selectedSubView === 'vendor_ledger' && !selectedEntityId && (() => {
        const ledgerRows = getVendorLedgerRows();
        const totalBilledAll = ledgerRows.reduce((sum, r) => sum + r.totalBilled, 0);
        const totalPaidAll = ledgerRows.reduce((sum, r) => sum + r.totalPaid, 0);
        const totalOutstandingAll = ledgerRows.reduce((sum, r) => sum + r.outstanding, 0);

        return (
          <div className="space-y-4">
            {/* Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card p-4 bg-rose-50/60 border-rose-150 flex flex-col justify-between shadow-sm">
                <span className="block text-[10px] text-rose-700 font-bold uppercase tracking-wider">Total Balance Due</span>
                <span className="text-xl font-extrabold text-rose-750 mt-1">₹{totalOutstandingAll.toLocaleString('en-IN')}</span>
              </div>
              <div className="card p-4 bg-slate-50/85 border-slate-200 flex flex-col justify-between shadow-sm">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Purchases</span>
                <span className="text-xl font-bold text-slate-700 mt-1">₹{totalBilledAll.toLocaleString('en-IN')}</span>
              </div>
              <div className="card p-4 bg-green-50/60 border-green-200 flex flex-col justify-between shadow-sm">
                <span className="block text-[10px] text-green-700 font-bold uppercase tracking-wider">Total Paid</span>
                <span className="text-xl font-bold text-green-700 mt-1">₹{totalPaidAll.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between bg-white border">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search vendor name or contact..." 
                  value={vendorQuery}
                  onChange={e => setVendorQuery(e.target.value)}
                  className="input-field pl-9 py-1.5 text-xs border-slate-200"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto shrink-0">
                <button 
                  onClick={() => {
                    setSelectedMasterTable('vendors');
                    setMasterForm({ status: 'Active' });
                    setMasterEditId(null);
                    setShowMasterModal(true);
                  }}
                  className="btn-primary py-1.5 px-3 flex items-center justify-center space-x-1 text-xs cursor-pointer w-full md:w-auto"
                >
                  <Plus size={14} /> <span>Add Vendor</span>
                </button>
                <button 
                  onClick={handleExportVendorLedger}
                  className="btn-secondary py-1.5 px-3 flex items-center justify-center space-x-1 cursor-pointer bg-white text-xs w-full md:w-auto"
                >
                  <Download size={14} /> <span>Export Excel</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ledgerRows.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => setSelectedEntityId(v.id)}
                  className="card p-5 cursor-pointer bg-white hover:shadow-md border-slate-150 hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{v.name}</h3>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                        {v.categoryName}
                      </span>
                    </div>
                    <span className={`text-xs font-bold ${v.outstanding > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                      Bal: ₹{v.outstanding.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                    <span>Actual Cost: ₹{v.totalBilled.toLocaleString('en-IN')}</span>
                    <span className="text-right">Paid: ₹{v.totalPaid.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* VENDOR LEDGER DETAILS VIEWS */}
      {selectedSubView === 'vendor_ledger' && selectedEntityId && (() => {
        const v = vendors.find(vend => vend.id === selectedEntityId);
        const cat = categories.find(c => c.id === v?.category_id);
        
        // Vendor transactions: Budget Items (credits) vs Payments (debits)
        const vExpenses = budgetItems.filter(b => b.vendor_id === selectedEntityId).map(b => {
          const evt = events.find(e => e.id === b.event_id) || {};
          return {
            id: b.id, 
            date: b.created_at ? b.created_at.split('T')[0] : new Date().toISOString().split('T')[0], 
            type: `Credit (${b.description || 'Estimated Cost'})`, 
            debit: 0, 
            credit: Number(b.quantity || 1) * Number(b.estimated_cost || 0), 
            ref: evt.name ? `Event: ${evt.name}` : 'Direct Entry',
            eventId: b.event_id
          };
        });
        const vPays = vendorPayments.filter(p => p.vendor_id === selectedEntityId).map(p => ({
          id: p.id, 
          date: p.date, 
          type: 'Payment (Debit)', 
          debit: p.amount, 
          credit: 0, 
          ref: p.reference_number || '-',
          eventId: p.event_id
        }));
        const txs = [...vExpenses, ...vPays].sort((a,b) => new Date(b.date) - new Date(a.date));

        const totalCredits = vExpenses.reduce((sum, e) => sum + e.credit, 0);
        const totalDebits = vPays.reduce((sum, p) => sum + p.debit, 0);
        const totalBal = totalCredits - totalDebits;

        return (
          <div className="space-y-4">
            <button 
              onClick={() => setSelectedEntityId(null)}
              className="flex items-center space-x-1 text-xs text-primary-600 font-bold hover:underline cursor-pointer"
            >
              &larr; Back to Vendor List
            </button>

            {/* Vendor Profile card */}
            <div className="card p-5 bg-white space-y-4 border border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-primary-50 text-primary-600 font-bold px-2 py-0.5 rounded uppercase">
                      {cat?.name || 'General'}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded-full border ${
                      v?.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>{v?.status || 'Active'}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{v?.name}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    {v?.phone && <span className="flex items-center"><Phone size={12} className="mr-1" /> {v.phone}</span>}
                    {v?.email && <span className="flex items-center"><Mail size={12} className="mr-1" /> {v.email}</span>}
                    <span className="flex items-center font-semibold text-primary-600 ml-2 border-l pl-3 border-slate-200">Total Business: ₹{totalCredits.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="flex items-center gap-4 bg-slate-50 border p-3 rounded-xl">
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-500 uppercase">Outstanding</span>
                      <span className="text-md font-bold text-red-600">₹{totalBal.toLocaleString('en-IN')}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setPaymentType('vendor');
                        setPaymentForm({
                          event_id: '',
                          vendor_id: selectedEntityId,
                          client_id: '',
                          date: new Date().toISOString().split('T')[0],
                          amount: '',
                          payment_method_id: methods[0]?.id || '',
                          account_id: accounts[0]?.id || '',
                          reference_number: ''
                        });
                        setShowPaymentModal(true);
                      }}
                      className="btn-primary text-xs py-1.5 px-3 cursor-pointer"
                    >
                      Pay Vendor
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setSelectedMasterTable('vendors');
                        // omit relations calculations
                        const { totalBilled, totalPaid, outstanding, categoryName, ...vForm } = v;
                        setMasterForm(vForm);
                        setMasterEditId(v.id);
                        setShowMasterModal(true);
                      }}
                      className="btn-secondary py-1.5 px-3 text-xs bg-white cursor-pointer"
                    >
                      Edit Profile
                    </button>
                    <button 
                      onClick={() => handleDeleteVendor(v.id)}
                      className="btn-secondary text-red-600 hover:text-red-750 hover:bg-red-50 border-red-200 py-1.5 px-3 text-xs bg-white cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Ledger Transactions table */}
            <div className="card p-5 bg-white overflow-x-auto border">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Transaction Running History</h4>
                <div className="flex space-x-2 shrink-0">
                  <button 
                    onClick={() => {
                      setVendorExpenseForm({
                        event_id: '',
                        category_id: v?.category_id || '',
                        amount: '',
                        date: new Date().toISOString().split('T')[0],
                        remarks: '',
                        payment_method_id: '',
                        account_id: '',
                        function_id: ''
                      });
                      setShowExpenseModal(true);
                    }}
                    className="btn-primary py-1 px-2.5 text-[10px] flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus size={10} /> <span>Add Expense Invoice</span>
                  </button>
                  <button 
                    onClick={() => {
                      setAdjustmentForm({
                        target_outstanding: totalBal.toString(),
                        date: new Date().toISOString().split('T')[0],
                        remarks: 'Outstanding balance adjustment'
                      });
                      setShowAdjustmentModal(true);
                    }}
                    className="btn-secondary py-1 px-2.5 text-[10px] flex items-center space-x-1 cursor-pointer bg-white"
                  >
                    <Edit2 size={10} /> <span>Adjust Outstanding</span>
                  </button>
                </div>
              </div>
              <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase">
                    <th className="py-2 pl-2">Date</th>
                    <th className="py-2">Transaction Type</th>
                    <th className="py-2 text-right pr-4">Balance Paid</th>
                    <th className="py-2 text-right pr-4">Balance Due</th>
                    <th className="py-2 pl-4">Ref ID / Particulars</th>
                    <th className="py-2 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {txs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-slate-400">No transactions recorded for this vendor.</td>
                    </tr>
                  ) : (
                    txs.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-2.5 pl-2">{formatDate(t.date)}</td>
                        <td className="py-2.5 font-medium text-slate-650">{t.type}</td>
                        <td className="py-2.5 text-right pr-4 text-green-600 font-semibold">{t.debit > 0 ? `₹${t.debit.toLocaleString('en-IN')}` : ''}</td>
                        <td className="py-2.5 text-right pr-4 text-rose-600 font-semibold">{t.credit > 0 ? `₹${t.credit.toLocaleString('en-IN')}` : ''}</td>
                        <td className="py-2.5 pl-4 text-slate-500 max-w-[150px] truncate" title={t.ref}>{t.ref}</td>
                        <td className="py-2.5 text-center">
                          {t.credit > 0 && (
                            <button
                              onClick={() => {
                                setPaymentType('vendor');
                                setPaymentForm({
                                  event_id: t.eventId || '',
                                  vendor_id: selectedEntityId,
                                  client_id: '',
                                  date: new Date().toISOString().split('T')[0],
                                  amount: t.credit.toString(),
                                  payment_method_id: methods[0]?.id || '',
                                  account_id: accounts[0]?.id || '',
                                  reference_number: `Invoice: ${t.ref.substring(0, 15)}`
                                });
                                setShowPaymentModal(true);
                              }}
                              className="text-[9px] bg-primary-50 text-primary-600 hover:bg-primary-100 font-bold border border-primary-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              Pay Invoice
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        );
      })()}

      {/* SUBVIEW 2: CLIENT LEDGER */}
      {selectedSubView === 'client_ledger' && !selectedEntityId && (() => {
        const ledgerRows = getClientLedgerRows();
        const totalBilledAll = ledgerRows.reduce((sum, r) => sum + r.totalInvoice, 0);
        const totalPaidAll = ledgerRows.reduce((sum, r) => sum + r.totalReceived, 0);
        const totalOutstandingAll = ledgerRows.reduce((sum, r) => sum + r.outstanding, 0);

        return (
          <div className="space-y-4">
            {/* Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card p-4 bg-orange-50/60 border-orange-150 flex flex-col justify-between shadow-sm">
                <span className="block text-[10px] text-orange-700 font-bold uppercase tracking-wider">Total Receivable Due</span>
                <span className="text-xl font-extrabold text-orange-755 mt-1">₹{totalOutstandingAll.toLocaleString('en-IN')}</span>
              </div>
              <div className="card p-4 bg-slate-50/85 border-slate-200 flex flex-col justify-between shadow-sm">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Invoiced</span>
                <span className="text-xl font-bold text-slate-700 mt-1">₹{totalBilledAll.toLocaleString('en-IN')}</span>
              </div>
              <div className="card p-4 bg-green-50/60 border-green-200 flex flex-col justify-between shadow-sm">
                <span className="block text-[10px] text-green-700 font-bold uppercase tracking-wider">Total Received</span>
                <span className="text-xl font-bold text-green-700 mt-1">₹{totalPaidAll.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between bg-white border">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search client name or contact..." 
                  value={clientQuery}
                  onChange={e => setClientQuery(e.target.value)}
                  className="input-field pl-9 py-1.5 text-xs border-slate-200"
                />
              </div>
              <button 
                onClick={handleExportClientLedger}
                className="btn-secondary py-1.5 px-3 flex items-center space-x-1 cursor-pointer bg-white text-xs w-full md:w-auto justify-center"
              >
                <Download size={14} /> <span>Export Excel</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ledgerRows.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedEntityId(c.id)}
                  className="card p-5 cursor-pointer bg-white hover:shadow-md border-slate-150 hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{c.name}</h3>
                      <p className="text-[10px] text-slate-400 flex items-center">
                        <Phone size={10} className="mr-0.5" /> {c.phone}
                      </p>
                    </div>
                    <span className={`text-xs font-bold ${c.outstanding > 0 ? 'text-orange-600' : 'text-slate-500'}`}>
                      Bal: ₹{c.outstanding.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                    <span>Billed Total: ₹{c.totalInvoice.toLocaleString('en-IN')}</span>
                    <span className="text-right">Paid: ₹{c.totalReceived.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* CLIENT LEDGER DETAILS VIEWS */}
      {selectedSubView === 'client_ledger' && selectedEntityId && (() => {
        const c = clients.find(cl => cl.id === selectedEntityId);
        const cEvents = events.filter(e => e.client_id === selectedEntityId);
        
        // Client ledger inflows: billing (invoices) vs receipts (payments in)
        const billing = cEvents.map(e => ({
          id: e.id, date: e.created_at?.split('T')[0] || '-', type: `Contract Invoice (${e.name})`, debit: e.budget_estimated, credit: 0, ref: e.event_id_serial || '-'
        }));
        const receipts = clientPayments.filter(p => p.client_id === selectedEntityId).map(p => ({
          id: p.id, date: p.date, type: 'Receipt (Credit)', debit: 0, credit: p.amount_received, ref: p.reference_number || '-'
        }));
        const txs = [...billing, ...receipts].sort((a,b) => new Date(b.date) - new Date(a.date));

        const totalInvoice = billing.reduce((sum, b) => sum + b.debit, 0);
        const totalReceived = receipts.reduce((sum, r) => sum + r.credit, 0);
        const outstanding = totalInvoice - totalReceived;

        return (
          <div className="space-y-4">
            <button 
              onClick={() => setSelectedEntityId(null)}
              className="flex items-center space-x-1 text-xs text-primary-600 font-bold hover:underline cursor-pointer"
            >
              &larr; Back to Client List
            </button>

            {/* Client Profile Card */}
            <div className="card p-5 bg-white space-y-4 border border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800">{c?.name}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    {c?.phone && <span className="flex items-center"><Phone size={12} className="mr-1" /> {c.phone}</span>}
                    {c?.email && <span className="flex items-center"><Mail size={12} className="mr-1" /> {c.email}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 border p-3 rounded-xl shrink-0">
                  <div className="text-center">
                    <span className="block text-[10px] text-slate-500 uppercase">Outstanding</span>
                    <span className="text-md font-bold text-orange-600">₹{outstanding.toLocaleString('en-IN')}</span>
                  </div>
                  {cEvents.length > 0 && (
                    <button 
                      onClick={() => {
                        setPaymentType('client');
                        setPaymentForm({
                          event_id: cEvents[0].id,
                          vendor_id: '',
                          client_id: selectedEntityId,
                          date: new Date().toISOString().split('T')[0],
                          amount: '',
                          payment_method_id: methods[0]?.id || '',
                          account_id: accounts[0]?.id || '',
                          account: '',
                          reference_number: '',
                          notes: ''
                        });
                        setShowPaymentModal(true);
                      }}
                      className="btn-primary text-xs py-1.5 px-3 cursor-pointer"
                    >
                      Record Payment
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Client ledger transactions */}
            <div className="card p-5 bg-white overflow-x-auto border">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Client Invoicing & Payment History</h4>
              <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase">
                    <th className="py-2 pl-2">Date</th>
                    <th className="py-2">Transaction Particulars</th>
                    <th className="py-2 text-right">Debit (Contract Billed)</th>
                    <th className="py-2 text-right">Credit (Payments In)</th>
                    <th className="py-2">Ref Serial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {txs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-slate-400">No invoice or payment records linked to this client.</td>
                    </tr>
                  ) : (
                    txs.map(t => (
                      <tr key={t.id}>
                        <td className="py-2.5 pl-2">{formatDate(t.date)}</td>
                        <td className="py-2.5 font-medium">{t.type}</td>
                        <td className="py-2 text-right text-rose-600 font-semibold">{t.debit > 0 ? `₹${t.debit.toLocaleString('en-IN')}` : ''}</td>
                        <td className="py-2 text-right text-green-600 font-semibold">{t.credit > 0 ? `₹${t.credit.toLocaleString('en-IN')}` : ''}</td>
                        <td className="py-2 text-slate-400">{t.ref}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* SUBVIEW 3: OUTSTANDING PAYMENTS */}
      {selectedSubView === 'outstanding' && (() => {
        // Receivables: events where amount_outstanding > 0 and status != Cancelled
        const clientReceivables = events.filter(e => e.amount_outstanding > 0 && e.status !== 'Cancelled').map(e => {
          const client = clients.find(c => c.id === e.client_id);
          return {
            ...e,
            clientName: client ? client.name : 'Unknown'
          };
        });

        // Payables: vendor ledger rows where outstanding > 0
        const vendorPayables = vendors.map(v => {
          const totalBilled = expenses.filter(e => e.vendor_id === v.id).reduce((sum, e) => sum + Number(e.amount || 0), 0);
          const totalPaid = vendorPayments.filter(p => p.vendor_id === v.id).reduce((sum, p) => sum + Number(p.amount || 0), 0);
          return {
            ...v,
            outstanding: totalBilled - totalPaid
          };
        }).filter(v => v.outstanding > 0);

        const totalClientReceivables = clientReceivables.reduce((sum, e) => sum + Number(e.amount_outstanding), 0);
        const totalVendorPayables = vendorPayables.reduce((sum, v) => sum + v.outstanding, 0);

        return (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4 bg-orange-50 border-orange-100 text-center">
                <span className="block text-[10px] text-orange-700 font-bold uppercase">Total Client Receivables</span>
                <span className="text-lg font-bold text-orange-700">₹{totalClientReceivables.toLocaleString('en-IN')}</span>
              </div>
              <div className="card p-4 bg-rose-50 border-rose-100 text-center">
                <span className="block text-[10px] text-rose-700 font-bold uppercase">Total Vendor Payables</span>
                <span className="text-lg font-bold text-rose-700">₹{totalVendorPayables.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Clients receivables card */}
              <div className="card p-5 bg-white space-y-3">
                <h4 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Pending Client Receivables</h4>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {clientReceivables.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No outstanding client receivables.</p>
                  ) : (
                    clientReceivables.map(e => (
                      <div key={e.id} className="p-3 border rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800">{e.name}</div>
                          <div className="text-slate-400">Client: {e.clientName}</div>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="font-bold text-orange-600 block">₹{Number(e.amount_outstanding).toLocaleString('en-IN')}</span>
                          <button 
                            onClick={() => {
                              setPaymentType('client');
                              setPaymentForm({
                                event_id: e.id, vendor_id: '', client_id: e.client_id,
                                date: new Date().toISOString().split('T')[0], amount: '',
                                payment_method_id: methods[0]?.id || '', account_id: accounts[0]?.id || '',
                                account: '', reference_number: '', notes: ''
                              });
                              setShowPaymentModal(true);
                            }}
                            className="bg-white border text-[10px] font-bold px-2 py-0.5 rounded hover:bg-slate-100 transition-colors"
                          >
                            Collect
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Vendor payables card */}
              <div className="card p-5 bg-white space-y-3">
                <h4 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Pending Vendor Payables</h4>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {vendorPayables.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No outstanding vendor payables.</p>
                  ) : (
                    vendorPayables.map(v => (
                      <div key={v.id} className="p-3 border rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800">{v.name}</div>
                          <div className="text-slate-400">{v.phone || 'No phone'}</div>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="font-bold text-red-600 block">₹{v.outstanding.toLocaleString('en-IN')}</span>
                          <button 
                            onClick={() => {
                              setPaymentType('vendor');
                              setPaymentForm({
                                event_id: '', vendor_id: v.id, client_id: '',
                                date: new Date().toISOString().split('T')[0], amount: '',
                                payment_method_id: methods[0]?.id || '', account_id: accounts[0]?.id || '', reference_number: ''
                              });
                              setShowPaymentModal(true);
                            }}
                            className="bg-white border text-[10px] font-bold px-2 py-0.5 rounded hover:bg-slate-100 transition-colors"
                          >
                            Pay
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* SUBVIEW 4: MASTER LISTS CONFIGURATOR */}
      {selectedSubView === 'masters' && (
        <div className="space-y-4">
          <div className="card p-4 bg-white space-y-3">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Select Database Master Table</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { table: 'master_lead_sources', label: 'Lead Sources' },
                { table: 'master_expense_categories', label: 'Expense Categories' },
                { table: 'master_payment_methods', label: 'Payment Methods' },
                { table: 'master_accounts', label: 'Financial Accounts' },
                { table: 'staff', label: 'Employees Staff' },
                { table: 'clients', label: 'Clients Master' }
              ].map(item => (
                <button
                  key={item.table}
                  onClick={() => {
                    setSelectedMasterTable(item.table);
                    setMasterQuery('');
                    setMasterEditId(null);
                    setMasterForm({});
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedMasterTable === item.table 
                      ? 'bg-primary-600 text-white shadow-sm' 
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Master Table controls */}
          <div className="card p-4 flex justify-between items-center bg-white gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search master item name..." 
                value={masterQuery}
                onChange={e => setMasterQuery(e.target.value)}
                className="input-field pl-9 py-1.5 text-xs border-slate-200"
              />
            </div>
            
            <button 
              onClick={() => {
                setMasterEditId(null);
                setMasterForm(
                  selectedMasterTable === 'vendors' ? { status: 'Active' } :
                  selectedMasterTable === 'staff' ? { role: 'Sales' } : {}
                );
                setShowMasterModal(true);
              }}
              className="btn-primary py-1.5 px-3 text-xs flex items-center space-x-1 cursor-pointer"
            >
              <Plus size={14} /> <span>Add Record</span>
            </button>
          </div>

          {/* Configuration Data Grid */}
          <div className="card p-5 bg-white border overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                  {getMasterTableColumns().map((col, index) => (
                    <th key={col} className={`py-2 capitalize ${index === 0 ? 'pl-2' : ''}`}>{col}</th>
                  ))}
                  <th className="py-2 w-20 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-750 text-[12px]">
                {getMasterRows().length === 0 ? (
                  <tr>
                    <td colSpan={getMasterTableColumns().length + 1} className="text-center py-6 text-slate-400 font-sans">
                      No configuration rows found.
                    </td>
                  </tr>
                ) : (
                  getMasterRows().map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      {/* Render fields dynamic */}
                      {getMasterTableColumns().map((col, index) => (
                        <td key={col} className={`py-2 font-sans font-medium text-slate-800 ${index === 0 ? 'pl-2' : ''}`}>
                          {col === 'category_id' 
                            ? (categories.find(c => c.id === row[col])?.name || 'N/A') 
                            : (row[col]?.toString() || '-')}
                        </td>
                      ))}
                      <td className="py-2 text-center font-sans">
                        <div className="flex justify-center space-x-1.5">
                          <button 
                            onClick={() => {
                              setMasterEditId(row.id);
                              // omit id and created_at
                              const { id, created_at, updated_at, ...formData } = row;
                              setMasterForm(formData);
                              setShowMasterModal(true);
                            }}
                            className="text-slate-400 hover:text-primary-600"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={() => handleDeleteMasterRow(row.id)}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: RECORD LEDGERS PAYMENT IN/OUT */}
      {showPaymentModal && (
        <div 
          onClick={() => setShowPaymentModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">
                {paymentType === 'client' ? 'Collect Client Payment' : 'Disburse Vendor Payment'}
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-4 space-y-4 text-xs">
              
              {paymentType === 'client' && (
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Select Event *</label>
                  <select 
                    className="input-field py-2 text-xs"
                    value={paymentForm.event_id}
                    onChange={e => setPaymentForm({...paymentForm, event_id: e.target.value})}
                    required
                  >
                    <option value="">-- Select client event --</option>
                    {events.filter(evt => evt.client_id === paymentForm.client_id || paymentForm.client_id === '').map(evt => (
                      <option key={evt.id} value={evt.id}>{evt.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {paymentType === 'vendor' && (
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Associated Event</label>
                  <select 
                    className="input-field py-2 text-xs"
                    value={paymentForm.event_id}
                    onChange={e => setPaymentForm({...paymentForm, event_id: e.target.value})}
                  >
                    <option value="">-- No specific event (General pool) --</option>
                    {events.map(evt => (
                      <option key={evt.id} value={evt.id}>{evt.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Payment Date *</label>
                  <input 
                    type="date"
                    className="input-field py-2 text-xs"
                    value={paymentForm.date}
                    onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Amount (₹) *</label>
                  <input 
                    type="number"
                    className="input-field py-2 text-xs"
                    placeholder="Amount in Rupees"
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Payment Method *</label>
                  <select 
                    className="input-field py-2 text-xs"
                    value={paymentForm.payment_method_id}
                    onChange={e => setPaymentForm({...paymentForm, payment_method_id: e.target.value})}
                    required
                  >
                    <option value="">-- Choose Method --</option>
                    {methods.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Financial Account *</label>
                  {paymentType === 'client' ? (
                    <input 
                      type="text"
                      className="input-field py-2 text-xs"
                      placeholder="e.g. HDFC Bank, Petty Cash"
                      value={paymentForm.account || ''}
                      onChange={e => setPaymentForm({...paymentForm, account: e.target.value})}
                      required
                    />
                  ) : (
                    <select 
                      className="input-field py-2 text-xs"
                      value={paymentForm.account_id}
                      onChange={e => setPaymentForm({...paymentForm, account_id: e.target.value})}
                      required
                    >
                      <option value="">-- Choose Account --</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Reference Number / Tx ID</label>
                <input 
                  type="text"
                  className="input-field py-2 text-xs"
                  placeholder="e.g. UPI ID, cheque reference"
                  value={paymentForm.reference_number || ''}
                  onChange={e => setPaymentForm({...paymentForm, reference_number: e.target.value})}
                />
              </div>

              {paymentType === 'client' && (
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Notes</label>
                  <textarea 
                    rows="2"
                    className="input-field py-2 text-xs resize-none"
                    placeholder="Add notes about this payment..."
                    value={paymentForm.notes || ''}
                    onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})}
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary py-2 cursor-pointer">Cancel</button>
                <button type="submit" className="btn-primary py-2 px-4 cursor-pointer">Record Transaction</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MASTER CONFIGURATOR ADD/EDIT */}
      {showMasterModal && (
        <div 
          onClick={() => setShowMasterModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">
                {masterEditId ? 'Edit Reference Record' : 'Add Configuration Record'}
              </h3>
              <button onClick={() => setShowMasterModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMasterRow} className="p-4 space-y-4 text-xs">
              
              {/* Dynamic Form render based on table schema */}
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Item Title / Name *</label>
                <input 
                  type="text"
                  className="input-field py-2 text-xs"
                  placeholder="Name"
                  value={masterForm.name || ''}
                  onChange={e => setMasterForm({...masterForm, name: e.target.value})}
                  required
                />
              </div>

              {selectedMasterTable === 'staff' && (
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Employee Role *</label>
                  <select
                    className="input-field py-2 text-xs"
                    value={masterForm.role || ''}
                    onChange={e => setMasterForm({...masterForm, role: e.target.value})}
                    required
                  >
                    <option value="Sales">Sales Executive</option>
                    <option value="Operations">Operations Supervisor</option>
                    <option value="Accounts">Accounts Specialist</option>
                    <option value="Admin">Administrator Owner</option>
                  </select>
                </div>
              )}

              {selectedMasterTable === 'clients' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Client Mobile Number *</label>
                    <input 
                      type="text"
                      className="input-field py-2 text-xs"
                      placeholder="Phone"
                      value={masterForm.phone || ''}
                      onChange={e => setMasterForm({...masterForm, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Email Address</label>
                    <input 
                      type="email"
                      className="input-field py-2 text-xs"
                      placeholder="Email"
                      value={masterForm.email || ''}
                      onChange={e => setMasterForm({...masterForm, email: e.target.value})}
                    />
                  </div>
                </>
              )}

              {selectedMasterTable === 'vendors' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Vendor Specialty Category</label>
                    <select
                      className="input-field py-2 text-xs"
                      value={masterForm.category_id || ''}
                      onChange={e => setMasterForm({...masterForm, category_id: e.target.value || null})}
                    >
                      <option value="">-- Choose Category --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Phone Number</label>
                    <input 
                      type="text"
                      className="input-field py-2 text-xs"
                      placeholder="Phone"
                      value={masterForm.phone || ''}
                      onChange={e => setMasterForm({...masterForm, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Email Address</label>
                    <input 
                      type="email"
                      className="input-field py-2 text-xs"
                      placeholder="Email"
                      value={masterForm.email || ''}
                      onChange={e => setMasterForm({...masterForm, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Status</label>
                    <select
                      className="input-field py-2 text-xs"
                      value={masterForm.status || ''}
                      onChange={e => setMasterForm({...masterForm, status: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowMasterModal(false)} className="btn-secondary py-2 cursor-pointer">Cancel</button>
                <button type="submit" className="btn-primary py-2 px-4 cursor-pointer">Save Reference</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD DIRECT VENDOR EXPENSE */}
      {showExpenseModal && (
        <div 
          onClick={() => setShowExpenseModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Add Vendor Expense Invoice</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordVendorExpense} className="p-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Associated Client (Optional)</label>
                <select
                  className="input-field py-2 text-xs"
                  value={vendorExpenseForm.client_id || ''}
                  onChange={e => {
                    const cid = e.target.value;
                    setVendorExpenseForm({
                      ...vendorExpenseForm,
                      client_id: cid,
                      event_id: ''
                    });
                  }}
                >
                  <option value="">-- No Specific Client (Show All Events) --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Associated Event (Optional)</label>
                <select
                  className="input-field py-2 text-xs"
                  value={vendorExpenseForm.event_id || ''}
                  onChange={e => {
                    const eid = e.target.value;
                    const evObj = events.find(ev => ev.id === eid);
                    setVendorExpenseForm({
                      ...vendorExpenseForm,
                      event_id: eid || null,
                      client_id: evObj ? evObj.client_id : vendorExpenseForm.client_id
                    });
                  }}
                >
                  <option value="">-- No Specific Event (General Ledger) --</option>
                  {(vendorExpenseForm.client_id 
                    ? events.filter(ev => ev.client_id === vendorExpenseForm.client_id) 
                    : events
                  ).map(ev => {
                    const cl = clients.find(c => c.id === ev.client_id);
                    return (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} ({ev.event_id_serial || 'EVT'}) {cl ? `[${cl.name}]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {vendorExpenseForm.event_id && (
                <div>
                  <label className="block font-semibold text-slate-650 mb-1">Associated Ceremony (Optional)</label>
                  <select
                    className="input-field py-2 text-xs cursor-pointer"
                    value={vendorExpenseForm.function_id || ''}
                    onChange={e => setVendorExpenseForm({...vendorExpenseForm, function_id: e.target.value || null})}
                  >
                    <option value="">-- General Costs --</option>
                    {functions.filter(f => f.event_id === vendorExpenseForm.event_id).map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Expense Category *</label>
                  <select
                    className="input-field py-2 text-xs"
                    value={vendorExpenseForm.category_id}
                    onChange={e => setVendorExpenseForm({...vendorExpenseForm, category_id: e.target.value})}
                    required
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Invoice Date *</label>
                  <input 
                    type="date"
                    className="input-field py-2 text-xs"
                    value={vendorExpenseForm.date}
                    onChange={e => setVendorExpenseForm({...vendorExpenseForm, date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Invoice Amount (₹) *</label>
                <input 
                  type="number"
                  className="input-field py-2 text-xs"
                  placeholder="e.g. 25000"
                  value={vendorExpenseForm.amount}
                  onChange={e => setVendorExpenseForm({...vendorExpenseForm, amount: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Payment Method (Optional)</label>
                  <select 
                    className="input-field py-2 text-xs"
                    value={vendorExpenseForm.payment_method_id}
                    onChange={e => setVendorExpenseForm({...vendorExpenseForm, payment_method_id: e.target.value || ''})}
                  >
                    <option value="">-- None (Unpaid Invoice) --</option>
                    {methods.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Financial Account (Optional)</label>
                  <select 
                    className="input-field py-2 text-xs"
                    value={vendorExpenseForm.account_id}
                    onChange={e => setVendorExpenseForm({...vendorExpenseForm, account_id: e.target.value || ''})}
                  >
                    <option value="">-- None (Unpaid Invoice) --</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Remarks / Particulars</label>
                <input 
                  type="text"
                  className="input-field py-2 text-xs"
                  placeholder="e.g. Stage flowers purchase, sound setup charges"
                  value={vendorExpenseForm.remarks}
                  onChange={e => setVendorExpenseForm({...vendorExpenseForm, remarks: e.target.value})}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="btn-secondary py-2 cursor-pointer">Cancel</button>
                <button type="submit" className="btn-primary py-2 px-4 cursor-pointer">Record Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADJUST OUTSTANDING BALANCE */}
      {showAdjustmentModal && (
        <div 
          onClick={() => setShowAdjustmentModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Adjust Outstanding Balance</h3>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordVendorAdjustment} className="p-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Desired Outstanding Balance (₹) *</label>
                <input 
                  type="number"
                  className="input-field py-2 text-xs"
                  placeholder="Enter target outstanding amount"
                  value={adjustmentForm.target_outstanding}
                  onChange={e => setAdjustmentForm({...adjustmentForm, target_outstanding: e.target.value})}
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block font-sans">
                  The system will automatically record an adjustment transaction to match this outstanding balance.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Adjustment Date *</label>
                <input 
                  type="date"
                  className="input-field py-2 text-xs"
                  value={adjustmentForm.date}
                  onChange={e => setAdjustmentForm({...adjustmentForm, date: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Reason / Remarks</label>
                <input 
                  type="text"
                  className="input-field py-2 text-xs"
                  placeholder="e.g. Opening balance adjustment"
                  value={adjustmentForm.remarks}
                  onChange={e => setAdjustmentForm({...adjustmentForm, remarks: e.target.value})}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAdjustmentModal(false)} className="btn-secondary py-2 cursor-pointer">Cancel</button>
                <button type="submit" className="btn-primary py-2 px-4 cursor-pointer">Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default More;
