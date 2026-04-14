/**
 * Card lifecycle helpers. Mirrors the state machine documented in the
 * Card Management UI: permit approval issues a digital ID immediately,
 * then the physical card follows through photo → print → pickup.
 *
 * Phase 2 replaces the localStorage store with a server-side record and
 * adds real email / SMS / phone delivery.
 */

export const CARD_KEY = 'bvi_cards';

export const PHOTO_STATUS = {
  scheduled: { label: 'Scheduled', cls: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Captured', cls: 'bg-green-100 text-green-800' },
  missed:    { label: 'Missed',    cls: 'bg-amber-100 text-amber-800' },
};

export const PRINT_STATUS = {
  not_started:     { label: 'Awaiting photo',     cls: 'bg-gray-100 text-gray-700' },
  queued:          { label: 'Queued for print',   cls: 'bg-blue-100 text-blue-800' },
  printing:        { label: 'Printing',           cls: 'bg-purple-100 text-purple-800' },
  printed:         { label: 'Printed',            cls: 'bg-indigo-100 text-indigo-800' },
  print_failed:    { label: 'Print failed',       cls: 'bg-red-100 text-red-800' },
  ready_for_pickup:{ label: 'Ready for pickup',   cls: 'bg-emerald-100 text-emerald-800' },
  collected:       { label: 'Collected',          cls: 'bg-green-100 text-green-800' },
};

export const PICKUP_LOCATIONS = [
  { id: 'road_town',      label: 'DLWD Office — Road Town, Tortola' },
  { id: 'virgin_gorda',   label: 'DLWD Satellite — Virgin Gorda' },
];

export const ID_VERIFICATION_TYPES = [
  { id: 'passport',         label: 'Passport' },
  { id: 'driving_licence',  label: 'Driving licence' },
  { id: 'voter_card',       label: 'Voter registration card' },
  { id: 'other',            label: 'Other government-issued ID' },
];

/** Is the card currently on the physical-production path? */
export function isInPrintPipeline(card) {
  if (!card) return false;
  return ['queued', 'printing', 'printed', 'print_failed'].includes(card?.print?.status);
}

/** Build a fresh card record when a permit is approved. */
export function newCardForPermit(permit) {
  return {
    id: `card-${permit.id}`,
    permitId: permit.id,
    permitNumber: permit.permitNumber,
    workerUserId: permit.userId,
    workerName: permit.employeeName,
    employerName: permit.employerName,
    digitalIssuedAt: new Date().toISOString(),
    appointment: null,
    photo: null,
    print: { status: 'not_started', failureCount: 0, failureNotes: [] },
    notifications: { readyNotifiedAt: null, channels: [] },
    collection: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Preview copy for the three channels the "ready for pickup" notification fires on. */
export function buildReadyForPickupPreview(card, deptInfo) {
  const first = (card.workerName || '').split(/\s+/)[0] || 'Applicant';
  const phone = deptInfo?.phone || '';
  const address = deptInfo?.address || 'DLWD Office, Road Town';
  const hours = deptInfo?.hours || 'Monday – Friday, 8:30 a.m. to 4:30 p.m.';
  const pickupLoc = (PICKUP_LOCATIONS.find(l => l.id === card?.collection?.location)
    || PICKUP_LOCATIONS[0]).label;

  const email = {
    from: 'labour@gov.vg',
    subject: `Your BVI Work Permit ID Card is Ready — ${card.permitNumber}`,
    body:
`Dear ${first},

Your physical work permit ID card is ready for collection at:

${pickupLoc}
${address}

Office hours: ${hours}

When collecting, please bring a valid government-issued photo identification (passport, driving licence, or voter registration card) for verification.

Your digital ID card remains valid in the BVI Labour Portal.

Department of Labour and Workforce Development
${phone}`,
  };

  const sms = `BVI Labour: Your ID card (${card.permitNumber}) is ready for pickup at ${pickupLoc.split(' — ')[1] || pickupLoc}. Bring valid photo ID. Hours: ${hours}.`;

  const inApp = `Your work permit ID card is ready for collection. Bring valid photo ID to ${pickupLoc}.`;

  const phoneScript = `Hello ${first}, this is the Department of Labour and Workforce Development calling to let you know your work permit ID card is ready for collection at ${pickupLoc}. Our hours are ${hours}. Please bring a government-issued photo ID. Thank you.`;

  return { email, sms, inApp, phoneScript };
}
