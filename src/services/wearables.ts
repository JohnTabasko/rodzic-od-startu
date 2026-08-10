/**
 * Optional step counter integration.
 *
 * The current implementation supports Health Connect on Android when the native
 * module is installed and permission is granted. iOS requires a separate
 * HealthKit module and is intentionally reported as unavailable for now.
 */
import { Platform } from 'react-native';

export interface StepsInfo {
  steps: number;
  source: 'health-connect' | 'healthkit';
}

export async function getTodaySteps(): Promise<StepsInfo | null> {
  if (Platform.OS !== 'android') return null;

  try {
    // Dynamic import keeps Expo Go/web usable when the native module is absent.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const healthConnect = require('react-native-health-connect');
    const { initialize, requestPermission, readRecords } = healthConnect;
    await initialize();
    await requestPermission([{ accessType: 'read', recordType: 'Steps' }]);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const result = await readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfDay,
        endTime: now.toISOString(),
      },
    });
    const steps = (result?.records ?? []).reduce(
      (total: number, record: { count?: number }) => total + (record.count ?? 0),
      0,
    );
    return { steps, source: 'health-connect' };
  } catch {
    return null;
  }
}
