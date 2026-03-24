
import React from 'react';
import * as ReportService from '../../../services/reportService';
import { Download, FileText, CalendarClock } from 'lucide-react';
import { ReportRange } from '../../../types';

const ReportsTab: React.FC = () => {
  
  const handleExport = (type: 'CSV'|'PDF', range: ReportRange, reportType: 'DONATIONS'|'LOANS') => {
    // Reusing existing generic report service but preset filters
    const filter = {
      range,
      warehouseId: 'STOCK-HELPDESK',
      category: 'ALL',
      search: ''
    };

    if (reportType === 'DONATIONS') {
        const { transactions } = ReportService.getDonationsReport(filter);
        const headers = ['Data', 'Item', 'Qtd', 'Missionário', 'Operador'];
        const rows = transactions.map(t => [
            new Date(t.timestamp).toLocaleDateString(), t.itemName, t.quantity, t.recipients?.[0]?.missionaryName || '-', t.deliveredBy || '-'
        ]);
        if (type === 'CSV') ReportService.generateCSV(`helpdesk_doacoes_${range}`, headers, rows);
        else ReportService.generatePDF(`Helpdesk Doações (${range})`, headers, rows);
    } else {
        const { loans } = ReportService.getLoansReport(filter);
        const headers = ['ID', 'Data', 'Missionário', 'Itens', 'Status'];
        const rows = loans.map(l => [
            l.id, new Date(l.createdAt).toLocaleDateString(), l.missionaryName, l.items.map(i=>i.itemName).join(', '), l.status
        ]);
        if (type === 'CSV') ReportService.generateCSV(`helpdesk_emprestimos_${range}`, headers, rows);
        else ReportService.generatePDF(`Helpdesk Empréstimos (${range})`, headers, rows);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4">
             <Download size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Doações do Dia</h3>
          <p className="text-sm text-slate-500 mb-6">Relatório detalhado de todas as saídas registradas hoje.</p>
          <div className="flex gap-2">
             <button onClick={() => handleExport('CSV', 'today', 'DONATIONS')} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">CSV</button>
             <button onClick={() => handleExport('PDF', 'today', 'DONATIONS')} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">PDF</button>
          </div>
       </div>

       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
             <CalendarClock size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Últimos 7 Dias</h3>
          <p className="text-sm text-slate-500 mb-6">Consolidado semanal de doações e entregas.</p>
          <div className="flex gap-2">
             <button onClick={() => handleExport('CSV', '7d', 'DONATIONS')} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">CSV</button>
             <button onClick={() => handleExport('PDF', '7d', 'DONATIONS')} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">PDF</button>
          </div>
       </div>

       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
             <FileText size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Empréstimos</h3>
          <p className="text-sm text-slate-500 mb-6">Lista completa de empréstimos ativos e histórico recente.</p>
          <div className="flex gap-2">
             <button onClick={() => handleExport('CSV', '30d', 'LOANS')} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">CSV</button>
             <button onClick={() => handleExport('PDF', '30d', 'LOANS')} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">PDF</button>
          </div>
       </div>
    </div>
  );
};

export default ReportsTab;
