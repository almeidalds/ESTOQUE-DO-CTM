
import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  badges?: { label: string; value: string | number; color?: string }[];
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  badges = [],
  isLoading = false,
  isEmpty = false,
  emptyMessage = "Sem dados para o filtro atual",
  children,
  className = "",
  action
}) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-[#324F85] uppercase tracking-wide truncate" title={title}>
            {title}
          </h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        
        {/* Badges / Indicators */}
        {(badges.length > 0 || action) && (
          <div className="flex items-center gap-3 self-start sm:self-center">
            {badges.map((badge, idx) => (
              <div key={idx} className="flex flex-col items-end">
                <span className={`text-lg font-black leading-none ${badge.color || 'text-[#324F85]'}`}>
                  {badge.value}
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  {badge.label}
                </span>
              </div>
            ))}
            {action && <div className="pl-2 border-l border-gray-100">{action}</div>}
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="flex-1 relative w-full min-h-[250px] p-2">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2 bg-white/80 z-10">
            <Loader2 className="animate-spin text-[#324F85]" size={32} />
            <span className="text-xs font-medium">Carregando dados...</span>
          </div>
        ) : isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 gap-2">
            <div className="p-3 bg-gray-50 rounded-full">
              <AlertCircle size={24} />
            </div>
            <span className="text-sm font-medium">{emptyMessage}</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default React.memo(ChartCard);
