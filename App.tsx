import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu,
  ArrowRight,
  Plus,
  LayoutDashboard,
  Package,
  Users,
  Settings,
  Ticket,
  ClipboardList,
  BarChart2,
  LogOut,
  Upload,
  X,
  ShoppingCart,
  MapPin,
  Smartphone,
  LifeBuoy,
  ChevronRight,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

import { ViewState, User, Warehouse, InventoryItem, TransactionType } from './types';
import * as InventoryService from './services/inventoryService';

import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import SettingsModule from './components/Settings/SettingsModule';
import MissionaryList from './components/MissionaryList';
import TicketManager from './components/TicketManager';
import CycleCountManager from './components/CycleCountManager';
import ImportItemsPage from './components/ImportItemsPage';
import HelpdeskConsole from './components/Helpdesk/HelpdeskConsole';
import HelpdeskProfile from './pages/helpdesk/HelpdeskProfile';
import ReportsLayout from './components/Reports/ReportsLayout';
import MobileEntry from './components/MobileEntry';
import TransactionModal from './components/TransactionModal';
import Modal from './components/Modal';
import ReplenishmentPage from './components/Replenishment/ReplenishmentPage';
import LocationMap from './components/Locations/LocationMap';

const DynamicIcon = ({
  name,
  size = 20,
  className = '',
}: {
  name?: string;
  size?: number;
  className?: string;
}) => {
  const IconComponent = (LucideIcons as any)[name || 'Package'] || LucideIcons.Package;
  return <IconComponent size={size} className={className} />;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Data State
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>('');

  // Modals State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('IN');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // ✅ Admin PIN Auth (padrão 123)
  const [isAdminPinOpen, setIsAdminPinOpen] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  const openAdminPin = () => {
    setAdminPin('');
    setAdminPinError('');
    setIsAdminPinOpen(true);
  };

  const closeAdminPin = () => {
    setIsAdminPinOpen(false);
    setAdminPin('');
    setAdminPinError('');
  };

  const confirmAdminPin = () => {
    const storedPin = localStorage.getItem('nexus_admin_pin') || '123';

    if (!adminPin) {
      setAdminPinError('Digite o PIN.');
      return;
    }

    if (adminPin !== storedPin) {
      setAdminPinError('PIN incorreto.');
      return;
    }

    closeAdminPin();
    handleLogin('admin');
  };

  // Load Data
  const loadData = useCallback(() => {
    const whs = InventoryService.getWarehouses();
    const inv = InventoryService.getItems();
    setWarehouses(whs);
    setItems(inv);

    if (!activeWarehouseId && whs.length > 0) {
      setActiveWarehouseId(whs[0].id);
    }
  }, [activeWarehouseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleLogin = (role: 'admin' | 'helpdesk' | 'mobile_add_only') => {
    const user: User = {
      uid: role === 'admin' ? 'admin-01' : role === 'helpdesk' ? 'agent-01' : 'oper-01',
      name: role === 'admin' ? 'Administrador' : role === 'helpdesk' ? 'Agente de Suporte' : 'Operador Logístico',
      role,
    };
    setCurrentUser(user);
    if (role === 'helpdesk') {
      setActiveView('helpdesk-profile');
    } else {
      setActiveView('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleNavigate = (view: ViewState) => {
    setActiveView(view);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleTransactionClick = (type: TransactionType, item: InventoryItem) => {
    setTxType(type);
    setSelectedItem(item);
    setIsTxModalOpen(true);
  };

  const handleTransactionConfirm = (data: any) => {
    if (!selectedItem || !currentUser) return;
    try {
      InventoryService.processTransaction(
        txType,
        selectedItem.id,
        data.quantity,
        selectedItem.warehouseId,
        currentUser,
        data.targetWarehouse,
        data.reason,
        undefined,
        data.reasonCategory,
        data.recipients,
        data.deliveredBy,
        data.deliveryLocation,
        data.deliveryShift,
        data.dueAt
      );
      setIsTxModalOpen(false);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAddItemClick = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleEditItemClick = (item: InventoryItem) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newItem: any = {
      id: editingItem ? editingItem.id : (formData.get('id') as string),
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      category: formData.get('category') as string,
      unit: formData.get('unit') as string,
      minLevel: Number(formData.get('minLevel')),
      maxLevel: Number(formData.get('maxLevel')),
      warehouseId: activeWarehouseId,
      quantity: editingItem ? editingItem.quantity : Number(formData.get('quantity') || 0),
      unitPrice: Number(formData.get('unitPrice') || 0),
      locationPath: formData.get('locationPath') as string,
    };

    try {
      if (editingItem) {
        InventoryService.updateItem(newItem);
      } else {
        InventoryService.addItem(newItem);
      }
      setIsItemModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- LOGIN SCREEN (Redesigned) ---
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="z-10 w-full max-w-6xl flex flex-col items-center animate-fade-in">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl shadow-blue-500/10 mb-6 transform hover:scale-105 transition-transform duration-500">
              <div className="w-14 h-14 rounded-xl overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-[#112D60] to-[#B6C0C5]">
                <img
                  src="https://i.imgur.com/7GchqTK.png"
                  alt="Logo"
                  className="relative z-10 w-12 h-12 object-contain drop-shadow-md"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight text-slate-800 mb-2">
              Gerenciador de Estoques
            </h1>
            <p className="text-slate-500 font-medium tracking-wide uppercase text-sm">
              Centro de Treinamento Missionário do Brasil
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {/* Admin Card */}
            <button
              onClick={openAdminPin}
              className="group relative bg-white/80 backdrop-blur-md p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-white hover:border-slate-200 hover:-translate-y-2 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-slate-200 transition-colors"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                  <LayoutDashboard size={28} strokeWidth={2} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Administração</h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-8">
                  Controle total de inventário, relatórios, auditoria e configurações do sistema.
                </p>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Acessar Painel <ArrowRight size={16} />
                </div>
              </div>
            </button>

            {/* Helpdesk Card */}
            <button
              onClick={() => handleLogin('helpdesk')}
              className="group relative bg-white/80 backdrop-blur-md p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-white hover:border-red-100 hover:-translate-y-2 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-red-100 transition-colors"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                  <LifeBuoy size={28} strokeWidth={2} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Help Desk</h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-8">
                  Console rápido para atendimento, entregas e empréstimos de materiais.
                </p>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                  Iniciar Atendimento <ArrowRight size={16} />
                </div>
              </div>
            </button>

            {/* Mobile Card */}
            <button
              onClick={() => handleLogin('mobile_add_only')}
              className="group relative bg-white/80 backdrop-blur-md p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-white hover:border-emerald-100 hover:-translate-y-2 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-100 transition-colors"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <Smartphone size={28} strokeWidth={2} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Coletor</h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-8">
                  Interface simplificada para entrada de notas e conferência via código QR.
                </p>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Abrir Coletor <ArrowRight size={16} />
                </div>
              </div>
            </button>
          </div>

          {/* ✅ MODAL PIN ADMIN */}
          {isAdminPinOpen && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
              {/* Overlay */}
              <button
                onClick={closeAdminPin}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                aria-label="Fechar"
              />

              {/* Modal */}
              <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">Acesso administrativo</h3>
                      <p className="text-sm text-slate-500">Digite o PIN numérico para continuar.</p>
                    </div>

                    <button
                      onClick={closeAdminPin}
                      className="p-2 rounded-xl hover:bg-slate-100 transition"
                      aria-label="Fechar"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <input
                    autoFocus
                    value={adminPin}
                    onChange={(e) => {
                      const onlyNums = e.target.value.replace(/\D/g, '');
                      setAdminPin(onlyNums);
                      setAdminPinError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmAdminPin();
                      if (e.key === 'Escape') closeAdminPin();
                    }}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={8}
                    placeholder="PIN (padrão: 123)"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 text-slate-900"
                  />

                  {adminPinError && (
                    <p className="mt-3 text-sm font-semibold text-red-600">{adminPinError}</p>
                  )}

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={closeAdminPin}
                      className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition"
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={confirmAdminPin}
                      className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition"
                    >
                      Entrar
                    </button>
                  </div>

                  <p className="mt-4 text-xs text-slate-400">
                    *PIN padrão: <span className="font-semibold">123</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-16 text-slate-400 text-xs font-medium bg-white/50 px-4 py-2 rounded-full border border-white/50">
            © CTM Brasil • v1.1.0
          </div>
        </div>
      </div>
    );
  }

  // --- ROLE BASED VIEWS ---
  if (currentUser.role === 'helpdesk') {
    if ((activeView as string) === 'console') {
      return (
        <HelpdeskConsole currentUser={currentUser} onLogout={handleLogout} onRefreshData={loadData} />
      );
    }
    return <HelpdeskProfile currentUser={currentUser} onLogout={handleLogout} onNavigate={handleNavigate} />;
  }

  if (currentUser.role === 'mobile_add_only') {
    return (
      <MobileEntry
        items={items}
        warehouses={warehouses}
        currentUser={currentUser}
        onTransactionComplete={loadData}
        onLogout={handleLogout}
      />
    );
  }

  // Settings Module takes over full content when active
  if ((activeView as string) === 'settings') {
    return (
      <SettingsModule
        currentUser={currentUser}
        warehouses={warehouses}
        onBack={() => setActiveView('dashboard')}
        onUpdateWarehouses={(updated) => {
          InventoryService.saveAllWarehouses(updated);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900">
      {/* Sidebar - Floating Style */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-72 bg-white/80 backdrop-blur-xl border-r border-white/50 shadow-2xl transform transition-transform duration-300 ease-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:shadow-none md:bg-transparent md:border-r-0
        `}
      >
        <div className="flex flex-col h-full md:p-4">
          {/* Sidebar Container (Desktop) */}
          <div className="flex flex-col h-full md:bg-white md:rounded-[32px] md:shadow-xl md:border md:border-white/50 overflow-hidden">
            {/* ✅ Header do Sidebar (LOGO + TEXTO) */}
            <div className="p-6 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo */}
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-2xl shadow-lg shadow-blue-500/10 transform hover:scale-105 transition-transform duration-300">
                  <div className="w-10 h-10 rounded-xl overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-[#112D60] to-[#B6C0C5]">
                    <img
                      src="https://i.imgur.com/7GchqTK.png"
                      alt="Logo"
                      className="relative z-10 w-7 h-7 object-contain drop-shadow-md"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Text */}
                <div className="leading-tight">
                  <h1 className="font-extrabold text-lg tracking-tight leading-none text-slate-900">
                    Gerenciador
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                    de Estoque
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
              <NavItem
                icon={LayoutDashboard}
                label="Dashboard"
                active={activeView === 'dashboard'}
                onClick={() => handleNavigate('dashboard')}
              />

              <div className="mt-6 mb-2 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Armazéns
              </div>

              {warehouses
                .filter((w) => !w.isArchived)
                .map((w) => {
                  const isActive = activeView === 'inventory' && activeWarehouseId === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        setActiveWarehouseId(w.id);
                        handleNavigate('inventory');
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 group ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 translate-x-1'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div
                        className={`transition-transform duration-300 ${
                          isActive ? 'scale-110' : 'group-hover:scale-110'
                        }`}
                        style={{ color: isActive ? '#fff' : w.color }}
                      >
                        <DynamicIcon name={w.icon} size={18} />
                      </div>
                      <span className="truncate">{w.name}</span>
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                    </button>
                  );
                })}

              <div className="mt-6 mb-2 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Operação
              </div>
              <NavItem icon={Users} label="Missionários" active={activeView === 'missionaries'} onClick={() => handleNavigate('missionaries')} />
              <NavItem icon={Ticket} label="Help Desk" active={activeView === 'tickets'} onClick={() => handleNavigate('tickets')} />
              <NavItem
                icon={ClipboardList}
                label="Ciclo de Contagem"
                active={activeView === 'cycle-count'}
                onClick={() => handleNavigate('cycle-count')}
              />
              <NavItem
                icon={ShoppingCart}
                label="Reposição"
                active={activeView === 'replenishment'}
                onClick={() => handleNavigate('replenishment')}
              />
              <NavItem icon={MapPin} label="Localizações" active={activeView === 'locations'} onClick={() => handleNavigate('locations')} />

              <div className="mt-6 mb-2 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Sistema
              </div>
              <NavItem
                icon={BarChart2}
                label="Relatórios"
                active={activeView.includes('report') || activeView === 'reports'}
                onClick={() => handleNavigate('reports')}
              />
              <NavItem icon={Upload} label="Importar" active={activeView === 'import-items'} onClick={() => handleNavigate('import-items')} />
              <NavItem icon={Settings} label="Configurações" active={activeView === 'settings'} onClick={() => handleNavigate('settings')} />
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold shadow-sm">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate text-slate-800">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">{currentUser.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sair"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative h-full">
        {/* Header - Transparent & Fluid */}
        <header className="px-8 py-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-700 p-2 bg-white rounded-xl shadow-sm"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb Context */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
                <span>GERENCIADOR DE ESTOQUE</span> <ChevronRight size={10} />{' '}
                <span className="uppercase tracking-wider text-blue-600">
                  {activeView === 'dashboard'
                    ? 'Visão Geral'
                    : activeView === 'inventory'
                      ? 'Inventário'
                      : activeView.replace(/-/g, ' ')}
                </span>
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                {activeView === 'dashboard' && 'Dashboard'}
                {activeView === 'reports' && 'Relatórios'}
                {activeView === 'missionaries' && 'Missionários'}
                {activeView === 'tickets' && 'Chamados'}
                {activeView === 'cycle-count' && 'Contagens'}
                {activeView === 'import-items' && 'Importação'}
                {activeView === 'replenishment' && 'Reposição'}
                {activeView === 'locations' && 'Mapa'}
                {activeView === 'inventory' && warehouses.find((w) => w.id === activeWarehouseId)?.name}
                {activeView.includes('report-') && 'Relatórios'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {activeView === 'inventory' && (
              <button
                onClick={handleAddItemClick}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-slate-900/20 active:scale-95 hover:-translate-y-1"
              >
                <Plus size={18} strokeWidth={2.5} /> <span className="hidden sm:inline">Adicionar Item</span>
              </button>
            )}
          </div>
        </header>

        {/* View Content Container */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scrollbar">
          {activeView === 'dashboard' && (
            <Dashboard
              items={items}
              warehouses={warehouses}
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onTransaction={(type, item) => handleTransactionClick(type as TransactionType, item)}
            />
          )}

          {activeView === 'inventory' && (
            <InventoryList
              warehouse={warehouses.find((w) => w.id === activeWarehouseId)!}
              items={items}
              currentUser={currentUser}
              onEdit={handleEditItemClick}
              onTransaction={handleTransactionClick}
              onHistory={() => handleNavigate('reports')}
              onPrintLabel={(item) => alert('Imprimir etiqueta: ' + item.name)}
              onRefresh={loadData}
            />
          )}

          {(activeView === 'reports' || activeView.includes('report-')) && <ReportsLayout />}

          {activeView === 'missionaries' && <MissionaryList />}

          {activeView === 'tickets' && <TicketManager currentUser={currentUser} />}

          {activeView === 'cycle-count' && <CycleCountManager currentUser={currentUser} warehouses={warehouses} />}

          {activeView === 'import-items' && (
            <ImportItemsPage currentUser={currentUser} onCancel={() => setActiveView('dashboard')} />
          )}

          {activeView === 'replenishment' && <ReplenishmentPage items={items} warehouses={warehouses} />}

          {activeView === 'locations' && <LocationMap items={items} warehouses={warehouses} />}
        </div>
      </main>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onConfirm={handleTransactionConfirm}
        type={txType}
        item={selectedItem}
        warehouses={warehouses}
        userRole={currentUser.role}
      />

      {/* Item Modal (Add/Edit) */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? 'Editar Item' : 'Novo Item'}
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          {!editingItem && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                ID (Opcional - Gerado Auto se vazio)
              </label>
              <input name="id" placeholder="Ex: ITEM-123" className="w-full border rounded-lg p-3 bg-gray-50 text-sm" />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Item</label>
            <input required name="name" defaultValue={editingItem?.name} className="w-full border rounded-lg p-3 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SKU / Código</label>
              <input required name="sku" defaultValue={editingItem?.sku} className="w-full border rounded-lg p-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
              <select
                name="category"
                defaultValue={editingItem?.category || 'Outros'}
                className="w-full border rounded-lg p-3 text-sm bg-white"
              >
                {['Alimentos', 'Higiene', 'Roupas', 'Cama e Banho', 'Materiais de Escritório', 'Ferramentas', 'Outros'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unidade</label>
              <input required name="unit" defaultValue={editingItem?.unit || 'un'} className="w-full border rounded-lg p-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mínimo</label>
              <input
                type="number"
                required
                name="minLevel"
                defaultValue={editingItem?.minLevel || 5}
                className="w-full border rounded-lg p-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Máximo</label>
              <input
                type="number"
                required
                name="maxLevel"
                defaultValue={editingItem?.maxLevel || 100}
                className="w-full border rounded-lg p-3 text-sm"
              />
            </div>
          </div>
          {!editingItem && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estoque Inicial</label>
              <input type="number" name="quantity" defaultValue={0} className="w-full border rounded-lg p-3 text-sm" />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Localização (Detalhe)</label>
            <input
              name="locationPath"
              defaultValue={editingItem?.locationPath}
              placeholder="Ex: Estante A > Prateleira 2"
              className="w-full border rounded-lg p-3 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold shadow-md">
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const NavItem = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 group ${
      active
        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 translate-x-1'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <Icon
      size={20}
      strokeWidth={2.5}
      className={`transition-colors ${active ? 'text-blue-300' : 'text-slate-400 group-hover:text-blue-500'}`}
    />
    <span>{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
  </button>
);

export default App;
