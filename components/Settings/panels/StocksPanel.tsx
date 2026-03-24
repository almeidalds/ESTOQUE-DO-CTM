
import React from 'react';
import WarehouseSettings from '../../WarehouseSettings'; // Reusing existing component logic
import { Warehouse, User } from '../../../types';
import * as InventoryService from '../../../services/inventoryService';

interface Props {
  warehouses: Warehouse[];
  onUpdate: (w: Warehouse[]) => void;
  currentUser: User;
}

const StocksPanel: React.FC<Props> = ({ warehouses, onUpdate, currentUser }) => {
  return (
    <div className="animate-fade-in">
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6 rounded-r-lg">
        <h4 className="font-bold text-blue-900">Gerenciamento de Armazéns</h4>
        <p className="text-sm text-blue-700 mt-1">
          Configure os locais físicos de estoque. Arquive estoques antigos somente se o saldo estiver zerado.
          <br/><strong>Nota:</strong> O estoque "Help Desk" é protegido e não pode ser removido.
        </p>
      </div>
      
      <WarehouseSettings 
        warehouses={warehouses}
        onUpdateAll={(updated) => { InventoryService.saveAllWarehouses(updated); onUpdate(updated); }}
        onResetWarehouses={() => {}}
        onResetFullSystem={() => {}}
      />
    </div>
  );
};

export default StocksPanel;
