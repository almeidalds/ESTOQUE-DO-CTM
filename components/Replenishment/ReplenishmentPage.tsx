
import React, { useMemo } from 'react';
import { InventoryItem, Warehouse } from '../../types';
import * as ReplenishmentService from '../../services/replenishmentService';
import * as ReportService from '../../services/reportService';
import { ShoppingCart, AlertTriangle, CheckCircle, Download, TrendingUp, FileText } from 'lucide-react';

interface Props {
  items: InventoryItem[];
  warehouses: Warehouse[];
}

const ReplenishmentPage: React.FC<Props> = ({ items, warehouses }) => {
  const suggestions = useMemo(() => ReplenishmentService.calculateReplenishment(items, warehouses), [items, warehouses]);

  const handleExport = (type: 'CSV' | 'PDF') => {
    const headers = ['Item', 'Estoque', 'Atual', 'Média/Dia', 'Sugestão', 'Status'];
    const rows = suggestions.map(s => [
      s.itemName,
      s.warehouseName,
      s.currentQty,
      s.avgDailyConsumption.toFixed(2),
      s.suggestedQty,
      s.status
    ]);

    if (type === 'PDF') {
      ReportService.generatePDF('Sugestão de Reposição de Estoque', headers, rows, `Gerado em: ${new Date().toLocaleString()} - Total de Itens: ${suggestions.length}`);
    } else {
      ReportService.generateCSV('sugestao_compras', headers, rows);
    }
  };

  return (
    <div className="p-6 animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#001B48] flex items-center gap-2">
            <ShoppingCart className="text-[#018ABE]" /> Reposição Inteligente
          </h2>
          <p className="text-sm text-gray-500 mt-1">Análise de consumo dos últimos 30 dias + Lead Time (7 dias).</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleExport('CSV')} 
            className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            <Download size={18} /> CSV
          </button>
          <button 
            onClick={() => handleExport('PDF')} 
            className="flex items-center gap-2 px-6 py-3 bg-[#001B48] text-white rounded-xl font-bold hover:bg-[#02457A] transition-colors shadow-lg"
          >
            <FileText size={18} /> Baixar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full text-red-600"><AlertTriangle size={24}/></div>
            <div>
              <div className="text-2xl font-black text-red-700">{suggestions.filter(s => s.status === 'CRITICAL').length}</div>
              <div className="text-xs font-bold text-red-600 uppercase">Críticos (Estoque Zero)</div>
            </div>
         </div>
         <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-full text-orange-600"><TrendingUp size={24}/></div>
            <div>
              <div className="text-2xl font-black text-orange-700">{suggestions.filter(s => s.status === 'WARNING').length}</div>
              <div className="text-xs font-bold text-orange-600 uppercase">Abaixo do Nível</div>
            </div>
         </div>
         <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full text-green-600"><CheckCircle size={24}/></div>
            <div>
              <div className="text-2xl font-black text-green-700">{items.length - suggestions.length}</div>
              <div className="text-xs font-bold text-green-600 uppercase">Estoque Saudável</div>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Item</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Estoque</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Saldo Atual</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Média/Dia</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Sugestão</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {suggestions.map((s, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-700">{s.itemName}</td>
                <td className="p-4 text-slate-600">{s.warehouseName}</td>
                <td className="p-4 text-right font-mono font-bold text-slate-800">{s.currentQty}</td>
                <td className="p-4 text-right text-slate-600">{s.avgDailyConsumption.toFixed(2)}</td>
                <td className="p-4 text-right">
                  {s.suggestedQty > 0 ? (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-bold">
                      +{s.suggestedQty}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {s.status === 'CRITICAL' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Crítico</span>}
                  {s.status === 'WARNING' && <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Comprar</span>}
                  {s.status === 'OK' && <span className="text-gray-400 text-[10px] font-bold uppercase">OK</span>}
                </td>
              </tr>
            ))}
            {suggestions.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhuma sugestão gerada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReplenishmentPage;
