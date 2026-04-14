import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStorage, setStorage, generateId, generatePermitNumber } from '../utils/helpers';
import { seedAll } from '../data/seedData';
import { useAuth } from './AuthContext';
import { logAudit, actorFromUser } from '../utils/auditLog';

const AppContext = createContext(null);

const KEYS = {
  permits: 'bvi_permits', disputes: 'bvi_disputes', jobs: 'bvi_jobs',
  applications: 'bvi_applications', documents: 'bvi_documents', notifications: 'bvi_notifications',
  appeals: 'bvi_appeals',
};

// Bump this key whenever seed data changes so returning browsers pick up the refresh
const SEED_FLAG = 'bvi_data_seeded_v2026';

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [permits, setPermits] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [appeals, setAppeals] = useState([]);

  /** Record an audit entry tagged with the current signed-in user. */
  const audit = useCallback((entry) => logAudit({ ...actorFromUser(user), ...entry }), [user]);

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
    setAppeals(getStorage(KEYS.appeals) || []);
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
    audit({
      category: 'permit', action: 'submitted',
      targetType: 'permit', targetId: permit.id, targetLabel: permit.permitNumber,
      metadata: { type: permit.type, employerId: permit.employerId },
    });
    return permit;
  };

  const updatePermitStatus = (permitId, status, notes = '') => {
    const next = permits.map(p => p.id === permitId ? { ...p, status, notes, updatedAt: new Date().toISOString() } : p);
    save(KEYS.permits, setPermits)(next);
    const permit = next.find(p => p.id === permitId);
    if (permit) {
      addNotification(permit.employerId || permit.userId, `Permit ${permit.permitNumber} status: ${status.replace(/_/g, ' ')}`, status === 'approved' ? 'success' : 'info');
      audit({
        category: 'permit', action: `status changed to ${status}`,
        targetType: 'permit', targetId: permit.id, targetLabel: permit.permitNumber,
        metadata: { status, notes },
      });
    }
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
    audit({
      category: 'dispute', action: 'filed',
      targetType: 'dispute', targetId: dispute.id, targetLabel: dispute.caseNumber,
      metadata: { type: dispute.type },
    });
    return dispute;
  };

  const updateDisputeStatus = (disputeId, status, note = '') => {
    const next = disputes.map(d => {
      if (d.id !== disputeId) return d;
      return { ...d, status, updatedAt: new Date().toISOString(), timeline: [...(d.timeline || []), { status, date: new Date().toISOString(), note }] };
    });
    save(KEYS.disputes, setDisputes)(next);
    const d = next.find(x => x.id === disputeId);
    if (d) {
      audit({
        category: 'dispute', action: `status changed to ${status}`,
        targetType: 'dispute', targetId: d.id, targetLabel: d.caseNumber,
        metadata: { status, note },
      });
    }
  };

  // JOBS
  const postJob = (jobData) => {
    const job = {
      ...jobData, id: generateId(), jobNumber: `JV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'open', applicants: 0, postedAt: new Date().toISOString(),
    };
    const next = [job, ...jobs];
    save(KEYS.jobs, setJobs)(next);
    audit({
      category: 'job', action: 'posted',
      targetType: 'job', targetId: job.id, targetLabel: job.jobNumber,
      metadata: { title: job.title, employerId: job.employerId },
    });
    return job;
  };

  const applyToJob = (jobId, applicationData) => {
    const app = { ...applicationData, id: generateId(), jobId, status: 'submitted', appliedAt: new Date().toISOString() };
    const nextApps = [app, ...applications];
    save(KEYS.applications, setApplications)(nextApps);
    const nextJobs = jobs.map(j => j.id === jobId ? { ...j, applicants: (j.applicants || 0) + 1 } : j);
    save(KEYS.jobs, setJobs)(nextJobs);
    const job = nextJobs.find(j => j.id === jobId);
    audit({
      category: 'job', action: 'application submitted',
      targetType: 'job', targetId: jobId, targetLabel: job?.jobNumber || jobId,
      metadata: { applicationId: app.id },
    });
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

  // APPEALS (of rejected permits)
  const fileAppeal = (appealData) => {
    const year = new Date().getFullYear();
    const appeal = {
      ...appealData,
      id: generateId(),
      appealNumber: `AP-${year}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'filed',
      filedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [{ status: 'filed', date: new Date().toISOString(), note: 'Appeal submitted' }],
    };
    const next = [appeal, ...appeals];
    save(KEYS.appeals, setAppeals)(next);
    addNotification(appealData.userId, `Appeal ${appeal.appealNumber} filed for permit ${appealData.permitNumber}.`, 'success');
    audit({
      category: 'permit', action: 'appeal filed',
      targetType: 'appeal', targetId: appeal.id, targetLabel: appeal.appealNumber,
      metadata: { permitId: appealData.permitId, permitNumber: appealData.permitNumber },
    });
    return appeal;
  };

  const updateAppealStatus = (appealId, status, note = '', decision = null) => {
    const next = appeals.map(a => {
      if (a.id !== appealId) return a;
      return {
        ...a, status, decision,
        updatedAt: new Date().toISOString(),
        timeline: [...(a.timeline || []), { status, date: new Date().toISOString(), note }],
      };
    });
    save(KEYS.appeals, setAppeals)(next);
    const a = next.find(x => x.id === appealId);
    if (a) {
      addNotification(a.userId, `Appeal ${a.appealNumber} updated: ${status.replace(/_/g, ' ')}.`, status === 'upheld' ? 'success' : 'info');
      audit({
        category: 'permit', action: `appeal ${status}`,
        targetType: 'appeal', targetId: a.id, targetLabel: a.appealNumber,
        metadata: { status, decision, note },
      });
      // If the appeal is upheld, reset the underlying permit to under_review
      if (status === 'decided' && decision === 'upheld' && a.permitId) {
        const nextPermits = permits.map(p => p.id === a.permitId
          ? { ...p, status: 'under_review', notes: `Permit re-opened for review — appeal ${a.appealNumber} upheld.`, updatedAt: new Date().toISOString() }
          : p);
        save(KEYS.permits, setPermits)(nextPermits);
      }
    }
  };

  const getAppealsByUser = (userId) => appeals.filter(a => a.userId === userId);

  const getPermitsByUser = (userId) => permits.filter(p => p.userId === userId || p.employerId === userId);
  const getDisputesByUser = (userId) => disputes.filter(d => d.userId === userId);
  const getJobsByEmployer = (userId) => jobs.filter(j => j.employerId === userId);
  const getApplicationsByUser = (userId) => applications.filter(a => a.userId === userId);
  const getDocsByUser = (userId) => documents.filter(d => d.userId === userId);
  const getNotificationsByUser = (userId) => notifications.filter(n => n.userId === userId);

  return (
    <AppContext.Provider value={{
      permits, disputes, jobs, applications, documents, notifications, appeals,
      submitPermit, updatePermitStatus, fileDispute, updateDisputeStatus,
      postJob, applyToJob, uploadDocument, markNotificationRead, addNotification,
      fileAppeal, updateAppealStatus,
      getPermitsByUser, getDisputesByUser, getJobsByEmployer, getApplicationsByUser,
      getDocsByUser, getNotificationsByUser, getAppealsByUser,
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
