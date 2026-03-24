
import React, { useMemo, useState } from 'react';
import { ReportFilters } from '../../types';
import * as ReportService from '../../services/reportService';
import { Download, FileText, ArrowRightLeft, PlusCircle, MinusCircle, CheckCircle } from 'lucide-react';
import { formatNumber, formatDateShort } from '../../utils/formatters';

interface Props {
  filters: ReportFilters;
}

const ReportsMovements: React.FC<Props> = ({ filters }) => {
  const { summary, transactions } = useMemo(() => ReportService.getMovementsReport(filters), [filters]);
  const [viewMode, setViewMode] = useState<'SUMMARY' | 'DETAILED'>('DETAILED');

  const handleExport = (type: 'CSV' | 'PDF') => {
    const headers = ['Data', 'Tipo', 'Item', 'Qtd', 'Origem', 'Destino', 'Usuário', 'Motivo'];
    const rows = transactions.map(t => [
       new Date(t.timestamp).toLocaleDateString(),
       t.type,
       t.itemName,
       t.quantity,
       t.fromWarehouseId || '-',
       t.toWarehouseId || '-',
       t.user,
       t.reason || '-'
    ]);

    if (type === 'CSV') {
      ReportService.generateCSV('relatorio_movimentacoes', headers, rows);
    } else {
      ReportService.generatePDF('Relatório Geral de Movimentações', headers, rows);
    }
  };

  return (
    <div className="space-y-6">
       {/* Cards Summary */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
            <div className="flex items-center gap-2 text-green-600 font-bold mb-1"><PlusCircle size={16}/> Entradas</div>
            <div className="text-2xl font-black text-slate-800">{formatNumber(summary.IN)}</div>
         </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
            <div className="flex items-center gap-2 text-red-600 font-bold mb-1"><MinusCircle size={16}/> Saídas</div>
            <div className="text-2xl font-black text-slate-800">{formatNumber(summary.OUT)}</div>
         </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 font-bold mb-1"><ArrowRightLeft size={16}/> Transf.</div>
            <div className="text-2xl font-black text-slate-800">{formatNumber(summary.TRANSFER)}</div>
         </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-100">
            <div className="flex items-center gap-2 text-yellow-600 font-bold mb-1"><CheckCircle size={16}/> Ajustes</div>
            <div className="text-2xl font-black text-slate-800">{formatNumber(summary.ADJUST)}</div>
         </div>
       </div>

       {/* List Header */}
       <div className="flex justify-between items-center">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
             <button onClick={() => setViewMode('DETAILED')} className={`px-4 py-1.5 text-sm font-bold rounded ${viewMode === 'DETAILED' ? 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}>Detalhado</button>
             {/* Summary view logic could be added here if needed separate from cards */}
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleExport('CSV')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"><Download size={16}/> CSV</button>
            <button onClick={() => handleExport('PDF')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"><FileText size={16}/> PDF</button>
          </div>
       </div>

       {/* Table */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm">
             <thead className="bg-slate-50 border-b border-gray-200">
               <tr>
                 <th className="p-3 font-bold text-slate-600">Data</th>
                 <th className="p-3 font-bold text-slate-600">Tipo</th>
                 <th className="p-3 font-bold text-slate-600">Item</th>
                 <th className="p-3 font-bold text-slate-600">Origem &#8594; Destino</th>
                 <th className="p-3 font-bold text-slate-600 text-right">Qtd</th>
                 <th className="p-3 font-bold text-slate-600">Resp.</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {transactions.map(tx => (
                 <tr key={tx.id} className="hover:bg-slate-50">
                   <td className="p-3 text-slate-600 whitespace-nowrap">{formatDateShort(tx.timestamp)}</td>
                   <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase
                        ${tx.type === 'IN' ? 'bg-green-100 text-green-700' : 
                          tx.type === 'OUT' ? 'bg-red-100 text-red-700' :
                          tx.type === 'TRANSFER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}
                      `}>{tx.type}</span>
                   </td>
                   <td className="p-3 font-medium text-slate-800">{tx.itemName}</td>
                   <td className="p-3 text-xs text-slate-500">
                     {tx.fromWarehouseId || '-'} &#8594; {tx.toWarehouseId || '-'}
                   </td>
                   <td className="p-3 text-right font-bold text-slate-800">{tx.quantity}</td>
                   <td className="p-3 text-xs text-slate-500">{tx.user}</td>
                 </tr>
               ))}
               {transactions.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Sem registros.</td></tr>}
             </tbody>
          </table>
       </div>
    </div>
  );
};

export default ReportsMovements;
