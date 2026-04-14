import { useState, useRef } from 'react';
import {
  User, Camera, Save, Mail, Phone, MapPin, Building, Shield,
  FileText, AlertCircle, Check, Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePhone, fileToBase64 } from '../../utils/helpers';
import { ISLANDS, JOB_CATEGORIES, ROLES } from '../../data/constants';
import MockBadge from '../common/MockBadge';

/**
 * Export everything the system knows about the signed-in user as a JSON
 * file. Implements the prototype version of a Subject Access Request
 * under the Data Protection Act. Phase 2 will do this server-side with a
 * signed download URL and an audit entry.
 */
function exportMyData(user) {
  if (!user) return;
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } };
  const mine = {
    exportedAt: new Date().toISOString(),
    subject: {
      id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
      portal: user.portal, role: user.role, deptRole: user.deptRole,
      profile: { ...user, password: undefined },
    },
    permits: read('bvi_permits').filter(p => p.userId === user.id || p.employerId === user.id),
    disputes: read('bvi_disputes').filter(d => d.userId === user.id),
    jobs: read('bvi_jobs').filter(j => j.employerId === user.id),
    applications: read('bvi_applications').filter(a => a.userId === user.id),
    documents: read('bvi_documents').filter(d => d.userId === user.id),
    notifications: read('bvi_notifications').filter(n => n.userId === user.id),
    appeals: read('bvi_appeals').filter(a => a.userId === user.id),
    transfers: read('bvi_transfers').filter(t => t.newEmployerId === user.id || t.originalEmployerId === user.id || t.workerUserId === user.id),
  };
  const blob = new Blob([JSON.stringify(mine, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bvi-labour-${user.id}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    island: user?.island || '',
    companyName: user?.companyName || '',
    tradeLicense: user?.tradeLicense || '',
    industry: user?.industry || '',
    currentEmployer: user?.currentEmployer || '',
    permitNumber: user?.permitNumber || '',
    skills: user?.skills || '',
    educationLevel: user?.educationLevel || '',
    avatar: user?.avatar || '',
  });

  const update = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB.');
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      setForm(prev => ({ ...prev, avatar: base64 }));
    } catch {
      setError('Failed to read image.');
    }
  };

  const handleSave = () => {
    if (!form.firstName.trim()) { setError('First name is required.'); return; }
    if (!form.lastName.trim()) { setError('Last name is required.'); return; }
    if (!validateEmail(form.email)) { setError('Valid email is required.'); return; }
    if (form.phone && !validatePhone(form.phone)) { setError('Invalid phone number.'); return; }

    setSaving(true);
    setError('');
    setTimeout(() => {
      const ok = updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        island: form.island,
        companyName: form.companyName?.trim(),
        tradeLicense: form.tradeLicense?.trim(),
        industry: form.industry,
        currentEmployer: form.currentEmployer?.trim(),
        permitNumber: form.permitNumber?.trim(),
        skills: form.skills?.trim(),
        educationLevel: form.educationLevel,
        avatar: form.avatar,
      });
      setSaving(false);
      if (ok) {
        setSuccess('Profile updated successfully.');
        setEditing(false);
      } else {
        setError('Failed to update profile.');
      }
    }, 400);
  };

  const initials = `${(form.firstName || '')[0] || ''}${(form.lastName || '')[0] || ''}`.toUpperCase();

  const roleLabels = {
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.EMPLOYER]: 'Employer',
    [ROLES.EMPLOYEE]: 'Employee',
    [ROLES.JOBSEEKER]: 'Job Seeker',
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-4">
        <h1 className="page-title m-0">My Profile</h1>
        <button
          type="button"
          onClick={() => exportMyData(user)}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors flex-shrink-0"
          title="Download everything the system knows about you as a JSON file"
        >
          <Download size={12} /> Export my data
          <MockBadge variant="phase2" label="DPA" title="Subject Access Request — Phase 2 will add PDF export and email delivery." />
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <Check size={18} className="flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="card">
        {/* Avatar area */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-[#003366] flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
              {form.avatar ? (
                <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initials || <User size={32} />
              )}
            </div>
            {editing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera size={20} className="text-white" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-800">{form.firstName} {form.lastName}</h2>
            <p className="text-sm text-gray-500">{form.email}</p>
            <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-[#003366] bg-blue-50 px-3 py-1 rounded-full">
              <Shield size={12} /> {roleLabels[user?.role] || user?.role}
            </span>
          </div>
          <div className="sm:ml-auto">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-outline text-sm px-4 py-2">
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setEditing(false); setError(''); setSuccess(''); }} className="btn-outline text-sm px-4 py-2">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-4 py-2">
                  {saving ? 'Saving...' : <><Save size={14} /> Save</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info sections */}
        <div className="pt-6 space-y-6">
          {/* Personal Info */}
          <section>
            <h3 className="section-title flex items-center gap-2"><User size={18} /> Personal Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field">First Name</label>
                {editing ? (
                  <input className="input-field" value={form.firstName} onChange={update('firstName')} />
                ) : (
                  <p className="text-sm text-gray-800 py-2.5">{form.firstName || '-'}</p>
                )}
              </div>
              <div>
                <label className="label-field">Last Name</label>
                {editing ? (
                  <input className="input-field" value={form.lastName} onChange={update('lastName')} />
                ) : (
                  <p className="text-sm text-gray-800 py-2.5">{form.lastName || '-'}</p>
                )}
              </div>
              <div>
                <label className="label-field flex items-center gap-1"><Mail size={12} /> Email</label>
                {editing ? (
                  <input className="input-field" type="email" value={form.email} onChange={update('email')} />
                ) : (
                  <p className="text-sm text-gray-800 py-2.5">{form.email || '-'}</p>
                )}
              </div>
              <div>
                <label className="label-field flex items-center gap-1"><Phone size={12} /> Phone</label>
                {editing ? (
                  <input className="input-field" type="tel" value={form.phone} onChange={update('phone')} />
                ) : (
                  <p className="text-sm text-gray-800 py-2.5">{form.phone || '-'}</p>
                )}
              </div>
              <div>
                <label className="label-field flex items-center gap-1"><MapPin size={12} /> Island</label>
                {editing ? (
                  <select className="input-field" value={form.island} onChange={update('island')}>
                    <option value="">Select island...</option>
                    {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                ) : (
                  <p className="text-sm text-gray-800 py-2.5">{form.island || '-'}</p>
                )}
              </div>
            </div>
          </section>

          {/* Role-specific */}
          {user?.role === ROLES.EMPLOYER && (
            <section>
              <h3 className="section-title flex items-center gap-2"><Building size={18} /> Employer Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Company Name</label>
                  {editing ? (
                    <input className="input-field" value={form.companyName} onChange={update('companyName')} />
                  ) : (
                    <p className="text-sm text-gray-800 py-2.5">{form.companyName || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="label-field">Trade Licence #</label>
                  {editing ? (
                    <input className="input-field" value={form.tradeLicense} onChange={update('tradeLicense')} />
                  ) : (
                    <p className="text-sm text-gray-800 py-2.5">{form.tradeLicense || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="label-field">Industry</label>
                  {editing ? (
                    <select className="input-field" value={form.industry} onChange={update('industry')}>
                      <option value="">Select...</option>
                      {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-800 py-2.5">{form.industry || '-'}</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {user?.role === ROLES.EMPLOYEE && (
            <section>
              <h3 className="section-title flex items-center gap-2"><FileText size={18} /> Employment Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Current Employer</label>
                  {editing ? (
                    <input className="input-field" value={form.currentEmployer} onChange={update('currentEmployer')} />
                  ) : (
                    <p className="text-sm text-gray-800 py-2.5">{form.currentEmployer || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="label-field">Permit Number</label>
                  {editing ? (
                    <input className="input-field" value={form.permitNumber} onChange={update('permitNumber')} />
                  ) : (
                    <p className="text-sm text-gray-800 py-2.5">{form.permitNumber || '-'}</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {user?.role === ROLES.JOBSEEKER && (
            <section>
              <h3 className="section-title flex items-center gap-2"><FileText size={18} /> Career Profile</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label-field">Skills</label>
                  {editing ? (
                    <textarea className="input-field min-h-[60px]" value={form.skills} onChange={update('skills')} />
                  ) : (
                    <p className="text-sm text-gray-800 py-2.5">{form.skills || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="label-field">Education Level</label>
                  {editing ? (
                    <select className="input-field" value={form.educationLevel} onChange={update('educationLevel')}>
                      <option value="">Select...</option>
                      {['High School / Secondary', 'Associate Degree', "Bachelor's Degree", "Master's Degree", 'Doctorate / PhD', 'Trade / Vocational Certificate', 'Other'].map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-800 py-2.5">{form.educationLevel || '-'}</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Account info */}
          <section>
            <h3 className="section-title flex items-center gap-2"><Shield size={18} /> Account Information</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="label-field">Account ID</label>
                <p className="text-gray-800 py-2.5 font-mono text-xs">{user?.id || '-'}</p>
              </div>
              <div>
                <label className="label-field">Member Since</label>
                <p className="text-gray-800 py-2.5">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
