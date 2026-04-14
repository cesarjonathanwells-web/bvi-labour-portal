import { Info } from 'lucide-react';

/**
 * Standardised label for any screen, field, or value whose behaviour is
 * simulated in this prototype. Reviewers can immediately see which parts of
 * the system are real UI vs placeholders for Phase 2 integrations.
 *
 * Variants:
 *   - "mock"     — gray: data is fake, no integration happens
 *   - "phase2"   — amber: integration planned for Phase 2
 *   - "verified" — green with dashed border: a positive result produced by a mock check
 */
export default function MockBadge({ variant = 'mock', label, title, className = '' }) {
  const variants = {
    mock: 'bg-gray-100 text-gray-700 border border-gray-300',
    phase2: 'bg-amber-50 text-amber-800 border border-amber-300',
    verified: 'bg-green-50 text-green-800 border border-dashed border-green-400',
  };
  const defaultLabel = {
    mock: 'Mock',
    phase2: 'Phase 2',
    verified: 'Verified (Mock)',
  }[variant];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${variants[variant]} ${className}`}
      title={title || 'This is a demonstration. Real integration is scheduled for Phase 2.'}
    >
      <Info className="w-2.5 h-2.5" />
      {label || defaultLabel}
    </span>
  );
}
