import { getStatusColor, getStatusLabel } from '../../utils/helpers';

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export default function StatusBadge({ status, size = 'sm', icon: Icon }) {
  const colorClass = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium leading-tight ${
        sizeClasses[size] || sizeClasses.sm
      } ${colorClass}`}
    >
      {Icon && <Icon size={size === 'sm' ? 12 : 14} aria-hidden="true" />}
      {label}
    </span>
  );
}
