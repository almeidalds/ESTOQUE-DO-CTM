
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DailyOutData } from '../../services/dashboardDataService';
import ChartCard from './ChartCard';
import ChartTooltip from './ChartTooltip';
import { formatDateShort, formatNumber } from '../../utils/formatters';

interface Props {
  data: DailyOutData[];
}

const HelpdeskDailyOutChart: React.FC<Props> = ({ data }) => {
  const totalOut = useMemo(() => data.reduce((acc, curr) => acc + curr.qty, 0), [data]);

  return (
    <ChartCard 
      title="Helpdesk: Retiradas" 
      subtitle="Volume diário de saídas do estoque de suporte"
      isEmpty={data.length === 0}
      badges={[{ label: 'Total Período', value: formatNumber(totalOut, true), color: 'text-blue-600' }]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            tick={{fontSize: 10, fill: '#6B7280'}} 
            tickFormatter={formatDateShort}
            minTickGap={30}
          />
          <YAxis tick={{fontSize: 11, fill: '#6B7280'}} />
          <Tooltip 
            cursor={{fill: '#F3F4F6'}}
            content={
              <ChartTooltip 
                labelFormatter={formatDateShort}
                valueFormatter={(v) => `${v} itens`}
              />
            }
          />
          <Bar 
            dataKey="qty" 
            name="Qtd Itens" 
            fill="#3B82F6" 
            radius={[4, 4, 0, 0]} 
            barSize={30} 
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default React.memo(HelpdeskDailyOutChart);
