
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LoansStatusData } from '../../services/dashboardDataService';
import ChartCard from './ChartCard';
import ChartTooltip from './ChartTooltip';

interface Props {
  data: LoansStatusData[];
  onSliceClick?: (status: string) => void;
}

const LoansStatusChart: React.FC<Props> = ({ data, onSliceClick }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const overdue = data.find(d => d.name === 'Vencidos')?.value || 0;

  // Cores fixas para manter padrão visual
  const COLORS = {
    'No Prazo': '#10B981', // Emerald
    'Vencidos': '#EF4444', // Red
  };

  return (
    <ChartCard 
      title="Status Empréstimos" 
      subtitle="Monitoramento de devoluções"
      isEmpty={data.length === 0}
      emptyMessage="Sem empréstimos ativos"
      badges={[
        { label: 'Atrasados', value: overdue, color: overdue > 0 ? 'text-red-500' : 'text-gray-400' },
        { label: 'Total', value: total }
      ]}
    >
      <div className="relative w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              onClick={(d) => onSliceClick && onSliceClick(d.name === 'Vencidos' ? 'OVERDUE' : 'OPEN')}
              cursor={onSliceClick ? 'pointer' : 'default'}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name as keyof typeof COLORS] || entry.color} 
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip hideLabel />} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
           <span className="text-3xl font-black text-[#324F85]">{total}</span>
           <span className="text-[10px] text-gray-400 uppercase font-bold">Ativos</span>
        </div>
      </div>
    </ChartCard>
  );
};

export default React.memo(LoansStatusChart);
