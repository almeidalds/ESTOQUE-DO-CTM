
import { Warehouse, InventoryItem } from './types';

// Updated colors for Ocean Blue theme
export const WAREHOUSES: Warehouse[] = [
  { id: 'STOCK-01', name: 'Recepção', type: 'materiais', color: '#001B48', icon: 'Package' }, // Deep Navy
  { id: 'STOCK-02', name: 'Roupas e Cama', type: 'roupas', color: '#02457A', icon: 'ShoppingBag' }, // Dark Blue
  { id: 'STOCK-03', name: 'Higiene', type: 'higiene', color: '#018ABE', icon: 'Droplet' }, // Bright Blue
  { id: 'STOCK-04', name: 'Materiais Missionários', type: 'materiais', color: '#97CADB', icon: 'BookOpen' }, // Soft Blue
  { id: 'STOCK-05', name: 'Doações Recebidas', type: 'triagem', color: '#5C8FA5', icon: 'Truck' }, // Muted Blue-Grey
  { id: 'STOCK-06', name: 'Reserva (Backup)', type: 'reserva', color: '#001B48', icon: 'Archive' }, // Deep Navy
  { id: 'STOCK-07', name: 'Operacional', type: 'operacional', color: '#02457A', icon: 'Shield' }, // Dark Blue
  { id: 'STOCK-HELPDESK', name: 'Help Desk', type: 'suporte', color: '#018ABE', icon: 'LifeBuoy' }, // Bright Blue
];

export const AVAILABLE_ICONS = [
  'Package', 
  'ShoppingBag', 
  'Droplet', 
  'BookOpen', 
  'Truck', 
  'Archive', 
  'Shield', 
  'Home', 
  'Layers', 
  'Zap', 
  'HardHat', 
  'Stethoscope', 
  'Cross', 
  'Box', 
  'LifeBuoy', 
  'Users',
  'Coffee',
  'Briefcase',
  'ClipboardList',
  'Utensils',
  'Thermometer',
  'Wrench',
  'Cpu',
  'Wifi',
  'Key',
  'MapPin',
  'Gift'
];

export const CATEGORIES = [
  'Alimentos',
  'Higiene',
  'Roupas',
  'Cama e Banho',
  'Materiais de Escritório',
  'Ferramentas',
  'Outros'
];

export const UNITS = ['un', 'cx', 'kg', 'l', 'pct', 'kit'];

// Seed data
export const INITIAL_ITEMS: InventoryItem[] = [
  { 
    id: 'ITEM-001', name: 'Kit Higiene Básico', sku: 'KIT-HIG-01', quantity: 15, category: 'Higiene', 
    warehouseId: 'STOCK-03', minLevel: 10, maxLevel: 50, unitPrice: 25.00, unit: 'kit', lastUpdated: new Date().toISOString() 
  },
  { 
    id: 'ITEM-002', name: 'Lençol Solteiro Branco', sku: 'LEN-001', quantity: 8, category: 'Cama e Banho', 
    warehouseId: 'STOCK-02', minLevel: 20, maxLevel: 60, unitPrice: 45.00, unit: 'un', lastUpdated: new Date().toISOString() 
  },
  { 
    id: 'ITEM-003', name: 'Bíblia Missionária', sku: 'BIB-001', quantity: 100, category: 'Materiais de Escritório', 
    warehouseId: 'STOCK-04', minLevel: 30, maxLevel: 200, unitPrice: 15.00, unit: 'un', lastUpdated: new Date().toISOString() 
  },
  { 
    id: 'ITEM-004', name: 'Cesta Básica P', sku: 'ALI-005', quantity: 5, category: 'Alimentos', 
    warehouseId: 'STOCK-05', minLevel: 5, maxLevel: 20, unitPrice: 80.00, unit: 'cx', lastUpdated: new Date().toISOString() 
  },
  { 
    id: 'ITEM-HD-01', name: 'Notebook Suporte', sku: 'IT-NOTE-01', quantity: 3, category: 'Outros', 
    warehouseId: 'STOCK-HELPDESK', minLevel: 1, maxLevel: 5, unitPrice: 2500.00, unit: 'un', lastUpdated: new Date().toISOString() 
  },
];
