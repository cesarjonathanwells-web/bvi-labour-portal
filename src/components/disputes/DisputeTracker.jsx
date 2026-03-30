import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatDate, getStatusColor, getStatusLabel } from '../../utils/helpers';
import { fileToBase64 } from '../../utils/helpers';
import { DISPUTE_STATUSES } from '../../data/constants';
import {
  Search, FileText, Clock, CheckCircle, ChevronDown, ChevronUp,
  Upload, Paperclip, X, User, Building2, Scale, Info, Inbox,
} from 'lucide-react';

const TIMELINE_STEPS = [
  { key: 'filed', label: 'Filed', icon: FileText },
  { key: 'investigating', label: 'Investigation', icon: Search },
  { key: 'mediation', label: 'Mediation', icon: Scale },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle },
];

export default function DisputeTracker() {
  const { user } = useAuth();
  const { getDisputesByUser, disputes: allDisputes } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [additionalDocs, setAdditionalDocs] = useState({});

  const userDisputes = getDisputesByUser(user.id);

  // Allow search by case number across user's disputes
  const filtered = searchTerm
    ? userDisputes.filter(d =>
        d.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.complaintType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.respondentName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : userDisputes;

  const getStepIndex = (status) => {
    const idx = TIMELINE_STEPS.findIndex(s => s.key === status);
    if (status === 'referred' || status === 'closed') return TIMELINE_STEPS.length;
    return idx >= 0 ? idx : 0;
  };

  const handleDocUpload = async (disputeId, e) => {
    const files = Array.from(e.target.files);
    const processed = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) continue;
      try {
        const base64 = await fileToBase64(file);
        processed.push({ name: file.name, data: base64, uploadedAt: new Date().toISOString() });
      } catch { /* skip */ }
    }
    if (processed.length > 0) {
      // Save to localStorage
      const allDisputesData = JSON.parse(localStorage.getItem('bvi_disputes') || '[]');
      const updated = allDisputesData.map(d => {
        if (d.id !== disputeId) return d;
        return { ...d, documents: [...(d.documents || []), ...processed] };
      });
      localStorage.setItem('bvi_disputes', JSON.stringify(updated));
      setAdditionalDocs(prev => ({
        ...prev,
        [disputeId]: [...(prev[disputeId] || []), ...processed],
      }));
    }
  };

  if (userDisputes.length === 0) {
    return (
      <div>
        {/* Search box always shown */}
        <div className="max-w-md mx-auto mb-8">
          <label className="label-field">Search by Case Number</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input className="input-field !pl-10" placeholder="e.g., DC-2026-1234"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Disputes Filed</h3>
          <p className="text-gray-500">You have not filed any disputes. If you have a workplace complaint, use the File a Dispute form.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input className="input-field !pl-10" placeholder="Search by case number, type, or respondent..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4">
        {filtered.length} dispute{filtered.length !== 1 ? 's' : ''} found
      </p>

      <div className="space-y-6">
        {filtered.map(dispute => {
          const expanded = expandedId === dispute.id;
          const currentStepIdx = getStepIndex(dispute.status);
          const isTerminal = dispute.status === 'resolved' || dispute.status === 'closed' || dispute.status === 'referred';
          const allDocs = [...(dispute.documents || []), ...(additionalDocs[dispute.id] || [])];

          return (
            <div key={dispute.id} className="card">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 cursor-pointer"
                onClick={() => setExpandedId(expanded ? null : dispute.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-[#003366] text-lg">{dispute.caseNumber}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
                      {getStatusLabel(dispute.status)}
                    </span>
                  </div>
                  <p className="text-gray-700 font-medium">{dispute.complaintType}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />vs. {dispute.respondentName}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Filed: {formatDate(dispute.filedAt)}</span>
                  </div>
                </div>
                {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>

              {/* Visual timeline (always visible) */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-0 overflow-x-auto pb-2">
                  {TIMELINE_STEPS.map((step, i) => {
                    const StepIcon = step.icon;
                    const isComplete = i < currentStepIdx || (i === currentStepIdx && isTerminal);
                    const isCurrent = i === currentStepIdx && !isTerminal;
                    return (
                      <div key={step.key} className="flex items-center flex-1 min-w-0">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isComplete ? 'bg-[#006633] text-white'
                            : isCurrent ? 'bg-[#003366] text-white ring-4 ring-blue-100'
                            : 'bg-gray-200 text-gray-500'
                          }`}>
                            <StepIcon className="w-5 h-5" />
                          </div>
                          <span className={`text-xs mt-1 text-center ${isCurrent ? 'font-bold text-[#003366]' : 'text-gray-500'}`}>
                            {step.label}
                          </span>
                        </div>
                        {i < TIMELINE_STEPS.length - 1 && (
                          <div className={`flex-1 h-1 mx-2 rounded ${i < currentStepIdx ? 'bg-[#006633]' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expanded details */}
              {expanded && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {/* Case details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Incident Date</h4>
                      <p className="text-sm text-gray-700">{formatDate(dispute.incidentDate)}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Labour Code Reference</h4>
                      <p className="text-sm text-[#003366]">{dispute.labourCodeRef}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Description</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                      {dispute.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Desired Resolution</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{dispute.desiredResolution}</p>
                  </div>

                  {/* Timeline / notes */}
                  {dispute.timeline && dispute.timeline.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#003366]" />Case Timeline
                      </h4>
                      <div className="space-y-3 ml-2">
                        {dispute.timeline.map((entry, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full mt-1.5 ${i === 0 ? 'bg-[#003366]' : 'bg-gray-300'}`} />
                              {i < dispute.timeline.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                            </div>
                            <div className="pb-3">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(entry.status)}`}>
                                  {getStatusLabel(entry.status)}
                                </span>
                                <span className="text-xs text-gray-400">{formatDate(entry.date)}</span>
                              </div>
                              {entry.note && <p className="text-sm text-gray-600 mt-1">{entry.note}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#003366]" />Documents
                    </h4>
                    {allDocs.length > 0 ? (
                      <div className="space-y-1 mb-3">
                        {allDocs.map((doc, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                            <Paperclip className="w-3 h-3 text-gray-400" />
                            <span className="flex-1">{doc.name}</span>
                            {doc.uploadedAt && <span className="text-xs text-gray-400">{formatDate(doc.uploadedAt)}</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-3">No documents uploaded.</p>
                    )}

                    {/* Add additional documents */}
                    {!isTerminal && (
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#003366] hover:bg-gray-50 transition-colors text-sm">
                        <Upload className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">Upload additional evidence or documents</span>
                        <input type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={e => handleDocUpload(dispute.id, e)} />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
