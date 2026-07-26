import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, IndianRupee, Calendar, MapPin, Phone, User, X } from 'lucide-react';
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

const EventMaster = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [functions, setFunctions] = useState([]);
  
  // Advanced filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLeadSource, setFilterLeadSource] = useState('');

  // Master lists for filter dropdowns
  const [leadSources, setLeadSources] = useState([]);

  const tabs = ['All', 'Upcoming', 'Ongoing', 'Completed'];

  const loadData = async () => {
    setLoading(true);
    try {
      const [resEvents, resClients, resFunctions, resSources] = await Promise.all([
        supabase.from('events').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*'),
        supabase.from('event_functions').select('*'),
        supabase.from('master_lead_sources').select('*')
      ]);

      if (resEvents.data) setEvents(resEvents.data);
      if (resClients.data) setClients(resClients.data);
      if (resFunctions.data) setFunctions(resFunctions.data);
      if (resSources.data) setLeadSources(resSources.data);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowFilterModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Map events to display details
  const mappedEvents = events.map(evt => {
    const client = clients.find(c => c.id === evt.client_id) || {};
    const evtFuncs = functions.filter(f => f.event_id === evt.id) || [];
    
    // Sort functions by date to find primary/earliest function
    const sortedFuncs = [...evtFuncs].sort((a, b) => new Date(a.function_date) - new Date(b.function_date));
    const primaryFunc = sortedFuncs[0] || {};
    
    return {
      ...evt,
      clientName: client.name || 'Unknown',
      clientPhone: client.phone || 'N/A',
      primaryDate: primaryFunc.function_date || null,
      venue: primaryFunc.venue || 'TBD'
    };
  });

  // Filter and Search logic
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredEvents = mappedEvents.filter(evt => {
    // 1. Search Query
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      evt.name.toLowerCase().includes(searchLower) ||
      evt.clientName.toLowerCase().includes(searchLower) ||
      evt.clientPhone.includes(searchLower) ||
      evt.venue.toLowerCase().includes(searchLower) ||
      (evt.event_id_serial && evt.event_id_serial.toLowerCase().includes(searchLower));

    if (!matchesSearch) return false;

    // 2. Tab Filter
    if (activeTab === 'Upcoming') {
      // Primary date is future
      if (!evt.primaryDate || evt.primaryDate < todayStr || evt.status === 'Completed' || evt.status === 'Cancelled') return false;
    } else if (activeTab === 'Ongoing') {
      // In progress status, or date is today
      if (evt.status !== 'In Progress' && evt.primaryDate !== todayStr) return false;
    } else if (activeTab === 'Completed') {
      // Completed status
      if (evt.status !== 'Completed') return false;
    }

    // 3. Advanced filters
    if (filterStatus && evt.status !== filterStatus) return false;
    if (filterLeadSource && evt.lead_source_id !== filterLeadSource) return false;

    return true;
  });

  const handleResetFilters = () => {
    setFilterStatus('');
    setFilterLeadSource('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In Progress':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'New Lead':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-12 font-sans">
      
      {/* Search and Filter Trigger */}
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search event, client name, phone or venue..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-10 bg-slate-50 border-none rounded-xl"
          />
        </div>
        <button 
          onClick={() => setShowFilterModal(true)}
          className={`p-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
            filterStatus || filterLeadSource
              ? 'bg-primary-50 border-primary-300 text-primary-600 font-bold'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Filter size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab 
                ? 'bg-primary-600 text-white' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Events Listing */}
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="card p-8 text-center text-slate-400">
          <p className="text-sm">No events found matching your search criteria.</p>
          {(filterStatus || filterLeadSource || searchQuery) && (
            <button 
              onClick={() => { handleResetFilters(); setSearchQuery(''); }}
              className="mt-3 text-xs font-semibold text-primary-600 hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map(event => (
            <div 
              key={event.id} 
              onClick={() => navigate(`/events/${event.id}`)}
              className="card p-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                    {event.event_id_serial || 'EVT'}
                  </span>
                  <h4 className="font-bold text-slate-800 text-sm truncate">{event.name}</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-3 text-xs text-slate-500">
                  <span className="flex items-center"><User size={12} className="mr-1 text-slate-400"/> {event.clientName}</span>
                  <span className="flex items-center"><Phone size={12} className="mr-1 text-slate-400"/> {event.clientPhone}</span>
                  <span className="flex items-center col-span-2 md:col-span-1 truncate">
                    <MapPin size={12} className="mr-1 text-slate-400 shrink-0"/> {event.venue}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <Calendar size={12} className="text-slate-400" />
                  <span>{event.primaryDate ? formatDate(event.primaryDate) : 'TBD'}</span>
                </div>
              </div>

              {/* Status and Financials */}
              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-slate-100 pt-2.5 md:pt-0 shrink-0 gap-1.5">
                <div className="flex flex-col md:items-end">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Budget Est</span>
                  <span className="text-xs font-bold text-slate-700 flex items-center">
                    <IndianRupee size={10} className="mr-0.5" />
                    {Number(event.budget_estimated || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center space-x-2 md:space-x-0">
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(event.status)}`}>
                    {event.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      <Link to="/add" className="md:hidden fixed bottom-20 right-4 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 active:scale-95 transition-all z-50">
        <Plus size={24} />
      </Link>

      {/* Advanced Filter Modal */}
      {showFilterModal && (
        <div 
          onClick={() => setShowFilterModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center">
                <Filter size={16} className="mr-1 text-primary-600" /> Filter Events
              </h3>
              <button onClick={() => setShowFilterModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select 
                  className="input-field py-2"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
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
                  className="input-field py-2"
                  value={filterLeadSource}
                  onChange={e => setFilterLeadSource(e.target.value)}
                >
                  <option value="">All Lead Sources</option>
                  {leadSources.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-between gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={handleResetFilters}
                  className="btn-secondary py-2 text-xs flex-1 cursor-pointer"
                >
                  Reset
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowFilterModal(false)}
                  className="btn-primary py-2 text-xs flex-1 cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EventMaster;
