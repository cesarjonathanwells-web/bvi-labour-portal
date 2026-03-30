import { useState, useMemo } from 'react';
import {
  Calendar, Clock, Search, Plus, ShieldAlert, Printer, User,
  Phone, FileText, X, ChevronLeft, ChevronRight, MapPin, Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { generateId, formatDateShort, getStorage, setStorage, getStatusLabel, getStatusColor } from '../../utils/helpers';

const APPOINTMENTS_KEY = 'bvi_appointments';
const WALKINS_KEY = 'bvi_walkins';

const TIME_SLOTS = [];
for (let h = 8; h <= 16; h++) {
  for (let m = 0; m < 60; m += 30) {
    if (h === 8 && m === 0) continue; // start at 8:30
    if (h === 16 && m > 30) continue; // end at 4:30
    const hour = h > 12 ? h - 12 : h;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const label = `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
    const value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    TIME_SLOTS.push({ label, value });
  }
}

const PURPOSES = [
  'Permit Collection',
  'Dispute Filing',
  'General Inquiry',
  'Renewal Submission',
  'Document Submission',
  'Payment',
  'Other',
];

/* ------------------------------------------------------------------ */
/*  Access Denied                                                      */
/* ------------------------------------------------------------------ */
function AccessDenied() {
  return (
    <div className="max-w-lg mx-auto mt-20 text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-purple-50 rounded-full flex items-center justify-center">
        <ShieldAlert className="w-10 h-10 text-[#7c3aed]" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-500">Insufficient Permissions</p>
      <p className="text-sm text-gray-400 mt-2">
        Appointment Manager is restricted to staff with appointment permissions.
      </p>
    </div>
  );
}

export default function AppointmentManager() {
  const { permits } = useApp();
  const { user, hasPermission } = useAuth();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [newAppt, setNewAppt] = useState({ date: '', time: '', visitorName: '', visitorPhone: '', purpose: '' });
  const [walkIn, setWalkIn] = useState({ visitorName: '', purpose: '', notes: '' });

  /* ---------- Permission gate ---------- */
  if (!user || !hasPermission('appointments')) {
    return <AccessDenied />;
  }

  const appointments = getStorage(APPOINTMENTS_KEY) || [];
  const walkins = getStorage(WALKINS_KEY) || [];

  /* today's schedule */
  const todayAppointments = useMemo(() => {
    return appointments
      .filter(a => a.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate]);

  const todayWalkins = useMemo(() => {
    return walkins.filter(w => w.date === selectedDate);
  }, [walkins, selectedDate]);

  /* schedule grid: map time slots to appointments */
  const scheduleGrid = useMemo(() => {
    return TIME_SLOTS.map(slot => {
      const appt = todayAppointments.find(a => a.time === slot.value);
      return { ...slot, appointment: appt || null };
    });
  }, [todayAppointments]);

  /* Permit lookup results */
  const lookupResults = useMemo(() => {
    if (!lookupQuery.trim()) return [];
    const q = lookupQuery.toLowerCase();
    return permits.filter(p =>
      (p.permitNumber || '').toLowerCase().includes(q) ||
      (p.employeeFirstName || '').toLowerCase().includes(q) ||
      (p.employeeLastName || '').toLowerCase().includes(q) ||
      (p.firstName || '').toLowerCase().includes(q) ||
      (p.lastName || '').toLowerCase().includes(q) ||
      (p.employerName || '').toLowerCase().includes(q) ||
      (p.employer || '').toLowerCase().includes(q)
    ).slice(0, 10);
  }, [permits, lookupQuery]);

  /* Schedule new appointment */
  const handleScheduleAppt = () => {
    const { date, time, visitorName, purpose } = newAppt;
    if (!date || !time || !visitorName.trim() || !purpose) return;

    const all = getStorage(APPOINTMENTS_KEY) || [];
    all.push({
      id: generateId(),
      date,
      time,
      visitorName: visitorName.trim(),
      visitorPhone: newAppt.visitorPhone.trim(),
      purpose,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      createdBy: `${user.firstName} ${user.lastName}`,
    });
    setStorage(APPOINTMENTS_KEY, all);
    setNewAppt({ date: '', time: '', visitorName: '', visitorPhone: '', purpose: '' });
    setShowNewAppt(false);
  };

  /* Log walk-in */
  const handleLogWalkIn = () => {
    if (!walkIn.visitorName.trim() || !walkIn.purpose) return;
    const all = getStorage(WALKINS_KEY) || [];
    all.push({
      id: generateId(),
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      visitorName: walkIn.visitorName.trim(),
      purpose: walkIn.purpose,
      notes: walkIn.notes.trim(),
      loggedAt: new Date().toISOString(),
      loggedBy: `${user.firstName} ${user.lastName}`,
    });
    setStorage(WALKINS_KEY, all);
    setWalkIn({ visitorName: '', purpose: '', notes: '' });
    setShowWalkIn(false);
  };

  /* Navigate date */
  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#7c3aed]">Appointment Manager</h1>
        <p className="text-gray-500 mb-6">Manage daily appointments, walk-ins, and permit lookups.</p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setShowNewAppt(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-colors"
        >
          <Plus size={16} /> Schedule Appointment
        </button>
        <button
          onClick={() => setShowWalkIn(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#7c3aed] text-[#7c3aed] rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
        >
          <User size={16} /> Log Walk-In
        </button>
        <button
          onClick={() => setShowLookup(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Search size={16} /> Quick Lookup
        </button>
      </div>

      {/* Date navigation */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex items-center justify-between">
        <button onClick={() => changeDate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          {isToday && <span className="text-xs text-[#7c3aed] font-medium">Today</span>}
        </div>
        <div className="flex items-center gap-2">
          {!isToday && (
            <button
              onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
              className="text-xs text-[#7c3aed] font-medium hover:underline"
            >
              Go to Today
            </button>
          )}
          <button onClick={() => changeDate(1)} className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#7c3aed]">{todayAppointments.length}</p>
          <p className="text-xs text-gray-500">Scheduled Appointments</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{todayWalkins.length}</p>
          <p className="text-xs text-gray-500">Walk-Ins</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{TIME_SLOTS.length - todayAppointments.length}</p>
          <p className="text-xs text-gray-500">Available Slots</p>
        </div>
      </div>

      {/* Schedule view */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#7c3aed]" />
          <h3 className="font-bold text-[#7c3aed]">Schedule (8:30 AM - 4:30 PM)</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {scheduleGrid.map(slot => (
            <div
              key={slot.value}
              className={`flex items-center px-6 py-3 ${slot.appointment ? 'bg-purple-50/50' : 'hover:bg-gray-50'}`}
            >
              <div className="w-20 flex-shrink-0">
                <span className="text-sm font-medium text-gray-600">{slot.label}</span>
              </div>
              {slot.appointment ? (
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-1 h-10 bg-[#7c3aed] rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{slot.appointment.visitorName}</p>
                    <p className="text-xs text-gray-500">{slot.appointment.purpose}</p>
                  </div>
                  {slot.appointment.visitorPhone && (
                    <span className="text-xs text-gray-400 hidden sm:block">{slot.appointment.visitorPhone}</span>
                  )}
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    slot.appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                    slot.appointment.status === 'no-show' ? 'bg-red-100 text-red-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {slot.appointment.status}
                  </span>
                </div>
              ) : (
                <div className="flex-1">
                  <span className="text-xs text-gray-300">Available</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Walk-in log */}
      {todayWalkins.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-gray-900">Walk-In Log</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {todayWalkins.map(w => (
              <div key={w.id} className="flex items-center gap-4 px-6 py-3">
                <span className="text-sm font-medium text-gray-600 w-16">{w.time}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{w.visitorName}</p>
                  <p className="text-xs text-gray-500">{w.purpose}{w.notes ? ` - ${w.notes}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============= Schedule Appointment Modal ============= */}
      {showNewAppt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewAppt(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#7c3aed]">Schedule Appointment</h3>
              <button onClick={() => setShowNewAppt(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field text-xs">Date *</label>
                  <input
                    type="date"
                    value={newAppt.date}
                    onChange={(e) => setNewAppt(a => ({ ...a, date: e.target.value }))}
                    className="input-field text-sm"
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div>
                  <label className="label-field text-xs">Time *</label>
                  <select
                    value={newAppt.time}
                    onChange={(e) => setNewAppt(a => ({ ...a, time: e.target.value }))}
                    className="input-field text-sm"
                  >
                    <option value="">Select Time</option>
                    {TIME_SLOTS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label-field text-xs">Visitor Name *</label>
                <input
                  type="text"
                  value={newAppt.visitorName}
                  onChange={(e) => setNewAppt(a => ({ ...a, visitorName: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="label-field text-xs">Phone (optional)</label>
                <input
                  type="tel"
                  value={newAppt.visitorPhone}
                  onChange={(e) => setNewAppt(a => ({ ...a, visitorPhone: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="Contact number"
                />
              </div>
              <div>
                <label className="label-field text-xs">Purpose *</label>
                <select
                  value={newAppt.purpose}
                  onChange={(e) => setNewAppt(a => ({ ...a, purpose: e.target.value }))}
                  className="input-field text-sm"
                >
                  <option value="">Select Purpose</option>
                  {PURPOSES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => {
                  handleScheduleAppt();
                  // Print appointment slip
                }}
                disabled={!newAppt.date || !newAppt.time || !newAppt.visitorName.trim() || !newAppt.purpose}
                className="flex items-center gap-2 text-sm text-[#7c3aed] hover:underline disabled:opacity-40"
              >
                <Printer size={14} /> Schedule & Print Slip
              </button>
              <div className="flex gap-3">
                <button onClick={() => setShowNewAppt(false)} className="btn-outline text-sm">Cancel</button>
                <button
                  onClick={handleScheduleAppt}
                  disabled={!newAppt.date || !newAppt.time || !newAppt.visitorName.trim() || !newAppt.purpose}
                  className="px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-40 transition-colors"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============= Walk-In Modal ============= */}
      {showWalkIn && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowWalkIn(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#7c3aed]">Log Walk-In</h3>
              <button onClick={() => setShowWalkIn(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label-field text-xs">Visitor Name *</label>
                <input
                  type="text"
                  value={walkIn.visitorName}
                  onChange={(e) => setWalkIn(w => ({ ...w, visitorName: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="label-field text-xs">Purpose *</label>
                <select
                  value={walkIn.purpose}
                  onChange={(e) => setWalkIn(w => ({ ...w, purpose: e.target.value }))}
                  className="input-field text-sm"
                >
                  <option value="">Select Purpose</option>
                  {PURPOSES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field text-xs">Notes (optional)</label>
                <textarea
                  value={walkIn.notes}
                  onChange={(e) => setWalkIn(w => ({ ...w, notes: e.target.value }))}
                  className="input-field text-sm resize-none"
                  rows={2}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowWalkIn(false)} className="btn-outline text-sm">Cancel</button>
              <button
                onClick={handleLogWalkIn}
                disabled={!walkIn.visitorName.trim() || !walkIn.purpose}
                className="px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-40 transition-colors"
              >
                Log Walk-In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============= Quick Lookup Modal ============= */}
      {showLookup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowLookup(false); setLookupQuery(''); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#7c3aed]">Quick Permit Lookup</h3>
              <button onClick={() => { setShowLookup(false); setLookupQuery(''); }} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="px-6 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Search by permit number, employee name, or employer..."
                  className="input-field pl-10 text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {lookupQuery.trim() && lookupResults.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No permits found matching your search.</p>
              )}
              {lookupResults.map(p => (
                <div key={p.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#7c3aed] text-sm">{p.permitNumber}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(p.status)}`}>
                      {getStatusLabel(p.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {p.employeeFirstName || p.firstName} {p.employeeLastName || p.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Employer: {p.employerName || p.employer || '-'}
                    {p.position ? ` | Position: ${p.position}` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Submitted: {formatDateShort(p.submittedAt)} | Type: {p.type?.replace(/-/g, ' ') || '-'}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={() => { setShowLookup(false); setLookupQuery(''); }} className="btn-outline text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
