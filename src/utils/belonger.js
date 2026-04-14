/**
 * Belonger / Virgin Islander status helpers.
 *
 * In the BVI, "Belonger" and "Virgin Islander" status carry legal weight
 * (Labour Code work-permit exemption, job-preference rules). In this
 * prototype the value is a self-declaration captured at registration.
 * Phase 2 will verify each declaration against the Immigration registry
 * at the time of the first work-permit application.
 *
 * This module fakes that verification with a deterministic result per
 * user id, so repeated calls return the same answer and demos are
 * consistent across reloads.
 */

export const BELONGER_STATUSES = {
  virgin_islander:    { label: 'Virgin Islander (Born)', tone: 'blue' },
  belonger:           { label: 'Belonger',               tone: 'blue' },
  permanent_resident: { label: 'Permanent Resident',     tone: 'gray' },
  work_permit_holder: { label: 'Work Permit Holder',     tone: 'gray' },
  other:              { label: 'Other / Not Applicable', tone: 'gray' },
};

/**
 * Simple deterministic string hash (djb2-style). Returns a non-negative int.
 */
function hashString(str) {
  let hash = 5381;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    // hash * 33 + c
    hash = ((hash << 5) + hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Mock verification against the Immigration registry.
 *
 * Returns one of:
 *   'verified'       — the self-declared status is accepted
 *                      (mock: ~90% of declarations)
 *   'pending'        — verification is pending (not used by the default
 *                      deterministic mock, but exposed for future flows)
 *   'declined'       — self-declared status does not match the registry
 *                      (mock: ~10% of declarations)
 *   'not_applicable' — no status was declared
 *
 * Deterministic per user id: the same user always gets the same result.
 * Replace with a real Immigration API call in Phase 2.
 */
export function mockVerifyBelonger(user) {
  if (!user || !user.belongerStatus) return 'not_applicable';
  const status = user.belongerStatus;
  if (!Object.prototype.hasOwnProperty.call(BELONGER_STATUSES, status)) {
    return 'not_applicable';
  }

  // Seed from a stable identifier on the user. Fall back to email/name if
  // no id is present so the demo still behaves deterministically.
  const seed = user.id || user.userId || user.email || user.fullName ||
    `${user.firstName || ''}${user.lastName || ''}` || status;

  // ~10% declined, remainder verified. Pending is reserved for flows that
  // want to show an in-progress state explicitly.
  const bucket = hashString(`belonger:${seed}`) % 100;
  if (bucket < 10) return 'declined';
  return 'verified';
}

/**
 * Human-readable label for a verification state.
 */
export function belongerVerificationLabel(state) {
  switch (state) {
    case 'verified': return 'Verified (Mock)';
    case 'pending':  return 'Verification Pending';
    case 'declined': return 'Declined (Mock)';
    default:         return '';
  }
}
