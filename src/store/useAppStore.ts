import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStorage } from '../services/secureStore';
import { todayISO } from '../utils/dates';

export type Role = 'mother' | 'father';
export type Experience = 'first' | 'experienced';
export type Mode = 'pregnancy' | 'child';

export interface Profile {
  role: Role;
  mode: Mode;
  dueDate?: string;
  birthDate?: string;
  childName?: string;
  experience: Experience;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  type?: string;
  updatedAt?: string;
}

export interface Note {
  id: string;
  text: string;
  date: string;
  kind: 'note' | 'question';
}

export interface MoodEntry {
  date: string;
  score: 1 | 2 | 3 | 4 | 5;
}

export interface WeightEntry {
  date: string;
  kg: number;
}

export interface BellyEntry {
  date: string;
  cm: number;
}

export interface BpEntry {
  date: string;
  sys: number;
  dia: number;
}

interface AppState {
  onboarded: boolean;
  profile: Profile | null;
  largeText: boolean;
  authToken: string | null;
  userId: string | null;
  coupleId: string | null;
  pairMemberCount: number;
  partnerRole: Role | null;
  pairCode: string | null;
  events: EventItem[];
  notes: Note[];
  moods: MoodEntry[];
  weights: WeightEntry[];
  belly: BellyEntry[];
  bps: BpEntry[];
  kicks: Record<string, number>;
  checklistDone: Record<string, boolean>;
  deletedEventIds: string[];
  completeOnboarding: (profile: Profile, plannedEvents: EventItem[]) => void;
  setLargeText: (value: boolean) => void;
  addEvent: (event: Omit<EventItem, 'id'>) => void;
  removeEvent: (id: string) => void;
  addNote: (text: string, kind: Note['kind']) => void;
  addMood: (score: MoodEntry['score']) => void;
  addWeight: (kg: number) => void;
  addBelly: (cm: number) => void;
  addBp: (sys: number, dia: number) => void;
  addKick: () => void;
  resetKicksToday: () => void;
  toggleChecklist: (key: string) => void;
  setPairInfo: (
    info: Partial<
      Pick<
        AppState,
        'authToken' | 'userId' | 'coupleId' | 'pairMemberCount' | 'partnerRole' | 'pairCode'
      >
    >,
  ) => void;
  mergeEvents: (remote: Array<EventItem & { deleted?: boolean }>) => void;
  clearTombstones: () => void;
  mergeChecklist: (remote: Record<string, boolean>) => void;
  exportJSON: () => string;
  resetAll: () => void;
}

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      profile: null,
      largeText: false,
      authToken: null,
      userId: null,
      coupleId: null,
      pairMemberCount: 0,
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

      completeOnboarding: (profile, plannedEvents) => {
        const updatedAt = new Date().toISOString();
        set({
          onboarded: true,
          profile,
          events: plannedEvents.map((event) => ({
            ...event,
            updatedAt: event.updatedAt ?? updatedAt,
          })),
        });
      },
      setLargeText: (value) => set({ largeText: value }),
      addEvent: (event) =>
        set({
          events: [
            ...get().events,
            { ...event, id: createId(), updatedAt: new Date().toISOString() },
          ],
        }),
      removeEvent: (id) => {
        if (!get().events.some((event) => event.id === id)) return;
        const deletedEventIds = get().deletedEventIds.includes(id)
          ? get().deletedEventIds
          : [...get().deletedEventIds, id];
        set({
          events: get().events.filter((event) => event.id !== id),
          deletedEventIds,
        });
      },
      addNote: (text, kind) =>
        set({ notes: [{ id: createId(), text, date: todayISO(), kind }, ...get().notes] }),
      addMood: (score) =>
        set({
          moods: [
            ...get().moods.filter((mood) => mood.date !== todayISO()),
            { date: todayISO(), score },
          ],
        }),
      addWeight: (kg) =>
        set({ weights: [{ date: todayISO(), kg }, ...get().weights].slice(0, 90) }),
      addBelly: (cm) => set({ belly: [{ date: todayISO(), cm }, ...get().belly].slice(0, 90) }),
      addBp: (sys, dia) =>
        set({ bps: [{ date: todayISO(), sys, dia }, ...get().bps].slice(0, 90) }),
      addKick: () => {
        const date = todayISO();
        const kicks = { ...get().kicks, [date]: (get().kicks[date] ?? 0) + 1 };
        set({ kicks });
      },
      resetKicksToday: () => {
        const kicks = { ...get().kicks };
        delete kicks[todayISO()];
        set({ kicks });
      },
      toggleChecklist: (key) =>
        set({ checklistDone: { ...get().checklistDone, [key]: !get().checklistDone[key] } }),
      setPairInfo: (info) => set(info),
      mergeEvents: (remote) => {
        let local = [...get().events];
        for (const remoteEvent of remote) {
          if (remoteEvent.deleted) {
            local = local.filter((event) => event.id !== remoteEvent.id);
            continue;
          }

          const index = local.findIndex((event) => event.id === remoteEvent.id);
          if (index === -1) {
            local.push(remoteEvent);
          } else if ((remoteEvent.updatedAt ?? '') > (local[index].updatedAt ?? '')) {
            local[index] = remoteEvent;
          }
        }
        set({ events: local });
      },
      clearTombstones: () => set({ deletedEventIds: [] }),
      mergeChecklist: (remote) =>
        set({
          checklistDone: {
            ...get().checklistDone,
            ...Object.fromEntries(Object.entries(remote).filter(([, value]) => value)),
          },
        }),
      exportJSON: () => {
        const { profile, events, notes, moods, weights, belly, bps, kicks, checklistDone } = get();
        return JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            profile,
            events,
            notes,
            moods,
            weights,
            belly,
            bps,
            kicks,
            checklistDone,
          },
          null,
          2,
        );
      },
      resetAll: () =>
        set({
          onboarded: false,
          profile: null,
          authToken: null,
          userId: null,
          coupleId: null,
          pairMemberCount: 0,
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
        }),
    }),
    {
      name: 'rodzic-od-startu',
      version: 3,
      storage: createJSONStorage(() => secureStorage),
      migrate: (persistedState) => {
        const state = persistedState as Partial<AppState>;
        return {
          ...state,
          pairMemberCount: state.coupleId ? (state.pairMemberCount ?? 0) : 0,
        } as AppState;
      },
    },
  ),
);
