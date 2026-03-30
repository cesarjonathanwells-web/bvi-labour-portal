import { TrendingUp, TrendingDown } from 'lucide-react';

const colorMap = {
  blue: 'bg-blue-100 text-[#003366]',
  green: 'bg-green-100 text-[#006633]',
  gold: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-gray-100 text-gray-600',
  orange: 'bg-orange-100 text-orange-600',
};

export default function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color = 'blue',
  onClick,
  trend,
}) {
  const Tag = onClick ? 'button' : 'div';
  const colorClass = colorMap[color] || colorMap.blue;

  return (
    <Tag
      onClick={onClick}
      className={`bg-white rounded-xl shadow-md border border-gray-100 p-6 flex items-start gap-4 w-full text-left transition-all ${
        onClick
          ? 'cursor-pointer hover:shadow-lg hover:border-[#c5a55a]'
          : ''
      }`}
    >
      {/* Icon circle */}
      {Icon && (
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}
        >
          <Icon size={22} aria-hidden="true" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        )}
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>

        {/* Subtitle with optional trend */}
        {(subtitle || trend) && (
          <div className="flex items-center gap-1.5 mt-1">
            {trend === 'up' && (
              <TrendingUp
                size={14}
                className="text-green-600"
                aria-label="Trending up"
              />
            )}
            {trend === 'down' && (
              <TrendingDown
                size={14}
                className="text-red-500"
                aria-label="Trending down"
              />
            )}
            {subtitle && (
              <span
                className={`text-xs font-medium ${
                  trend === 'up'
                    ? 'text-green-600'
                    : trend === 'down'
                    ? 'text-red-500'
                    : 'text-gray-500'
                }`}
              >
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </Tag>
  );
}
