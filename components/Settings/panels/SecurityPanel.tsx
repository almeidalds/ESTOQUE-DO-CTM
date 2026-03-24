
import React from 'react';
import { AppSettings } from '../../../types';
import { ShieldCheck, Lock } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onUpdate: (s: Partial<AppSettings>) => void;
}

const SecurityPanel: React.FC<Props> = ({ settings, onUpdate }) => {
  const sec = settings.security;

  const toggle = (field: keyof typeof sec) => {
    onUpdate({
      security: { ...sec, [field]: !sec[field] }
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="bg-slate-800 text-white p-2 rounded-lg"><ShieldCheck size={24}/></div>
        <div>
          <h3 className="text-lg font-bold text-[#001B48]">Políticas de Segurança</h3>
          <p className="text-xs text-gray-500">Regras globais de bloqueio e auditoria.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
           <div>
             <h4 className="font-bold text-gray-800 text-sm">Bloquear Arquivamento com Saldo</h4>
             <p className="text-xs text-gray-500">Impede arquivar itens/estoques que possuam quantidade &gt; 0.</p>
           </div>
           <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
             <input type="checkbox" checked={sec.blockArchiveIfBalanceNonZero} onChange={() => toggle('blockArchiveIfBalanceNonZero')} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
             <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${sec.blockArchiveIfBalanceNonZero ? 'bg-green-500' : 'bg-gray-300'}`}></label>
           </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
           <div>
             <h4 className="font-bold text-gray-800 text-sm">Bloquear Arquivamento com Empréstimos</h4>
             <p className="text-xs text-gray-500">Impede arquivar itens/estoques com empréstimos em aberto.</p>
           </div>
           <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
             <input type="checkbox" checked={sec.blockArchiveIfOpenLoans} onChange={() => toggle('blockArchiveIfOpenLoans')} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
             <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${sec.blockArchiveIfOpenLoans ? 'bg-green-500' : 'bg-gray-300'}`}></label>
           </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
           <div>
             <h4 className="font-bold text-gray-800 text-sm">Exigir Motivo em Ajustes</h4>
             <p className="text-xs text-gray-500">Obrigatório preencher justificativa para transações do tipo ADJUST.</p>
           </div>
           <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
             <input type="checkbox" checked={sec.adjustRequiresReason} onChange={() => toggle('adjustRequiresReason')} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
             <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${sec.adjustRequiresReason ? 'bg-green-500' : 'bg-gray-300'}`}></label>
           </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
           <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Retenção de Logs de Auditoria (Dias)</label>
           <input 
             type="number" 
             value={sec.retainAuditLogsDays} 
             onChange={e => onUpdate({ security: { ...sec, retainAuditLogsDays: parseInt(e.target.value) } })}
             className="w-full border rounded-lg p-2 font-bold text-slate-700"
           />
        </div>
      </div>
    </div>
  );
};

export default SecurityPanel;
