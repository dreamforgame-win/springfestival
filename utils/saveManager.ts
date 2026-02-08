
import { ConsumableType } from "../types";

const STORAGE_KEY = 'cny_game_save_data_v2';

export interface SaveData {
  unlockedItems: Record<string, number>;
  money: number;
  consumables: Record<ConsumableType, number>;
}

const DEFAULT_SAVE: SaveData = {
  unlockedItems: {},
  money: 0,
  consumables: {
    [ConsumableType.SPRAY]: 0,
    [ConsumableType.DICE]: 0
  }
};

export const loadSaveData = (): SaveData => {
  if (typeof window === 'undefined') return DEFAULT_SAVE;
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    
    // Migration logic for old saves
    if (!raw) {
       const v1 = localStorage.getItem('cny_game_save_data_v1');
       if (v1) {
          try {
             const parsedV1 = JSON.parse(v1);
             return { ...DEFAULT_SAVE, unlockedItems: parsedV1.unlockedItems || {} };
          } catch(e) {}
       }
       // Even older legacy
       const legacy = localStorage.getItem('unlockedItems');
       if (legacy) {
         try {
           const parsed = JSON.parse(legacy);
           return { ...DEFAULT_SAVE, unlockedItems: parsed };
         } catch (e) { }
       }
       return DEFAULT_SAVE;
    }
    
    // Merge with default to ensure new fields exist
    return { ...DEFAULT_SAVE, ...JSON.parse(raw) };
  } catch (error) {
    console.warn("Failed to load save data:", error);
  }
  return DEFAULT_SAVE;
};

export const saveGameData = (data: Partial<SaveData>) => {
  try {
    // We need to load existing first to merge, or we maintain state in App and pass full object.
    // Assuming App passes the full updated slice it controls, but better to load existing to be safe?
    // Actually, App will likely maintain the authoritative state. 
    // Let's implement a merge approach here or assume the caller passes what they want saved.
    
    // Better approach: Reader reads, Writer writes full object.
    // For partial updates, we read current localStorage first.
    const current = loadSaveData();
    const updated = { ...current, ...data };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn("Failed to save game data:", error);
  }
};

export const clearSaveData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('cny_game_save_data_v1');
    localStorage.removeItem('unlockedItems'); 
  } catch (error) {
    console.warn("Failed to clear save data:", error);
  }
};
