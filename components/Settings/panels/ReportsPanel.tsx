
import React from 'react';
import { AppSettings } from '../../../types';
import { FileText, Clock } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onUpdate: (s: Partial<AppSettings>) => void;
}

const ReportsPanel: React.FC<Props> = ({ settings, onUpdate }) => {
  return (
    <div className="animate-fade-in bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
      <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
        <FileText size={40} />
      </div>
      <h3 className="text-xl font-bold text-gray-800">Modelos de Relatórios</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Configure cabeçalhos, rodapés e agendamentos automáticos de envio por e-mail.
      </p>
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 inline-flex items-center gap-2 text-sm text-gray-600">
        <Clock size={16} /> Funcionalidade em desenvolvimento (Q3 2024)
      </div>
    </div>
  );
};

export default ReportsPanel;
