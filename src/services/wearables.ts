/**
 * ⌚ Wearables (Faza 3, dokument §5.11): odczyt kroków z Health Connect (Android)
 * / HealthKit (iOS). MVP: łagodna degradacja — gdy moduł natywny nie jest
 * dostępny/dev-build bez zgód, zwracamy null i UI pokazuje informację.
 * Produkcja: react-native-health-connect (Android) lub react-native-health (iOS),
 * zgody runtime + wpisy "privacy" w app.json (Data safety/privacy manifest).
 */
export interface StepsInfo { steps: number; source: 'health-connect' | 'healthkit'; }

export async function getTodaySteps(): Promise<StepsInfo | null> {
  try {
    // Dynamiczny import — brak modułu (Expo Go/web) = łagodne null
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-health-connect');
    const { initialize, requestPermission, readRecords } = mod;
    await initialize();
    await requestPermission([{ accessType: 'read', recordType: 'Steps' }]);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const res = await readRecords('Steps', { timeRangeFilter: { operator: 'between', startTime: startOfDay, endTime: now.toISOString() } });
    const steps = (res?.records ?? []).reduce((s: number, r: any) => s + (r.count ?? 0), 0);
    return { steps, source: 'health-connect' };
  } catch {
    return null; // brak modułu/zgody — UI pokaże „niedostępne"
  }
}
