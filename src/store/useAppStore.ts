import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '../services/secureStore';
import { todayISO } from '../utils/dates';

export type Role = 'mother' | 'father';
export type Experience = 'first' | 'experienced';
export type Mode = 'pregnancy' | 'child';

export interface Profile {
  role: Role;
  mode: Mode;
  dueDate?: string;      // RRRR-MM-DD (ciąża)
  birthDate?: string;    // RRRR-MM-DD (dziecko)
  childName?: string;
  experience: Experience;
}
export interface EventItem { id: string; title: string; date: string; type?: string; updatedAt?: string; }
export interface Note { id: string; text: string; date: string; kind: 'note' | 'question'; }
export interface MoodEntry { date: string; score: 1 | 2 | 3 | 4 | 5; }
export interface WeightEntry { date: string; kg: number; }
export interface BellyEntry { date: string; cm: number; }
export interface BpEntry { date: string; sys: number; dia: number; }

interface AppState {
  onboarded: boolean;
  profile: Profile | null;
  largeText: boolean;
  // ---- tryb pary / sync z backendem ----
  authToken: string | null;
  userId: string | null;
  coupleId: string | null;
  partnerRole: Role | null;
  pairCode: string | null;
  events: EventItem[];
  notes: Note[];
  moods: MoodEntry[];
  weights: WeightEntry[];
  belly: BellyEntry[];
  bps: BpEntry[];
  kicks: Record<string, number>;          // licznik ruchów dziecka per dzień
  checklistDone: Record<string, boolean>;
  deletedEventIds: string[]; // tombstony do propagacji usunięcia w sync
  completeOnboarding: (p: Profile, plannedEvents: EventItem[]) => void;
  setLargeText: (v: boolean) => void;
  addEvent: (e: Omit<EventItem, 'id'>) => void;
  removeEvent: (id: string) => void;
  addNote: (text: string, kind: Note['kind']) => void;
  addMood: (score: MoodEntry['score']) => void;
  addWeight: (kg: number) => void;
  addBelly: (cm: number) => void;
  addBp: (sys: number, dia: number) => void;
  addKick: () => void;
  resetKicksToday: () => void;
  toggleChecklist: (key: string) => void;
  setPairInfo: (p: Partial<Pick<AppState, 'authToken' | 'userId' | 'coupleId' | 'partnerRole' | 'pairCode'>>) => void;
  mergeEvents: (remote: (EventItem & { deleted?: boolean })[]) => void;
  clearTombstones: () => void;
  mergeChecklist: (remote: Record<string, boolean>) => void;
  exportJSON: () => string;
  resetAll: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      profile: null,
      largeText: false,
      authToken: null,
      userId: null,
      coupleId: null,
      partnerRole: null,
      pairCode: null,
      events: [],
      notes: [],
      moods: [],
      weights: [],
      belly: [],
      bps: [],
      kicks: {},
      checklistDone: {},
      deletedEventIds: [],
      completeOnboarding: (profile, plannedEvents) =>
        set({ onboarded: true, profile, events: plannedEvents }),
      setLargeText: (v) => set({ largeText: v }),
      addEvent: (e) => set({ events: [...get().events, { ...e, id: uid(), updatedAt: new Date().toISOString() }] }),
      removeEvent: (id) => set({ events: get().events.filter(e => e.id !== id), deletedEventIds: [...get().deletedEventIds, id] }),
      addNote: (text, kind) => set({ notes: [{ id: uid(), text, date: todayISO(), kind }, ...get().notes] }),
      addMood: (score) =>
        set({ moods: [...get().moods.filter(m => m.date !== todayISO()), { date: todayISO(), score }] }),
      addWeight: (kg) => set({ weights: [{ date: todayISO(), kg }, ...get().weights].slice(0, 90) }),
      addBelly: (cm) => set({ belly: [{ date: todayISO(), cm }, ...get().belly].slice(0, 90) }),
      addBp: (sys, dia) => set({ bps: [{ date: todayISO(), sys, dia }, ...get().bps].slice(0, 90) }),
      addKick: () => {
        const d = todayISO();
        const kicks = { ...get().kicks };
        kicks[d] = (kicks[d] ?? 0) + 1;
        set({ kicks });
      },
      resetKicksToday: () => {
        const kicks = { ...get().kicks };
        delete kicks[todayISO()];
        set({ kicks });
      },
      toggleChecklist: (key) =>
        set({ checklistDone: { ...get().checklistDone, [key]: !get().checklistDone[key] } }),
      setPairInfo: (p) => set(p),
      // Scalanie wspólnego kalendarza: last-write-wins po updatedAt
      mergeEvents: (remote) => {
        let local = [...get().events];
        for (const r of remote) {
          if (r.deleted) { local = local.filter(l => l.id !== r.id); continue; } // tombstone
          const idx = local.findIndex(l => l.id === r.id);
          if (idx === -1) local.push(r);
          else if ((r.updatedAt ?? '') > (local[idx].updatedAt ?? '')) local[idx] = r;
        }
        set({ events: local });
      },
      clearTombstones: () => set({ deletedEventIds: [] }),
      // Checklista wspólna: raz odhaczone zostaje (soft-OR)
      mergeChecklist: (remote) =>
        set({ checklistDone: { ...get().checklistDone, ...Object.fromEntries(Object.entries(remote).filter(([, v]) => v)) } }),
      exportJSON: () => {
        const { profile, events, notes, moods, weights, belly, bps, kicks, checklistDone } = get();
        return JSON.stringify({ exportedAt: new Date().toISOString(), profile, events, notes, moods, weights, belly, bps, kicks, checklistDone }, null, 2);
      },
      resetAll: () =>
        set({ onboarded: false, profile: null, authToken: null, userId: null, coupleId: null, partnerRole: null, pairCode: null, events: [], notes: [], moods: [], weights: [], belly: [], bps: [], kicks: {}, checklistDone: {}, deletedEventIds: [] }),
    }),
    {
      name: 'rodzic-od-startu',
      version: 2,
      storage: createJSONStorage(() => secureStorage), // szyfrowana pamięć (SecureStore/Keystore)
    }
  )
);
