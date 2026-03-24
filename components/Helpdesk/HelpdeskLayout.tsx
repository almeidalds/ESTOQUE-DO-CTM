
import React from 'react';
import { Package, Truck, Clock, Share2, LogOut } from 'lucide-react';

interface HelpdeskLayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userName: string;
}

const HelpdeskLayout: React.FC<HelpdeskLayoutProps> = ({ children, activePage, onNavigate, onLogout, userName }) => {
  const menuItems = [
    { id: 'home', label: 'Início', icon: Package },
    { id: 'deliver', label: 'Entregar', icon: Truck },
    { id: 'stock', label: 'Estoque', icon: Package },
    { id: 'loans', label: 'Empréstimos', icon: Share2 },
    { id: 'history', label: 'Histórico', icon: Clock },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#F0F5FA]">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-white p-2 rounded-lg shadow-md shadow-red-200">
            <Truck size={20} />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 leading-none">Help Desk</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Suporte Técnico</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-xs font-medium text-gray-500 hidden sm:block">Agente: {userName}</span>
           <button onClick={onLogout} className="text-gray-400 hover:text-red-500 p-2"><LogOut size={20} /></button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 custom-scrollbar">
        <div className="max-w-3xl mx-auto h-full">
          {children}
        </div>
      </div>

      {/* Bottom Nav (Mobile First) */}
      <div className="bg-white border-t border-gray-200 fixed bottom-0 w-full z-20 pb-safe">
        <div className="flex justify-around items-center h-16 max-w-3xl mx-auto">
          {menuItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HelpdeskLayout;
