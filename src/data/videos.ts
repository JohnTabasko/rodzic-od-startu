// Katalog wideo (demo). Docelowo z CMS: pola ekspert/recenzja jak w bazie wiedzy.
// Adresy stream to testowe placeholdery — w produkcji: własne nagrania z CDN,
// napisy (WCAG 1.2.2) i transkrypcje do KAŻDEGO materiału.
export interface VideoItem {
  id: string;
  category: 'ćwiczenia' | 'oddech' | 'pielęgnacja' | 'karmienie';
  title: string;
  minutes: number;
  expert: string;
  streamUri: string; // HLS/MP4 z CDN
  forRoles: ('mother' | 'father')[];
  reviewedAt: string;
}

const DEMO_STREAM = 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4';

export const VIDEOS: VideoItem[] = [
  {
    id: 'v1',
    category: 'ćwiczenia',
    title: 'Bezpieczny rozciąganie w ciąży — 10 min',
    minutes: 10,
    expert: 'M. Kowalska, fizjoterapeutka',
    streamUri: DEMO_STREAM,
    forRoles: ['mother'],
    reviewedAt: '2026-06-20',
  },
  {
    id: 'v2',
    category: 'ćwiczenia',
    title: 'Wzmacnianie dna miednicy (Kegel)',
    minutes: 8,
    expert: 'M. Kowalska, fizjoterapeutka',
    streamUri: DEMO_STREAM,
    forRoles: ['mother'],
    reviewedAt: '2026-06-20',
  },
  {
    id: 'v3',
    category: 'oddech',
    title: 'Oddech na skurcze — technika 4-7-8',
    minutes: 5,
    expert: 'J. Nowak, położna',
    streamUri: DEMO_STREAM,
    forRoles: ['mother', 'father'],
    reviewedAt: '2026-06-25',
  },
  {
    id: 'v4',
    category: 'oddech',
    title: 'Wspólny trening oddechowy dla pary',
    minutes: 7,
    expert: 'J. Nowak, położna',
    streamUri: DEMO_STREAM,
    forRoles: ['father'],
    reviewedAt: '2026-06-25',
  },
  {
    id: 'v5',
    category: 'pielęgnacja',
    title: 'Kąpiel noworodka krok po kroku',
    minutes: 12,
    expert: 'M. Zielińska, położna neonatalna',
    streamUri: DEMO_STREAM,
    forRoles: ['mother', 'father'],
    reviewedAt: '2026-07-01',
  },
  {
    id: 'v6',
    category: 'pielęgnacja',
    title: 'Ubieranie i przewijanie bez stresu',
    minutes: 6,
    expert: 'M. Zielińska, położna neonatalna',
    streamUri: DEMO_STREAM,
    forRoles: ['father'],
    reviewedAt: '2026-07-01',
  },
  {
    id: 'v7',
    category: 'karmienie',
    title: 'Poprawne przystawianie do piersi',
    minutes: 9,
    expert: 'A. Wrona, IBCLC',
    streamUri: DEMO_STREAM,
    forRoles: ['mother'],
    reviewedAt: '2026-07-01',
  },
  {
    id: 'v8',
    category: 'karmienie',
    title: 'Karmienie z butelki — pacing',
    minutes: 7,
    expert: 'A. Wrona, IBCLC',
    streamUri: DEMO_STREAM,
    forRoles: ['father'],
    reviewedAt: '2026-07-01',
  },
];

export const CATEGORIES: { key: VideoItem['category']; label: string }[] = [
  { key: 'ćwiczenia', label: '🤸 Ćwiczenia' },
  { key: 'oddech', label: '🌬 Oddech' },
  { key: 'pielęgnacja', label: '🛁 Pielęgnacja' },
  { key: 'karmienie', label: '🍼 Karmienie' },
];
