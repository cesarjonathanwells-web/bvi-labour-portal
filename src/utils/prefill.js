/**
 * Shared helpers for pre-filling permit forms from the user's registered profile
 * and from existing data in localStorage. Keeps the "we already know this, don't
 * make the user retype it" logic in one place.
 */

/**
 * Build an employer-info object from a logged-in business user.
 * Returns empty strings when the user is not a business account, so the caller
 * can safely merge it into form state without wiping out manually entered values.
 */
export function buildEmployerPrefill(user) {
  if (!user || user.portal !== 'business') {
    return {
      companyName: '', tradeLicense: '', address: '', phone: '',
      email: '', industry: '', authorizedSignatory: '', contactPerson: '',
    };
  }
  const signatory = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return {
    companyName: user.companyName || user.organization || '',
    tradeLicense: user.tradeLicense || '',
    address: user.businessAddress || user.address || '',
    phone: user.phone || '',
    email: user.email || '',
    industry: user.industry || '',
    authorizedSignatory: signatory,
    contactPerson: signatory,
  };
}

/**
 * Merge a prefill object into an existing section, preferring the existing
 * value so manually-typed or draft-restored data isn't overwritten.
 */
export function mergePrefill(existing, prefill) {
  const merged = { ...existing };
  for (const key of Object.keys(prefill)) {
    if (!merged[key] && prefill[key]) merged[key] = prefill[key];
  }
  return merged;
}

/**
 * Return permits owned by the logged-in business user, sorted newest first.
 * Used by the Renewal form "pick a permit to renew" shortcut.
 */
export function getOwnedPermits(permits, user) {
  if (!user || !permits) return [];
  return permits
    .filter(p => p.employerId === user.id || p.userId === user.id)
    .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
}

/**
 * Turn an approved permit into employee + position prefill chunks for the
 * renewal form. Splits employeeName into first/last on the first whitespace.
 */
export function permitToEmployeePrefill(permit) {
  if (!permit) return null;
  const name = permit.employeeName || '';
  const parts = name.trim().split(/\s+/);
  const fullName = name;
  return {
    employee: {
      fullName,
      nationality: permit.employeeNationality || '',
      passportNumber: permit.employeePassport || '',
      phone: permit.employeePhone || '',
      email: permit.employeeEmail || '',
      currentAddress: permit.employeeAddress || '',
      // Keep name parts available for forms that want them split
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
    },
    position: {
      jobTitle: permit.position || '',
      annualSalary: permit.salary ? String(permit.salary) : '',
      workLocation: permit.island || '',
      jobDescription: permit.jobDescription || '',
      department: permit.department || '',
    },
    currentPermit: {
      permitNumber: permit.permitNumber || '',
    },
  };
}

/**
 * Documents a user has previously uploaded, keyed by document type so forms
 * can show "re-use previous upload" chips alongside the upload slots.
 */
export function getPreviousDocuments(user) {
  if (!user) return {};
  try {
    const docs = JSON.parse(localStorage.getItem('bvi_documents') || '[]');
    const mine = docs.filter(d => d.userId === user.id);
    const byType = {};
    for (const d of mine) {
      // keep the most recent upload per type
      if (!byType[d.type] || (d.uploadedAt || '') > (byType[d.type].uploadedAt || '')) {
        byType[d.type] = d;
      }
    }
    return byType;
  } catch {
    return {};
  }
}

/**
 * Mock IRD trade-licence verification. In Phase 2 this would call the IRD
 * registry API. For the prototype we consider the licence "verified" when
 * it matches the licence on file for the signed-in business account.
 */
export function isTradeLicenceVerified(tradeLicense, user) {
  if (!tradeLicense || !user?.tradeLicense) return false;
  return tradeLicense.trim().toUpperCase() === user.tradeLicense.trim().toUpperCase();
}
