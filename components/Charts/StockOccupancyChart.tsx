
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { OccupancyData } from '../../services/dashboardDataService';
import ChartCard from './ChartCard';
import ChartTooltip from './ChartTooltip';
import { formatNumber, truncateText } from '../../utils/formatters';

interface Props {
  data: OccupancyData[];
  onBarClick?: (stockId: string) => void;
}

const StockOccupancyChart: React.FC<Props> = ({ data, onBarClick }) => {
  const totalQty = useMemo(() => data.reduce((acc, curr) => acc + curr.qty, 0), [data]);
  
  return (
    <ChartCard 
      title="Ocupação por Estoque" 
      subtitle="Volume total de itens armazenados"
      isEmpty={data.length === 0}
      badges={[{ label: 'Total', value: formatNumber(totalQty, true) }]}
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
            width={100} 
            tick={{fontSize: 11, fill: '#6B7280'}} 
            tickFormatter={(val) => truncateText(val, 15)}
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
            dataKey="qty" 
            radius={[0, 4, 4, 0]} 
            barSize={24}
            onClick={(data) => onBarClick && onBarClick(data.id)}
            cursor={onBarClick ? 'pointer' : 'default'}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.fill || '#324F85'} 
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default React.memo(StockOccupancyChart);
