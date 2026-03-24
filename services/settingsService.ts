
import { AppSettings, User } from '../types';
import { CATEGORIES, UNITS } from '../constants';

const SETTINGS_KEY = 'nexus7_app_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  helpdeskDefaults: {
    defaultReasonCategory: 'DONATION_TO_MISSIONARY',
    defaultLocation: 'Balcão Helpdesk',
    shiftRules: [
      { name: 'Manhã', start: '06:00', end: '12:00' },
      { name: 'Tarde', start: '12:01', end: '18:00' },
      { name: 'Noite', start: '18:01', end: '05:59' }
    ],
    topUsedCount: 12,
    favoritesItemIds: [],
    repeatedDonationWindowDays: 30
  },
  security: {
    blockArchiveIfBalanceNonZero: true,
    blockArchiveIfOpenLoans: true,
    adjustRequiresReason: true,
    retainAuditLogsDays: 365
  },
  categories: CATEGORIES,
  units: UNITS,
  locationsMap: {},
  importEnabled: true,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'system'
};

// --- READ ---
export const getAppSettings = (): AppSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
  return JSON.parse(data);
};

// --- WRITE (Admin Only) ---
export const updateAppSettings = async (newSettings: Partial<AppSettings>, user: User): Promise<AppSettings> => {
  if (user.role !== 'admin' && user.role !== 'manager') {
    throw new Error('Permissão negada: Apenas Admin/Manager pode alterar configurações.');
  }

  // Simulating Server-side validation
  const current = getAppSettings();
  const updated: AppSettings = {
    ...current,
    ...newSettings,
    // Deep merge specific sections if provided partial
    helpdeskDefaults: { ...current.helpdeskDefaults, ...newSettings.helpdeskDefaults },
    security: { ...current.security, ...newSettings.security },
    lastUpdated: new Date().toISOString(),
    updatedBy: user.uid
  };

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  
  // Log Audit (Simulation)
  console.log(`[AUDIT] Settings updated by ${user.name}`);
  
  return updated;
};

// --- HELPERS FOR UI ---
export const getLocationsForStock = (stockId: string): string[] => {
  const settings = getAppSettings();
  return settings.locationsMap[stockId] || [];
};

export const addLocationToStock = async (stockId: string, location: string, user: User) => {
  const settings = getAppSettings();
  const currentLocs = settings.locationsMap[stockId] || [];
  if (currentLocs.includes(location)) return;
  
  const newMap = { ...settings.locationsMap, [stockId]: [...currentLocs, location] };
  await updateAppSettings({ locationsMap: newMap }, user);
};

export const removeLocationFromStock = async (stockId: string, location: string, user: User) => {
  const settings = getAppSettings();
  const currentLocs = settings.locationsMap[stockId] || [];
  const newMap = { ...settings.locationsMap, [stockId]: currentLocs.filter(l => l !== location) };
  await updateAppSettings({ locationsMap: newMap }, user);
};
