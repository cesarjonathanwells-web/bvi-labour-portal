import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { fileToBase64 } from '../../utils/helpers';
import {
  FileText, Upload, Calendar, DollarSign, Send, CheckCircle, AlertCircle,
  ArrowLeft, X, Paperclip,
} from 'lucide-react';

export default function ApplicationForm({ job, onBack, onSuccess }) {
  const { user } = useAuth();
  const { applyToJob } = useApp();
  const [form, setForm] = useState({
    coverLetter: '',
    resume: null,
    resumeName: '',
    additionalDocs: [],
    availableDate: '',
    salaryExpectation: '',
    suitability: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedApp, setSubmittedApp] = useState(null);

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, resume: 'File must be under 5MB' }));
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      set('resume', base64);
      set('resumeName', file.name);
    } catch {
      setErrors(prev => ({ ...prev, resume: 'Failed to process file' }));
    }
  };

  const handleAdditionalDocs = async (e) => {
    const files = Array.from(e.target.files);
    const processed = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) continue;
      try {
        const base64 = await fileToBase64(file);
        processed.push({ name: file.name, data: base64 });
      } catch { /* skip failed */ }
    }
    setForm(prev => ({ ...prev, additionalDocs: [...prev.additionalDocs, ...processed] }));
  };

  const removeDoc = (idx) => {
    setForm(prev => ({
      ...prev,
      additionalDocs: prev.additionalDocs.filter((_, i) => i !== idx),
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.coverLetter || form.coverLetter.length < 50)
      e.coverLetter = 'Cover letter must be at least 50 characters';
    if (!form.resume) e.resume = 'Resume is required';
    if (!form.availableDate) e.availableDate = 'Available start date is required';
    if (!form.suitability || form.suitability.length < 30)
      e.suitability = 'Please explain your suitability (at least 30 characters)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const app = applyToJob(job.id, {
        userId: user.id,
        applicantName: `${user.firstName} ${user.lastName}`,
        applicantEmail: user.email,
        coverLetter: form.coverLetter,
        resumeName: form.resumeName,
        resume: form.resume,
        additionalDocs: form.additionalDocs,
        availableDate: form.availableDate,
        salaryExpectation: form.salaryExpectation ? Number(form.salaryExpectation) : null,
        suitability: form.suitability,
        jobTitle: job.title,
        employerName: job.employerName,
      });
      setSubmittedApp(app);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
        <p className="text-gray-600 mb-1">You have applied to <span className="font-semibold">{job.title}</span></p>
        <p className="text-gray-600 mb-6">Application ID: <span className="font-mono text-[#003366]">{submittedApp?.id?.slice(0, 12)}</span></p>
        <div className="flex gap-3 justify-center">
          {onBack && <button className="btn-outline" onClick={onBack}><ArrowLeft className="w-4 h-4" />Back to Jobs</button>}
          {onSuccess && <button className="btn-primary" onClick={() => onSuccess()}>View My Applications</button>}
        </div>
      </div>
    );
  }

  const ErrorMsg = ({ field }) => errors[field] ? (
    <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors[field]}</p>
  ) : null;

  return (
    <div className="max-w-3xl mx-auto">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-[#003366] hover:underline mb-4 font-medium">
          <ArrowLeft className="w-4 h-4" />Back to Job Details
        </button>
      )}

      {/* Job summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-[#003366]">Applying for: {job.title}</h3>
        <p className="text-sm text-gray-600">{job.employerName} &middot; {job.location} &middot; {job.employmentType}</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <h2 className="section-title flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#003366]" />Job Application
        </h2>

        {/* Cover letter */}
        <div>
          <label className="label-field">Cover Letter *</label>
          <textarea className="input-field min-h-[150px]"
            placeholder="Introduce yourself and explain your interest in this position..."
            value={form.coverLetter} onChange={e => set('coverLetter', e.target.value)} />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <ErrorMsg field="coverLetter" />
            <span>{form.coverLetter.length} characters</span>
          </div>
        </div>

        {/* Resume */}
        <div>
          <label className="label-field">Resume / CV *</label>
          {form.resumeName ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Paperclip className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800 flex-1">{form.resumeName}</span>
              <button type="button" onClick={() => { set('resume', null); set('resumeName', ''); }}
                className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#003366] hover:bg-gray-50 transition-colors">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">Click to upload resume (PDF, DOC - max 5MB)</span>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
            </label>
          )}
          <ErrorMsg field="resume" />
        </div>

        {/* Additional documents */}
        <div>
          <label className="label-field">Additional Documents</label>
          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#003366] hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Upload certificates, references, etc. (max 5MB each)</span>
            <input type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleAdditionalDocs} />
          </label>
          {form.additionalDocs.length > 0 && (
            <div className="mt-2 space-y-1">
              {form.additionalDocs.map((doc, i) => (
                <div key={i} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                  <Paperclip className="w-3 h-3 text-gray-400" />
                  <span className="flex-1">{doc.name}</span>
                  <button type="button" onClick={() => removeDoc(i)} className="text-red-500 hover:text-red-700">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Available Start Date *</label>
            <input type="date" className="input-field" value={form.availableDate}
              onChange={e => set('availableDate', e.target.value)} min={new Date().toISOString().split('T')[0]} />
            <ErrorMsg field="availableDate" />
          </div>
          <div>
            <label className="label-field">Salary Expectation (USD/year)</label>
            <input type="number" className="input-field" placeholder="e.g., 40000"
              value={form.salaryExpectation} onChange={e => set('salaryExpectation', e.target.value)} />
          </div>
        </div>

        {/* Suitability */}
        <div>
          <label className="label-field">Why are you suitable for this role? *</label>
          <textarea className="input-field min-h-[120px]"
            placeholder="Describe your relevant experience, skills, and why you'd be a great fit..."
            value={form.suitability} onChange={e => set('suitability', e.target.value)} />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <ErrorMsg field="suitability" />
            <span>{form.suitability.length} characters</span>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button type="submit" className="btn-primary text-lg px-8" disabled={submitting}>
            <Send className="w-4 h-4" />{submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
