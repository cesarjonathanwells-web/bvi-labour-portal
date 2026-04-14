import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStorage, setStorage, generateId, generatePermitNumber } from '../utils/helpers';
import { seedAll } from '../data/seedData';
import { useAuth } from './AuthContext';
import { logAudit, actorFromUser } from '../utils/auditLog';
import { CARD_KEY, newCardForPermit } from '../utils/cardLifecycle';

const AppContext = createContext(null);

const KEYS = {
  permits: 'bvi_permits', disputes: 'bvi_disputes', jobs: 'bvi_jobs',
  applications: 'bvi_applications', documents: 'bvi_documents', notifications: 'bvi_notifications',
  appeals: 'bvi_appeals', transfers: 'bvi_transfers', variations: 'bvi_variations',
  cards: CARD_KEY,
};

// Bump this key whenever seed data changes so returning browsers pick up the refresh
const SEED_FLAG = 'bvi_data_seeded_v2026_inspections';

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [permits, setPermits] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [variations, setVariations] = useState([]);
  const [cards, setCards] = useState([]);

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
    setTransfers(getStorage(KEYS.transfers) || []);
    setVariations(getStorage(KEYS.variations) || []);
    setCards(getStorage(KEYS.cards) || []);
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
      // Approval issues the digital ID card record immediately. The physical
      // card follows through the photo / print / pickup lifecycle.
      if (status === 'approved' && !cards.find(c => c.permitId === permit.id)) {
        const card = newCardForPermit(permit);
        save(KEYS.cards, setCards)([card, ...cards]);
        if (permit.userId) {
          addNotification(permit.userId, `Digital ID card issued for ${permit.permitNumber}. View it in the Worker Portal.`, 'success');
        }
        audit({
          category: 'permit', action: 'digital ID issued',
          targetType: 'card', targetId: card.id, targetLabel: card.permitNumber,
          metadata: { workerUserId: card.workerUserId },
        });
      }
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

  const addDisputeResponse = (disputeId, { responseText, supportingNotes } = {}) => {
    const now = new Date().toISOString();
    const dispute = disputes.find(d => d.id === disputeId);
    if (!dispute) return null;
    const actorId = user?.id || null;
    const actorLabel = user ? (user.companyName || user.organization || `${user.firstName || ''} ${user.lastName || ''}`.trim()) : 'Respondent';
    const nextStatus = dispute.status === 'investigating' ? 'response_received' : dispute.status;
    const timelineEntry = {
      status: 'respondent_response',
      date: now,
      note: supportingNotes ? `Respondent response received. ${supportingNotes}` : 'Respondent response received.',
      actorId,
    };
    const respondentResponse = {
      text: responseText,
      submittedAt: now,
      submittedBy: actorId,
      submittedByName: actorLabel,
      supportingNotes: supportingNotes || '',
    };
    const next = disputes.map(d => {
      if (d.id !== disputeId) return d;
      return {
        ...d,
        status: nextStatus,
        respondentResponse,
        updatedAt: now,
        timeline: [...(d.timeline || []), timelineEntry],
      };
    });
    save(KEYS.disputes, setDisputes)(next);
    const updated = next.find(d => d.id === disputeId);
    audit({
      category: 'dispute', action: 'respondent response submitted',
      targetType: 'dispute', targetId: disputeId, targetLabel: dispute.caseNumber,
      metadata: { status: nextStatus, respondent: actorLabel, length: (responseText || '').length },
    });
    if (dispute.userId) {
      addNotification(dispute.userId, `A response has been filed on dispute ${dispute.caseNumber}.`, 'info');
    }
    return updated;
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

  // PERMIT TRANSFERS (Employer A → Employer B for an existing work permit)
  const submitTransferRequest = (data) => {
    const year = new Date().getFullYear();
    const transfer = {
      ...data,
      id: generateId(),
      transferNumber: `TR-${year}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'filed',
      filedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [{ status: 'filed', date: new Date().toISOString(), note: 'Transfer request submitted' }],
    };
    const next = [transfer, ...transfers];
    save(KEYS.transfers, setTransfers)(next);
    addNotification(data.newEmployerId, `Transfer ${transfer.transferNumber} submitted for permit ${data.originalPermitNumber}.`, 'success');
    if (data.originalEmployerId && data.originalEmployerId !== data.newEmployerId) {
      addNotification(data.originalEmployerId, `A transfer request has been submitted for permit ${data.originalPermitNumber}.`, 'info');
    }
    audit({
      category: 'permit', action: 'transfer requested',
      targetType: 'transfer', targetId: transfer.id, targetLabel: transfer.transferNumber,
      metadata: { originalPermitId: data.originalPermitId, originalPermitNumber: data.originalPermitNumber, newEmployerId: data.newEmployerId },
    });
    return transfer;
  };

  const updateTransferStatus = (transferId, status, note = '', decision = null) => {
    const next = transfers.map(t => {
      if (t.id !== transferId) return t;
      return {
        ...t, status, decision,
        updatedAt: new Date().toISOString(),
        timeline: [...(t.timeline || []), { status, date: new Date().toISOString(), note }],
      };
    });
    save(KEYS.transfers, setTransfers)(next);
    const t = next.find(x => x.id === transferId);
    if (t) {
      if (t.newEmployerId) addNotification(t.newEmployerId, `Transfer ${t.transferNumber}: ${status.replace(/_/g, ' ')}.`, status === 'approved' ? 'success' : 'info');
      audit({
        category: 'permit', action: `transfer ${status}`,
        targetType: 'transfer', targetId: t.id, targetLabel: t.transferNumber,
        metadata: { status, decision, note },
      });
      // If approved, update the underlying permit with the new employer details
      if (status === 'approved' && t.originalPermitId) {
        const nextPermits = permits.map(p => p.id === t.originalPermitId
          ? {
              ...p,
              employerId: t.newEmployerId,
              employerName: t.newEmployerName,
              position: t.newPosition || p.position,
              salary: t.newSalary || p.salary,
              island: t.newWorkLocation || p.island,
              notes: `Transferred from ${t.originalEmployerName} to ${t.newEmployerName} — see transfer ${t.transferNumber}.`,
              updatedAt: new Date().toISOString(),
            }
          : p);
        save(KEYS.permits, setPermits)(nextPermits);
      }
    }
  };

  const getTransfersByUser = (userId) => transfers.filter(t => t.newEmployerId === userId || t.originalEmployerId === userId);

  // PERMIT VARIATIONS (mid-permit amendments — position, salary, location, etc.)
  const submitVariation = (data) => {
    const year = new Date().getFullYear();
    const now = new Date().toISOString();
    const variation = {
      ...data,
      id: generateId(),
      variationNumber: `VR-${year}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'filed',
      filedAt: now,
      updatedAt: now,
      timeline: [{ status: 'filed', date: now, note: 'Variation request submitted' }],
    };
    const next = [variation, ...variations];
    save(KEYS.variations, setVariations)(next);
    if (data.userId) {
      addNotification(data.userId, `Variation ${variation.variationNumber} submitted for permit ${data.permitNumber}.`, 'success');
    }
    audit({
      category: 'permit', action: 'variation submitted',
      targetType: 'variation', targetId: variation.id, targetLabel: variation.variationNumber,
      metadata: { permitId: data.permitId, permitNumber: data.permitNumber, variationType: data.variationType },
    });
    return variation;
  };

  const updateVariationStatus = (variationId, status, note = '', decision = null) => {
    const now = new Date().toISOString();
    const next = variations.map(v => {
      if (v.id !== variationId) return v;
      return {
        ...v, status, decision,
        updatedAt: now,
        timeline: [...(v.timeline || []), { status, date: now, note }],
      };
    });
    save(KEYS.variations, setVariations)(next);
    const v = next.find(x => x.id === variationId);
    if (v) {
      if (v.userId) addNotification(v.userId, `Variation ${v.variationNumber}: ${status.replace(/_/g, ' ')}.`, status === 'approved' ? 'success' : 'info');
      audit({
        category: 'permit', action: `variation ${status}`,
        targetType: 'variation', targetId: v.id, targetLabel: v.variationNumber,
        metadata: { status, decision, note, permitId: v.permitId, variationType: v.variationType },
      });
      if (status === 'approved' && v.permitId) {
        const nextPermits = permits.map(p => {
          if (p.id !== v.permitId) return p;
          const updated = { ...p, updatedAt: now };
          switch (v.variationType) {
            case 'position': updated.position = v.newValue || p.position; break;
            case 'salary': updated.salary = Number(v.newValue) || p.salary; break;
            case 'working_location': updated.island = v.newValue || p.island; break;
            case 'working_hours': updated.workingHours = v.newValue || p.workingHours; break;
            default: break;
          }
          const priorNotes = p.notes ? `${p.notes}\n` : '';
          updated.notes = `${priorNotes}Varied by ${v.variationNumber} on ${new Date(now).toLocaleDateString('en-GB')}`;
          return updated;
        });
        save(KEYS.permits, setPermits)(nextPermits);
      }
    }
  };

  const getVariationsByUser = (userId) => variations.filter(v => v.userId === userId || v.employerId === userId);

  // ─── CARDS — physical work-permit ID card lifecycle ─────────────────
  const updateCard = (cardId, mutator, auditEntry) => {
    let changed = null;
    const next = cards.map(c => {
      if (c.id !== cardId) return c;
      changed = { ...mutator(c), updatedAt: new Date().toISOString() };
      return changed;
    });
    save(KEYS.cards, setCards)(next);
    if (changed && auditEntry) {
      audit({
        category: 'permit', targetType: 'card',
        targetId: changed.id, targetLabel: changed.permitNumber,
        ...auditEntry,
      });
    }
    return changed;
  };

  const scheduleCardPhoto = (cardId, { scheduledAt, location }) => {
    const c = updateCard(cardId, (card) => ({
      ...card,
      appointment: { scheduledAt, location, status: 'scheduled' },
    }), { action: 'photo appointment scheduled', metadata: { scheduledAt, location } });
    if (c) addNotification(c.workerUserId, `Photo appointment scheduled for ${new Date(scheduledAt).toLocaleString('en-GB')}.`, 'info');
    return c;
  };

  const captureCardPhoto = (cardId, photoData) => {
    const c = updateCard(cardId, (card) => ({
      ...card,
      appointment: card.appointment ? { ...card.appointment, status: 'completed' } : { status: 'completed' },
      photo: { capturedAt: new Date().toISOString(), capturedBy: user?.id || null, photoData },
      print: { ...card.print, status: 'queued', queuedAt: new Date().toISOString() },
    }), { action: 'photo captured and queued for print' });
    if (c) addNotification(c.workerUserId, 'Your photo has been captured. Card is in the print queue.', 'info');
    return c;
  };

  const markCardPrinting = (cardId) => updateCard(cardId,
    (card) => ({ ...card, print: { ...card.print, status: 'printing' } }),
    { action: 'print started' });

  const markCardPrinted = (cardId) => updateCard(cardId,
    (card) => ({
      ...card,
      print: { ...card.print, status: 'printed', printedAt: new Date().toISOString(), printedBy: user?.id || null },
    }),
    { action: 'print completed' });

  const markCardPrintFailed = (cardId, note) => updateCard(cardId,
    (card) => ({
      ...card,
      print: {
        ...card.print,
        status: 'print_failed',
        failureCount: (card.print?.failureCount || 0) + 1,
        failureNotes: [
          ...(card.print?.failureNotes || []),
          { at: new Date().toISOString(), by: user?.id || null, note: note || 'Machine fault' },
        ],
      },
    }),
    { action: 'print failed — re-queued', metadata: { note } });

  const markCardReadyForPickup = (cardId, { channels = [], location } = {}) => {
    const c = updateCard(cardId, (card) => ({
      ...card,
      print: { ...card.print, status: 'ready_for_pickup' },
      collection: { ...(card.collection || {}), location: location || card.collection?.location || 'road_town' },
      notifications: {
        readyNotifiedAt: new Date().toISOString(),
        channels,
      },
    }), { action: 'marked ready for pickup', metadata: { channels, location } });
    if (c) addNotification(c.workerUserId, 'Your physical work permit ID card is ready for collection. Bring valid photo ID.', 'success');
    return c;
  };

  const recordCardCollection = (cardId, { idVerificationType, idReference }) => {
    const c = updateCard(cardId, (card) => ({
      ...card,
      print: { ...card.print, status: 'collected' },
      collection: {
        ...(card.collection || {}),
        collectedAt: new Date().toISOString(),
        verifiedBy: user?.id || null,
        idVerificationType,
        idReference: idReference || null,
      },
    }), { action: 'card collected', metadata: { idVerificationType } });
    if (c) addNotification(c.workerUserId, 'Your physical ID card has been collected. Thank you.', 'success');
    return c;
  };

  const getCardByPermit = (permitId) => cards.find(c => c.permitId === permitId);
  const getCardsByWorker = (userId) => cards.filter(c => c.workerUserId === userId);

  const getPermitsByUser = (userId) => permits.filter(p => p.userId === userId || p.employerId === userId);
  const getDisputesByUser = (userId) => disputes.filter(d => d.userId === userId);
  const getJobsByEmployer = (userId) => jobs.filter(j => j.employerId === userId);
  const getApplicationsByUser = (userId) => applications.filter(a => a.userId === userId);
  const getDocsByUser = (userId) => documents.filter(d => d.userId === userId);
  const getNotificationsByUser = (userId) => notifications.filter(n => n.userId === userId);

  return (
    <AppContext.Provider value={{
      permits, disputes, jobs, applications, documents, notifications, appeals, transfers, variations, cards,
      submitPermit, updatePermitStatus, fileDispute, updateDisputeStatus, addDisputeResponse,
      postJob, applyToJob, uploadDocument, markNotificationRead, addNotification,
      fileAppeal, updateAppealStatus,
      submitTransferRequest, updateTransferStatus,
      submitVariation, updateVariationStatus,
      scheduleCardPhoto, captureCardPhoto, markCardPrinting, markCardPrinted,
      markCardPrintFailed, markCardReadyForPickup, recordCardCollection,
      getCardByPermit, getCardsByWorker,
      getPermitsByUser, getDisputesByUser, getJobsByEmployer, getApplicationsByUser,
      getDocsByUser, getNotificationsByUser, getAppealsByUser, getTransfersByUser, getVariationsByUser,
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
