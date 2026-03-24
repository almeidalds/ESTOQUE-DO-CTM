
import React, { useState, useMemo } from 'react';
import * as HelpdeskProfileService from '../../../services/helpdeskProfileService';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import LoanReturnModal from '../../../components/LoanReturnModal';
import { User, Loan } from '../../../types';
import { Search, Clock, CheckCircle, AlertTriangle, Share2 } from 'lucide-react';

interface Props {
  currentUser: User;
  onRefresh: () => void;
}

const LoansTab: React.FC<Props> = ({ currentUser, onRefresh }) => {
  const [filter, setFilter] = useState<'OPEN' | 'OVERDUE' | 'CLOSED' | 'ALL'>('OPEN');
  const [search, setSearch] = useState('');
  const [loanToReturn, setLoanToReturn] = useState<Loan | null>(null);

  const loans = useMemo(() => {
    let list = HelpdeskProfileService.getHelpdeskLoans(filter === 'ALL' ? 'ALL' : filter as any);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(l => l.missionaryName.toLowerCase().includes(s) || l.items.some(i => i.itemName.toLowerCase().includes(s)));
    }
    return list;
  }, [filter, search]);

  const handleReturnSuccess = () => {
    setLoanToReturn(null);
    onRefresh(); // Trigger parent refresh to update stats
    // Ideally force re-render of this component's data too, but simplified here via useMemo dependency
    window.location.reload(); // Hard refresh to ensure consistency for prototype
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm justify-between">
         <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
            {(['OPEN', 'OVERDUE', 'CLOSED', 'ALL'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === f ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {f === 'OPEN' ? 'Abertos' : f === 'OVERDUE' ? 'Atrasados' : f === 'CLOSED' ? 'Devolvidos' : 'Todos'}
              </button>
            ))}
         </div>
         <div className="relative md:w-64">
            <Search size={16} className="absolute left-3 top-3 text-slate-400"/>
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar empréstimo..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
            />
         </div>
      </div>

      {/* Table */}
      {loans.length === 0 ? (
        <EmptyState title="Nenhum empréstimo encontrado" description="Nenhum registro corresponde aos filtros selecionados." icon={Share2} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-xs">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Missionário</th>
                <th className="px-6 py-4">Item(s)</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loans.map(loan => {
                const isOverdue = loan.status === 'OPEN' && new Date(loan.dueAt) < new Date();
                return (
                  <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      {loan.status === 'CLOSED' && <Badge variant="success">Devolvido</Badge>}
                      {loan.status === 'OPEN' && !isOverdue && <Badge variant="info">Aberto</Badge>}
                      {(loan.status === 'OVERDUE' || isOverdue) && loan.status !== 'CLOSED' && <Badge variant="danger">Atrasado</Badge>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{loan.missionaryName}</div>
                      <div className="text-xs text-slate-400 font-mono">ID: {loan.missionaryId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <ul className="space-y-1">
                        {loan.items.map(i => (
                          <li key={i.itemId} className="text-xs text-slate-600 flex justify-between gap-4">
                            <span>{i.itemName}</span>
                            <span className="font-mono font-bold">{i.qtyReturned}/{i.qtyLoaned}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-medium flex items-center gap-1 ${isOverdue && loan.status !== 'CLOSED' ? 'text-red-600' : 'text-slate-600'}`}>
                        <Clock size={14}/> {new Date(loan.dueAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {loan.status !== 'CLOSED' && (
                        <button 
                          onClick={() => setLoanToReturn(loan)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                        >
                          Devolver
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {loanToReturn && (
        <LoanReturnModal 
          loan={loanToReturn} 
          currentUser={currentUser} 
          onClose={() => setLoanToReturn(null)} 
          onSuccess={handleReturnSuccess} 
        />
      )}
    </div>
  );
};

export default LoansTab;
