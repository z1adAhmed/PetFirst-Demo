import React from 'react';

interface MetricCardProps {
  label: string;
  value: number | string;
  percentage?: string;
  icon?: string;
  color?: 'teal' | 'green' | 'red' | 'blue' | 'purple' | 'orange';
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  percentage,
  icon,
  color = 'teal',
}) => {
  const colorClasses = {
    teal: 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-100 text-teal-600',
    green: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 text-green-600',
    red: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-100 text-red-600',
    blue: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 text-blue-600',
    purple: 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100 text-purple-600',
    orange: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100 text-orange-600',
  };

  return (
    <div className={`p-5 rounded-2xl border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-[10px] font-black uppercase tracking-wider opacity-70">
          {label}
        </span>
      </div>
      <div className="text-3xl font-black mb-1">{value.toLocaleString()}</div>
      {percentage && (
        <div className="text-xs font-bold opacity-70">({percentage})</div>
      )}
    </div>
  );
};

export default MetricCard;
