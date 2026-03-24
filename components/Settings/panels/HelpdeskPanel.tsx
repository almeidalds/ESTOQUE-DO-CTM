
import React from 'react';
import { AppSettings } from '../../../types';

interface Props {
  settings: AppSettings;
  onUpdate: (s: Partial<AppSettings>) => void;
}

const HelpdeskPanel: React.FC<Props> = ({ settings, onUpdate }) => {
  const defaults = settings.helpdeskDefaults;

  const handleChange = (field: keyof typeof defaults, value: any) => {
    onUpdate({
      helpdeskDefaults: {
        ...defaults,
        [field]: value
      }
    });
  };

  const handleShiftChange = (idx: number, field: 'name'|'start'|'end', val: string) => {
    const newShifts = [...defaults.shiftRules];
    newShifts[idx] = { ...newShifts[idx], [field]: val };
    handleChange('shiftRules', newShifts);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-[#001B48] mb-6 border-b pb-2">Padrões do Console</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Local Padrão</label>
            <input 
              value={defaults.defaultLocation}
              onChange={e => handleChange('defaultLocation', e.target.value)}
              className="w-full border rounded-lg p-3 text-sm font-bold text-gray-700"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Janela de Doação Repetida (Dias)</label>
            <input 
              type="number"
              value={defaults.repeatedDonationWindowDays}
              onChange={e => handleChange('repeatedDonationWindowDays', parseInt(e.target.value))}
              className="w-full border rounded-lg p-3 text-sm font-bold text-gray-700"
            />
            <p className="text-[10px] text-orange-500 mt-1">Exibe alerta se o missionário recebeu o mesmo item neste período.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-[#001B48] mb-6 border-b pb-2">Turnos de Trabalho</h3>
        <div className="space-y-3">
          {defaults.shiftRules.map((shift, idx) => (
            <div key={idx} className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg">
               <input 
                 value={shift.name} 
                 onChange={e => handleShiftChange(idx, 'name', e.target.value)} 
                 className="flex-1 bg-transparent font-bold text-gray-700 border-b border-gray-300 focus:border-blue-500 outline-none"
               />
               <div className="flex items-center gap-2">
                 <input type="time" value={shift.start} onChange={e => handleShiftChange(idx, 'start', e.target.value)} className="bg-white border rounded p-1 text-sm"/>
                 <span className="text-gray-400">-</span>
                 <input type="time" value={shift.end} onChange={e => handleShiftChange(idx, 'end', e.target.value)} className="bg-white border rounded p-1 text-sm"/>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpdeskPanel;
