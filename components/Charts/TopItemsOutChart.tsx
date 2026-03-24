
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TopItemData } from '../../services/dashboardDataService';
import ChartCard from './ChartCard';
import ChartTooltip from './ChartTooltip';
import { formatNumber, truncateText } from '../../utils/formatters';

interface Props {
  data: TopItemData[];
  onBarClick?: (itemId: string) => void;
}

const TopItemsOutChart: React.FC<Props> = ({ data, onBarClick }) => {
  const totalTop10 = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);

  return (
    <ChartCard 
      title="Top 10 Saídas (Volume)" 
      subtitle="Itens com maior movimentação no período"
      isEmpty={data.length === 0}
      badges={[{ label: 'Vol. Top 10', value: formatNumber(totalTop10, true) }]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          layout="vertical" 
          data={data} 
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={140} 
            tick={{fontSize: 11, fill: '#6B7280'}} 
            tickFormatter={(val) => truncateText(val, 22)}
            interval={0} 
          />
          <Tooltip 
            cursor={{fill: '#F3F4F6'}}
            content={
              <ChartTooltip 
                valueFormatter={(val) => `${formatNumber(val)} unid.`}
              />
            }
          />
          <Bar 
            dataKey="value" 
            name="Qtd Saída" 
            radius={[0, 4, 4, 0]} 
            barSize={18} 
            fill="#8B5CF6"
            onClick={(d) => onBarClick && onBarClick(d.id)}
            cursor={onBarClick ? 'pointer' : 'default'}
          >
             {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`rgba(139, 92, 246, ${1 - (index * 0.05)})`} 
                  className="hover:opacity-80 transition-opacity"
                />
             ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default React.memo(TopItemsOutChart);
