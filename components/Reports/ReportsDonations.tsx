
import React, { useMemo } from 'react';
import { ReportFilters, Transaction } from '../../types';
import * as ReportService from '../../services/reportService';
import { Download, FileText, ChevronRight } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

interface Props {
  filters: ReportFilters;
  onViewItem: (itemId: string) => void;
}

const ReportsDonations: React.FC<Props> = ({ filters, onViewItem }) => {
  const { summary, transactions } = useMemo(() => ReportService.getDonationsReport(filters), [filters]);

  const handleExport = (type: 'CSV' | 'PDF') => {
    const headers = ['Data', 'Item', 'Categoria', 'Qtd', 'Missionário', 'ID Missionário'];
    const rows = transactions.map(t => [
       new Date(t.timestamp).toLocaleDateString(),
       t.itemName,
       summary.find(s => s.itemId === t.itemId)?.category || '-',
       t.quantity,
       t.recipients?.[0]?.missionaryName || '-',
       t.recipients?.[0]?.missionaryId || '-'
    ]);

    if (type === 'CSV') {
      ReportService.generateCSV('relatorio_doacoes', headers, rows);
    } else {
      ReportService.generatePDF('Relatório de Doações', headers, rows, `Total de Itens Doados: ${formatNumber(summary.reduce((a,b)=>a+b.qty,0))}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
         <div>
           <h3 className="text-lg font-bold text-[#324F85]">Resumo de Doações</h3>
           <p className="text-sm text-gray-500">{transactions.length} registros encontrados no período.</p>
         </div>
         <div className="flex gap-2">
            <button onClick={() => handleExport('CSV')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-green-700 bg-green-50 rounded-lg hover:bg-green-100"><Download size={16}/> CSV</button>
            <button onClick={() => handleExport('PDF')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-700 bg-red-50 rounded-lg hover:bg-red-100"><FileText size={16}/> PDF</button>
         </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summary.slice(0, 3).map((item, idx) => (
          <div key={item.itemId} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
             <div>
               <div className="text-xs font-bold text-gray-400 uppercase mb-1">Top {idx+1} Item</div>
               <div className="font-bold text-[#324F85] truncate max-w-[150px]">{item.itemName}</div>
             </div>
             <div className="text-2xl font-black text-orange-500">{formatNumber(item.qty, true)}</div>
          </div>
        ))}
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-bold text-slate-600">Item</th>
              <th className="p-4 font-bold text-slate-600">Categoria</th>
              <th className="p-4 font-bold text-slate-600 text-right">Qtd Doada</th>
              <th className="p-4 font-bold text-slate-600 text-right">Transações</th>
              <th className="p-4 font-bold text-slate-600 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {summary.map(item => (
              <tr key={item.itemId} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-slate-800">{item.itemName}</div>
                  <div className="text-xs text-slate-400 font-mono">{item.itemId}</div>
                </td>
                <td className="p-4 text-slate-600">{item.category}</td>
                <td className="p-4 text-right font-bold text-orange-600">{formatNumber(item.qty)}</td>
                <td className="p-4 text-right text-slate-600">{item.count}</td>
                <td className="p-4 text-center">
                  <button onClick={() => onViewItem(item.itemId)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                    <ChevronRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {summary.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhuma doação no período.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsDonations;
