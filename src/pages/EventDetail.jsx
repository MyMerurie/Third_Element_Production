import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, MapPin, IndianRupee, User, Phone, Mail, 
  Plus, Edit2, Trash2, Check, X, ChevronDown, ChevronRight, Save, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const cleanStr = dateString.split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
};

const EventDetail = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');

  // Core Data States
  const [event, setEvent] = useState(null);
  const [client, setClient] = useState(null);
  const [functions, setFunctions] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [clientPayments, setClientPayments] = useState([]);
  const [vendorPayments, setVendorPayments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [useNotesFallback, setUseNotesFallback] = useState(false);

  // Master Data lists
  const [vendors, setVendors] = useState([]);
  const [staff, setStaff] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [leadSources, setLeadSources] = useState([]);

  // Modal & Edit States
  const [activeModal, setActiveModal] = useState(null); // 'meeting', 'expense', 'client_payment', 'vendor_payment', 'note', 'ceremony'
  const [editTarget, setEditTarget] = useState(null); // stores object when editing
  const [expandedCategories, setExpandedCategories] = useState({});
  const [otherEvents, setOtherEvents] = useState([]);
  const [ceremonyForm, setCeremonyForm] = useState({
    name: '',
    function_date: new Date().toISOString().split('T')[0],
    venue: ''
  });

  // Overview Tab Edit State
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [overviewForm, setOverviewForm] = useState({});
  const [clientForm, setClientForm] = useState({});

  // Dynamic Modals Form State
  const [meetingForm, setMeetingForm] = useState({
    meeting_date: '',
    meeting_time: '',
    meeting_type: 'In Person',
    attended_by: '',
    notes: '',
    next_followup_date: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category_id: '',
    vendor_id: '',
    amount: '',
    payment_method_id: '',
    account_id: '',
    remarks: ''
  });

  const [clientPaymentForm, setClientPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount_received: '',
    payment_method_id: '',
    account: '',
    reference_number: '',
    notes: ''
  });

  const [vendorPaymentForm, setVendorPaymentForm] = useState({
    vendor_id: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method_id: '',
    account_id: '',
    reference_number: ''
  });

  const [noteForm, setNoteForm] = useState({
    content: '',
    author: 'Staff'
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Event first to get client_id
      const { data: eventData, error: eventErr } = await supabase.from('events').select('*').eq('id', eventId).single();
      if (eventErr) throw eventErr;
      setEvent(eventData);
      setOverviewForm(eventData);

      // 2. Fetch Client
      if (eventData.client_id) {
        const { data: clientData } = await supabase.from('clients').select('*').eq('id', eventData.client_id).single();
        if (clientData) {
          setClient(clientData);
          setClientForm(clientData);
        }

        // Fetch other events for this client
        const { data: otherEvts } = await supabase.from('events')
          .select('*')
          .eq('client_id', eventData.client_id)
          .neq('id', eventId);
        if (otherEvts) {
          setOtherEvents(otherEvts);
        }
      }

      // 3. Fetch all children & masters
      const [
        resFuncs, resMeetings, resBudget, resExpenses, 
        resClientPay, resVendorPay, resVendors, resStaff,
        resAccounts, resMethods, resCategories, resSources
      ] = await Promise.all([
        supabase.from('event_functions').select('*').eq('event_id', eventId),
        supabase.from('event_meetings').select('*').eq('event_id', eventId).order('meeting_date', { ascending: false }),
        supabase.from('budget_items').select('*').eq('event_id', eventId),
        supabase.from('expenses').select('*').eq('event_id', eventId).order('date', { ascending: false }),
        supabase.from('client_payments').select('*').eq('event_id', eventId).order('date', { ascending: false }),
        supabase.from('vendor_payments').select('*').eq('event_id', eventId).order('date', { ascending: false }),
        supabase.from('vendors').select('*'),
        supabase.from('staff').select('*'),
        supabase.from('master_accounts').select('*'),
        supabase.from('master_payment_methods').select('*'),
        supabase.from('master_expense_categories').select('*'),
        supabase.from('master_lead_sources').select('*')
      ]);

      if (resFuncs.data) setFunctions(resFuncs.data);
      if (resMeetings.data) setMeetings(resMeetings.data);
      if (resBudget.data) setBudgetItems(resBudget.data);
      if (resExpenses.data) setExpenses(resExpenses.data);
      if (resClientPay.data) setClientPayments(resClientPay.data);
      if (resVendorPay.data) setVendorPayments(resVendorPay.data);
      
      if (resVendors.data) setVendors(resVendors.data);
      if (resStaff.data) setStaff(resStaff.data);
      if (resAccounts.data) setAccounts(resAccounts.data);
      if (resMethods.data) setPaymentMethods(resMethods.data);
      if (resCategories.data) setExpenseCategories(resCategories.data);
      if (resSources.data) setLeadSources(resSources.data);

      // Expand all budget categories by default
      const defaultExpanded = {};
      if (resCategories.data) {
        resCategories.data.forEach(c => {
          defaultExpanded[c.id] = true;
        });
      }
      setExpandedCategories(defaultExpanded);

      // 4. Fetch notes with fallback
      await loadNotes(eventId);

    } catch (err) {
      console.error(err);
      showNotification("Failed to load event details", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async (evtId) => {
    try {
      const { data: notesData, error: notesErr } = await supabase.from('event_notes').select('*').eq('event_id', evtId).order('created_at', { ascending: false });
      if (notesErr) {
        // Fall back to event_meetings where meeting_type = 'Note'
        setUseNotesFallback(true);
        const { data: fallbackNotes } = await supabase.from('event_meetings')
          .select('*')
          .eq('event_id', evtId)
          .eq('meeting_type', 'Note')
          .order('meeting_date', { ascending: false });
        
        if (fallbackNotes) {
          setNotes(fallbackNotes.map(n => ({
            id: n.id,
            content: n.notes,
            author: 'Staff',
            created_at: n.meeting_date + 'T' + (n.meeting_time || '00:00:00')
          })));
        }
      } else {
        setNotes(notesData || []);
      }
    } catch (e) {
      console.error("Notes load error:", e);
    }
  };

  useEffect(() => {
    loadData();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
        setEditTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [eventId]);

  // Recalculates metrics and updates events table in Supabase
  const updateEventFinancials = async () => {
    // 1. Fetch latest event details
    const { data: latestEvent } = await supabase.from('events').select('*').eq('id', eventId).single();
    const currentEvent = latestEvent || event;

    // 2. Fetch latest budget items to calculate Estimated Budget and Closing Budget
    const { data: bItems } = await supabase.from('budget_items').select('*').eq('event_id', eventId);
    const activeBudgetItems = bItems || [];
    const bEst = activeBudgetItems.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.estimated_cost || 0)), 0);
    const bAct = activeBudgetItems.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.actual_cost || 0)), 0);

    // 3. Fetch latest client payments to calculate Total Received
    const { data: cPayments } = await supabase.from('client_payments').select('*').eq('event_id', eventId);
    const amtRec = (cPayments || []).reduce((sum, p) => sum + Number(p.amount_received || 0), 0);

    // 4. Outstanding is always calculated as Closing Budget (bAct) - Total Received
    const amtOut = Math.max(0, bAct - amtRec);

    // 5. Update Database row
    const { error } = await supabase.from('events').update({
      budget_estimated: bEst,
      amount_received: amtRec,
      amount_outstanding: amtOut,
      budget_actual: bAct
    }).eq('id', eventId);

    if (error) {
      console.error("Financial update failed:", error);
    } else {
      const updatedMetrics = {
        budget_estimated: bEst,
        amount_received: amtRec,
        amount_outstanding: amtOut,
        budget_actual: bAct
      };
      setEvent(prev => ({ ...prev, ...updatedMetrics }));
      setOverviewForm(prev => ({ ...prev, ...updatedMetrics }));
    }
  };

  // OVERVIEW TAB: Save handler
  const handleSaveOverview = async () => {
    setLoading(true);
    try {
      // 1. Update client details
      const { error: clientErr } = await supabase.from('clients').update({
        name: clientForm.name,
        phone: clientForm.phone,
        email: clientForm.email
      }).eq('id', event.client_id);
      if (clientErr) throw clientErr;

      // 2. Update event details
      const bAct = Number(overviewForm.budget_actual || 0);

      const { error: eventErr } = await supabase.from('events').update({
        name: overviewForm.name,
        status: overviewForm.status,
        lead_source_id: overviewForm.lead_source_id || null,
        sales_executive_id: overviewForm.sales_executive_id || null,
        budget_actual: bAct
      }).eq('id', eventId);
      if (eventErr) throw eventErr;

      showNotification("Overview updated successfully!");
      setIsEditingOverview(false);
      
      // Calculate latest estimated budget, payments received, and outstanding
      await updateEventFinancials();
      await loadData();
    } catch (err) {
      console.error(err);
      showNotification("Update failed: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // MEETINGS CRUD
  // ----------------------------------------------------
  const handleSaveMeeting = async (e) => {
    e.preventDefault();
    try {
      if (editTarget) {
        // Edit
        const { error } = await supabase.from('event_meetings').update({
          meeting_date: meetingForm.meeting_date,
          meeting_time: meetingForm.meeting_time || null,
          meeting_type: meetingForm.meeting_type,
          attended_by: meetingForm.attended_by || null,
          notes: meetingForm.notes,
          next_followup_date: meetingForm.next_followup_date || null
        }).eq('id', editTarget.id);
        if (error) throw error;
        showNotification("Meeting updated successfully!");
      } else {
        // Add
        const { error } = await supabase.from('event_meetings').insert({
          event_id: eventId,
          meeting_date: meetingForm.meeting_date,
          meeting_time: meetingForm.meeting_time || null,
          meeting_type: meetingForm.meeting_type,
          attended_by: meetingForm.attended_by || null,
          notes: meetingForm.notes,
          next_followup_date: meetingForm.next_followup_date || null
        });
        if (error) throw error;
        showNotification("Meeting added successfully!");
      }
      setActiveModal(null);
      setEditTarget(null);
      setMeetingForm({ meeting_date: '', meeting_time: '', meeting_type: 'In Person', attended_by: '', notes: '', next_followup_date: '' });
      loadData();
    } catch (err) {
      showNotification("Saving meeting failed: " + err.message, "error");
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm("Are you sure you want to delete this meeting record?")) return;
    try {
      const { error } = await supabase.from('event_meetings').delete().eq('id', meetingId);
      if (error) throw error;
      showNotification("Meeting record deleted.");
      loadData();
    } catch (err) {
      showNotification("Deletion failed: " + err.message, "error");
    }
  };
  
  // ----------------------------------------------------
  // CEREMONIES (EVENT FUNCTIONS) CRUD
  // ----------------------------------------------------
  const handleSaveCeremony = async (e) => {
    e.preventDefault();
    try {
      if (editTarget) {
        // Edit
        const { error } = await supabase.from('event_functions').update({
          name: ceremonyForm.name,
          function_date: ceremonyForm.function_date,
          venue: ceremonyForm.venue || null
        }).eq('id', editTarget.id);
        if (error) throw error;
        showNotification("Ceremony updated successfully!");
      } else {
        // Add
        const { error } = await supabase.from('event_functions').insert({
          event_id: eventId,
          name: ceremonyForm.name,
          function_date: ceremonyForm.function_date,
          venue: ceremonyForm.venue || null
        });
        if (error) throw error;
        showNotification("Ceremony added successfully!");
      }
      setActiveModal(null);
      setEditTarget(null);
      setCeremonyForm({ name: '', function_date: new Date().toISOString().split('T')[0], venue: '' });
      loadData();
    } catch (err) {
      showNotification("Saving ceremony failed: " + err.message, "error");
    }
  };

  const handleDeleteCeremony = async (ceremonyId) => {
    if (!window.confirm("Are you sure you want to delete this ceremony function?")) return;
    try {
      const { error } = await supabase.from('event_functions').delete().eq('id', ceremonyId);
      if (error) throw error;
      showNotification("Ceremony deleted.");
      loadData();
    } catch (err) {
      showNotification("Deletion failed: " + err.message, "error");
    }
  };

  // ----------------------------------------------------
  // BUDGET TAB: INLINE INTERACTION
  // ----------------------------------------------------
  const handleAddBudgetItem = async (categoryId) => {
    try {
      const { data, error } = await supabase.from('budget_items').insert({
        event_id: eventId,
        category_id: categoryId,
        description: 'New Budget Item',
        quantity: 1,
        unit: 'Pcs',
        estimated_cost: 0,
        notes: ''
      }).select().single();

      if (error) throw error;
      setBudgetItems(prev => [...prev, data]);
      showNotification("Item added. Click cells to edit.");
    } catch (err) {
      showNotification("Add failed: " + err.message, "error");
    }
  };

  const handleUpdateBudgetItemInline = async (itemId, field, value) => {
    try {
      // Find item
      const item = budgetItems.find(b => b.id === itemId);
      if (!item) return;

      const updatedVal = (field === 'quantity' || field === 'estimated_cost') ? Number(value) : value;

      // Optimistic state update
      const updatedItems = budgetItems.map(b => b.id === itemId ? { ...b, [field]: updatedVal } : b);
      setBudgetItems(updatedItems);

      // Save to database
      const { error } = await supabase.from('budget_items').update({
        [field]: updatedVal
      }).eq('id', itemId);

      if (error) throw error;

      updateEventFinancials();

    } catch (err) {
      console.error(err);
      showNotification("Inline update failed: " + err.message, "error");
    }
  };

  const handleDeleteBudgetItem = async (itemId) => {
    if (!window.confirm("Delete this budget item?")) return;
    try {
      const { error } = await supabase.from('budget_items').delete().eq('id', itemId);
      if (error) throw error;

      const remaining = budgetItems.filter(b => b.id !== itemId);
      setBudgetItems(remaining);

      updateEventFinancials();

      showNotification("Item deleted.");
    } catch (err) {
      showNotification("Delete failed: " + err.message, "error");
    }
  };

  // ----------------------------------------------------
  // EXPENSES CRUD
  // ----------------------------------------------------
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    try {
      const amt = Number(expenseForm.amount);
      if (editTarget) {
        // Edit
        const { error } = await supabase.from('expenses').update({
          date: expenseForm.date,
          category_id: expenseForm.category_id,
          vendor_id: expenseForm.vendor_id || null,
          amount: amt,
          payment_method_id: expenseForm.payment_method_id,
          account_id: expenseForm.account_id,
          remarks: expenseForm.remarks,
          function_id: expenseForm.function_id || null
        }).eq('id', editTarget.id);
        if (error) throw error;
        showNotification("Expense updated.");
      } else {
        // Add
        const { error } = await supabase.from('expenses').insert({
          event_id: eventId,
          date: expenseForm.date,
          category_id: expenseForm.category_id,
          vendor_id: expenseForm.vendor_id || null,
          amount: amt,
          payment_method_id: expenseForm.payment_method_id,
          account_id: expenseForm.account_id,
          remarks: expenseForm.remarks,
          function_id: expenseForm.function_id || null
        });
        if (error) throw error;
        showNotification("Expense added.");
      }
      setActiveModal(null);
      setEditTarget(null);
      loadData().then(() => updateEventFinancials());
    } catch (err) {
      showNotification("Expense error: " + err.message, "error");
    }
  };

  const handleDeleteExpense = async (expId) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', expId);
      if (error) throw error;
      showNotification("Expense deleted.");
      loadData().then(() => updateEventFinancials());
    } catch (err) {
      showNotification("Delete failed: " + err.message, "error");
    }
  };

  // ----------------------------------------------------
  // CLIENT PAYMENTS CRUD
  // ----------------------------------------------------
  const handleSaveClientPayment = async (e) => {
    e.preventDefault();
    try {
      const amt = Number(clientPaymentForm.amount_received);
      if (editTarget) {
        const diff = amt - Number(editTarget.amount_received);
        const { error } = await supabase.from('client_payments').update({
          date: clientPaymentForm.date,
          amount_received: amt,
          payment_method_id: clientPaymentForm.payment_method_id,
          account: clientPaymentForm.account,
          reference_number: clientPaymentForm.reference_number,
          notes: clientPaymentForm.notes
        }).eq('id', editTarget.id);
        if (error) throw error;

        updateEventFinancials();
        showNotification("Payment updated.");
      } else {
        const { error } = await supabase.from('client_payments').insert({
          event_id: eventId,
          client_id: event.client_id,
          date: clientPaymentForm.date,
          amount_received: amt,
          payment_method_id: clientPaymentForm.payment_method_id,
          account: clientPaymentForm.account,
          reference_number: clientPaymentForm.reference_number,
          notes: clientPaymentForm.notes
        });
        if (error) throw error;

        updateEventFinancials();
        showNotification("Payment recorded.");
      }
      setActiveModal(null);
      setEditTarget(null);
      loadData();
    } catch (err) {
      showNotification("Payment failed: " + err.message, "error");
    }
  };

  const handleDeleteClientPayment = async (payId, amt) => {
    if (!window.confirm("Delete this client payment record?")) return;
    try {
      const { error } = await supabase.from('client_payments').delete().eq('id', payId);
      if (error) throw error;

      updateEventFinancials();
      showNotification("Payment record deleted.");
      loadData();
    } catch (err) {
      showNotification("Delete failed: " + err.message, "error");
    }
  };

  // ----------------------------------------------------
  // VENDOR PAYMENTS CRUD
  // ----------------------------------------------------
  const handleSaveVendorPayment = async (e) => {
    e.preventDefault();
    try {
      const amt = Number(vendorPaymentForm.amount);
      if (editTarget) {
        const { error } = await supabase.from('vendor_payments').update({
          vendor_id: vendorPaymentForm.vendor_id,
          date: vendorPaymentForm.date,
          amount: amt,
          payment_method_id: vendorPaymentForm.payment_method_id,
          account_id: vendorPaymentForm.account_id,
          reference_number: vendorPaymentForm.reference_number
        }).eq('id', editTarget.id);
        if (error) throw error;
        showNotification("Vendor payment updated.");
      } else {
        const { error } = await supabase.from('vendor_payments').insert({
          event_id: eventId,
          vendor_id: vendorPaymentForm.vendor_id,
          date: vendorPaymentForm.date,
          amount: amt,
          payment_method_id: vendorPaymentForm.payment_method_id,
          account_id: vendorPaymentForm.account_id,
          reference_number: vendorPaymentForm.reference_number
        });
        if (error) throw error;
        showNotification("Vendor payment recorded.");
      }
      setActiveModal(null);
      setEditTarget(null);
      loadData();
    } catch (err) {
      showNotification("Vendor payment failed: " + err.message, "error");
    }
  };

  const handleDeleteVendorPayment = async (payId) => {
    if (!window.confirm("Delete this vendor payment record?")) return;
    try {
      const { error } = await supabase.from('vendor_payments').delete().eq('id', payId);
      if (error) throw error;
      showNotification("Vendor payment deleted.");
      loadData();
    } catch (err) {
      showNotification("Delete failed: " + err.message, "error");
    }
  };

  // ----------------------------------------------------
  // NOTES CRUD (WITH MEETING TYPE Note FALLBACK)
  // ----------------------------------------------------
  const handleSaveNote = async (e) => {
    e.preventDefault();
    try {
      if (useNotesFallback) {
        // Store as meeting with type 'Note'
        if (editTarget) {
          const { error } = await supabase.from('event_meetings').update({
            notes: noteForm.content,
            meeting_date: new Date().toISOString().split('T')[0]
          }).eq('id', editTarget.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('event_meetings').insert({
            event_id: eventId,
            meeting_type: 'Note',
            notes: noteForm.content,
            meeting_date: new Date().toISOString().split('T')[0],
            meeting_time: new Date().toTimeString().split(' ')[0]
          });
          if (error) throw error;
        }
      } else {
        // Store in event_notes
        if (editTarget) {
          const { error } = await supabase.from('event_notes').update({
            content: noteForm.content
          }).eq('id', editTarget.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('event_notes').insert({
            event_id: eventId,
            content: noteForm.content,
            author: noteForm.author || 'Staff'
          });
          if (error) throw error;
        }
      }
      showNotification("Note saved!");
      setActiveModal(null);
      setEditTarget(null);
      setNoteForm({ content: '', author: 'Staff' });
      loadNotes(eventId);
    } catch (err) {
      showNotification("Note save failed: " + err.message, "error");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      if (useNotesFallback) {
        await supabase.from('event_meetings').delete().eq('id', noteId);
      } else {
        await supabase.from('event_notes').delete().eq('id', noteId);
      }
      showNotification("Note deleted.");
      loadNotes(eventId);
    } catch (err) {
      showNotification("Delete failed: " + err.message, "error");
    }
  };

  // Duplicate Event CTA
  const handleDuplicateEvent = async () => {
    if (!window.confirm("Are you sure you want to duplicate this event? (This duplicates event config, clients relation and functions, but not payments/expenses)")) return;
    try {
      const serial = `EVT-DUP-${Math.floor(100 + Math.random() * 900)}`;
      // Insert duplicate event
      const { data: newEvt, error: evtErr } = await supabase.from('events').insert({
        name: `${event.name} (Copy)`,
        client_id: event.client_id,
        status: 'New Lead',
        lead_source_id: event.lead_source_id,
        sales_executive_id: event.sales_executive_id,
        budget_estimated: event.budget_estimated,
        event_id_serial: serial
      }).select().single();

      if (evtErr) throw evtErr;

      // Duplicate functions
      if (functions.length > 0) {
        const dupeFuncs = functions.map(f => ({
          event_id: newEvt.id,
          name: f.name,
          function_date: f.function_date,
          venue: f.venue
        }));
        await supabase.from('event_functions').insert(dupeFuncs);
      }

      // Duplicate budget items
      if (budgetItems.length > 0) {
        const dupeBudget = budgetItems.map(b => ({
          event_id: newEvt.id,
          category_id: b.category_id,
          description: b.description,
          vendor_id: b.vendor_id,
          quantity: b.quantity,
          unit: b.unit,
          estimated_cost: b.estimated_cost,
          notes: b.notes
        }));
        await supabase.from('budget_items').insert(dupeBudget);
      }

      showNotification("Event duplicated successfully!");
      navigate(`/events/${newEvt.id}`);
    } catch (err) {
      showNotification("Duplication failed: " + err.message, "error");
    }
  };

  // Archive Event CTA (Toggles status to Cancelled / Completed or custom field)
  const handleArchiveEvent = async () => {
    if (!window.confirm("Are you sure you want to archive this event by marking it Completed?")) return;
    try {
      const { error } = await supabase.from('events').update({ status: 'Completed' }).eq('id', eventId);
      if (error) throw error;
      setEvent(prev => ({ ...prev, status: 'Completed' }));
      showNotification("Event archived (Completed).");
    } catch (err) {
      showNotification("Archiving failed: " + err.message, "error");
    }
  };

  // Delete Event CTA
  const handleDeleteEvent = async () => {
    if (!window.confirm("CRITICAL WARNING: This will permanently delete this event and all associated payments, expenses, budgets, meetings, and notes. This action cannot be undone. Do you wish to proceed?")) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      alert("Event deleted successfully.");
      navigate('/events');
    } catch (err) {
      showNotification("Deletion failed: " + err.message, "error");
    }
  };

  if (loading && !event) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="card p-8 text-center text-slate-500 max-w-xl mx-auto mt-12 font-sans">
        <p className="font-bold text-lg mb-2">Event Not Found</p>
        <p className="text-sm">The event may have been deleted or the URL is invalid.</p>
        <button onClick={() => navigate('/events')} className="btn-primary mt-4 py-2 cursor-pointer flex items-center justify-center mx-auto space-x-1">
          <ArrowLeft size={16} /> <span>Back to Events</span>
        </button>
      </div>
    );
  }

  // Vendors Tab details preparation
  const vendorFinances = vendors.map(v => {
    // Budget items for this vendor
    const vendorBudgets = budgetItems.filter(b => b.vendor_id === v.id);
    const budgetedVal = vendorBudgets.reduce((sum, b) => sum + (Number(b.quantity || 1) * Number(b.estimated_cost || 0)), 0);

    // Payments for this vendor
    const vendorPays = vendorPayments.filter(p => p.vendor_id === v.id);
    const paidVal = vendorPays.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const isAssigned = budgetItems.some(b => b.vendor_id === v.id);

    return {
      ...v,
      budgeted: budgetedVal,
      paid: paidVal,
      balance: budgetedVal - paidVal,
      isAssigned
    };
  }).filter(vf => vf.isAssigned);

  return (
    <div className="space-y-6 pb-12 font-sans relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-white flex items-center space-x-2 transition-all duration-300 ${
          notification.type === 'error' ? 'bg-red-500 border-red-600' : 'bg-green-500 border-green-600'
        }`}>
          <Check size={18} />
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      {/* Header Back & Action Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <button 
          onClick={() => navigate('/events')}
          className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold text-sm cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Event Master</span>
        </button>

        <div className="flex flex-wrap gap-2">
          <button onClick={handleDuplicateEvent} className="btn-secondary py-1.5 px-3 text-xs cursor-pointer bg-white">Duplicate</button>
          <button onClick={handleArchiveEvent} className="btn-secondary py-1.5 px-3 text-xs cursor-pointer bg-white">Archive</button>
          <button onClick={handleDeleteEvent} className="btn-secondary border-red-200 text-red-600 hover:bg-red-50 py-1.5 px-3 text-xs cursor-pointer bg-white">Delete Event</button>
        </div>
      </div>

      {/* SUMMARY WORKSPACE HEADER - Stickied Top */}
      <section className="card p-5 bg-gradient-to-r from-primary-600 to-indigo-700 text-white border-none shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded uppercase">
                {event.event_id_serial || 'EVT'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/10 ${
                event.status === 'Confirmed' ? 'border-green-300 text-green-200' : 'border-amber-300 text-amber-200'
              }`}>
                {event.status}
              </span>
            </div>
            <h2 className="text-xl font-bold">{event.name}</h2>
            <p className="text-xs text-white/80 flex items-center">
              <User size={12} className="mr-1" /> {client?.name || 'Loading client...'} ({client?.phone || ''})
            </p>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 p-3.5 rounded-xl border border-white/15 w-full md:w-auto">
            <div className="text-center">
              <span className="block text-[10px] text-white/70 uppercase">Closing Budget</span>
              <span className="text-sm font-bold text-amber-300 flex items-center justify-center">
                <IndianRupee size={12} className="mr-0.5" />
                {Number(event.budget_actual || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-[10px] text-white/70 uppercase">Estimated Budget</span>
              <span className="text-sm font-bold flex items-center justify-center">
                <IndianRupee size={12} className="mr-0.5" />
                {Number(event.budget_estimated || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-[10px] text-white/70 uppercase">Total Received</span>
              <span className="text-sm font-bold text-green-300 flex items-center justify-center">
                <IndianRupee size={12} className="mr-0.5" />
                {Number(event.amount_received || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-[10px] text-white/70 uppercase">Outstanding</span>
              <span className="text-sm font-bold text-rose-300 flex items-center justify-center">
                <IndianRupee size={12} className="mr-0.5" />
                {Number(event.amount_outstanding || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* TAB SELECTOR */}
      <div className="border-b border-slate-200 flex overflow-x-auto pb-px scrollbar-hide">
        {['Overview', 'Meetings', 'Budget', 'Vendors', 'Client Payments', 'Vendor Payments', 'Notes'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB WINDOW CONTENT */}
      <div className="space-y-4">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div className="card p-5 space-y-6 bg-white">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">General Event & Client Information</h3>
              {!isEditingOverview ? (
                <button 
                  onClick={() => setIsEditingOverview(true)} 
                  className="btn-secondary py-1 px-3 text-xs flex items-center space-x-1 cursor-pointer bg-white"
                >
                  <Edit2 size={12} /> <span>Edit Details</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => { setIsEditingOverview(false); loadData(); }} 
                    className="btn-secondary py-1 px-3 text-xs cursor-pointer bg-white"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveOverview} 
                    className="btn-primary py-1 px-3 text-xs cursor-pointer flex items-center space-x-1"
                  >
                    <Save size={12} /> <span>Save</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Event Details */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Event Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Event Name</label>
                    <input 
                      type="text"
                      className={`w-full text-sm rounded-lg px-3 py-1.5 border transition-all ${
                        isEditingOverview ? 'bg-white border-slate-300 focus:border-primary-500' : 'bg-slate-50 border-transparent pointer-events-none'
                      }`}
                      value={overviewForm.name || ''}
                      onChange={e => setOverviewForm({...overviewForm, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Event Status</label>
                      <select 
                        className={`w-full text-sm rounded-lg px-3 py-1.5 border transition-all ${
                          isEditingOverview ? 'bg-white border-slate-300 focus:border-primary-500' : 'bg-slate-50 border-transparent pointer-events-none'
                        }`}
                        value={overviewForm.status || ''}
                        onChange={e => setOverviewForm({...overviewForm, status: e.target.value})}
                      >
                        <option value="New Lead">New Lead</option>
                        <option value="Follow Up">Follow Up</option>
                        <option value="Quotation Sent">Quotation Sent</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Lead Source</label>
                      <select 
                        className={`w-full text-sm rounded-lg px-3 py-1.5 border transition-all ${
                          isEditingOverview ? 'bg-white border-slate-300 focus:border-primary-500' : 'bg-slate-50 border-transparent pointer-events-none'
                        }`}
                        value={overviewForm.lead_source_id || ''}
                        onChange={e => setOverviewForm({...overviewForm, lead_source_id: e.target.value})}
                      >
                        <option value="">-- Select --</option>
                        {leadSources.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Sales Executive</label>
                    <select 
                      className={`w-full text-sm rounded-lg px-3 py-1.5 border transition-all ${
                        isEditingOverview ? 'bg-white border-slate-300 focus:border-primary-500' : 'bg-slate-50 border-transparent pointer-events-none'
                      }`}
                      value={overviewForm.sales_executive_id || ''}
                      onChange={e => setOverviewForm({...overviewForm, sales_executive_id: e.target.value})}
                    >
                      <option value="">-- Select --</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Closing Budget (₹) (Calculated)</label>
                      <input 
                        type="number"
                        className="w-full text-sm rounded-lg px-3 py-1.5 border transition-all bg-slate-50 border-transparent pointer-events-none text-slate-500 font-bold"
                        value={overviewForm.budget_actual === null || overviewForm.budget_actual === undefined ? '' : overviewForm.budget_actual}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Estimated Budget (₹) (Calculated)</label>
                      <input 
                        type="number"
                        className="w-full text-sm rounded-lg px-3 py-1.5 border transition-all bg-slate-50 border-transparent pointer-events-none text-slate-500"
                        value={overviewForm.budget_estimated === null || overviewForm.budget_estimated === undefined ? '' : overviewForm.budget_estimated}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Details */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Client Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Client Name</label>
                    <input 
                      type="text"
                      className={`w-full text-sm rounded-lg px-3 py-1.5 border transition-all ${
                        isEditingOverview ? 'bg-white border-slate-300 focus:border-primary-500' : 'bg-slate-50 border-transparent pointer-events-none'
                      }`}
                      value={clientForm.name || ''}
                      onChange={e => setClientForm({...clientForm, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                    <input 
                      type="text"
                      className={`w-full text-sm rounded-lg px-3 py-1.5 border transition-all ${
                        isEditingOverview ? 'bg-white border-slate-300 focus:border-primary-500' : 'bg-slate-50 border-transparent pointer-events-none'
                      }`}
                      value={clientForm.phone || ''}
                      onChange={e => setClientForm({...clientForm, phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                    <input 
                      type="email"
                      className={`w-full text-sm rounded-lg px-3 py-1.5 border transition-all ${
                        isEditingOverview ? 'bg-white border-slate-300 focus:border-primary-500' : 'bg-slate-50 border-transparent pointer-events-none'
                      }`}
                      value={clientForm.email || ''}
                      onChange={e => setClientForm({...clientForm, email: e.target.value})}
                    />
                  </div>

                  {/* Other Events for this Client */}
                  {otherEvents.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 mt-3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Other Client Events</label>
                      <div className="space-y-1.5">
                        {otherEvents.map(e => (
                          <a 
                            key={e.id}
                            href={`/events/${e.id}`}
                            className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-200 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-all cursor-pointer"
                          >
                            <span className="font-semibold truncate max-w-[150px]">{e.name}</span>
                            <span className="text-[9px] text-slate-500 font-bold bg-white border border-slate-250 px-1.5 py-0.5 rounded-full">{e.status}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* Visual Ceremony Cost Allocation Card */}
            {functions.length > 0 && (
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Ceremony Budget Allocations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {functions.map(func => {
                    const funcBudget = budgetItems.filter(item => item.function_id === func.id).reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.estimated_cost || 0)), 0);
                    const totalBudget = Number(event.budget_estimated || 0);
                    const pct = totalBudget > 0 ? Math.min(100, Math.round((funcBudget / totalBudget) * 100)) : 0;
                    
                    return (
                      <div key={func.id} className="p-4 border border-slate-150 rounded-xl bg-slate-50 space-y-2">
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-slate-700 text-xs truncate uppercase">{func.name}</h5>
                          <span className="text-[10px] text-slate-400 font-semibold">{formatDate(func.function_date)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase block">Budget Allocation</span>
                            <span className="font-bold text-slate-700">₹{funcBudget.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 text-[10px] uppercase block">Share of Total</span>
                            <span className="font-bold text-primary-600">
                              {pct}%
                            </span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        {totalBudget > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500 bg-primary-600"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scheduled Functions List */}
            <div className="border-t border-slate-100 pt-5">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Event Ceremony Schedule</h4>
                {isEditingOverview && (
                  <button 
                    onClick={() => {
                      setEditTarget(null);
                      setCeremonyForm({
                        name: '',
                        function_date: new Date().toISOString().split('T')[0],
                        venue: '',
                        event_type_id: ''
                      });
                      setActiveModal('ceremony');
                    }}
                    className="btn-primary py-1 px-2.5 text-[10px] flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus size={10} /> <span>Add Ceremony</span>
                  </button>
                )}
              </div>
              
              {functions.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No ceremonies scheduled for this event yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {functions.map(f => (
                    <div key={f.id} className="p-3 border border-slate-150 rounded-xl bg-slate-50 space-y-1.5 text-xs relative">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-slate-805 text-sm truncate max-w-[180px]">{f.name}</div>
                        {isEditingOverview && (
                          <div className="flex space-x-1 shrink-0">
                            <button 
                              onClick={() => {
                                setEditTarget(f);
                                setCeremonyForm({
                                  name: f.name || '',
                                  function_date: f.function_date || '',
                                  venue: f.venue || '',
                                  event_type_id: f.event_type_id || ''
                                });
                                setActiveModal('ceremony');
                              }}
                              className="text-slate-400 hover:text-primary-600 p-0.5"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              onClick={() => handleDeleteCeremony(f.id)}
                              className="text-slate-400 hover:text-red-600 p-0.5"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="text-slate-500 flex items-center">
                        <Calendar size={12} className="mr-1 text-slate-400" /> {formatDate(f.function_date)}
                      </div>
                      <div className="text-slate-500 flex items-center">
                        <MapPin size={12} className="mr-1 text-slate-400" /> {f.venue || 'No venue recorded'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MEETINGS TAB */}
        {activeTab === 'Meetings' && (
          <div className="card p-5 space-y-4 bg-white">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Meeting & Interaction Log</h3>
              <button 
                onClick={() => {
                  setEditTarget(null);
                  setMeetingForm({
                    meeting_date: new Date().toISOString().split('T')[0],
                    meeting_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
                    meeting_type: 'In Person',
                    attended_by: '',
                    notes: '',
                    next_followup_date: ''
                  });
                  setActiveModal('meeting');
                }}
                className="btn-primary py-1 px-3 text-xs flex items-center space-x-1 cursor-pointer"
              >
                <Plus size={12} /> <span>Record Meeting</span>
              </button>
            </div>

            {meetings.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No meetings recorded yet.</p>
            ) : (
              <div className="relative border-l border-slate-200 ml-4 space-y-6 py-2">
                {meetings.map(m => {
                  const attStaff = staff.find(s => s.id === m.attended_by);
                  return (
                    <div key={m.id} className="relative pl-6">
                      {/* Timeline Circle */}
                      <span className="absolute -left-2.5 top-1.5 w-5 h-5 bg-primary-50 rounded-full border border-primary-500 flex items-center justify-center text-primary-600">
                        <Clock size={10} />
                      </span>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 relative space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-slate-700 bg-white border px-2 py-0.5 rounded-full">
                              {m.meeting_type}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-2">
                              {formatDate(m.meeting_date)} {m.meeting_time}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                setEditTarget(m);
                                setMeetingForm(m);
                                setActiveModal('meeting');
                              }}
                              className="text-slate-400 hover:text-primary-600 p-0.5"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              onClick={() => handleDeleteMeeting(m.id)}
                              className="text-slate-400 hover:text-red-600 p-0.5"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 font-serif">"{m.notes}"</p>
                        <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                          <span>Attended By: {attStaff ? attStaff.name : 'N/A'}</span>
                          {m.next_followup_date && (
                            <span className="font-bold text-amber-600">Next Followup: {formatDate(m.next_followup_date)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BUDGET TAB */}
        {activeTab === 'Budget' && (
          <div className="card p-5 space-y-4 bg-white">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Detailed Cost Estimation Sheet</h3>
              <p className="text-xs text-slate-400 font-semibold">Tip: Double-click or select cells to edit values directly.</p>
            </div>

            {/* Ceremony Cost Allocation Summary Grid */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
              <h4 className="font-bold text-[10px] text-slate-450 uppercase tracking-wider">Ceremony-wise Budget Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* General/General Costs first */}
                {(() => {
                  const items = budgetItems.filter(item => !item.function_id);
                  const est = items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.estimated_cost || 0)), 0);
                  const act = items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.actual_cost || 0)), 0);
                  return (
                    <div className="bg-white border p-2.5 rounded-lg space-y-1">
                      <span className="block text-[9px] font-bold text-slate-455 uppercase">General Event Costs</span>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        Est: <span className="text-slate-800 font-bold">₹{est.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        Act: <span className="text-primary-750 font-bold">₹{act.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })()}
                {/* Each ceremony in event */}
                {functions.map(func => {
                  const items = budgetItems.filter(item => item.function_id === func.id);
                  const est = items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.estimated_cost || 0)), 0);
                  const act = items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.actual_cost || 0)), 0);
                  return (
                    <div key={func.id} className="bg-white border p-2.5 rounded-lg space-y-1">
                      <span className="block text-[9px] font-bold text-primary-500 uppercase truncate" title={func.name}>{func.name}</span>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        Est: <span className="text-slate-800 font-bold">₹{est.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        Act: <span className="text-primary-750 font-bold">₹{act.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {expenseCategories.map(cat => {
              const catItems = budgetItems.filter(bi => bi.category_id === cat.id);
              const catEst = catItems.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.estimated_cost || 0)), 0);
              const catAct = catItems.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.actual_cost || 0)), 0);
              const isExpanded = expandedCategories[cat.id];

              return (
                <div key={cat.id} className="border border-slate-250 rounded-xl overflow-hidden shadow-sm">
                  {/* Category Header */}
                  <div 
                    onClick={() => setExpandedCategories({...expandedCategories, [cat.id]: !isExpanded})}
                    className="flex justify-between items-center bg-slate-50 p-3 cursor-pointer select-none border-b border-slate-200"
                  >
                    <div className="flex items-center space-x-2">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="font-bold text-xs text-slate-700 uppercase tracking-wide">{cat.name}</span>
                    </div>
                    <span className="font-bold text-xs text-slate-750">
                      Est: ₹{catEst.toLocaleString('en-IN')} | Act: ₹{catAct.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Category Body */}
                  {isExpanded && (
                    <div className="p-3 bg-white space-y-3 overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase tracking-wider">
                            <th className="py-2 pl-2">Description</th>
                            <th className="py-2 w-32">Assign Vendor</th>
                            <th className="py-2 w-32">Ceremony</th>
                            <th className="py-2 w-20 text-center">Qty</th>
                            <th className="py-2 w-20">Unit</th>
                            <th className="py-2 w-24 text-right">Est. Cost (₹)</th>
                            <th className="py-2 w-24 text-right">Est. Total (₹)</th>
                            <th className="py-2 w-24 text-right">Act. Cost (₹)</th>
                            <th className="py-2 w-24 text-right pr-2">Act. Total (₹)</th>
                            <th className="py-2 w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {catItems.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="py-2 pl-2">
                                <input 
                                  type="text" 
                                  value={item.description || ''} 
                                  onChange={e => handleUpdateBudgetItemInline(item.id, 'description', e.target.value)}
                                  className="w-full bg-slate-50/40 hover:bg-slate-100/60 focus:bg-white border border-slate-200/50 focus:border-primary-500 rounded px-2 py-1 outline-none font-medium transition-all"
                                />
                              </td>
                              <td className="py-2 w-32 px-1">
                                <select
                                  value={item.vendor_id || ''}
                                  onChange={e => handleUpdateBudgetItemInline(item.id, 'vendor_id', e.target.value || null)}
                                  className="w-full bg-slate-50/40 hover:bg-slate-100/60 focus:bg-white border border-slate-200/50 focus:border-primary-500 rounded px-2 py-1 outline-none transition-all cursor-pointer"
                                >
                                  <option value="">-- Unassigned --</option>
                                  {vendors.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 w-32 px-1">
                                <select
                                  value={item.function_id || ''}
                                  onChange={e => handleUpdateBudgetItemInline(item.id, 'function_id', e.target.value || null)}
                                  className="w-full bg-slate-50/40 hover:bg-slate-100/60 focus:bg-white border border-slate-200/50 focus:border-primary-500 rounded px-2 py-1 outline-none transition-all cursor-pointer text-xs"
                                >
                                  <option value="">General Costs</option>
                                  {functions.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 w-20 px-1">
                                <input 
                                  type="number" 
                                  value={item.quantity === null ? '' : item.quantity} 
                                  onChange={e => handleUpdateBudgetItemInline(item.id, 'quantity', e.target.value)}
                                  className="w-full bg-slate-50/40 hover:bg-slate-100/60 focus:bg-white border border-slate-200/50 focus:border-primary-500 rounded px-2 py-1 outline-none transition-all text-center"
                                />
                              </td>
                              <td className="py-2 w-20 px-1">
                                <input 
                                  type="text" 
                                  value={item.unit || ''} 
                                  onChange={e => handleUpdateBudgetItemInline(item.id, 'unit', e.target.value)}
                                  className="w-full bg-slate-50/40 hover:bg-slate-100/60 focus:bg-white border border-slate-200/50 focus:border-primary-500 rounded px-2 py-1 outline-none transition-all"
                                />
                              </td>
                              <td className="py-2 w-24 px-1">
                                <input 
                                  type="number" 
                                  value={item.estimated_cost === null ? '' : item.estimated_cost} 
                                  onChange={e => handleUpdateBudgetItemInline(item.id, 'estimated_cost', e.target.value)}
                                  className="w-full bg-slate-50/40 hover:bg-slate-100/60 focus:bg-white border border-slate-200/50 focus:border-primary-500 rounded px-2 py-1 outline-none transition-all text-right"
                                />
                              </td>
                              <td className="py-2 w-24 text-right font-bold text-slate-700">
                                ₹{(Number(item.quantity || 1) * Number(item.estimated_cost || 0)).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 w-24 px-1">
                                <input 
                                  type="number" 
                                  value={item.actual_cost === null ? '' : item.actual_cost} 
                                  onChange={e => handleUpdateBudgetItemInline(item.id, 'actual_cost', e.target.value)}
                                  className="w-full bg-slate-50/40 hover:bg-slate-100/60 focus:bg-white border border-slate-200/50 focus:border-primary-500 rounded px-2 py-1 outline-none transition-all text-right"
                                />
                              </td>
                              <td className="py-2 w-24 text-right pr-2 font-bold text-slate-800">
                                ₹{(Number(item.quantity || 1) * Number(item.actual_cost || 0)).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 w-10 text-center">
                                <button 
                                  onClick={() => handleDeleteBudgetItem(item.id)}
                                  className="text-slate-400 hover:text-red-600"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <button 
                        onClick={() => handleAddBudgetItem(cat.id)}
                        className="text-xs text-primary-600 font-semibold hover:underline flex items-center space-x-0.5 cursor-pointer mt-1 pl-2"
                      >
                        <Plus size={12} /> <span>Add New Item</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* VENDORS TAB */}
        {activeTab === 'Vendors' && (
          <div className="card p-5 space-y-4 bg-white">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Assigned Vendor Ledger Status</h3>
            </div>

            {vendorFinances.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No vendors assigned to this event's budget.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px] text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                      <th className="py-2 pl-2">Vendor Name</th>
                      <th className="py-2">Contact</th>
                      <th className="py-2 text-right">Budgeted Cost (₹)</th>
                      <th className="py-2 text-right">Paid Amount (₹)</th>
                      <th className="py-2 text-right pr-2">Outstanding (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-700">
                    {vendorFinances.map(vf => (
                      <tr key={vf.id} className="hover:bg-slate-50">
                        <td className="py-3 pl-2 font-bold text-slate-800">{vf.name}</td>
                        <td className="py-3">{vf.phone || 'N/A'}</td>
                        <td className="py-3 text-right font-semibold">₹{vf.budgeted.toLocaleString('en-IN')}</td>
                        <td className="py-3 text-right font-semibold text-green-600">₹{vf.paid.toLocaleString('en-IN')}</td>
                        <td className={`py-3 text-right pr-2 font-bold ${vf.balance > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                          ₹{vf.balance.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CLIENT PAYMENTS TAB */}
        {activeTab === 'Client Payments' && (
          <div className="card p-5 space-y-4 bg-white">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Client Payment Inflow Receipts</h3>
              <button 
                onClick={() => {
                  setEditTarget(null);
                  setClientPaymentForm({
                    date: new Date().toISOString().split('T')[0],
                    amount_received: '',
                    payment_method_id: '',
                    account: '',
                    reference_number: '',
                    notes: ''
                  });
                  setActiveModal('client_payment');
                }}
                className="btn-primary py-1 px-3 text-xs flex items-center space-x-1 cursor-pointer"
              >
                <Plus size={12} /> <span>Record Receipt</span>
              </button>
            </div>

            {clientPayments.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No client payments received yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px] text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                      <th className="py-2 pl-2">Date</th>
                      <th className="py-2 text-right pr-6">Amount Received (₹)</th>
                      <th className="py-2 pl-6 px-4">Payment Method</th>
                      <th className="py-2 px-4">Destination Account</th>
                      <th className="py-2 px-4">Reference Number</th>
                      <th className="py-2 px-4">Notes</th>
                      <th className="py-2 w-16 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-700">
                    {clientPayments.map(p => {
                      const method = paymentMethods.find(m => m.id === p.payment_method_id);
                      
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-2.5 pl-2">{formatDate(p.date)}</td>
                          <td className="py-2.5 text-right pr-6 font-bold text-green-600">₹{Number(p.amount_received || 0).toLocaleString('en-IN')}</td>
                          <td className="py-2.5 pl-6 px-4">{method ? method.name : 'N/A'}</td>
                          <td className="py-2.5 px-4">{p.account || 'N/A'}</td>
                          <td className="py-2.5 px-4">{p.reference_number || '-'}</td>
                          <td className="py-2.5 px-4 max-w-[200px] truncate" title={p.notes || ''}>{p.notes || '-'}</td>
                          <td className="py-2.5 text-center">
                            <div className="flex justify-center space-x-1.5">
                              <button 
                                onClick={() => {
                                  setEditTarget(p);
                                  setClientPaymentForm({
                                    date: p.date,
                                    amount_received: p.amount_received,
                                    payment_method_id: p.payment_method_id,
                                    account: p.account || '',
                                    reference_number: p.reference_number || '',
                                    notes: p.notes || ''
                                  });
                                  setActiveModal('client_payment');
                                }}
                                className="text-slate-400 hover:text-primary-600"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button 
                                onClick={() => handleDeleteClientPayment(p.id, p.amount_received)}
                                className="text-slate-400 hover:text-red-600"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VENDOR PAYMENTS TAB */}
        {activeTab === 'Vendor Payments' && (
          <div className="card p-5 space-y-4 bg-white">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Vendor Payment Transactions (Outflow)</h3>
              <button 
                onClick={() => {
                  setEditTarget(null);
                  setVendorPaymentForm({
                    vendor_id: vendorFinances[0]?.id || '',
                    date: new Date().toISOString().split('T')[0],
                    amount: '',
                    payment_method_id: paymentMethods[0]?.id || '',
                    account_id: accounts[0]?.id || '',
                    reference_number: ''
                  });
                  setActiveModal('vendor_payment');
                }}
                className="btn-primary py-1 px-3 text-xs flex items-center space-x-1 cursor-pointer"
              >
                <Plus size={12} /> <span>Record Vendor Payment</span>
              </button>
            </div>

            {vendorPayments.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No vendor payments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px] text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                      <th className="py-2 pl-2">Date</th>
                      <th className="py-2">Vendor Name</th>
                      <th className="py-2 text-right">Amount Paid (₹)</th>
                      <th className="py-2">Payment Method</th>
                      <th className="py-2">Source Account</th>
                      <th className="py-2">Reference Number</th>
                      <th className="py-2 w-16 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-700">
                    {vendorPayments.map(p => {
                      const vend = vendors.find(v => v.id === p.vendor_id);
                      const method = paymentMethods.find(m => m.id === p.payment_method_id);
                      const acc = accounts.find(a => a.id === p.account_id);
                      
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-2.5 pl-2">{formatDate(p.date)}</td>
                          <td className="py-2.5 font-semibold">{vend ? vend.name : 'Unknown'}</td>
                          <td className="py-2.5 text-right font-bold text-red-600">₹{Number(p.amount || 0).toLocaleString('en-IN')}</td>
                          <td className="py-2.5">{method ? method.name : 'N/A'}</td>
                          <td className="py-2.5">{acc ? acc.name : 'N/A'}</td>
                          <td className="py-2.5">{p.reference_number || '-'}</td>
                          <td className="py-2.5 text-center">
                            <div className="flex justify-center space-x-1.5">
                              <button 
                                onClick={() => {
                                  setEditTarget(p);
                                  setVendorPaymentForm(p);
                                  setActiveModal('vendor_payment');
                                }}
                                className="text-slate-400 hover:text-primary-600"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button 
                                onClick={() => handleDeleteVendorPayment(p.id)}
                                className="text-slate-400 hover:text-red-600"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'Notes' && (
          <div className="card p-5 space-y-4 bg-white">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Free-form General Notes</h3>
              <button 
                onClick={() => {
                  setEditTarget(null);
                  setNoteForm({ content: '', author: 'Staff' });
                  setActiveModal('note');
                }}
                className="btn-primary py-1 px-3 text-xs flex items-center space-x-1 cursor-pointer"
              >
                <Plus size={12} /> <span>Add Note</span>
              </button>
            </div>

            {notes.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No notes recorded yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notes.map(n => (
                  <div key={n.id} className="p-4 rounded-xl border border-slate-150 bg-slate-50 flex flex-col justify-between space-y-3 relative group">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-slate-400">
                          {formatDate(n.created_at)}
                        </span>
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditTarget(n);
                              setNoteForm({ content: n.content, author: n.author || 'Staff' });
                              setActiveModal('note');
                            }}
                            className="text-slate-400 hover:text-primary-600"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={() => handleDeleteNote(n.id)}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 font-serif whitespace-pre-wrap">"{n.content}"</p>
                    </div>
                    <div className="text-[9px] text-slate-400 text-right font-semibold">Author: {n.author || 'Staff'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* CRUD MODALS */}
      {activeModal && (
        <div 
          onClick={() => { setActiveModal(null); setEditTarget(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">
                {activeModal === 'meeting' && (editTarget ? 'Edit Meeting Record' : 'Record New Meeting')}
                {activeModal === 'expense' && (editTarget ? 'Edit Expense' : 'Add Expense Record')}
                {activeModal === 'client_payment' && (editTarget ? 'Edit Client Receipt' : 'Record Client Inflow')}
                {activeModal === 'vendor_payment' && (editTarget ? 'Edit Vendor Payment' : 'Record Vendor Payment')}
                {activeModal === 'note' && (editTarget ? 'Edit Note' : 'Add Note')}
                {activeModal === 'ceremony' && (editTarget ? 'Edit Ceremony Details' : 'Add New Ceremony')}
              </h3>
              <button 
                onClick={() => { setActiveModal(null); setEditTarget(null); }} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Forms */}
            <div className="p-4 overflow-y-auto max-h-[80vh]">
              
              {/* Meeting Form */}
              {activeModal === 'meeting' && (
                <form onSubmit={handleSaveMeeting} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                      <input 
                        type="date"
                        className="input-field py-2 text-xs"
                        value={meetingForm.meeting_date}
                        onChange={e => setMeetingForm({...meetingForm, meeting_date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Time</label>
                      <input 
                        type="time"
                        className="input-field py-2 text-xs"
                        value={meetingForm.meeting_time || ''}
                        onChange={e => setMeetingForm({...meetingForm, meeting_time: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Meeting Type *</label>
                      <select 
                        className="input-field py-2 text-xs"
                        value={meetingForm.meeting_type}
                        onChange={e => setMeetingForm({...meetingForm, meeting_type: e.target.value})}
                        required
                      >
                        <option value="In Person">In Person</option>
                        <option value="Phone Call">Phone Call</option>
                        <option value="WhatsApp">WhatsApp Message</option>
                        <option value="Site Visit">Site Visit</option>
                        <option value="Meeting">Meeting</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Attended By</label>
                      <select 
                        className="input-field py-2 text-xs"
                        value={meetingForm.attended_by || ''}
                        onChange={e => setMeetingForm({...meetingForm, attended_by: e.target.value})}
                      >
                        <option value="">-- Choose Staff --</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Next Followup Date</label>
                    <input 
                      type="date"
                      className="input-field py-2 text-xs"
                      value={meetingForm.next_followup_date || ''}
                      onChange={e => setMeetingForm({...meetingForm, next_followup_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Discussion Notes *</label>
                    <textarea 
                      rows="4"
                      placeholder="Enter details of meeting discussion"
                      className="input-field py-2 text-xs resize-none"
                      value={meetingForm.notes}
                      onChange={e => setMeetingForm({...meetingForm, notes: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                    <button type="button" onClick={() => { setActiveModal(null); setEditTarget(null); }} className="btn-secondary py-2 text-xs cursor-pointer">Cancel</button>
                    <button type="submit" className="btn-primary py-2 px-4 text-xs cursor-pointer">
                      {editTarget ? 'Update Record' : 'Record Meeting'}
                    </button>
                  </div>
                </form>
              )}

              {/* Expense Form */}
              {activeModal === 'expense' && (
                <form onSubmit={handleSaveExpense} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
                      <select 
                        className="input-field py-2 text-xs"
                        value={expenseForm.category_id}
                        onChange={e => setExpenseForm({...expenseForm, category_id: e.target.value})}
                        required
                      >
                        <option value="">-- Category --</option>
                        {expenseCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Vendor</label>
                      <select 
                        className="input-field py-2 text-xs"
                        value={expenseForm.vendor_id || ''}
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
                        className="input-field py-2 text-xs"
                        value={expenseForm.date}
                        onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Amount Paid (₹) *</label>
                      <input 
                        type="number"
                        className="input-field py-2 text-xs"
                        placeholder="e.g. 10000"
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
                        className="input-field py-2 text-xs"
                        value={expenseForm.payment_method_id}
                        onChange={e => setExpenseForm({...expenseForm, payment_method_id: e.target.value})}
                        required
                      >
                        <option value="">-- Method --</option>
                        {paymentMethods.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Account *</label>
                      <select 
                        className="input-field py-2 text-xs"
                        value={expenseForm.account_id}
                        onChange={e => setExpenseForm({...expenseForm, account_id: e.target.value})}
                        required
                      >
                        <option value="">-- Account --</option>
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
                      className="input-field py-2 text-xs"
                      placeholder="Remarks"
                      value={expenseForm.remarks || ''}
                      onChange={e => setExpenseForm({...expenseForm, remarks: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Associated Ceremony</label>
                    <select 
                      className="input-field py-2 text-xs cursor-pointer"
                      value={expenseForm.function_id || ''}
                      onChange={e => setExpenseForm({...expenseForm, function_id: e.target.value || null})}
                    >
                      <option value="">-- General Costs --</option>
                      {functions.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                    <button type="button" onClick={() => { setActiveModal(null); setEditTarget(null); }} className="btn-secondary py-2 text-xs cursor-pointer">Cancel</button>
                    <button type="submit" className="btn-primary py-2 px-4 text-xs cursor-pointer">
                      {editTarget ? 'Update' : 'Add Expense'}
                    </button>
                  </div>
                </form>
              )}

              {/* Client Payment Form */}
              {activeModal === 'client_payment' && (
                <form onSubmit={handleSaveClientPayment} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                      <input 
                        type="date"
                        className="input-field py-2 text-xs"
                        value={clientPaymentForm.date}
                        onChange={e => setClientPaymentForm({...clientPaymentForm, date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Amount Received (₹) *</label>
                      <input 
                        type="number"
                        className="input-field py-2 text-xs"
                        placeholder="e.g. 50000"
                        value={clientPaymentForm.amount_received}
                        onChange={e => setClientPaymentForm({...clientPaymentForm, amount_received: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Method *</label>
                      <select 
                        className="input-field py-2 text-xs"
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
                      <input 
                        type="text"
                        className="input-field py-2 text-xs"
                        placeholder="e.g. HDFC Bank, Petty Cash"
                        value={clientPaymentForm.account || ''}
                        onChange={e => setClientPaymentForm({...clientPaymentForm, account: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Reference Number / transaction ID</label>
                      <input 
                        type="text"
                        className="input-field py-2 text-xs"
                        placeholder="e.g. UPI Ref, Bank reference"
                        value={clientPaymentForm.reference_number || ''}
                        onChange={e => setClientPaymentForm({...clientPaymentForm, reference_number: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                    <textarea 
                      rows="3"
                      className="input-field py-2 text-xs resize-none"
                      placeholder="Add notes about this payment..."
                      value={clientPaymentForm.notes || ''}
                      onChange={e => setClientPaymentForm({...clientPaymentForm, notes: e.target.value})}
                    />
                  </div>
                  <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                    <button type="button" onClick={() => { setActiveModal(null); setEditTarget(null); }} className="btn-secondary py-2 text-xs cursor-pointer">Cancel</button>
                    <button type="submit" className="btn-primary py-2 px-4 text-xs cursor-pointer">
                      {editTarget ? 'Update Receipt' : 'Record Receipt'}
                    </button>
                  </div>
                </form>
              )}

              {/* Vendor Payment Form */}
              {activeModal === 'vendor_payment' && (
                <form onSubmit={handleSaveVendorPayment} className="space-y-4">
                  {/* Event Name — read-only context */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Event</span>
                    <span className="text-xs font-semibold text-slate-700 truncate">{event?.name || 'This Event'}</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Vendor *</label>
                    <select 
                      className="input-field py-2 text-xs"
                      value={vendorPaymentForm.vendor_id}
                      onChange={e => setVendorPaymentForm({...vendorPaymentForm, vendor_id: e.target.value})}
                      required
                    >
                      <option value="">-- Choose Vendor --</option>
                      {(vendorFinances.length > 0 ? vendorFinances : vendors).map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                    {vendorFinances.length === 0 && (
                      <p className="text-[10px] text-amber-600 mt-1">No vendors assigned to budget yet. Showing all vendors.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                      <input 
                        type="date"
                        className="input-field py-2 text-xs"
                        value={vendorPaymentForm.date}
                        onChange={e => setVendorPaymentForm({...vendorPaymentForm, date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Amount Paid (₹) *</label>
                      <input 
                        type="number"
                        className="input-field py-2 text-xs"
                        placeholder="e.g. 15000"
                        value={vendorPaymentForm.amount}
                        onChange={e => setVendorPaymentForm({...vendorPaymentForm, amount: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Method *</label>
                      <select 
                        className="input-field py-2 text-xs"
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
                        className="input-field py-2 text-xs"
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
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Reference Number</label>
                    <input 
                      type="text"
                      className="input-field py-2 text-xs"
                      placeholder="e.g. Ref details"
                      value={vendorPaymentForm.reference_number || ''}
                      onChange={e => setVendorPaymentForm({...vendorPaymentForm, reference_number: e.target.value})}
                    />
                  </div>
                  <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                    <button type="button" onClick={() => { setActiveModal(null); setEditTarget(null); }} className="btn-secondary py-2 text-xs cursor-pointer">Cancel</button>
                    <button type="submit" className="btn-primary py-2 px-4 text-xs cursor-pointer">
                      {editTarget ? 'Update Payment' : 'Record Payment'}
                    </button>
                  </div>
                </form>
              )}

              {/* Note Form */}
              {activeModal === 'note' && (
                <form onSubmit={handleSaveNote} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Author</label>
                    <input 
                      type="text"
                      className="input-field py-2 text-xs"
                      value={noteForm.author}
                      onChange={e => setNoteForm({...noteForm, author: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Note Content *</label>
                    <textarea 
                      rows="5"
                      placeholder="Write general event notes..."
                      className="input-field py-2 text-xs resize-none"
                      value={noteForm.content}
                      onChange={e => setNoteForm({...noteForm, content: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                    <button type="button" onClick={() => { setActiveModal(null); setEditTarget(null); }} className="btn-secondary py-2 text-xs cursor-pointer">Cancel</button>
                    <button type="submit" className="btn-primary py-2 px-4 text-xs cursor-pointer">
                      {editTarget ? 'Update Note' : 'Save Note'}
                    </button>
                  </div>
                </form>
              )}

              {/* Ceremony Form */}
              {activeModal === 'ceremony' && (
                <form onSubmit={handleSaveCeremony} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Ceremony / Function Name *</label>
                    <input 
                      type="text"
                      className="input-field py-2 text-xs"
                      placeholder="e.g. Wedding, Reception, Haldi"
                      value={ceremonyForm.name}
                      onChange={e => setCeremonyForm({...ceremonyForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                    <input 
                      type="date"
                      className="input-field py-2 text-xs"
                      value={ceremonyForm.function_date}
                      onChange={e => setCeremonyForm({...ceremonyForm, function_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Venue Location</label>
                    <input 
                      type="text"
                      className="input-field py-2 text-xs"
                      placeholder="e.g. Grand Ballroom, Poolside"
                      value={ceremonyForm.venue || ''}
                      onChange={e => setCeremonyForm({...ceremonyForm, venue: e.target.value})}
                    />
                  </div>
                  <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                    <button type="button" onClick={() => { setActiveModal(null); setEditTarget(null); }} className="btn-secondary py-2 text-xs cursor-pointer">Cancel</button>
                    <button type="submit" className="btn-primary py-2 px-4 text-xs cursor-pointer">
                      {editTarget ? 'Update Ceremony' : 'Save Ceremony'}
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

export default EventDetail;
