
import React, { useState } from 'react';
import { InventoryItem, ReportFilters } from '../../types';
import * as InventoryService from '../../services/inventoryService';
import ReportsFilterBar from './ReportsFilterBar';
import ReportsDonations from './ReportsDonations';
import ReportsMovements from './ReportsMovements';
import ReportsLoans from './ReportsLoans';
import ReportsItemLedger from './ReportsItemLedger';
import { LayoutDashboard, Heart, ArrowRightLeft, Share2, Package } from 'lucide-react';

const ReportsLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DONATIONS' | 'MOVEMENTS' | 'LOANS' | 'ITEM_LEDGER'>('DONATIONS');
  const [filters, setFilters] = useState<ReportFilters>({
    range: '30d',
    warehouseId: 'ALL',
    category: 'ALL',
    search: ''
  });
  
  // Ledger State
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Helper to get item details for ledger
  const items = InventoryService.getItems();
  const selectedItemDetails = items.find(i => i.id === selectedItemId);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab !== 'ITEM_LEDGER') setSelectedItemId(null);
  };

  const handleRefresh = () => {
    // Force re-render trick or just let the components re-fetch on filter change
    setFilters({ ...filters }); 
  };

  const renderContent = () => {
    if (activeTab === 'ITEM_LEDGER' && selectedItemId) {
      return (
        <ReportsItemLedger 
          itemId={selectedItemId}
          itemDetails={selectedItemDetails}
          filters={filters}
          onBack={() => setSelectedItemId(null)}
        />
      );
    }

    if (activeTab === 'DONATIONS') return <ReportsDonations filters={filters} onViewItem={(id) => { setSelectedItemId(id); setActiveTab('ITEM_LEDGER'); }} />;
    if (activeTab === 'MOVEMENTS') return <ReportsMovements filters={filters} />;
    if (activeTab === 'LOANS') return <ReportsLoans filters={filters} />;
    
    // Default Item Ledger List View (Select Item)
    if (activeTab === 'ITEM_LEDGER') {
       // Filter items based on search/category first to show a list
       const filteredItems = items.filter(i => {
         if (filters.category !== 'ALL' && i.category !== filters.category) return false;
         if (filters.search && !i.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
         if (filters.warehouseId !== 'ALL' && i.warehouseId !== filters.warehouseId) return false;
         return true;
       }).slice(0, 50);

       return (
         <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E0ECDE]">
            <h3 className="font-bold text-gray-700 mb-4">Selecione um item para ver o Ficha Kardex</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredItems.map(item => (
                <button 
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className="text-left p-3 rounded-lg border border-[#E0ECDE] hover:border-[#68B2A0] hover:bg-[#F5F9F7] transition-all group"
                >
                   <div className="font-bold text-[#2C6975] group-hover:text-[#68B2A0]">{item.name}</div>
                   <div className="text-xs text-gray-500 font-mono">{item.id}</div>
                   <div className="text-xs text-gray-400 mt-1">{item.category} • Saldo: {item.quantity}</div>
                </button>
              ))}
              {filteredItems.length === 0 && <p className="text-gray-400 italic">Nenhum item encontrado.</p>}
            </div>
         </div>
       );
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in pb-12">
      
      {/* Tabs */}
      <div className="flex border-b border-[#E0ECDE] mb-6 bg-white rounded-t-xl px-4 pt-2">
         <button onClick={() => handleTabChange('DONATIONS')} className={`px-6 py-3 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'DONATIONS' ? 'border-[#2C6975] text-[#2C6975]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <Heart size={16}/> Doações
         </button>
         <button onClick={() => handleTabChange('MOVEMENTS')} className={`px-6 py-3 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'MOVEMENTS' ? 'border-[#2C6975] text-[#2C6975]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <ArrowRightLeft size={16}/> Movimentações
         </button>
         <button onClick={() => handleTabChange('LOANS')} className={`px-6 py-3 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'LOANS' ? 'border-[#2C6975] text-[#2C6975]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <Share2 size={16}/> Empréstimos
         </button>
         <button onClick={() => handleTabChange('ITEM_LEDGER')} className={`px-6 py-3 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'ITEM_LEDGER' ? 'border-[#2C6975] text-[#2C6975]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <Package size={16}/> Por Item (Kardex)
         </button>
      </div>

      {/* Filter Bar (Global for all reports) */}
      <ReportsFilterBar 
        filters={filters} 
        onChange={setFilters} 
        onRefresh={handleRefresh} 
        hideCategory={activeTab === 'LOANS'} // Loans don't strictly have categories like items
      />

      {/* Content Area */}
      {renderContent()}

    </div>
  );
};

export default ReportsLayout;
