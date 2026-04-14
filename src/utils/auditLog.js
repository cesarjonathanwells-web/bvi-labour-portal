/**
 * Demo audit log. Persists state-changing actions to localStorage so the
 * Commissioner has a visible record of who did what, when. Phase 2 will
 * replace this with a server-side immutable log exportable for the
 * Auditor General and Internal Audit.
 *
 * Each entry:
 *   id, timestamp, actorId, actorName, actorRole,
 *   category ("permit" | "dispute" | "job" | "user" | "system"),
 *   action (human-readable verb, e.g. "approved", "rejected", "assigned"),
 *   targetType, targetId, targetLabel,
 *   metadata (free-form object, small)
 */

const AUDIT_KEY = 'bvi_audit_log';
const MAX_ENTRIES = 2000;

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeAll(list) {
  try {
    const trimmed = list.slice(0, MAX_ENTRIES);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(trimmed));
  } catch {
    /* storage full — drop silently in the prototype */
  }
}

/**
 * Record one audit entry. Safe to call without an actor — unknown actors are
 * recorded as "system". Callers shouldn't fear this throwing.
 */
export function logAudit(entry) {
  try {
    const now = new Date().toISOString();
    const fresh = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: now,
      actorId: entry.actorId || null,
      actorName: entry.actorName || 'System',
      actorRole: entry.actorRole || null,
      category: entry.category || 'system',
      action: entry.action || 'event',
      targetType: entry.targetType || null,
      targetId: entry.targetId || null,
      targetLabel: entry.targetLabel || null,
      metadata: entry.metadata || {},
    };
    const list = readAll();
    list.unshift(fresh);
    writeAll(list);
    return fresh;
  } catch {
    return null;
  }
}

export function getAuditLog({ category, actorId, limit, since } = {}) {
  let list = readAll();
  if (category) list = list.filter(e => e.category === category);
  if (actorId) list = list.filter(e => e.actorId === actorId);
  if (since) list = list.filter(e => e.timestamp >= since);
  if (typeof limit === 'number') list = list.slice(0, limit);
  return list;
}

export function clearAuditLog() {
  localStorage.removeItem(AUDIT_KEY);
}

/** Helper: build an actor snapshot from an auth user object. */
export function actorFromUser(user) {
  if (!user) return { actorId: null, actorName: 'Anonymous', actorRole: null };
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'User';
  return {
    actorId: user.id,
    actorName: name,
    actorRole: user.deptRole || user.portal || user.role || null,
  };
}
