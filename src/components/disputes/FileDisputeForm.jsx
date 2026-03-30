import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { fileToBase64 } from '../../utils/helpers';
import {
  AlertTriangle, User, Building2, FileText, Upload, Send, CheckCircle,
  AlertCircle, X, Paperclip, ChevronLeft, ChevronRight, Scale, Info,
} from 'lucide-react';

const COMPLAINT_TYPES = [
  'Unpaid Wages',
  'Unfair Dismissal',
  'Discrimination',
  'Unsafe Working Conditions',
  'Breach of Contract',
  'Harassment',
  'Wrongful Deduction of Wages',
  'Denial of Leave Entitlements',
  'Other',
];

const LABOUR_CODE_REFS = {
  'Unpaid Wages': 'Labour Code, Part VI - Wages (Sections 76-95)',
  'Unfair Dismissal': 'Labour Code, Part IX - Termination of Employment (Sections 168-182)',
  'Discrimination': 'Labour Code, Part III - Protection from Discrimination (Sections 26-35)',
  'Unsafe Working Conditions': 'Labour Code, Part VIII - Occupational Safety and Health (Sections 139-167)',
  'Breach of Contract': 'Labour Code, Part IV - Contracts of Employment (Sections 36-58)',
  'Harassment': 'Labour Code, Part III - Protection from Harassment (Sections 30-35)',
  'Wrongful Deduction of Wages': 'Labour Code, Part VI - Section 82 (Unauthorized Deductions)',
  'Denial of Leave Entitlements': 'Labour Code, Part VII - Leave Entitlements (Sections 96-138)',
  'Other': 'Labour Code (Various Sections)',
};

const initialForm = {
  // Complainant
  complainantName: '', complainantEmail: '', complainantPhone: '', complainantAddress: '',
  // Respondent
  respondentName: '', respondentAddress: '', respondentPhone: '',
  // Complaint
  complaintType: '', incidentDate: '', description: '', desiredResolution: '',
  // Documents
  documents: [],
  // Declaration
  declaration: false,
};

export default function FileDisputeForm({ onSuccess }) {
  const { user } = useAuth();
  const { fileDispute } = useApp();
  const [form, setForm] = useState({
    ...initialForm,
    complainantName: user ? `${user.firstName} ${user.lastName}` : '',
    complainantEmail: user?.email || '',
    complainantPhone: user?.phone || '',
    complainantAddress: user?.address || '',
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1=complainant, 2=respondent, 3=complaint, 4=documents, 5=review
  const [submitted, setSubmitted] = useState(false);
  const [submittedDispute, setSubmittedDispute] = useState(null);

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.complainantName.trim()) e.complainantName = 'Name is required';
      if (!form.complainantEmail.trim()) e.complainantEmail = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.complainantEmail))
        e.complainantEmail = 'Enter a valid email';
      if (!form.complainantPhone.trim()) e.complainantPhone = 'Phone number is required';
    }
    if (s === 2) {
      if (!form.respondentName.trim()) e.respondentName = 'Employer/respondent name is required';
      if (!form.respondentAddress.trim()) e.respondentAddress = 'Respondent address is required';
    }
    if (s === 3) {
      if (!form.complaintType) e.complaintType = 'Select the nature of your complaint';
      if (!form.incidentDate) e.incidentDate = 'Date of incident is required';
      else if (new Date(form.incidentDate) > new Date()) e.incidentDate = 'Date cannot be in the future';
      if (!form.description || form.description.length < 100)
        e.description = 'Description must be at least 100 characters';
      if (!form.desiredResolution.trim()) e.desiredResolution = 'Please state your desired resolution';
    }
    if (s === 5) {
      if (!form.declaration) e.declaration = 'You must agree to the declaration to proceed';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(s => s + 1); };
  const prev = () => setStep(s => s - 1);

  const handleDocUpload = async (e) => {
    const files = Array.from(e.target.files);
    const processed = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) continue;
      try {
        const base64 = await fileToBase64(file);
        processed.push({ name: file.name, data: base64, size: file.size });
      } catch { /* skip */ }
    }
    setForm(prev => ({ ...prev, documents: [...prev.documents, ...processed] }));
  };

  const removeDoc = (idx) => {
    setForm(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = () => {
    if (!validateStep(5)) return;
    const dispute = fileDispute({
      userId: user.id,
      complainantName: form.complainantName,
      complainantEmail: form.complainantEmail,
      complainantPhone: form.complainantPhone,
      complainantAddress: form.complainantAddress,
      respondentName: form.respondentName,
      respondentAddress: form.respondentAddress,
      respondentPhone: form.respondentPhone,
      complaintType: form.complaintType,
      incidentDate: form.incidentDate,
      description: form.description,
      desiredResolution: form.desiredResolution,
      documents: form.documents,
      labourCodeRef: LABOUR_CODE_REFS[form.complaintType] || '',
    });
    setSubmittedDispute(dispute);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dispute Filed Successfully</h2>
        <p className="text-gray-600 mb-1">
          Case Number: <span className="font-bold text-[#003366] text-lg">{submittedDispute?.caseNumber}</span>
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Please save your case number for future reference. You will be contacted regarding next steps.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
          <h4 className="font-semibold text-[#003366] mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />What Happens Next?
          </h4>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal ml-4">
            <li>Your complaint will be reviewed by a Labour Officer</li>
            <li>An investigation may be initiated</li>
            <li>Both parties may be called for mediation</li>
            <li>A resolution will be determined</li>
          </ol>
        </div>
        <div className="flex gap-3 justify-center">
          <button className="btn-primary" onClick={() => { setForm({ ...initialForm }); setStep(1); setSubmitted(false); }}>
            File Another Dispute
          </button>
          {onSuccess && (
            <button className="btn-outline" onClick={() => onSuccess(submittedDispute)}>Track My Disputes</button>
          )}
        </div>
      </div>
    );
  }

  const ErrorMsg = ({ field }) => errors[field] ? (
    <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors[field]}</p>
  ) : null;

  const stepLabels = ['Your Info', 'Respondent', 'Complaint', 'Evidence', 'Review'];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={i + 1 < step ? 'stepper-complete' : i + 1 === step ? 'stepper-active' : 'stepper-inactive'}>
                {i + 1 < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
              </div>
              <span className="text-xs mt-1 text-gray-600 hidden sm:block">{label}</span>
            </div>
            {i < stepLabels.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i + 1 < step ? 'bg-[#006633]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="card">
        {/* Step 1: Complainant */}
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="section-title flex items-center gap-2">
              <User className="w-5 h-5 text-[#003366]" />Complainant Information
            </h3>
            <p className="text-sm text-gray-500 -mt-2">Your personal details (pre-filled from your profile)</p>

            <div>
              <label className="label-field">Full Name *</label>
              <input className="input-field" value={form.complainantName}
                onChange={e => set('complainantName', e.target.value)} />
              <ErrorMsg field="complainantName" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Email *</label>
                <input type="email" className="input-field" value={form.complainantEmail}
                  onChange={e => set('complainantEmail', e.target.value)} />
                <ErrorMsg field="complainantEmail" />
              </div>
              <div>
                <label className="label-field">Phone *</label>
                <input type="tel" className="input-field" placeholder="1(284) 000-0000"
                  value={form.complainantPhone} onChange={e => set('complainantPhone', e.target.value)} />
                <ErrorMsg field="complainantPhone" />
              </div>
            </div>

            <div>
              <label className="label-field">Address</label>
              <input className="input-field" placeholder="Street address, island"
                value={form.complainantAddress} onChange={e => set('complainantAddress', e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 2: Respondent */}
        {step === 2 && (
          <div className="space-y-5">
            <h3 className="section-title flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#003366]" />Respondent (Employer) Information
            </h3>

            <div>
              <label className="label-field">Employer / Company Name *</label>
              <input className="input-field" placeholder="Name of employer or business"
                value={form.respondentName} onChange={e => set('respondentName', e.target.value)} />
              <ErrorMsg field="respondentName" />
            </div>

            <div>
              <label className="label-field">Employer Address *</label>
              <input className="input-field" placeholder="Business address"
                value={form.respondentAddress} onChange={e => set('respondentAddress', e.target.value)} />
              <ErrorMsg field="respondentAddress" />
            </div>

            <div>
              <label className="label-field">Employer Phone</label>
              <input type="tel" className="input-field" placeholder="1(284) 000-0000"
                value={form.respondentPhone} onChange={e => set('respondentPhone', e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 3: Complaint details */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="section-title flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#003366]" />Nature of Complaint
            </h3>

            <div>
              <label className="label-field">Type of Complaint *</label>
              <select className="input-field" value={form.complaintType}
                onChange={e => set('complaintType', e.target.value)}>
                <option value="">Select complaint type</option>
                {COMPLAINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ErrorMsg field="complaintType" />
            </div>

            {/* Labour Code reference */}
            {form.complaintType && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <Scale className="w-4 h-4 text-[#003366] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[#003366]">Relevant Labour Code Reference</p>
                    <p className="text-gray-700">{LABOUR_CODE_REFS[form.complaintType]}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="label-field">Date of Incident *</label>
              <input type="date" className="input-field" value={form.incidentDate}
                onChange={e => set('incidentDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]} />
              <ErrorMsg field="incidentDate" />
            </div>

            <div>
              <label className="label-field">Detailed Description *</label>
              <textarea className="input-field min-h-[180px]"
                placeholder="Provide a detailed account of the incident or issue. Include relevant dates, names, and circumstances..."
                value={form.description} onChange={e => set('description', e.target.value)} />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <ErrorMsg field="description" />
                <span className={form.description.length < 100 ? 'text-red-500' : 'text-green-600'}>
                  {form.description.length}/100 min characters
                </span>
              </div>
            </div>

            <div>
              <label className="label-field">Desired Resolution *</label>
              <textarea className="input-field min-h-[80px]"
                placeholder="What outcome are you seeking? (e.g., payment of owed wages, reinstatement, compensation...)"
                value={form.desiredResolution} onChange={e => set('desiredResolution', e.target.value)} />
              <ErrorMsg field="desiredResolution" />
            </div>
          </div>
        )}

        {/* Step 4: Documents */}
        {step === 4 && (
          <div className="space-y-5">
            <h3 className="section-title flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#003366]" />Supporting Documents
            </h3>
            <p className="text-sm text-gray-500 -mt-2">
              Upload any documents that support your complaint (contracts, pay slips, correspondence, photos, etc.)
            </p>

            <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#003366] hover:bg-gray-50 transition-colors">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-gray-500 text-center">Click to upload documents<br /><span className="text-xs">PDF, DOC, JPG, PNG (max 10MB each)</span></span>
              <input type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleDocUpload} />
            </label>

            {form.documents.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Uploaded Documents ({form.documents.length})</h4>
                {form.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                    <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 flex-1 truncate">{doc.name}</span>
                    <span className="text-xs text-gray-400">{(doc.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => removeDoc(i)} className="text-red-500 hover:text-red-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {form.documents.length === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>While not required, supporting documents strengthen your case and may help expedite resolution.</span>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-6">
            <h3 className="section-title flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#003366]" />Review &amp; Submit
            </h3>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-1">
                    <User className="w-4 h-4 text-[#003366]" />Complainant
                  </h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>{form.complainantName}</p>
                    <p>{form.complainantEmail}</p>
                    <p>{form.complainantPhone}</p>
                    {form.complainantAddress && <p>{form.complainantAddress}</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-[#003366]" />Respondent
                  </h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>{form.respondentName}</p>
                    <p>{form.respondentAddress}</p>
                    {form.respondentPhone && <p>{form.respondentPhone}</p>}
                  </div>
                </div>
              </div>

              <hr />

              <div>
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">Complaint Details</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Type:</span> <span className="font-medium">{form.complaintType}</span></p>
                  <p><span className="text-gray-500">Date of Incident:</span> {new Date(form.incidentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p><span className="text-gray-500">Reference:</span> <span className="text-[#003366]">{LABOUR_CODE_REFS[form.complaintType]}</span></p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-1">Description</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border max-h-40 overflow-y-auto">
                  {form.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-1">Desired Resolution</h4>
                <p className="text-sm text-gray-700 bg-white p-3 rounded border">{form.desiredResolution}</p>
              </div>

              {form.documents.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-1">Supporting Documents ({form.documents.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {form.documents.map((doc, i) => (
                      <span key={i} className="text-xs bg-white px-2 py-1 rounded border flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />{doc.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Declaration */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded accent-[#003366] mt-0.5"
                  checked={form.declaration} onChange={e => set('declaration', e.target.checked)} />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Declaration</p>
                  <p className="text-gray-700 mt-1">
                    I hereby declare that the information provided in this complaint is true and accurate to the best of
                    my knowledge. I understand that providing false or misleading information may result in the dismissal
                    of my complaint and possible legal consequences. I authorize the Department of Labour and Workforce
                    Development to investigate this matter and contact the parties involved.
                  </p>
                </div>
              </label>
              <ErrorMsg field="declaration" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          {step > 1 ? (
            <button className="btn-outline" onClick={prev}><ChevronLeft className="w-4 h-4" />Back</button>
          ) : <div />}
          {step < 5 ? (
            <button className="btn-primary" onClick={next}>Next<ChevronRight className="w-4 h-4" /></button>
          ) : (
            <button className="btn-success" onClick={handleSubmit}>
              <Send className="w-4 h-4" />Submit Dispute
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
