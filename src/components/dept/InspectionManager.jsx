import { useState, useMemo } from 'react';
import {
  ClipboardCheck, Search, Plus, ShieldAlert, Calendar, MapPin,
  AlertTriangle, Check, XCircle, X, Eye, ArrowLeft, Clock,
  FileText, Printer, ChevronRight, Building, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { generateId, formatDateShort, getStorage, setStorage } from '../../utils/helpers';
import { ISLANDS } from '../../data/constants';

const INSPECTIONS_KEY = 'bvi_inspections';

const INSPECTION_TYPES = [
  { id: 'routine', label: 'Routine Inspection' },
  { id: 'complaint', label: 'Complaint-Based' },
  { id: 'followup', label: 'Follow-Up' },
];

/* Labour Code Part IX checklist items */
const CHECKLIST_ITEMS = [
  { id: 'workplace_cleanliness', label: 'Workplace Cleanliness', category: 'General' },
  { id: 'fire_safety', label: 'Fire Safety & Extinguishers', category: 'Safety' },
  { id: 'machinery_safety', label: 'Machinery Safety & Guards', category: 'Safety' },
  { id: 'protective_equipment', label: 'Protective Equipment Provided', category: 'Safety' },
  { id: 'ventilation', label: 'Adequate Ventilation', category: 'Environment' },
  { id: 'lighting', label: 'Adequate Lighting', category: 'Environment' },
  { id: 'sanitary_facilities', label: 'Sanitary Facilities', category: 'Environment' },
  { id: 'drinking_water', label: 'Drinking Water Available', category: 'Environment' },
  { id: 'first_aid', label: 'First Aid Kit Available', category: 'Safety' },
  { id: 'employee_records', label: 'Employee Records Maintained', category: 'Records' },
  { id: 'young_worker_register', label: 'Young Worker Register', category: 'Records' },
  { id: 'working_hours', label: 'Working Hours Compliance', category: 'Compliance' },
  { id: 'minimum_wage', label: 'Minimum Wage Compliance', category: 'Compliance' },
  { id: 'overtime_records', label: 'Overtime Records', category: 'Records' },
  { id: 'leave_records', label: 'Leave/Holiday Records', category: 'Records' },
  { id: 'work_permits', label: 'Valid Work Permits for Non-Belongers', category: 'Compliance' },
  { id: 'noise_levels', label: 'Noise Levels Acceptable', category: 'Environment' },
  { id: 'emergency_exits', label: 'Emergency Exits Clear & Marked', category: 'Safety' },
  { id: 'structural_safety', label: 'Structural Safety', category: 'Safety' },
  { id: 'chemical_storage', label: 'Chemical Storage & Labeling', category: 'Safety' },
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
        Inspection Manager is restricted to staff with inspection permissions.
      </p>
    </div>
  );
}

export default function InspectionManager() {
  const { user, hasPermission } = useAuth();

  const [view, setView] = useState('list'); // list | schedule | detail | checklist
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);

  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({
    workplaceName: '', address: '', island: 'Tortola', date: '', type: 'routine',
  });

  // Checklist state
  const [checklist, setChecklist] = useState({});
  const [checklistNotes, setChecklistNotes] = useState({});
  const [overallNotes, setOverallNotes] = useState('');

  // Violation form
  const [showViolation, setShowViolation] = useState(false);
  const [violation, setViolation] = useState({ category: '', description: '', deadline: '' });

  /* ---------- Permission gate ---------- */
  if (!user || !hasPermission('inspections')) {
    return <AccessDenied />;
  }

  const inspections = getStorage(INSPECTIONS_KEY) || [];

  /* filtered inspections */
  const filtered = useMemo(() => {
    let list = inspections;
    if (typeFilter !== 'all') list = list.filter(i => i.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        (i.workplaceName || '').toLowerCase().includes(q) ||
        (i.address || '').toLowerCase().includes(q) ||
        (i.island || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [inspections, typeFilter, search]);

  /* Group by workplace for history */
  const workplaceHistory = useMemo(() => {
    const map = {};
    inspections.forEach(i => {
      const key = i.workplaceName || 'Unknown';
      if (!map[key]) map[key] = [];
      map[key].push(i);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => new Date(b.date) - new Date(a.date)));
    return map;
  }, [inspections]);

  /* Follow-up tracker */
  const pendingFollowups = useMemo(() => {
    return inspections.filter(i =>
      i.violations && i.violations.length > 0 &&
      i.violations.some(v => !v.resolved)
    );
  }, [inspections]);

  /* Schedule inspection */
  const handleSchedule = () => {
    const { workplaceName, address, island, date, type } = scheduleForm;
    if (!workplaceName.trim() || !address.trim() || !date) return;

    const all = getStorage(INSPECTIONS_KEY) || [];
    all.push({
      id: generateId(),
      workplaceName: workplaceName.trim(),
      address: address.trim(),
      island,
      date,
      type,
      status: 'scheduled',
      inspector: `${user.firstName} ${user.lastName}`,
      inspectorId: user.id,
      checklist: null,
      violations: [],
      overallStatus: null,
      createdAt: new Date().toISOString(),
    });
    setStorage(INSPECTIONS_KEY, all);
    setScheduleForm({ workplaceName: '', address: '', island: 'Tortola', date: '', type: 'routine' });
    setShowSchedule(false);
  };

  /* Start inspection checklist */
  const startChecklist = (inspection) => {
    setSelectedInspection(inspection);
    // Pre-populate if checklist exists
    if (inspection.checklist) {
      const ck = {};
      const cn = {};
      inspection.checklist.forEach(item => {
        ck[item.id] = item.status;
        cn[item.id] = item.notes || '';
      });
      setChecklist(ck);
      setChecklistNotes(cn);
    } else {
      setChecklist({});
      setChecklistNotes({});
    }
    setOverallNotes(inspection.overallNotes || '');
    setView('checklist');
  };

  /* Save / generate inspection report */
  const handleSaveChecklist = () => {
    if (!selectedInspection) return;
    const checklistData = CHECKLIST_ITEMS.map(item => ({
      id: item.id,
      label: item.label,
      category: item.category,
      status: checklist[item.id] || 'na',
      notes: checklistNotes[item.id] || '',
    }));

    const nonCompliant = checklistData.filter(c => c.status === 'non_compliant').length;
    const compliant = checklistData.filter(c => c.status === 'compliant').length;
    const overallStatus = nonCompliant === 0 ? 'compliant' : (nonCompliant > 3 ? 'major_violations' : 'minor_violations');

    const all = getStorage(INSPECTIONS_KEY) || [];
    const idx = all.findIndex(i => i.id === selectedInspection.id);
    if (idx >= 0) {
      all[idx] = {
        ...all[idx],
        checklist: checklistData,
        overallStatus,
        overallNotes: overallNotes.trim(),
        status: 'completed',
        completedAt: new Date().toISOString(),
        summary: { compliant, nonCompliant, total: checklistData.length },
      };
      setStorage(INSPECTIONS_KEY, all);
    }

    setView('list');
    setSelectedInspection(null);
  };

  /* Add violation notice */
  const handleAddViolation = () => {
    if (!selectedInspection || !violation.category.trim() || !violation.description.trim()) return;
    const all = getStorage(INSPECTIONS_KEY) || [];
    const idx = all.findIndex(i => i.id === selectedInspection.id);
    if (idx >= 0) {
      const v = {
        id: generateId(),
        category: violation.category.trim(),
        description: violation.description.trim(),
        deadline: violation.deadline,
        resolved: false,
        issuedAt: new Date().toISOString(),
        issuedBy: `${user.firstName} ${user.lastName}`,
      };
      all[idx].violations = [...(all[idx].violations || []), v];
      setStorage(INSPECTIONS_KEY, all);
      setSelectedInspection(prev => ({ ...prev, violations: [...(prev.violations || []), v] }));
    }
    setViolation({ category: '', description: '', deadline: '' });
    setShowViolation(false);
  };

  /* Mark violation resolved */
  const resolveViolation = (inspectionId, violationId) => {
    const all = getStorage(INSPECTIONS_KEY) || [];
    const idx = all.findIndex(i => i.id === inspectionId);
    if (idx >= 0) {
      all[idx].violations = all[idx].violations.map(v =>
        v.id === violationId ? { ...v, resolved: true, resolvedAt: new Date().toISOString() } : v
      );
      setStorage(INSPECTIONS_KEY, all);
      if (selectedInspection?.id === inspectionId) {
        setSelectedInspection(prev => ({
          ...prev,
          violations: prev.violations.map(v =>
            v.id === violationId ? { ...v, resolved: true, resolvedAt: new Date().toISOString() } : v
          ),
        }));
      }
    }
  };

  /* ============= CHECKLIST VIEW ============= */
  if (view === 'checklist' && selectedInspection) {
    const categories = [...new Set(CHECKLIST_ITEMS.map(i => i.category))];

    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => { setView('list'); setSelectedInspection(null); }}
          className="mb-4 text-sm text-[#7c3aed] hover:text-[#6d28d9] font-medium flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back to Inspections
        </button>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-[#7c3aed] mb-1">Inspection Checklist</h2>
          <p className="text-sm text-gray-500 mb-4">
            {selectedInspection.workplaceName} - {selectedInspection.address}, {selectedInspection.island}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span>Date: <strong>{formatDateShort(selectedInspection.date)}</strong></span>
            <span>Type: <strong>{INSPECTION_TYPES.find(t => t.id === selectedInspection.type)?.label}</strong></span>
            <span>Inspector: <strong>{selectedInspection.inspector}</strong></span>
          </div>
        </div>

        {/* Checklist by category */}
        {categories.map(cat => (
          <div key={cat} className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
            <div className="px-6 py-3 border-b border-gray-100 bg-purple-50/50">
              <h3 className="text-sm font-bold text-[#7c3aed]">{cat}</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {CHECKLIST_ITEMS.filter(i => i.category === cat).map(item => (
                <div key={item.id} className="px-6 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">{item.label}</span>
                    <div className="flex gap-1">
                      {[
                        { value: 'compliant', label: 'Compliant', color: 'bg-green-600' },
                        { value: 'non_compliant', label: 'Non-Compliant', color: 'bg-red-600' },
                        { value: 'na', label: 'N/A', color: 'bg-gray-400' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setChecklist(prev => ({ ...prev, [item.id]: opt.value }))}
                          className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                            checklist[item.id] === opt.value
                              ? `${opt.color} text-white`
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={checklistNotes[item.id] || ''}
                    onChange={(e) => setChecklistNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="Notes (optional)..."
                    className="input-field text-xs py-1.5"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Overall notes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="text-sm font-bold text-[#7c3aed] mb-3">Overall Notes & Observations</h3>
          <textarea
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
            rows={4}
            className="input-field text-sm resize-none"
            placeholder="General observations about the workplace..."
          />
        </div>

        {/* Violation notices */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#7c3aed] flex items-center gap-2">
              <AlertTriangle size={14} /> Violation Notices
            </h3>
            <button
              onClick={() => setShowViolation(true)}
              className="flex items-center gap-1 text-sm text-[#7c3aed] hover:underline"
            >
              <Plus size={14} /> Add Violation
            </button>
          </div>

          {(selectedInspection.violations || []).length === 0 ? (
            <p className="text-sm text-gray-400">No violations issued.</p>
          ) : (
            <div className="space-y-2">
              {selectedInspection.violations.map(v => (
                <div key={v.id} className={`p-3 rounded-lg border ${v.resolved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-600 uppercase">{v.category}</span>
                      <p className="text-sm text-gray-800">{v.description}</p>
                      {v.deadline && <p className="text-xs text-gray-500 mt-1">Deadline: {formatDateShort(v.deadline)}</p>}
                    </div>
                    {v.resolved ? (
                      <span className="text-xs text-green-700 font-medium">Resolved</span>
                    ) : (
                      <button
                        onClick={() => resolveViolation(selectedInspection.id, v.id)}
                        className="text-xs text-green-600 hover:underline font-medium"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save / Generate Report */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={handleSaveChecklist}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#7c3aed] text-white rounded-lg font-medium hover:bg-[#6d28d9] transition-colors"
          >
            <FileText size={16} /> Save & Generate Report
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-3 border-2 border-[#7c3aed] text-[#7c3aed] rounded-lg font-medium hover:bg-purple-50 transition-colors"
          >
            <Printer size={16} /> Print
          </button>
        </div>

        {/* Violation modal */}
        {showViolation && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowViolation(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-red-600">Issue Violation Notice</h3>
                <button onClick={() => setShowViolation(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="label-field text-xs">Category *</label>
                  <select
                    value={violation.category}
                    onChange={(e) => setViolation(v => ({ ...v, category: e.target.value }))}
                    className="input-field text-sm"
                  >
                    <option value="">Select Category</option>
                    {['Fire Safety', 'Machinery Safety', 'Protective Equipment', 'Sanitary Conditions', 'Working Hours', 'Minimum Wage', 'Employee Records', 'Structural Safety', 'Chemical Safety', 'General Non-Compliance', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-field text-xs">Description *</label>
                  <textarea
                    value={violation.description}
                    onChange={(e) => setViolation(v => ({ ...v, description: e.target.value }))}
                    className="input-field text-sm resize-none"
                    rows={3}
                    placeholder="Describe the violation..."
                  />
                </div>
                <div>
                  <label className="label-field text-xs">Remediation Deadline</label>
                  <input
                    type="date"
                    value={violation.deadline}
                    onChange={(e) => setViolation(v => ({ ...v, deadline: e.target.value }))}
                    className="input-field text-sm"
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setShowViolation(false)} className="btn-outline text-sm">Cancel</button>
                <button
                  onClick={handleAddViolation}
                  disabled={!violation.category || !violation.description.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 transition-colors"
                >
                  Issue Violation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ============= DETAIL VIEW ============= */
  if (view === 'detail' && selectedInspection) {
    const insp = selectedInspection;
    const history = workplaceHistory[insp.workplaceName] || [];

    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => { setView('list'); setSelectedInspection(null); }}
          className="mb-4 text-sm text-[#7c3aed] hover:text-[#6d28d9] font-medium flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back to Inspections
        </button>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-[#7c3aed]">{insp.workplaceName}</h2>
              <p className="text-sm text-gray-500">{insp.address}, {insp.island}</p>
            </div>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              insp.status === 'completed' ? (
                insp.overallStatus === 'compliant' ? 'bg-green-100 text-green-700' :
                insp.overallStatus === 'major_violations' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              ) : 'bg-blue-100 text-blue-700'
            }`}>
              {insp.status === 'completed' ? (insp.overallStatus || 'Completed') : 'Scheduled'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase">Date</p>
              <p className="font-medium">{formatDateShort(insp.date)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase">Type</p>
              <p className="font-medium">{INSPECTION_TYPES.find(t => t.id === insp.type)?.label}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase">Inspector</p>
              <p className="font-medium">{insp.inspector}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase">Status</p>
              <p className="font-medium capitalize">{insp.status}</p>
            </div>
          </div>
        </div>

        {/* Checklist summary if completed */}
        {insp.summary && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{insp.summary.compliant}</p>
              <p className="text-xs text-green-600">Compliant</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{insp.summary.nonCompliant}</p>
              <p className="text-xs text-red-600">Non-Compliant</p>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{insp.summary.total - insp.summary.compliant - insp.summary.nonCompliant}</p>
              <p className="text-xs text-gray-600">N/A</p>
            </div>
          </div>
        )}

        {/* Violations */}
        {(insp.violations || []).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle size={14} /> Violation Notices ({insp.violations.length})
            </h3>
            <div className="space-y-2">
              {insp.violations.map(v => (
                <div key={v.id} className={`p-3 rounded-lg border ${v.resolved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-600 uppercase">{v.category}</span>
                      <p className="text-sm text-gray-800">{v.description}</p>
                      {v.deadline && <p className="text-xs text-gray-500 mt-1">Deadline: {formatDateShort(v.deadline)}</p>}
                    </div>
                    {v.resolved ? (
                      <span className="text-xs text-green-700 font-medium flex items-center gap-1"><Check size={12} /> Resolved</span>
                    ) : (
                      <button
                        onClick={() => resolveViolation(insp.id, v.id)}
                        className="text-xs text-green-600 hover:underline font-medium"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          {insp.status === 'scheduled' && (
            <button
              onClick={() => startChecklist(insp)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#7c3aed] text-white rounded-lg font-medium hover:bg-[#6d28d9] transition-colors text-sm"
            >
              <ClipboardCheck size={16} /> Start Inspection
            </button>
          )}
          {insp.status === 'completed' && (
            <button
              onClick={() => startChecklist(insp)}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-[#7c3aed] text-[#7c3aed] rounded-lg font-medium hover:bg-purple-50 transition-colors text-sm"
            >
              <Eye size={16} /> View/Edit Checklist
            </button>
          )}
        </div>

        {/* Inspection history for this workplace */}
        {history.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#7c3aed] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock size={14} /> Inspection History - {insp.workplaceName}
            </h3>
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      h.overallStatus === 'compliant' ? 'bg-green-500' :
                      h.overallStatus === 'major_violations' ? 'bg-red-500' :
                      h.overallStatus === 'minor_violations' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{formatDateShort(h.date)}</p>
                      <p className="text-xs text-gray-500">{INSPECTION_TYPES.find(t => t.id === h.type)?.label} by {h.inspector}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 capitalize">{h.overallStatus || h.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ============= LIST VIEW ============= */
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#7c3aed]">Inspection Manager</h1>
        <p className="text-gray-500 mb-6">Schedule workplace inspections, conduct checklists, and track violations.</p>
      </div>

      {/* Action button */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setShowSchedule(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-colors"
        >
          <Plus size={16} /> Schedule Inspection
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#7c3aed]">{inspections.length}</p>
          <p className="text-xs text-gray-500">Total Inspections</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{inspections.filter(i => i.status === 'scheduled').length}</p>
          <p className="text-xs text-gray-500">Scheduled</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{inspections.filter(i => i.status === 'completed').length}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{pendingFollowups.length}</p>
          <p className="text-xs text-gray-500">Pending Follow-Ups</p>
        </div>
      </div>

      {/* Follow-up tracker */}
      {pendingFollowups.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
            <RefreshCw size={14} /> Pending Follow-Ups
          </h3>
          <div className="space-y-2">
            {pendingFollowups.slice(0, 5).map(i => (
              <div key={i.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">{i.workplaceName}</p>
                  <p className="text-xs text-gray-500">
                    {i.violations.filter(v => !v.resolved).length} unresolved violation(s) - Inspected: {formatDateShort(i.date)}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedInspection(i); setView('detail'); }}
                  className="text-xs text-[#7c3aed] hover:underline font-medium"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by workplace name, address, or island..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 text-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field text-sm py-2 w-auto"
          >
            <option value="all">All Types</option>
            {INSPECTION_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inspections list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <ClipboardCheck className="w-14 h-14 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Inspections</h3>
          <p className="text-gray-400">Schedule an inspection to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(insp => (
            <button
              key={insp.id}
              onClick={() => { setSelectedInspection(insp); setView('detail'); }}
              className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-[#7c3aed] hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  insp.status === 'completed' ? (
                    insp.overallStatus === 'compliant' ? 'bg-green-50' :
                    insp.overallStatus === 'major_violations' ? 'bg-red-50' : 'bg-amber-50'
                  ) : 'bg-blue-50'
                }`}>
                  <ClipboardCheck className={`w-5 h-5 ${
                    insp.status === 'completed' ? (
                      insp.overallStatus === 'compliant' ? 'text-green-600' :
                      insp.overallStatus === 'major_violations' ? 'text-red-600' : 'text-amber-600'
                    ) : 'text-blue-600'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-[#7c3aed]">{insp.workplaceName}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      insp.status === 'completed' ? (
                        insp.overallStatus === 'compliant' ? 'bg-green-100 text-green-700' :
                        insp.overallStatus === 'major_violations' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      ) : 'bg-blue-100 text-blue-700'
                    }`}>
                      {insp.status === 'completed' ? (insp.overallStatus?.replace(/_/g, ' ') || 'Completed') : 'Scheduled'}
                    </span>
                    <span className="text-[10px] text-gray-400">{INSPECTION_TYPES.find(t => t.id === insp.type)?.label}</span>
                  </div>
                  <p className="text-sm text-gray-700 truncate">{insp.address}, {insp.island}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Date: {formatDateShort(insp.date)} | Inspector: {insp.inspector}
                    {(insp.violations || []).length > 0 && (
                      <span className="text-red-500 ml-2">
                        {insp.violations.filter(v => !v.resolved).length} open violation(s)
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-gray-400 group-hover:text-[#7c3aed]">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ============= Schedule Inspection Modal ============= */}
      {showSchedule && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSchedule(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#7c3aed]">Schedule Inspection</h3>
              <button onClick={() => setShowSchedule(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label-field text-xs">Workplace Name *</label>
                <input
                  type="text"
                  value={scheduleForm.workplaceName}
                  onChange={(e) => setScheduleForm(f => ({ ...f, workplaceName: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="Business/Workplace name"
                />
              </div>
              <div>
                <label className="label-field text-xs">Address *</label>
                <input
                  type="text"
                  value={scheduleForm.address}
                  onChange={(e) => setScheduleForm(f => ({ ...f, address: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field text-xs">Island *</label>
                  <select
                    value={scheduleForm.island}
                    onChange={(e) => setScheduleForm(f => ({ ...f, island: e.target.value }))}
                    className="input-field text-sm"
                  >
                    {ISLANDS.map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-field text-xs">Date *</label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm(f => ({ ...f, date: e.target.value }))}
                    className="input-field text-sm"
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
              </div>
              <div>
                <label className="label-field text-xs">Inspection Type *</label>
                <select
                  value={scheduleForm.type}
                  onChange={(e) => setScheduleForm(f => ({ ...f, type: e.target.value }))}
                  className="input-field text-sm"
                >
                  {INSPECTION_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowSchedule(false)} className="btn-outline text-sm">Cancel</button>
              <button
                onClick={handleSchedule}
                disabled={!scheduleForm.workplaceName.trim() || !scheduleForm.address.trim() || !scheduleForm.date}
                className="px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-40 transition-colors"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
