
import { LibraryItem, UserPersona } from '../types';

const STORAGE_KEY = 'creative_studio_library';
const PERSONA_KEY = 'creative_studio_personas';

export const storageService = {
  // 素材库管理
  getItems: (): LibraryItem[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveItem: (item: Omit<LibraryItem, 'id' | 'createdAt'>): LibraryItem => {
    const items = storageService.getItems();
    const newItem: LibraryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
    };
    items.unshift(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return newItem;
  },

  deleteItem: (id: string) => {
    const items = storageService.getItems().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },

  // 人设画像管理
  getSavedPersonas: (): UserPersona[] => {
    const data = localStorage.getItem(PERSONA_KEY);
    return data ? JSON.parse(data) : [];
  },

  savePersona: (persona: UserPersona): UserPersona => {
    const personas = storageService.getSavedPersonas();
    const newPersona = {
      ...persona,
      id: persona.id || Math.random().toString(36).substr(2, 9),
      isSystem: false
    };
    
    const index = personas.findIndex(p => p.id === newPersona.id);
    if (index >= 0) {
      personas[index] = newPersona;
    } else {
      personas.unshift(newPersona);
    }
    
    localStorage.setItem(PERSONA_KEY, JSON.stringify(personas));
    return newPersona;
  },

  deletePersona: (id: string) => {
    const personas = storageService.getSavedPersonas().filter(p => p.id !== id);
    localStorage.setItem(PERSONA_KEY, JSON.stringify(personas));
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PERSONA_KEY);
  }
};
