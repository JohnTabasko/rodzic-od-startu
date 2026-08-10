import { useAppStore } from '../store/useAppStore';
import { api, SharedEvent } from './api';

const DEBOUNCE_MS = 3_000;
let timer: ReturnType<typeof setTimeout> | null = null;
let inFlight = false;
let syncRequested = false;

function canSync(): boolean {
  const state = useAppStore.getState();
  return Boolean(
    state.onboarded && state.coupleId && state.authToken && state.pairMemberCount === 2,
  );
}

/** Schedules a debounced sync after a shared-data change. */
export function scheduleAutoSync(): void {
  if (!canSync()) return;
  syncRequested = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void autoSync().catch(() => {
      // The next local change or an explicit manual sync retries the operation.
    });
  }, DEBOUNCE_MS);
}

/**
 * Pushes local shared data, pulls the complete remote state and merges it.
 * A second request is queued if another local change happens while a sync is
 * already in flight, so changes are not silently dropped.
 */
export async function autoSync(): Promise<void> {
  if (!canSync()) return;
  if (inFlight) {
    syncRequested = true;
    return;
  }

  inFlight = true;
  syncRequested = false;
  try {
    const state = useAppStore.getState();
    const token = state.authToken;
    if (!token) return;

    const stamped: SharedEvent[] = state.events.map((event) => ({
      ...event,
      updatedAt: event.updatedAt ?? new Date().toISOString(),
    }));

    // Persist timestamps for legacy events before they enter LWW merging.
    if (stamped.some((event, index) => event.updatedAt !== state.events[index]?.updatedAt)) {
      useAppStore.setState({ events: stamped });
    }

    await api.pushEvents(token, stamped, state.deletedEventIds);
    useAppStore.getState().clearTombstones();

    const remoteEvents = await api.pullEvents(token);
    useAppStore.getState().mergeEvents(remoteEvents.events);

    const current = useAppStore.getState();
    const updatedAt: Record<string, string> = {};
    for (const key of Object.keys(current.checklistDone)) {
      updatedAt[key] = new Date().toISOString();
    }
    await api.pushChecklist(token, current.checklistDone, updatedAt);

    const remoteChecklist = await api.pullChecklist(token);
    useAppStore.getState().mergeChecklist(remoteChecklist.done);
  } finally {
    inFlight = false;
    if (syncRequested) scheduleAutoSync();
  }
}
