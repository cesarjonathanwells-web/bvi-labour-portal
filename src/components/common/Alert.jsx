import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

const config = {
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50 border-green-200',
    iconColor: 'text-green-600',
    titleColor: 'text-green-800',
    textColor: 'text-green-700',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    textColor: 'text-red-700',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-50 border-yellow-200',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-800',
    textColor: 'text-yellow-700',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800',
    textColor: 'text-blue-700',
  },
};

export default function Alert({ type = 'info', message, title, onDismiss }) {
  const c = config[type] || config.info;
  const Icon = c.icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 border rounded-xl ${c.bg}`}
    >
      <Icon
        size={20}
        className={`${c.iconColor} shrink-0 mt-0.5`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`text-sm font-semibold ${c.titleColor}`}>{title}</p>
        )}
        {message && (
          <p className={`text-sm ${c.textColor} ${title ? 'mt-0.5' : ''}`}>
            {message}
          </p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className={`p-1 rounded ${c.textColor} hover:bg-black/5 transition-colors shrink-0`}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
