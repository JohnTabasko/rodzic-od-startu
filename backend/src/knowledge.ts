/**
 * Baza wiedzy asystenta (demo). Model dokumentu odzwierciedla content governance:
 * każdy wpis ma id, wersję i datę recenzji medycznej → po stronie RAG te same pola
 * trafiają do cytowań. Produkcyjnie: z CMS, indeksowanie wektorowe (pgvector).
 */
export interface KbDoc {
  id: string;
  title: string;
  keywords: string[];
  answer: string;
  source: string;
  reviewedAt: string; // data ostatniej recenzji medycznej
}

export const SAFETY_KEYWORDS = [
  'krwawi',
  'krwawienie',
  'plamienie',
  'silny ból',
  'silny bol',
  'odejście wód',
  'odejscie wod',
  'nie czuję ruchów',
  'nie czuje ruchow',
  'brak ruchów',
  'brak ruchow',
  'wysoka gorączka',
  'gorączka 3',
  'samobój',
  'samoboj',
  'zabić się',
  'zabic sie',
  'nie chcę żyć',
  'nie chce zyc',
  'skrzywdzić',
  'skrzywdzic',
];

export const CRISIS_TEXT = `🆘 To brzmi poważnie i nie powinno czekać.

• KRWAWIENIE, silny ból, odejście wód, wyraźnie osłabione ruchy dziecka, wysoka gorączka → zadzwoń na izbę przyjęć szpitala lub **112 / 999** już teraz.
• Myśli o skrzywdzeniu siebie → Centrum Wsparcia: **800 70 2222** (całodobowo, bezpłatnie) lub 112.

Jestem asystentem informacyjnym — przy takich objawach liczy się realny kontakt ze specjalistą. 💛`;

export const KB: KbDoc[] = [
  {
    id: 'kb-ogtt',
    title: 'Badanie OGTT',
    keywords: ['ogtt', 'glukoz', 'cukrzyca ciążowa', 'cukrzyca ciazowa', 'cukier'],
    answer:
      'Obciążenie glukozą (OGTT) wykonuje się standardowo między 24. a 28. tygodniem ciąży (wcześniej przy czynnikach ryzyka — zdecyduje lekarz). Badanie na czczo trwa ok. 2 godzin.',
    source: 'Standardy opieki prenatalnej (redakcja demo)',
    reviewedAt: '2026-06-15',
  },
  {
    id: 'kb-kicks',
    title: 'Ruchy dziecka',
    keywords: [
      'ruchy dziecka',
      'kopnięcia',
      'kopniecia',
      'ile ruchów',
      'ile ruchow',
      'licznik ruchów',
    ],
    answer:
      'Od ok. 28. tygodnia obserwuj rytm ruchów. Zasada praktyczna: min. 10 wyczuwalnych ruchów w 2 godziny aktywności. Wyraźnie mniej lub nagła zmiana → kontakt z lekarzem/izbą przyjęć. Licznik: zakładka Dziennik.',
    source: 'Materiał edukacyjny (redakcja demo)',
    reviewedAt: '2026-06-15',
  },
  {
    id: 'kb-bag',
    title: 'Torba do szpitala',
    keywords: [
      'torba',
      'szpital',
      'wyprawka',
      'co spakować',
      'co spakowac',
      'zabrać',
      'zabrac',
      'porodówki',
      'porodowka',
      'porodówce',
    ],
    answer:
      'Dokumenty (dowód, karta ciąży, wyniki, grupa krwi), koszule do porodu/karmienia, wkłady poporodowe, kosmetyki, ubranka 56–62, pieluchy noworodkowe i sprawdzony fotelik. Pełna checklista: zakładka Wiedza.',
    source: 'Checklista redakcyjna (demo)',
    reviewedAt: '2026-06-15',
  },
  {
    id: 'kb-diet',
    title: 'Dieta w ciąży',
    keywords: [
      'jeść',
      'jesc',
      'dieta',
      'czego nie wolno',
      'sushi',
      'ser pleśniowy',
      'kawa',
      'kawę',
      'kawie',
      'mogę pić',
      'moge pic',
      'kofein',
      'cola',
      'alkohol',
      'ryby',
    ],
    answer:
      'Unikaj: surowego mięsa i ryb, niepasteryzowanego mleka i serów, surowych jaj oraz alkoholu. Kawa: max ok. 200 mg kofeiny dziennie. Duże ryby drapieżne — ogranicz (rtęć).',
    source: 'Materiał edukacyjny (redakcja demo)',
    reviewedAt: '2026-06-20',
  },
  {
    id: 'kb-mood',
    title: 'Baby blues i depresja poporodowa',
    keywords: [
      'baby blues',
      'depresja',
      'smutno',
      'przygnęb',
      'przygneb',
      'płaczę',
      'placze',
      'lęk',
      'nie radzę sobie',
    ],
    answer:
      'Baby blues mija zwykle w 1–2 tygodnie. Dłuższy smutek/lęk u mamy LUB ojca → to częste, można leczyć: porozmawiaj z lekarzem lub Centrum Wsparcia 800 70 2222 (całodobowo).',
    source: 'Materiał psychoedukacyjny (redakcja demo)',
    reviewedAt: '2026-07-01',
  },
  {
    id: 'kb-feed',
    title: 'Karmienie',
    keywords: [
      'karmienie',
      'karmić',
      'karmic',
      'pierś',
      'piers',
      'laktacja',
      'mleko',
      'butelka',
      'mieszanka',
    ],
    answer:
      'Karmienie na żądanie i poprawna technika (szeroko otwarta buzia) to baza. Ból, zapalenie, wątpliwości o ilości → doradczyni laktacyjna (IBCLC). Mieszanka też jest OK.',
    source: 'Materiał edukacyjny (redakcja demo)',
    reviewedAt: '2026-06-20',
  },
  {
    id: 'kb-vacc',
    title: 'Szczepienia',
    keywords: ['szczepienie', 'szczepić', 'szczepic', 'pso', 'bcg', 'hbv', 'harmonogram'],
    answer:
      'BCG i HBV po urodzeniu, dalej wg aktualnego PSO (2, 4, 6, 13–16 msc…). Przypomnienia: zakładka Kalendarz; harmonogram potwierdź z pediatrą.',
    source: 'PSO (redakcja demo) — zweryfikuj wersję',
    reviewedAt: '2026-07-01',
  },
  {
    id: 'kb-labor',
    title: 'Poród — kiedy jechać',
    keywords: ['poród', 'porod', 'znieczulenie', 'skurcze', 'wody odeszły', 'kiedy do szpitala'],
    answer:
      'Pierwsze dziecko: regularne skurcze co ~5 min przez godzinę, po odejściu wód od razu, objawy alarmowe — od razu. Znieczulenie zewnątrzoponowe: sprawdź zasady szpitala.',
    source: 'Materiał edukacyjny (redakcja demo)',
    reviewedAt: '2026-06-15',
  },
  {
    id: 'kb-leave',
    title: 'Urlopy rodzicielskie',
    keywords: ['urlop ojcowski', 'tacierzyński', 'rodzicielski', 'macierzyński'],
    answer:
      'Ojcu przysługuje płatny urlop ojcowski i nieprzenoszalna część rodzicielskiego. Wymiary zmieniają się — zweryfikuj na gov.pl lub u kadrowej.',
    source: 'Informator (demo) — zweryfikuj przepisy',
    reviewedAt: '2026-07-01',
  },
  {
    id: 'kb-sport',
    title: 'Aktywność w ciąży',
    keywords: ['ćwiczenia', 'cwiczenia', 'sport', 'biegać', 'biegac', 'basen', 'joga'],
    answer:
      'Bez przeciwwskazań lekarskich: 150 min umiarkowanej aktywności tygodniowo (spacer, basen, joga prenatalna). Unikaj sportów kontaktowych i z ryzykiem upadku.',
    source: 'Materiał edukacyjny (redakcja demo)',
    reviewedAt: '2026-06-20',
  },
  {
    id: 'kb-sleep',
    title: 'Bezpieczny sen niemowlęcia',
    keywords: ['sen niemowlęcia', 'sen noworodka', 'nie śpi', 'nie spi', 'bezpieczny sen', 'sids'],
    answer:
      'Na plecach, twarda mata, puste łóżeczko (bez poduszek/maskotek), 18–20°C. Te zasady obniżają ryzyko SIDS.',
    source: 'Materiał edukacyjny (redakcja demo)',
    reviewedAt: '2026-06-25',
  },
];

export const FALLBACK_TEXT =
  'Nie znalazłem tego w zweryfikowanej bazie wiedzy. Spróbuj inaczej (np. „ruchy dziecka”, „OGTT”, „torba do szpitala”) albo zajrzyj do zakładki Wiedza. W sprawach zdrowotnych najpewniejszym źródłem jest lekarz lub położna.';
