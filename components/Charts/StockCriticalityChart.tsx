
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CriticalityData } from '../../services/dashboardDataService';
import ChartCard from './ChartCard';
import ChartTooltip from './ChartTooltip';
import { formatNumber, truncateText } from '../../utils/formatters';

interface Props {
  data: CriticalityData[];
  onBarClick?: (stockId: string, type: 'CRITICAL' | 'EXCESS') => void;
}

const StockCriticalityChart: React.FC<Props> = ({ data, onBarClick }) => {
  const { totalLow, totalHigh } = useMemo(() => {
    return data.reduce((acc, curr) => ({
      totalLow: acc.totalLow + curr.low,
      totalHigh: acc.totalHigh + curr.high
    }), { totalLow: 0, totalHigh: 0 });
  }, [data]);

  return (
    <ChartCard 
      title="Criticidade dos Níveis" 
      subtitle="Itens abaixo do mínimo ou acima do máximo"
      isEmpty={data.length === 0}
      badges={[
        { label: 'Crítico', value: totalLow, color: 'text-red-500' },
        { label: 'Excesso', value: totalHigh, color: 'text-orange-500' }
      ]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            tick={{fontSize: 10, fill: '#6B7280'}} 
            tickFormatter={(val) => truncateText(val, 12)}
            interval={0} 
          />
          <YAxis tick={{fontSize: 11, fill: '#6B7280'}} />
          <Tooltip 
             cursor={{fill: '#F3F4F6'}}
             content={<ChartTooltip />}
          />
          <Legend 
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
            iconType="circle"
          />
          <Bar 
            dataKey="low" 
            name="Crítico (Baixo)" 
            stackId="a" 
            fill="#EF4444" 
            onClick={(d) => onBarClick && onBarClick(d.id, 'CRITICAL')}
            cursor={onBarClick ? 'pointer' : 'default'}
          />
          <Bar 
            dataKey="high" 
            name="Excesso" 
            stackId="a" 
            fill="#F97316" 
            onClick={(d) => onBarClick && onBarClick(d.id, 'EXCESS')}
            cursor={onBarClick ? 'pointer' : 'default'}
          />
          <Bar 
            dataKey="ok" 
            name="Normal" 
            stackId="a" 
            fill="#10B981" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default React.memo(StockCriticalityChart);
