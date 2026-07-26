import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Calendar, Users, IndianRupee, CreditCard, PlusCircle, Download, X, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Database Data States
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [clientPayments, setClientPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vendorPayments, setVendorPayments] = useState([]);
  const [meetings, setMeetings] = useState([]);
  
  // Masters
  const [accounts, setAccounts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'client_payment', 'vendor_payment', 'expense', 'vendor'
  const [submitting, setSubmitting] = useState(false);

  // Quick Action Form States
  const [clientPaymentForm, setClientPaymentForm] = useState({
    event_id: '',
    date: new Date().toISOString().split('T')[0],
    amount_received: '',
    payment_method_id: '',
    account_id: '',
    reference_number: ''
  });

  const [vendorPaymentForm, setVendorPaymentForm] = useState({
    vendor_id: '',
    event_id: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method_id: '',
    account_id: '',
    reference_number: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    event_id: '',
    vendor_id: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method_id: '',
    account_id: '',
    remarks: ''
  });

  const [vendorForm, setVendorForm] = useState({
    name: '',
    category_id: '',
    phone: '',
    email: '',
    status: 'Active'
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        resEvents,
        resClients,
        resVendors,
        resClientPayments,
        resExpenses,
        resVendorPayments,
        resMeetings,
        resAccounts,
        resMethods,
        resCategories
      ] = await Promise.all([
        supabase.from('events').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*'),
        supabase.from('vendors').select('*'),
        supabase.from('client_payments').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('vendor_payments').select('*'),
        supabase.from('event_meetings').select('*').order('meeting_date', { ascending: true }),
        supabase.from('master_accounts').select('*'),
        supabase.from('master_payment_methods').select('*'),
        supabase.from('master_expense_categories').select('*')
      ]);

      if (resEvents.data) setEvents(resEvents.data);
      if (resClients.data) setClients(resClients.data);
      if (resVendors.data) setVendors(resVendors.data);
      if (resClientPayments.data) setClientPayments(resClientPayments.data);
      if (resExpenses.data) setExpenses(resExpenses.data);
      if (resVendorPayments.data) setVendorPayments(resVendorPayments.data);
      if (resMeetings.data) setMeetings(resMeetings.data);
      
      if (resAccounts.data) setAccounts(resAccounts.data);
      if (resMethods.data) setPaymentMethods(resMethods.data);
      if (resCategories.data) setExpenseCategories(resCategories.data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      showNotification("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculated Metrics
  const activeEventsCount = events.filter(e => e.status !== 'Completed' && e.status !== 'Cancelled').length;
  const completedEventsCount = events.filter(e => e.status === 'Completed').length;
  const totalEventsCount = events.length;

  // Monthly filters
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const isCurrentMonth = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  // Client payments received in current month
  const monthlyRevenue = clientPayments
    .filter(p => isCurrentMonth(p.date))
    .reduce((sum, p) => sum + Number(p.amount_received || 0), 0);

  // Expenses in current month
  const monthlyExpenses = expenses
    .filter(e => isCurrentMonth(e.date))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const monthlyProfit = monthlyRevenue - monthlyExpenses;

  // Outstanding Client Payments
  const outstandingClientPayments = events
    .filter(e => e.status !== 'Cancelled')
    .reduce((sum, e) => sum + Number(e.amount_outstanding || 0), 0);

  // Outstanding Vendor Payments
  const totalVendorExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalVendorPayments = vendorPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const outstandingVendorPayments = totalVendorExpenses - totalVendorPayments;

  // KPI cards display structure
  const kpiData = [
    { title: 'Active Events', value: activeEventsCount.toString(), icon: <Calendar className="text-purple-500" size={24} />, bgColor: 'bg-purple-50', valueColor: 'text-purple-600', link: '/events' },
    { title: 'Monthly Revenue', value: `₹${monthlyRevenue.toLocaleString('en-IN')}`, icon: <IndianRupee className="text-green-500" size={24} />, bgColor: 'bg-green-50', valueColor: 'text-green-600', link: '/reports' },
    { title: 'Monthly Expenses', value: `₹${monthlyExpenses.toLocaleString('en-IN')}`, icon: <CreditCard className="text-red-500" size={24} />, bgColor: 'bg-red-50', valueColor: 'text-red-600', link: '/reports' },
    { title: 'Monthly Profit', value: `₹${monthlyProfit.toLocaleString('en-IN')}`, icon: <TrendingUp className="text-primary-500" size={24} />, bgColor: 'bg-primary-50', valueColor: 'text-primary-600', link: '/reports' },
    { title: 'Client Outstanding', value: `₹${outstandingClientPayments.toLocaleString('en-IN')}`, icon: <TrendingUp className="text-orange-500" size={24} />, bgColor: 'bg-orange-50', valueColor: 'text-orange-600', link: '/more' },
    { title: 'Vendor Outstanding', value: `₹${outstandingVendorPayments.toLocaleString('en-IN')}`, icon: <TrendingDown className="text-rose-500" size={24} />, bgColor: 'bg-rose-50', valueColor: 'text-rose-600', link: '/more' },
  ];

  // Chart Data preparation
  // Let's group transactions by day of the current month
  const chartDataMap = {};
  // Initialize with last 7 days or matching days in this month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Aggregate current month client payments
  clientPayments.forEach(p => {
    if (isCurrentMonth(p.date)) {
      const day = new Date(p.date).getDate();
      if (!chartDataMap[day]) chartDataMap[day] = { name: `Day ${day}`, revenue: 0, expense: 0 };
      chartDataMap[day].revenue += Number(p.amount_received || 0);
    }
  });

  // Aggregate current month expenses
  expenses.forEach(e => {
    if (isCurrentMonth(e.date)) {
      const day = new Date(e.date).getDate();
      if (!chartDataMap[day]) chartDataMap[day] = { name: `Day ${day}`, revenue: 0, expense: 0 };
      chartDataMap[day].expense += Number(e.amount || 0);
    }
  });

  const chartData = Object.keys(chartDataMap)
    .sort((a, b) => Number(a) - Number(b))
    .map(key => chartDataMap[key]);

  // If no transactions, add a dummy entry
  if (chartData.length === 0) {
    chartData.push({ name: 'No Transactions', revenue: 0, expense: 0 });
  }

  // Upcoming Activities & Events timeline
  const todayStr = now.toISOString().split('T')[0];
  const upcomingEvents = events
    .filter(e => e.status !== 'Completed' && e.status !== 'Cancelled')
    .slice(0, 3)
    .map(e => {
      // Find client name
      const client = clients.find(c => c.id === e.client_id);
      return {
        id: e.id,
        title: e.name,
        client: client ? client.name : 'Unknown Client',
        status: e.status,
        date: e.created_at ? new Date(e.created_at).toLocaleDateString('en-IN') : 'TBD',
        venue: 'Main Venue'
      };
    });

  const upcomingMeetings = meetings
    .filter(m => m.meeting_date >= todayStr)
    .slice(0, 3)
    .map(m => {
      const event = events.find(e => e.id === m.event_id);
      return {
        id: m.id,
        event_id: m.event_id,
        title: event ? `Meeting: ${event.name}` : 'Client Meeting',
        date: m.meeting_date,
        time: m.meeting_time || '',
        notes: m.notes || 'No notes'
      };
    });

  // Database Backup Utility
  const handleBackupExport = async () => {
    try {
      const tables = [
        'events', 'clients', 'vendors', 'event_meetings', 'budget_items', 
        'expenses', 'client_payments', 'vendor_payments', 'master_event_types', 
        'master_lead_sources', 'master_expense_categories', 'master_payment_methods', 
        'master_accounts', 'staff'
      ];
      
      const backupData = {};
      
      await Promise.all(tables.map(async (table) => {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw error;
        backupData[table] = data;
      }));

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crm_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification("Backup exported successfully!");
    } catch (error) {
      console.error("Backup failed:", error);
      showNotification("Backup failed: " + error.message, "error");
    }
  };

  // Submit Handlers
  const handleRecordClientPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { event_id, date, amount_received, payment_method_id, account_id, reference_number } = clientPaymentForm;
      if (!event_id || !amount_received || !payment_method_id || !account_id) {
        showNotification("Please fill in all required fields", "error");
        setSubmitting(false);
        return;
      }

      // Fetch current event to get client_id
      const selectedEvent = events.find(evt => evt.id === event_id);
      if (!selectedEvent) throw new Error("Event not found");

      // Insert payment record
      const paymentAmount = Number(amount_received);
      const { error: insertError } = await supabase.from('client_payments').insert({
        event_id,
        client_id: selectedEvent.client_id,
        date,
        amount_received: paymentAmount,
        payment_method_id,
        account_id,
        reference_number
      });

      if (insertError) throw insertError;

      // Update event balances
      const currentReceived = Number(selectedEvent.amount_received || 0);
      const newReceived = currentReceived + paymentAmount;
      const budgetEst = Number(selectedEvent.budget_estimated || 0);
      const newOutstanding = Math.max(0, budgetEst - newReceived);

      const { error: updateError } = await supabase.from('events').update({
        amount_received: newReceived,
        amount_outstanding: newOutstanding
      }).eq('id', event_id);

      if (updateError) throw updateError;

      showNotification("Client payment recorded successfully!");
      setActiveModal(null);
      setClientPaymentForm({
        event_id: '',
        date: new Date().toISOString().split('T')[0],
        amount_received: '',
        payment_method_id: '',
        account_id: '',
        reference_number: ''
      });
      loadData();
    } catch (error) {
      console.error(error);
      showNotification("Recording payment failed: " + error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordVendorPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { vendor_id, event_id, date, amount, payment_method_id, account_id, reference_number } = vendorPaymentForm;
      if (!vendor_id || !event_id || !amount || !payment_method_id || !account_id) {
        showNotification("Please fill in all required fields", "error");
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from('vendor_payments').insert({
        vendor_id,
        event_id,
        date,
        amount: Number(amount),
        payment_method_id,
        account_id,
        reference_number
      });

      if (error) throw error;

      showNotification("Vendor payment recorded successfully!");
      setActiveModal(null);
      setVendorPaymentForm({
        vendor_id: '',
        event_id: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method_id: '',
        account_id: '',
        reference_number: ''
      });
      loadData();
    } catch (error) {
      console.error(error);
      showNotification("Recording vendor payment failed: " + error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { event_id, vendor_id, category_id, date, amount, payment_method_id, account_id, remarks } = expenseForm;
      if (!event_id || !category_id || !amount || !payment_method_id || !account_id) {
        showNotification("Please fill in all required fields", "error");
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from('expenses').insert({
        event_id,
        vendor_id: vendor_id || null,
        category_id,
        date,
        amount: Number(amount),
        payment_method_id,
        account_id,
        remarks
      });

      if (error) throw error;

      // Update event actual budget
      const selectedEvent = events.find(evt => evt.id === event_id);
      if (selectedEvent) {
        const currentActual = Number(selectedEvent.budget_actual || 0);
        const newActual = currentActual + Number(amount);
        await supabase.from('events').update({
          budget_actual: newActual
        }).eq('id', event_id);
      }

      showNotification("Expense added successfully!");
      setActiveModal(null);
      setExpenseForm({
        event_id: '',
        vendor_id: '',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method_id: '',
        account_id: '',
        remarks: ''
      });
      loadData();
    } catch (error) {
      console.error(error);
      showNotification("Adding expense failed: " + error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { name, category_id, phone, email, status } = vendorForm;
      if (!name) {
        showNotification("Vendor name is required", "error");
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from('vendors').insert({
        name,
        category_id: category_id || null,
        phone,
        email,
        status
      });

      if (error) throw error;

      showNotification("Vendor added successfully!");
      setActiveModal(null);
      setVendorForm({
        name: '',
        category_id: '',
        phone: '',
        email: '',
        status: 'Active'
      });
      loadData();
    } catch (error) {
      console.error(error);
      showNotification("Adding vendor failed: " + error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-white flex items-center space-x-2 transition-all duration-300 ${
          notification.type === 'error' ? 'bg-red-500 border-red-600' : 'bg-green-500 border-green-600'
        }`}>
          <Check size={18} />
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      {/* Greeting and Quick backup */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-sans">Hello, Operations Team</h2>
          <p className="text-slate-500 text-sm">Today is {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button 
          onClick={handleBackupExport}
          className="btn-secondary flex items-center space-x-2 border-slate-200 bg-white cursor-pointer"
        >
          <Download size={16} />
          <span>Export Backup</span>
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Today's Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {kpiData.map((kpi, idx) => (
                <div 
                  key={idx} 
                  onClick={() => navigate(kpi.link)}
                  className={`${kpi.bgColor} p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col cursor-pointer hover:shadow-md transition-all active:scale-98`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-slate-600 text-xs font-semibold uppercase">{kpi.title}</span>
                    {kpi.icon}
                  </div>
                  <span className={`text-xl font-bold ${kpi.valueColor}`}>{kpi.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="card p-5">
            <h3 className="text-md font-bold text-slate-800 mb-4">Quick Operations</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Link to="/add" className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-primary-50 hover:text-primary-600 text-slate-600 transition-colors border border-slate-100 text-center">
                <PlusCircle size={28} className="mb-2" />
                <span className="text-xs font-bold font-sans">Create Event</span>
              </Link>
              <button 
                onClick={() => setActiveModal('client_payment')}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-primary-50 hover:text-primary-600 text-slate-600 transition-colors border border-slate-100 text-center cursor-pointer"
              >
                <IndianRupee size={28} className="mb-2" />
                <span className="text-xs font-bold font-sans">Client Payment</span>
              </button>
              <button 
                onClick={() => setActiveModal('vendor_payment')}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-primary-50 hover:text-primary-600 text-slate-600 transition-colors border border-slate-100 text-center cursor-pointer"
              >
                <CreditCard size={28} className="mb-2" />
                <span className="text-xs font-bold font-sans">Vendor Payment</span>
              </button>
              <button 
                onClick={() => setActiveModal('expense')}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-primary-50 hover:text-primary-600 text-slate-600 transition-colors border border-slate-100 text-center cursor-pointer"
              >
                <TrendingDown size={28} className="mb-2" />
                <span className="text-xs font-bold font-sans">Record Expense</span>
              </button>
              <button 
                onClick={() => setActiveModal('vendor')}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-primary-50 hover:text-primary-600 text-slate-600 transition-colors border border-slate-100 text-center col-span-2 md:col-span-1 cursor-pointer"
              >
                <Users size={28} className="mb-2" />
                <span className="text-xs font-bold font-sans">Add Vendor</span>
              </button>
            </div>
          </section>

          {/* Revenue vs Expense Chart */}
          <section className="card p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 font-sans">Revenue vs Expense (This Month)</h3>
            </div>
            <div className="h-72 w-full font-sans">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Legend iconType="circle" />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Double Column: Upcoming Events & Upcoming Meetings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
            {/* Upcoming Events */}
            <section className="card p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-800">Recent & Upcoming Events</h3>
                <Link to="/events" className="text-sm font-semibold text-primary-600 hover:text-primary-700">View All</Link>
              </div>
              <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No upcoming events. Click "Create Event" to start.</p>
                ) : (
                  upcomingEvents.map((event) => (
                    <div 
                      key={event.id} 
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="p-4 rounded-xl border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer flex items-center justify-between bg-white"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 text-sm">{event.title}</h4>
                        <p className="text-xs text-slate-500 flex items-center">
                          <Users size={12} className="mr-1" /> {event.client}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className={`inline-block text-[10px] px-2 py-0.5 font-semibold rounded-full ${
                          event.status === 'Confirmed' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {event.status}
                        </span>
                        <p className="text-[10px] text-slate-400">{event.date}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Upcoming Meetings / Timelines */}
            <section className="card p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-800">Scheduled Client Meetings</h3>
              </div>
              <div className="space-y-3">
                {upcomingMeetings.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No upcoming meetings scheduled.</p>
                ) : (
                  upcomingMeetings.map((meeting) => (
                    <div 
                      key={meeting.id}
                      onClick={() => navigate(`/events/${meeting.event_id}`)}
                      className="p-4 rounded-xl border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer space-y-2 bg-white"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-sm truncate max-w-[75%]">{meeting.title}</h4>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2.5 py-0.5 rounded-full flex items-center whitespace-nowrap">
                          <Calendar size={10} className="mr-1" /> {meeting.date} {meeting.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 italic">"{meeting.notes}"</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {/* QUICK ACTION MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {activeModal === 'client_payment' && 'Record Client Payment'}
                {activeModal === 'vendor_payment' && 'Record Vendor Payment'}
                {activeModal === 'expense' && 'Add Expense'}
                {activeModal === 'vendor' && 'Add New Vendor'}
              </h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Forms */}
            <div className="p-5 overflow-y-auto max-h-[80vh]">
              
              {/* Client Payment Form */}
              {activeModal === 'client_payment' && (
                <form onSubmit={handleRecordClientPayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Select Event *</label>
                    <select 
                      className="input-field py-2"
                      value={clientPaymentForm.event_id}
                      onChange={e => setClientPaymentForm({...clientPaymentForm, event_id: e.target.value})}
                      required
                    >
                      <option value="">-- Choose Event --</option>
                      {events.map(evt => (
                        <option key={evt.id} value={evt.id}>{evt.name} (Serial: {evt.event_id_serial || 'None'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                      <input 
                        type="date"
                        className="input-field py-2"
                        value={clientPaymentForm.date}
                        onChange={e => setClientPaymentForm({...clientPaymentForm, date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (₹) *</label>
                      <input 
                        type="number"
                        className="input-field py-2"
                        placeholder="e.g. 50000"
                        value={clientPaymentForm.amount_received}
                        onChange={e => setClientPaymentForm({...clientPaymentForm, amount_received: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method *</label>
                      <select 
                        className="input-field py-2"
                        value={clientPaymentForm.payment_method_id}
                        onChange={e => setClientPaymentForm({...clientPaymentForm, payment_method_id: e.target.value})}
                        required
                      >
                        <option value="">-- Choose --</option>
                        {paymentMethods.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Account *</label>
                      <select 
                        className="input-field py-2"
                        value={clientPaymentForm.account_id}
                        onChange={e => setClientPaymentForm({...clientPaymentForm, account_id: e.target.value})}
                        required
                      >
                        <option value="">-- Choose --</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Reference Number / Transaction ID</label>
                    <input 
                      type="text"
                      className="input-field py-2"
                      placeholder="e.g. UPI Ref #, Cheque #"
                      value={clientPaymentForm.reference_number}
                      onChange={e => setClientPaymentForm({...clientPaymentForm, reference_number: e.target.value})}
                    />
                  </div>
                  <div className="pt-4 flex justify-end space-x-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary py-2 cursor-pointer">Cancel</button>
                    <button type="submit" disabled={submitting} className="btn-primary py-2 px-5 cursor-pointer">
                      {submitting ? 'Recording...' : 'Record Payment'}
                    </button>
                  </div>
                </form>
              )}

              {/* Vendor Payment Form */}
              {activeModal === 'vendor_payment' && (
                <form onSubmit={handleRecordVendorPayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Select Vendor *</label>
                    <select 
                      className="input-field py-2"
                      value={vendorPaymentForm.vendor_id}
                      onChange={e => setVendorPaymentForm({...vendorPaymentForm, vendor_id: e.target.value})}
                      required
                    >
                      <option value="">-- Choose Vendor --</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.phone || 'No phone'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Select Event *</label>
                    <select 
                      className="input-field py-2"
                      value={vendorPaymentForm.event_id}
                      onChange={e => setVendorPaymentForm({...vendorPaymentForm, event_id: e.target.value})}
                      required
                    >
                      <option value="">-- Choose Event --</option>
                      {events.map(evt => (
                        <option key={evt.id} value={evt.id}>{evt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                      <input 
                        type="date"
                        className="input-field py-2"
                        value={vendorPaymentForm.date}
                        onChange={e => setVendorPaymentForm({...vendorPaymentForm, date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Amount Paid (₹) *</label>
                      <input 
                        type="number"
                        className="input-field py-2"
                        placeholder="e.g. 20000"
                        value={vendorPaymentForm.amount}
                        onChange={e => setVendorPaymentForm({...vendorPaymentForm, amount: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method *</label>
                      <select 
                        className="input-field py-2"
                        value={vendorPaymentForm.payment_method_id}
                        onChange={e => setVendorPaymentForm({...vendorPaymentForm, payment_method_id: e.target.value})}
                        required
                      >
                        <option value="">-- Choose --</option>
                        {paymentMethods.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Account *</label>
                      <select 
                        className="input-field py-2"
                        value={vendorPaymentForm.account_id}
                        onChange={e => setVendorPaymentForm({...vendorPaymentForm, account_id: e.target.value})}
                        required
                      >
                        <option value="">-- Choose --</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Reference Number / Transaction ID</label>
                    <input 
                      type="text"
                      className="input-field py-2"
                      placeholder="e.g. Ref transaction info"
                      value={vendorPaymentForm.reference_number}
                      onChange={e => setVendorPaymentForm({...vendorPaymentForm, reference_number: e.target.value})}
                    />
                  </div>
                  <div className="pt-4 flex justify-end space-x-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary py-2 cursor-pointer">Cancel</button>
                    <button type="submit" disabled={submitting} className="btn-primary py-2 px-5 cursor-pointer">
                      {submitting ? 'Recording...' : 'Record Payment'}
                    </button>
                  </div>
                </form>
              )}

              {/* Add Expense Form */}
              {activeModal === 'expense' && (
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Select Event *</label>
                    <select 
                      className="input-field py-2"
                      value={expenseForm.event_id}
                      onChange={e => setExpenseForm({...expenseForm, event_id: e.target.value})}
                      required
                    >
                      <option value="">-- Choose Event --</option>
                      {events.map(evt => (
                        <option key={evt.id} value={evt.id}>{evt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Expense Category *</label>
                      <select 
                        className="input-field py-2"
                        value={expenseForm.category_id}
                        onChange={e => setExpenseForm({...expenseForm, category_id: e.target.value})}
                        required
                      >
                        <option value="">-- Choose Category --</option>
                        {expenseCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Vendor</label>
                      <select 
                        className="input-field py-2"
                        value={expenseForm.vendor_id}
                        onChange={e => setExpenseForm({...expenseForm, vendor_id: e.target.value})}
                      >
                        <option value="">-- No Vendor (Self) --</option>
                        {vendors.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                      <input 
                        type="date"
                        className="input-field py-2"
                        value={expenseForm.date}
                        onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (₹) *</label>
                      <input 
                        type="number"
                        className="input-field py-2"
                        placeholder="e.g. 15000"
                        value={expenseForm.amount}
                        onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method *</label>
                      <select 
                        className="input-field py-2"
                        value={expenseForm.payment_method_id}
                        onChange={e => setExpenseForm({...expenseForm, payment_method_id: e.target.value})}
                        required
                      >
                        <option value="">-- Choose --</option>
                        {paymentMethods.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Account *</label>
                      <select 
                        className="input-field py-2"
                        value={expenseForm.account_id}
                        onChange={e => setExpenseForm({...expenseForm, account_id: e.target.value})}
                        required
                      >
                        <option value="">-- Choose --</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
                    <input 
                      type="text"
                      className="input-field py-2"
                      placeholder="e.g. Stage floral materials, labor charges"
                      value={expenseForm.remarks}
                      onChange={e => setExpenseForm({...expenseForm, remarks: e.target.value})}
                    />
                  </div>
                  <div className="pt-4 flex justify-end space-x-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary py-2 cursor-pointer">Cancel</button>
                    <button type="submit" disabled={submitting} className="btn-primary py-2 px-5 cursor-pointer">
                      {submitting ? 'Adding...' : 'Add Expense'}
                    </button>
                  </div>
                </form>
              )}

              {/* Add Vendor Form */}
              {activeModal === 'vendor' && (
                <form onSubmit={handleAddVendor} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Vendor Name *</label>
                    <input 
                      type="text"
                      className="input-field py-2"
                      placeholder="e.g. Raj Flowers"
                      value={vendorForm.name}
                      onChange={e => setVendorForm({...vendorForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Vendor Category / Specialty</label>
                    <select 
                      className="input-field py-2"
                      value={vendorForm.category_id}
                      onChange={e => setVendorForm({...vendorForm, category_id: e.target.value})}
                    >
                      <option value="">-- Choose Category --</option>
                      {expenseCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                      <input 
                        type="text"
                        className="input-field py-2"
                        placeholder="e.g. +91 99999 88888"
                        value={vendorForm.phone}
                        onChange={e => setVendorForm({...vendorForm, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                      <input 
                        type="email"
                        className="input-field py-2"
                        placeholder="e.g. info@vendor.com"
                        value={vendorForm.email}
                        onChange={e => setVendorForm({...vendorForm, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                    <select 
                      className="input-field py-2"
                      value={vendorForm.status}
                      onChange={e => setVendorForm({...vendorForm, status: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="pt-4 flex justify-end space-x-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary py-2 cursor-pointer">Cancel</button>
                    <button type="submit" disabled={submitting} className="btn-primary py-2 px-5 cursor-pointer">
                      {submitting ? 'Adding...' : 'Add Vendor'}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
