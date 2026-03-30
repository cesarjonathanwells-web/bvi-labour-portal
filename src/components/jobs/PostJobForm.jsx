import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { JOB_CATEGORIES, ISLANDS } from '../../data/constants';
import {
  Briefcase, MapPin, DollarSign, Clock, Calendar, User, Phone, Mail,
  ChevronLeft, ChevronRight, Eye, Send, CheckCircle, AlertCircle,
} from 'lucide-react';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Temporary', 'Contract'];

const initialForm = {
  title: '', category: '', description: '', requirements: '',
  salaryMin: '', salaryMax: '', workingHours: '', location: '',
  employmentType: '', deadline: '', belongerPreferred: false,
  contactPerson: '', contactEmail: '', contactPhone: '',
};

export default function PostJobForm({ onSuccess }) {
  const { user } = useAuth();
  const { postJob } = useApp();
  const [form, setForm] = useState({
    ...initialForm,
    contactPerson: user ? `${user.firstName} ${user.lastName}` : '',
    contactEmail: user?.email || '',
    contactPhone: user?.phone || '',
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1=details, 2=requirements, 3=contact, 4=preview
  const [submitted, setSubmitted] = useState(false);
  const [submittedJob, setSubmittedJob] = useState(null);

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.title.trim()) e.title = 'Job title is required';
      if (!form.category) e.category = 'Select a category';
      if (!form.description || form.description.length < 50)
        e.description = 'Description must be at least 50 characters';
      if (!form.location) e.location = 'Select a location';
      if (!form.employmentType) e.employmentType = 'Select employment type';
    }
    if (s === 2) {
      if (!form.salaryMin || isNaN(form.salaryMin) || Number(form.salaryMin) <= 0)
        e.salaryMin = 'Enter a valid minimum salary';
      if (form.salaryMax && Number(form.salaryMax) < Number(form.salaryMin))
        e.salaryMax = 'Max salary must be >= min salary';
      if (!form.workingHours.trim()) e.workingHours = 'Specify working hours';
      if (!form.deadline) e.deadline = 'Application deadline is required';
      else if (new Date(form.deadline) <= new Date()) e.deadline = 'Deadline must be in the future';
    }
    if (s === 3) {
      if (!form.contactPerson.trim()) e.contactPerson = 'Contact name is required';
      if (!form.contactEmail.trim()) e.contactEmail = 'Contact email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))
        e.contactEmail = 'Enter a valid email';
      if (!form.contactPhone.trim()) e.contactPhone = 'Contact phone is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(s => s + 1); };
  const prev = () => setStep(s => s - 1);

  const handleSubmit = () => {
    const job = postJob({
      ...form,
      salaryMin: Number(form.salaryMin),
      salaryMax: form.salaryMax ? Number(form.salaryMax) : Number(form.salaryMin),
      employerId: user.id,
      employerName: user.organization || `${user.firstName} ${user.lastName}`,
    });
    setSubmittedJob(job);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Posted Successfully!</h2>
        <p className="text-gray-600 mb-1">Job Number: <span className="font-semibold text-[#003366]">{submittedJob?.jobNumber}</span></p>
        <p className="text-gray-600 mb-6">Your job listing is now live and visible to job seekers.</p>
        <div className="flex gap-3 justify-center">
          <button className="btn-primary" onClick={() => { setForm({ ...initialForm }); setStep(1); setSubmitted(false); }}>
            Post Another Job
          </button>
          {onSuccess && (
            <button className="btn-outline" onClick={() => onSuccess(submittedJob)}>View My Jobs</button>
          )}
        </div>
      </div>
    );
  }

  const ErrorMsg = ({ field }) => errors[field] ? (
    <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors[field]}</p>
  ) : null;

  const stepLabels = ['Job Details', 'Compensation', 'Contact', 'Preview'];

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
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="section-title flex items-center gap-2"><Briefcase className="w-5 h-5 text-[#003366]" />Job Details</h3>

            <div>
              <label className="label-field">Job Title *</label>
              <input className="input-field" placeholder="e.g., Senior Accountant" value={form.title}
                onChange={e => set('title', e.target.value)} />
              <ErrorMsg field="title" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Category *</label>
                <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
                  <option value="">Select category</option>
                  {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ErrorMsg field="category" />
              </div>
              <div>
                <label className="label-field">Employment Type *</label>
                <select className="input-field" value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
                  <option value="">Select type</option>
                  {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ErrorMsg field="employmentType" />
              </div>
            </div>

            <div>
              <label className="label-field">Location (Island) *</label>
              <select className="input-field" value={form.location} onChange={e => set('location', e.target.value)}>
                <option value="">Select island</option>
                {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              <ErrorMsg field="location" />
            </div>

            <div>
              <label className="label-field">Job Description *</label>
              <textarea className="input-field min-h-[120px]" placeholder="Describe the role, responsibilities, and expectations..."
                value={form.description} onChange={e => set('description', e.target.value)} />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <ErrorMsg field="description" />
                <span>{form.description.length}/50 min characters</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <h3 className="section-title flex items-center gap-2"><DollarSign className="w-5 h-5 text-[#003366]" />Compensation &amp; Schedule</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Minimum Salary (USD/year) *</label>
                <input type="number" className="input-field" placeholder="e.g., 30000" value={form.salaryMin}
                  onChange={e => set('salaryMin', e.target.value)} />
                <ErrorMsg field="salaryMin" />
              </div>
              <div>
                <label className="label-field">Maximum Salary (USD/year)</label>
                <input type="number" className="input-field" placeholder="e.g., 50000" value={form.salaryMax}
                  onChange={e => set('salaryMax', e.target.value)} />
                <ErrorMsg field="salaryMax" />
              </div>
            </div>

            <div>
              <label className="label-field">Working Hours *</label>
              <input className="input-field" placeholder="e.g., Monday-Friday, 8:30am-4:30pm" value={form.workingHours}
                onChange={e => set('workingHours', e.target.value)} />
              <ErrorMsg field="workingHours" />
            </div>

            <div>
              <label className="label-field">Application Deadline *</label>
              <input type="date" className="input-field" value={form.deadline}
                onChange={e => set('deadline', e.target.value)} min={new Date().toISOString().split('T')[0]} />
              <ErrorMsg field="deadline" />
            </div>

            <div>
              <label className="label-field">Requirements</label>
              <textarea className="input-field min-h-[100px]"
                placeholder="List qualifications, experience, certifications needed..."
                value={form.requirements} onChange={e => set('requirements', e.target.value)} />
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input type="checkbox" className="w-5 h-5 rounded accent-[#003366]" checked={form.belongerPreferred}
                onChange={e => set('belongerPreferred', e.target.checked)} />
              <div>
                <span className="font-medium text-[#003366]">VI Belonger / Local Preferred</span>
                <p className="text-xs text-gray-600">Preference given to British Virgin Islands Belongers</p>
              </div>
            </label>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="section-title flex items-center gap-2"><User className="w-5 h-5 text-[#003366]" />Contact Information</h3>

            <div>
              <label className="label-field">Contact Person *</label>
              <input className="input-field" value={form.contactPerson}
                onChange={e => set('contactPerson', e.target.value)} />
              <ErrorMsg field="contactPerson" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Email *</label>
                <input type="email" className="input-field" value={form.contactEmail}
                  onChange={e => set('contactEmail', e.target.value)} />
                <ErrorMsg field="contactEmail" />
              </div>
              <div>
                <label className="label-field">Phone *</label>
                <input type="tel" className="input-field" placeholder="1(284) 000-0000" value={form.contactPhone}
                  onChange={e => set('contactPhone', e.target.value)} />
                <ErrorMsg field="contactPhone" />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="section-title flex items-center gap-2"><Eye className="w-5 h-5 text-[#003366]" />Preview Job Listing</h3>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{form.title}</h4>
                  <p className="text-gray-600">{user?.organization || `${user?.firstName} ${user?.lastName}`}</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {form.employmentType}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{form.location}</span>
                <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{form.category}</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  ${Number(form.salaryMin).toLocaleString()}{form.salaryMax && Number(form.salaryMax) !== Number(form.salaryMin) ? ` - $${Number(form.salaryMax).toLocaleString()}` : ''}/yr
                </span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{form.workingHours}</span>
              </div>

              {form.belongerPreferred && (
                <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  VI Belonger Preferred
                </div>
              )}

              <div>
                <h5 className="font-semibold text-gray-800 mb-1">Description</h5>
                <p className="text-gray-700 whitespace-pre-wrap">{form.description}</p>
              </div>

              {form.requirements && (
                <div>
                  <h5 className="font-semibold text-gray-800 mb-1">Requirements</h5>
                  <p className="text-gray-700 whitespace-pre-wrap">{form.requirements}</p>
                </div>
              )}

              <div>
                <h5 className="font-semibold text-gray-800 mb-1">Application Deadline</h5>
                <p className="text-gray-700 flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(form.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              <div className="border-t pt-4">
                <h5 className="font-semibold text-gray-800 mb-2">Contact</h5>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><User className="w-4 h-4" />{form.contactPerson}</span>
                  <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{form.contactEmail}</span>
                  <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{form.contactPhone}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          {step > 1 ? (
            <button className="btn-outline" onClick={prev}><ChevronLeft className="w-4 h-4" />Back</button>
          ) : <div />}
          {step < 4 ? (
            <button className="btn-primary" onClick={next}>Next<ChevronRight className="w-4 h-4" /></button>
          ) : (
            <button className="btn-success" onClick={handleSubmit}><Send className="w-4 h-4" />Post Job</button>
          )}
        </div>
      </div>
    </div>
  );
}
