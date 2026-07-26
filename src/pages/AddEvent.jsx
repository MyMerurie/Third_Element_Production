import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Calendar, MapPin, IndianRupee, FileText, Check, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AddEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [notification, setNotification] = useState(null);

  // Loaded Config List States
  const [clients, setClients] = useState([]);

  // Form State
  const [clientMode, setClientMode] = useState('existing'); // 'existing' or 'new'
  const [selectedClientId, setSelectedClientId] = useState('');
  
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const [eventForm, setEventForm] = useState({
    name: '',
    lead_source: '',
    budget_estimated: '',
    budget_actual: ''
  });

  const [functionForm, setFunctionForm] = useState({
    name: 'Wedding',
    function_date: new Date().toISOString().split('T')[0],
    venue: ''
  });

  const [initialNotes, setInitialNotes] = useState('');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (error) throw error;
      if (data) setClients(data);
    } catch (err) {
      console.error(err);
      showNotification("Failed to load setup categories", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNextStep = () => {
    if (step === 1) {
      if (clientMode === 'existing' && !selectedClientId) {
        showNotification("Please select an existing client", "error");
        return;
      }
      if (clientMode === 'new' && (!clientForm.name || !clientForm.phone)) {
        showNotification("Client name and phone number are required", "error");
        return;
      }
    }
    if (step === 2) {
      if (!eventForm.name) {
        showNotification("Event name is required", "error");
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let clientId = selectedClientId;

      // 1. Client Creation (if new)
      if (clientMode === 'new') {
        const { data: newClient, error: clientErr } = await supabase.from('clients').insert({
          name: clientForm.name,
          phone: clientForm.phone,
          email: clientForm.email || null
        }).select().single();

        if (clientErr) throw clientErr;
        clientId = newClient.id;
      }

      // Check and save Lead Source dynamic
      let leadSourceId = null;
      if (eventForm.lead_source && eventForm.lead_source.trim()) {
        const trimmedSource = eventForm.lead_source.trim();
        const { data: existingSource } = await supabase
          .from('master_lead_sources')
          .select('id')
          .ilike('name', trimmedSource)
          .maybeSingle();
        
        if (existingSource) {
          leadSourceId = existingSource.id;
        } else {
          const { data: newSource, error: sourceErr } = await supabase
            .from('master_lead_sources')
            .insert({ name: trimmedSource })
            .select()
            .single();
          if (!sourceErr && newSource) {
            leadSourceId = newSource.id;
          }
        }
      }

      // 2. Event Creation
      const { data: newEvent, error: eventErr } = await supabase.from('events').insert({
        name: eventForm.name,
        client_id: clientId,
        status: 'New Lead',
        lead_source_id: leadSourceId,
        sales_executive_id: null,
        budget_estimated: Number(eventForm.budget_estimated || 0),
        budget_actual: Number(eventForm.budget_actual || 0),
        amount_received: 0,
        amount_outstanding: Number(eventForm.budget_actual || 0)
      }).select().single();

      if (eventErr) throw eventErr;

      // 3. Ceremony Function Creation
      const { error: funcErr } = await supabase.from('event_functions').insert({
        event_id: newEvent.id,
        name: functionForm.name,
        function_date: functionForm.function_date,
        venue: functionForm.venue,
        event_type_id: null
      });

      if (funcErr) throw funcErr;

      // 4. Initial Notes (if provided)
      if (initialNotes) {
        // Try to insert in event_notes, fallback is meeting
        const { error: noteErr } = await supabase.from('event_notes').insert({
          event_id: newEvent.id,
          content: initialNotes,
          author: 'Sales Team'
        });
        if (noteErr) {
          // fallback to event_meetings
          await supabase.from('event_meetings').insert({
            event_id: newEvent.id,
            meeting_type: 'Note',
            notes: initialNotes,
            meeting_date: new Date().toISOString().split('T')[0]
          });
        }
      }

      showNotification("Event created successfully!");
      // Redirect to detail page
      navigate(`/events/${newEvent.id}`);
    } catch (err) {
      console.error(err);
      showNotification("Failed to save event: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-white flex items-center space-x-2 transition-all duration-300 ${
          notification.type === 'error' ? 'bg-red-500 border-red-600' : 'bg-green-500 border-green-600'
        }`}>
          <Check size={18} />
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Add New Event</h2>
        <div className="text-xs font-semibold text-slate-500">Step {step} of 3</div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-primary-600 h-full transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        ></div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="card p-6 bg-white space-y-6">
          
          {/* STEP 1: CLIENT INFORMATION */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-md font-bold text-slate-800 flex items-center border-b border-slate-100 pb-2">
                <User className="text-primary-600 mr-2" size={18} /> Client Information
              </h3>

              {/* Client Mode Selector Toggle */}
              <div className="flex bg-slate-50 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setClientMode('existing')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    clientMode === 'existing' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Existing Client
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode('new')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    clientMode === 'new' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create New Client
                </button>
              </div>

              {/* Existing Client Form */}
              {clientMode === 'existing' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Client *</label>
                  <select
                    className="input-field py-2 text-xs"
                    value={selectedClientId}
                    onChange={e => setSelectedClientId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* New Client Form */}
              {clientMode === 'new' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Client Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="e.g. Suresh Kumar"
                        className="input-field pl-9 py-2 text-xs"
                        value={clientForm.name}
                        onChange={e => setClientForm({...clientForm, name: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                          type="text" 
                          placeholder="e.g. +91 98765 43210"
                          className="input-field pl-9 py-2 text-xs"
                          value={clientForm.phone}
                          onChange={e => setClientForm({...clientForm, phone: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                          type="email" 
                          placeholder="e.g. name@client.com"
                          className="input-field pl-9 py-2 text-xs"
                          value={clientForm.email}
                          onChange={e => setClientForm({...clientForm, email: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: EVENT DETAILS */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-md font-bold text-slate-800 flex items-center border-b border-slate-100 pb-2">
                <FileText className="text-primary-600 mr-2" size={18} /> Event Parameters
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Event Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Rahul & Priya Wedding"
                    className="input-field py-2 text-xs"
                    value={eventForm.name}
                    onChange={e => setEventForm({...eventForm, name: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Lead Source</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Instagram, Referral, Google, Walk-in"
                    className="input-field py-2 text-xs"
                    value={eventForm.lead_source || ''}
                    onChange={e => setEventForm({...eventForm, lead_source: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Closing Budget (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="number" 
                        placeholder="e.g. 500000"
                        className="input-field pl-9 py-2 text-xs"
                        value={eventForm.budget_actual}
                        onChange={e => setEventForm({...eventForm, budget_actual: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Estimated Budget (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="number" 
                        placeholder="e.g. 350000"
                        className="input-field pl-9 py-2 text-xs"
                        value={eventForm.budget_estimated}
                        onChange={e => setEventForm({...eventForm, budget_estimated: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: INITIAL CEREMONY FUNCTION & NOTES */}
          {step === 3 && (
            <div className="space-y-5">
              
              {/* Function details */}
              <div className="space-y-4">
                <h3 className="text-md font-bold text-slate-800 flex items-center border-b border-slate-100 pb-2">
                  <Calendar className="text-primary-600 mr-2" size={18} /> Initial Function Details
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Function Title *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Wedding Reception, Haldi Ceremony"
                    className="input-field py-2 text-xs"
                    value={functionForm.name}
                    onChange={e => setFunctionForm({...functionForm, name: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                    <input 
                      type="date"
                      className="input-field py-2 text-xs"
                      value={functionForm.function_date}
                      onChange={e => setFunctionForm({...functionForm, function_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Venue Location *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="Enter venue address"
                        className="input-field pl-9 py-2 text-xs"
                        value={functionForm.venue}
                        onChange={e => setFunctionForm({...functionForm, venue: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Initial notes */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Planning Notes / Client Brief</label>
                <textarea 
                  rows="3"
                  className="input-field py-2 text-xs resize-none"
                  placeholder="Enter initial details discussed, color preferences, materials requested, etc..."
                  value={initialNotes}
                  onChange={e => setInitialNotes(e.target.value)}
                ></textarea>
              </div>

            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4 border-t border-slate-100">
            {step > 1 ? (
              <button 
                type="button" 
                onClick={handlePrevStep}
                className="btn-secondary py-2 px-4 text-xs cursor-pointer flex items-center space-x-1"
              >
                <ArrowLeft size={14} /> <span>Back</span>
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => navigate('/events')}
                className="btn-secondary py-2 px-4 text-xs cursor-pointer"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button 
                type="button" 
                onClick={handleNextStep}
                className="btn-primary py-2 px-4 text-xs cursor-pointer flex items-center space-x-1"
              >
                <span>Next Step</span> <ArrowRight size={14} />
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary py-2 px-5 text-xs cursor-pointer flex items-center space-x-1"
              >
                {submitting ? 'Creating Event...' : 'Create Event'}
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default AddEvent;
