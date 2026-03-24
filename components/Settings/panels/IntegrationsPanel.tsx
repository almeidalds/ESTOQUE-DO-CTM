
import React from 'react';
import { AppSettings } from '../../../types';
import { UploadCloud, CheckCircle } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onUpdate: (s: Partial<AppSettings>) => void;
}

const IntegrationsPanel: React.FC<Props> = ({ settings, onUpdate }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="bg-sky-500 text-white p-2 rounded-lg"><UploadCloud size={24}/></div>
        <div>
          <h3 className="text-lg font-bold text-[#001B48]">Importação de Dados</h3>
          <p className="text-xs text-gray-500">Configurações para carga em massa via CSV/XLSX.</p>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-sky-50 rounded-xl border border-sky-100 mb-4">
         <div>
           <h4 className="font-bold text-sky-900 text-sm">Habilitar Importação de Itens</h4>
           <p className="text-xs text-sky-700">Permite que administradores carreguem planilhas de produtos.</p>
         </div>
         <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
           <input type="checkbox" checked={settings.importEnabled} onChange={() => onUpdate({ importEnabled: !settings.importEnabled })} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
           <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.importEnabled ? 'bg-sky-500' : 'bg-gray-300'}`}></label>
         </div>
      </div>

      <div className="p-4 border border-gray-200 rounded-xl">
        <h4 className="font-bold text-gray-700 mb-2">Templates de Mapeamento</h4>
        <p className="text-sm text-gray-500 mb-4">Defina como colunas de arquivos externos mapeiam para o sistema.</p>
        <button disabled className="w-full py-2 bg-gray-100 text-gray-400 rounded-lg font-bold text-sm cursor-not-allowed">
          Gerenciar Templates (Em Breve)
        </button>
      </div>
    </div>
  );
};

export default IntegrationsPanel;
