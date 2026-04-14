import { CheckCircle2, Clock } from 'lucide-react';
import MockBadge from '../common/MockBadge';
import { BELONGER_STATUSES, mockVerifyBelonger } from '../../utils/belonger';

/**
 * Small pill that surfaces a user's self-declared Belonger / Virgin
 * Islander status alongside a mock verification state.
 *
 * Usage:
 *   <BelongerBadge user={user} showVerificationState />
 *
 * Renders nothing if the user hasn't declared a status.
 */
export default function BelongerBadge({
  user,
  showVerificationState = false,
  className = '',
}) {
  if (!user || !user.belongerStatus) return null;
  const meta = BELONGER_STATUSES[user.belongerStatus];
  if (!meta) return null;

  const tones = {
    blue: 'bg-[#003366]/5 text-[#003366] border-[#003366]/20',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  const toneClass = tones[meta.tone] || tones.gray;

  const state = showVerificationState ? mockVerifyBelonger(user) : null;
  const Icon = state === 'verified' ? CheckCircle2
    : state === 'pending' ? Clock
    : null;

  let badgeVariant = 'phase2';
  let badgeLabel;
  let badgeTitle;
  if (state === 'verified') {
    badgeVariant = 'verified';
    badgeLabel = 'Verified (Mock)';
    badgeTitle = 'Mock verification against the Immigration registry. Phase 2 will perform a real check.';
  } else if (state === 'declined') {
    badgeVariant = 'phase2';
    badgeLabel = 'Declined (Mock)';
    badgeTitle = 'Mock result: self-declared status did not match the Immigration registry. Phase 2 will resolve this at work-permit time.';
  } else if (state === 'pending') {
    badgeVariant = 'phase2';
    badgeLabel = 'Pending';
    badgeTitle = 'Verification pending. Phase 2 integrates with the Immigration registry.';
  } else {
    badgeLabel = 'Self-declared';
    badgeTitle = 'Self-declared at registration. Phase 2 verifies against the Immigration registry.';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={badgeTitle}
    >
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${toneClass}`}
      >
        {Icon && <Icon className="w-3 h-3" aria-hidden="true" />}
        {meta.label}
      </span>
      {showVerificationState && (
        <MockBadge
          variant={badgeVariant}
          label={badgeLabel}
          title={badgeTitle}
        />
      )}
    </span>
  );
}
