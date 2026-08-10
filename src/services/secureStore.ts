// Szyfrowana pamięć lokalna: expo-secure-store (kluczyka iOS / Keystore Android).
// Ponieważ SecureStore ma limit ~2 KB na wpis, wartości są dzielone na bloki.
// Fallback na AsyncStorage (np. web / brak wsparcia). Docelowo: pełne SQLCipher.
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHUNK = 1800;
const k = (name: string) => name.replace(/[^.A-Za-z0-9_-]/g, '_');

export const secureStorage = {
  async getItem(name: string): Promise<string | null> {
    try {
      const n = await SecureStore.getItemAsync(k(name) + '_n');
      if (n === null) {
        // jednorazowa migracja z wcześniejszego nieszyfrowanego zapisu
        const legacy = await AsyncStorage.getItem(name);
        if (legacy) await this.setItem(name, legacy);
        return legacy;
      }
      const count = parseInt(n, 10);
      let out = '';
      for (let i = 0; i < count; i++) {
        const part = await SecureStore.getItemAsync(`${k(name)}_${i}`);
        if (part === null) return null;
        out += part;
      }
      return out;
    } catch {
      return AsyncStorage.getItem(name);
    }
  },

  async setItem(name: string, value: string): Promise<void> {
    try {
      const parts = Math.max(1, Math.ceil(value.length / CHUNK));
      const prev = await SecureStore.getItemAsync(k(name) + '_n');
      const prevCount = prev ? parseInt(prev, 10) : 0;
      for (let i = parts; i < prevCount; i++) {
        await SecureStore.deleteItemAsync(`${k(name)}_${i}`);
      }
      for (let i = 0; i < parts; i++) {
        await SecureStore.setItemAsync(k(name) + `_${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
      }
      await SecureStore.setItemAsync(k(name) + '_n', String(parts));
      await AsyncStorage.removeItem(name);
    } catch {
      await AsyncStorage.setItem(name, value);
    }
  },

  async removeItem(name: string): Promise<void> {
    try {
      const prev = await SecureStore.getItemAsync(k(name) + '_n');
      const prevCount = prev ? parseInt(prev, 10) : 0;
      for (let i = 0; i < prevCount; i++) {
        await SecureStore.deleteItemAsync(`${k(name)}_${i}`);
      }
      await SecureStore.deleteItemAsync(k(name) + '_n');
    } catch { /* ignoruj */ }
    await AsyncStorage.removeItem(name);
  },
};
