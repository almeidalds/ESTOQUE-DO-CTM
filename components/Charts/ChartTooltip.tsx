
import React from 'react';
import { formatNumber } from '../../utils/formatters';

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number) => string;
  hideLabel?: boolean;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ 
  active, 
  payload, 
  label, 
  labelFormatter, 
  valueFormatter,
  hideLabel = false 
}) => {
  if (active && payload && payload.length) {
    const formattedLabel = labelFormatter ? labelFormatter(label!) : label;

    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 border border-gray-100 rounded-xl shadow-lg text-sm z-50 min-w-[150px]">
        {!hideLabel && (
          <p className="font-bold text-[#324F85] mb-2 pb-1 border-b border-gray-100 text-xs uppercase tracking-wide">
            {formattedLabel}
          </p>
        )}
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            // Tenta pegar o nome da prop 'name' do payload, ou fallback
            const name = entry.name || entry.dataKey;
            const value = entry.value;
            const color = entry.fill || entry.color || '#324F85';
            
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                  {name}
                </span>
                <span className="font-bold text-[#324F85]">
                  {valueFormatter ? valueFormatter(value) : formatNumber(value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

export default React.memo(ChartTooltip);
