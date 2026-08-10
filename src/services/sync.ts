// Auto-sync trybu pary: wywoływany po zmianach wspólnych danych (kalendarz, checklisty)
// oraz przy starcie aplikacji. Debounce 3 s, działa tylko gdy konto jest sparowane.
// Znane ograniczenie MVP: lokalne usunięcie wydarzenia nie propaguje tombstone do partnera.
import { useAppStore } from '../store/useAppStore';
import { api, SharedEvent } from './api';

let timer: ReturnType<typeof setTimeout> | null = null;
let inFlight = false;

export function scheduleAutoSync() {
  const s = useAppStore.getState();
  if (!s.onboarded || !s.coupleId || !s.authToken) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { autoSync().catch(() => { /* offline — spróbujemy przy następnej zmianie */ }); }, 3000);
}

export async function autoSync(): Promise<void> {
  const s = useAppStore.getState();
  if (!s.onboarded || !s.coupleId || !s.authToken || inFlight) return;
  inFlight = true;
  try {
    const token = s.authToken;
    const stamped = s.events.map((e): SharedEvent => ({ ...e, updatedAt: e.updatedAt ?? new Date().toISOString() }));
    await api.pushEvents(token, stamped, s.deletedEventIds);
    useAppStore.setState({ deletedEventIds: [] });
    const down = await api.pullEvents(token); // pełny pull — z tombstonami partnera
    useAppStore.getState().mergeEvents(down.events);

    const state2 = useAppStore.getState();
    const ts: Record<string, string> = {};
    Object.keys(state2.checklistDone).forEach(k => (ts[k] = new Date().toISOString()));
    await api.pushChecklist(token, state2.checklistDone, ts);
    const cl = await api.pullChecklist(token);
    useAppStore.getState().mergeChecklist(cl.done);
  } finally {
    inFlight = false;
  }
}
