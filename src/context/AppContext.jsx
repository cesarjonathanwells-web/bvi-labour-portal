import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStorage, setStorage, generateId, generatePermitNumber } from '../utils/helpers';
import { seedAll } from '../data/seedData';

const AppContext = createContext(null);

const KEYS = {
  permits: 'bvi_permits', disputes: 'bvi_disputes', jobs: 'bvi_jobs',
  applications: 'bvi_applications', documents: 'bvi_documents', notifications: 'bvi_notifications',
};

// Bump this key whenever seed data changes so returning browsers pick up the refresh
const SEED_FLAG = 'bvi_data_seeded_v2026';

export function AppProvider({ children }) {
  const [permits, setPermits] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Auto-seed mock data on first visit so dashboards aren't empty.
    // When SEED_FLAG bumps, wipe the old seeded collections so fresh ones land.
    if (!getStorage(SEED_FLAG)) {
      try {
        Object.values(KEYS).forEach(k => localStorage.removeItem(k));
        seedAll();
        setStorage(SEED_FLAG, true);
      } catch { /* ignore */ }
    }
    setPermits(getStorage(KEYS.permits) || []);
    setDisputes(getStorage(KEYS.disputes) || []);
    setJobs(getStorage(KEYS.jobs) || []);
    setApplications(getStorage(KEYS.applications) || []);
    setDocuments(getStorage(KEYS.documents) || []);
    setNotifications(getStorage(KEYS.notifications) || []);
  }, []);

  const save = (key, setter) => (data) => { setter(data); setStorage(key, data); };

  const addNotification = useCallback((userId, message, type = 'info') => {
    const n = { id: generateId(), userId, message, type, read: false, createdAt: new Date().toISOString() };
    setNotifications(prev => { const next = [n, ...prev]; setStorage(KEYS.notifications, next); return next; });
  }, []);

  // PERMITS
  const submitPermit = (permitData) => {
    const permit = {
      ...permitData, id: generateId(), permitNumber: generatePermitNumber(permitData.type),
      status: 'submitted', submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const next = [permit, ...permits];
    save(KEYS.permits, setPermits)(next);
    addNotification(permitData.employerId || permitData.userId, `Work permit ${permit.permitNumber} submitted successfully.`, 'success');
    return permit;
  };

  const updatePermitStatus = (permitId, status, notes = '') => {
    const next = permits.map(p => p.id === permitId ? { ...p, status, notes, updatedAt: new Date().toISOString() } : p);
    save(KEYS.permits, setPermits)(next);
    const permit = next.find(p => p.id === permitId);
    if (permit) addNotification(permit.employerId || permit.userId, `Permit ${permit.permitNumber} status: ${status.replace(/_/g, ' ')}`, status === 'approved' ? 'success' : 'info');
  };

  // DISPUTES
  const fileDispute = (disputeData) => {
    const dispute = {
      ...disputeData, id: generateId(), caseNumber: `DC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'filed', filedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), timeline: [{ status: 'filed', date: new Date().toISOString(), note: 'Dispute filed' }],
    };
    const next = [dispute, ...disputes];
    save(KEYS.disputes, setDisputes)(next);
    addNotification(disputeData.userId, `Dispute ${dispute.caseNumber} filed successfully.`, 'success');
    return dispute;
  };

  const updateDisputeStatus = (disputeId, status, note = '') => {
    const next = disputes.map(d => {
      if (d.id !== disputeId) return d;
      return { ...d, status, updatedAt: new Date().toISOString(), timeline: [...(d.timeline || []), { status, date: new Date().toISOString(), note }] };
    });
    save(KEYS.disputes, setDisputes)(next);
  };

  // JOBS
  const postJob = (jobData) => {
    const job = {
      ...jobData, id: generateId(), jobNumber: `JV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'open', applicants: 0, postedAt: new Date().toISOString(),
    };
    const next = [job, ...jobs];
    save(KEYS.jobs, setJobs)(next);
    return job;
  };

  const applyToJob = (jobId, applicationData) => {
    const app = { ...applicationData, id: generateId(), jobId, status: 'submitted', appliedAt: new Date().toISOString() };
    const nextApps = [app, ...applications];
    save(KEYS.applications, setApplications)(nextApps);
    const nextJobs = jobs.map(j => j.id === jobId ? { ...j, applicants: (j.applicants || 0) + 1 } : j);
    save(KEYS.jobs, setJobs)(nextJobs);
    return app;
  };

  // DOCUMENTS
  const uploadDocument = (docData) => {
    const doc = { ...docData, id: generateId(), uploadedAt: new Date().toISOString() };
    const next = [doc, ...documents];
    save(KEYS.documents, setDocuments)(next);
    return doc;
  };

  const markNotificationRead = (notifId) => {
    const next = notifications.map(n => n.id === notifId ? { ...n, read: true } : n);
    save(KEYS.notifications, setNotifications)(next);
  };

  const getPermitsByUser = (userId) => permits.filter(p => p.userId === userId || p.employerId === userId);
  const getDisputesByUser = (userId) => disputes.filter(d => d.userId === userId);
  const getJobsByEmployer = (userId) => jobs.filter(j => j.employerId === userId);
  const getApplicationsByUser = (userId) => applications.filter(a => a.userId === userId);
  const getDocsByUser = (userId) => documents.filter(d => d.userId === userId);
  const getNotificationsByUser = (userId) => notifications.filter(n => n.userId === userId);

  return (
    <AppContext.Provider value={{
      permits, disputes, jobs, applications, documents, notifications,
      submitPermit, updatePermitStatus, fileDispute, updateDisputeStatus,
      postJob, applyToJob, uploadDocument, markNotificationRead, addNotification,
      getPermitsByUser, getDisputesByUser, getJobsByEmployer, getApplicationsByUser,
      getDocsByUser, getNotificationsByUser,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
