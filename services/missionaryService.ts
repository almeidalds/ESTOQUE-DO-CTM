
import { Missionary, User } from '../types';
import * as InventoryService from './inventoryService';

// --- MOCK STORAGE ---
const MISSIONARIES_KEY = 'nexus7_missionaries_v1';

export const getMissionaryById = (id: string): Missionary | undefined => {
  const all = InventoryService.getMissionaries();
  return all.find(m => m.id === id);
};

// SIMULATES Cloud Function `updateMissionaryProfile`
export const updateMissionaryProfile = async (
  missionaryId: string, 
  patch: Partial<Missionary>, 
  user: User
) => {
  // 1. Role Validation
  if (user.role === 'mobile_add_only') throw new Error("Permissão negada.");
  
  if (user.role === 'helpdesk') {
    // Helpdesk restriction: Can only edit notes or contact info, not structural fields
    // Allowing Name/Language/Notes for usability, blocking Branch/District/Active
    // This logic mimics the backend rule
    const allowed = ['name', 'language', 'phone', 'email', 'notes'];
    const keys = Object.keys(patch);
    const forbidden = keys.filter(k => !allowed.includes(k));
    if (forbidden.length > 0) {
      throw new Error(`Helpdesk não pode editar: ${forbidden.join(', ')}`);
    }
  }

  const all = InventoryService.getMissionaries();
  const idx = all.findIndex(m => m.id === missionaryId);
  if (idx === -1) throw new Error("Missionário não encontrado.");

  // 2. Apply Update
  const current = all[idx];
  const updated: Missionary = {
    ...current,
    ...patch,
    id: current.id, // IMMUTABLE
    updatedAt: new Date().toISOString(),
    updatedBy: user.name
  };

  all[idx] = updated;
  InventoryService.saveMissionaries(all);

  console.log(`[AUDIT] UPDATE_MISSIONARY_PROFILE by ${user.name} for ${missionaryId}`);
  return updated;
};
