
import React, { useMemo } from 'react';
import { ReportFilters } from '../../types';
import * as ReportService from '../../services/reportService';
import { Download, FileText, Share2, AlertTriangle, Check } from 'lucide-react';
import { formatNumber, formatDateShort } from '../../utils/formatters';

interface Props {
  filters: ReportFilters;
}

const ReportsLoans: React.FC<Props> = ({ filters }) => {
  const { summary, loans } = useMemo(() => ReportService.getLoansReport(filters), [filters]);

  const handleExport = (type: 'CSV' | 'PDF') => {
    const headers = ['ID', 'Criado', 'Vencimento', 'Missionário', 'Item', 'Qtd', 'Status'];
    const rows = loans.map(l => [
       l.id,
       new Date(l.createdAt).toLocaleDateString(),
       new Date(l.dueAt).toLocaleDateString(),
       l.missionaryName,
       l.items.map(i => i.itemName).join(', '),
       l.items.map(i => i.qtyLoaned).reduce((a,b)=>a+b,0),
       l.status
    ]);

    if (type === 'CSV') {
      ReportService.generateCSV('relatorio_emprestimos', headers, rows);
    } else {
      ReportService.generatePDF('Relatório de Empréstimos', headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
         <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 font-bold mb-1"><Share2 size={16}/> Abertos</div>
            <div className="text-2xl font-black text-slate-800">{formatNumber(summary.OPEN)}</div>
         </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
            <div className="flex items-center gap-2 text-red-600 font-bold mb-1"><AlertTriangle size={16}/> Atrasados</div>
            <div className="text-2xl font-black text-slate-800">{formatNumber(summary.OVERDUE)}</div>
         </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
            <div className="flex items-center gap-2 text-green-600 font-bold mb-1"><Check size={16}/> Devolvidos</div>
            <div className="text-2xl font-black text-slate-800">{formatNumber(summary.CLOSED)}</div>
         </div>
      </div>

      <div className="flex justify-end gap-2">
         <button onClick={() => handleExport('CSV')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"><Download size={16}/> CSV</button>
         <button onClick={() => handleExport('PDF')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"><FileText size={16}/> PDF</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <table className="w-full text-left text-sm">
           <thead className="bg-slate-50 border-b border-gray-200">
             <tr>
               <th className="p-3 font-bold text-slate-600">ID / Data</th>
               <th className="p-3 font-bold text-slate-600">Missionário</th>
               <th className="p-3 font-bold text-slate-600">Itens</th>
               <th className="p-3 font-bold text-slate-600">Vencimento</th>
               <th className="p-3 font-bold text-slate-600 text-center">Status</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-50">
             {loans.map(loan => (
               <tr key={loan.id} className="hover:bg-slate-50">
                 <td className="p-3">
                   <div className="font-mono text-xs text-slate-400">{loan.id}</div>
                   <div className="text-slate-600">{formatDateShort(loan.createdAt)}</div>
                 </td>
                 <td className="p-3 font-medium text-slate-800">{loan.missionaryName}</td>
                 <td className="p-3">
                   {loan.items.map(i => (
                     <div key={i.itemId} className="text-xs text-slate-600">
                       {i.itemName} (x{i.qtyLoaned})
                     </div>
                   ))}
                 </td>
                 <td className="p-3 text-slate-600">{formatDateShort(loan.dueAt)}</td>
                 <td className="p-3 text-center">
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase
                     ${loan.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 
                       loan.status === 'CLOSED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                   `}>{loan.status}</span>
                 </td>
               </tr>
             ))}
              {loans.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Sem registros.</td></tr>}
           </tbody>
         </table>
      </div>
    </div>
  );
};

export default ReportsLoans;
