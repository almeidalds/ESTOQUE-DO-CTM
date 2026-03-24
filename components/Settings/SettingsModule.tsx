
import React, { useState, useEffect } from 'react';
import { User, AppSettings, Warehouse } from '../../types';
import * as SettingsService from '../../services/settingsService';
import { 
  ArrowLeft, Settings, Database, MapPin, List, LifeBuoy, 
  ShieldCheck, AlertTriangle, FileText, UploadCloud 
} from 'lucide-react';

// Sub-Pages
import StocksPanel from './panels/StocksPanel';
import LocationsPanel from './panels/LocationsPanel';
import CatalogPanel from './panels/CatalogPanel';
import HelpdeskPanel from './panels/HelpdeskPanel';
import SecurityPanel from './panels/SecurityPanel';
import ReportsPanel from './panels/ReportsPanel';
import IntegrationsPanel from './panels/IntegrationsPanel';

interface Props {
  currentUser: User;
  warehouses: Warehouse[];
  onBack: () => void;
  onUpdateWarehouses: (w: Warehouse[]) => void;
}

type SettingsTab = 'HOME' | 'STOCKS' | 'LOCATIONS' | 'CATALOG' | 'HELPDESK' | 'SECURITY' | 'REPORTS' | 'INTEGRATIONS';

const SettingsModule: React.FC<Props> = ({ currentUser, warehouses, onBack, onUpdateWarehouses }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('HOME');
  const [settings, setSettings] = useState<AppSettings>(SettingsService.getAppSettings());

  const refreshSettings = () => {
    setSettings(SettingsService.getAppSettings());
  };

  const handleUpdateSettings = async (partial: Partial<AppSettings>) => {
    try {
      await SettingsService.updateAppSettings(partial, currentUser);
      refreshSettings();
      alert('Configurações salvas com sucesso!');
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  };

  // MENU ITEMS CONFIG
  const menuItems = [
    { id: 'STOCKS', label: 'Estoques', icon: Database, desc: 'Gerenciar armazéns, cores e arquivamento.', color: 'bg-blue-600' },
    { id: 'LOCATIONS', label: 'Localizações', icon: MapPin, desc: 'Mapeamento de prateleiras e setores.', color: 'bg-indigo-500' },
    { id: 'CATALOG', label: 'Catálogo', icon: List, desc: 'Categorias, unidades e itens restritos.', color: 'bg-teal-600' },
    { id: 'HELPDESK', label: 'Helpdesk', icon: LifeBuoy, desc: 'Regras de atendimento, turnos e favoritos.', color: 'bg-red-500' },
    { id: 'SECURITY', label: 'Segurança & Auditoria', icon: ShieldCheck, desc: 'Bloqueios, retenção de logs e regras.', color: 'bg-slate-700' },
    { id: 'REPORTS', label: 'Relatórios', icon: FileText, desc: 'Configuração de exportações e modelos.', color: 'bg-orange-500' },
    { id: 'INTEGRATIONS', label: 'Integrações', icon: UploadCloud, desc: 'Importação e mapeamento de dados.', color: 'bg-sky-500' },
  ];

  // RENDER CONTENT
  const renderContent = () => {
    switch (activeTab) {
      case 'STOCKS':
        return <StocksPanel warehouses={warehouses} onUpdate={onUpdateWarehouses} currentUser={currentUser} />;
      case 'LOCATIONS':
        return <LocationsPanel settings={settings} warehouses={warehouses} onUpdate={handleUpdateSettings} />;
      case 'CATALOG':
        return <CatalogPanel settings={settings} onUpdate={handleUpdateSettings} />;
      case 'HELPDESK':
        return <HelpdeskPanel settings={settings} onUpdate={handleUpdateSettings} />;
      case 'SECURITY':
        return <SecurityPanel settings={settings} onUpdate={handleUpdateSettings} />;
      case 'REPORTS':
        return <ReportsPanel settings={settings} onUpdate={handleUpdateSettings} />;
      case 'INTEGRATIONS':
        return <IntegrationsPanel settings={settings} onUpdate={handleUpdateSettings} />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as SettingsTab)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all text-left group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 ${item.color} shadow-md`}>
                  <item.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#001B48] group-hover:text-[#018ABE] transition-colors">{item.label}</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F0F5FA]">
      {/* Header */}
      <div className="px-8 py-6 bg-white border-b border-gray-200 flex items-center gap-4 sticky top-0 z-20">
        <button 
          onClick={() => activeTab === 'HOME' ? onBack() : setActiveTab('HOME')} 
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#001B48] flex items-center gap-2">
            <Settings className="text-[#018ABE]" /> 
            Configurações
            {activeTab !== 'HOME' && <span className="text-slate-400 font-medium text-lg">/ {menuItems.find(m => m.id === activeTab)?.label}</span>}
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Painel de Controle do Sistema</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;
