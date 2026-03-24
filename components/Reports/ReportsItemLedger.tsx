
import React, { useMemo } from 'react';
import { ReportFilters, InventoryItem } from '../../types';
import * as ReportService from '../../services/reportService';
import { Download, FileText, ChevronLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatNumber, formatDateShort } from '../../utils/formatters';

interface Props {
  itemId: string;
  itemDetails?: InventoryItem;
  filters: ReportFilters;
  onBack: () => void;
}

const ReportsItemLedger: React.FC<Props> = ({ itemId, itemDetails, filters, onBack }) => {
  const { summary, transactions } = useMemo(() => ReportService.getItemLedger(itemId, filters), [itemId, filters]);

  const handleExport = (type: 'CSV' | 'PDF') => {
    const headers = ['Data', 'Tipo', 'Qtd', 'Origem', 'Destino', 'Motivo', 'Usuário'];
    const rows = transactions.map(t => [
       new Date(t.timestamp).toLocaleDateString(),
       t.type,
       t.quantity,
       t.fromWarehouseId || '-',
       t.toWarehouseId || '-',
       t.reason || '-',
       t.user
    ]);

    const title = `Ficha Kardex: ${itemDetails?.name || itemId}`;
    if (type === 'CSV') {
      ReportService.generateCSV('ficha_item', headers, rows);
    } else {
      ReportService.generatePDF(title, headers, rows);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white border border-gray-200 rounded-lg text-slate-500 hover:text-slate-800">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-[#324F85]">{itemDetails?.name || 'Item Desconhecido'}</h2>
          <p className="text-sm text-gray-400 font-mono">ID: {itemId} • Categoria: {itemDetails?.category}</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
         <div className="bg-white p-3 rounded-lg border border-gray-100">
           <div className="text-xs font-bold text-gray-400 uppercase">Entradas</div>
           <div className="text-xl font-bold text-green-600 flex items-center gap-1"><ArrowDownLeft size={16}/> {formatNumber(summary.inQty)}</div>
         </div>
         <div className="bg-white p-3 rounded-lg border border-gray-100">
           <div className="text-xs font-bold text-gray-400 uppercase">Saídas Totais</div>
           <div className="text-xl font-bold text-red-600 flex items-center gap-1"><ArrowUpRight size={16}/> {formatNumber(summary.outQty)}</div>
         </div>
         <div className="bg-white p-3 rounded-lg border border-gray-100">
           <div className="text-xs font-bold text-gray-400 uppercase">Doações</div>
           <div className="text-xl font-bold text-orange-600">{formatNumber(summary.donationQty)}</div>
         </div>
         <div className="bg-white p-3 rounded-lg border border-gray-100">
           <div className="text-xs font-bold text-gray-400 uppercase">Emprestados</div>
           <div className="text-xl font-bold text-blue-600">{formatNumber(summary.loanOutQty)}</div>
         </div>
         <div className="bg-white p-3 rounded-lg border border-gray-100">
           <div className="text-xs font-bold text-gray-400 uppercase">Devolvidos</div>
           <div className="text-xl font-bold text-indigo-600">{formatNumber(summary.loanReturnQty)}</div>
         </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
         <div className="text-sm font-bold text-gray-500">Histórico Detalhado</div>
         <div className="flex gap-2">
            <button onClick={() => handleExport('CSV')} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-50 rounded hover:bg-gray-100"><Download size={14}/> CSV</button>
            <button onClick={() => handleExport('PDF')} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-50 rounded hover:bg-gray-100"><FileText size={14}/> PDF</button>
         </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-gray-200">
            <tr>
              <th className="p-3 font-bold text-slate-600">Data</th>
              <th className="p-3 font-bold text-slate-600">Evento</th>
              <th className="p-3 font-bold text-slate-600 text-right">Qtd</th>
              <th className="p-3 font-bold text-slate-600">Detalhes</th>
              <th className="p-3 font-bold text-slate-600">Usuário</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-slate-50">
                <td className="p-3 text-slate-600 whitespace-nowrap">{formatDateShort(tx.timestamp)} <span className="text-xs text-gray-300">{new Date(tx.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></td>
                <td className="p-3">
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase
                     ${tx.type === 'IN' || tx.type === 'LOAN_RETURN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                   `}>{tx.type === 'LOAN_OUT' ? 'EMPRÉSTIMO' : tx.type}</span>
                </td>
                <td className="p-3 text-right font-mono font-bold text-slate-800">{tx.quantity}</td>
                <td className="p-3 text-xs text-slate-500">
                  {tx.fromWarehouseId} &#8594; {tx.toWarehouseId || 'Externo'}
                  {tx.reason && <div className="italic text-gray-400 mt-0.5">{tx.reason}</div>}
                </td>
                <td className="p-3 text-xs text-slate-500">{tx.user}</td>
              </tr>
            ))}
             {transactions.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum histórico no período.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsItemLedger;
