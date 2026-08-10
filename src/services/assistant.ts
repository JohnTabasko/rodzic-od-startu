// Asystent rodzica — silnik Q&A (demo offline).
// Produkcja: RAG nad zweryfikowaną bazą redakcyjną + LLM z cytowaniem źródeł.
// Zasady bezpieczeństwa (guardrails) są TWARDE i sprawdzane zawsze jako pierwsze.

export interface Answer {
  text: string;
  source: string;
  isSafety?: boolean;
}

const SAFETY_KEYWORDS = [
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

const CRISIS = `🆘 To brzmi poważnie i nie powinno czekać.

• KRWAWIENIE, silny ból, odejście wód, wyraźnie osłabione ruchy dziecka, wysoka gorączka → zadzwoń na izbę przyjęć szpitala lub **112 / 999** już teraz.
• Myśli o skrzywdzeniu siebie lub życie nie ma sensu → Centrum Wsparcia: **800 70 2222** (całodobowo, bezpłatnie) lub 112.

Jestem tylko asystentem informacyjnym — przy takich objawach liczy się realny kontakt ze specjalistą. Trzymam kciuki. 💛`;

interface Faq {
  keywords: string[];
  q: string;
  a: string;
  source: string;
}

const FAQ: Faq[] = [
  {
    keywords: ['ogtt', 'glukoz', 'cukrzyca ciążowa', 'cukrzyca ciazowa', 'cukier'],
    q: 'Kiedy zrobić badanie OGTT?',
    a: 'Obciążenie glukozą (OGTT) wykonuje się standardowo między 24. a 28. tygodniem ciąży (wcześniej, jeśli masz czynniki ryzyka — zdecyduje lekarz). Badanie jest na czczo i trwa ok. 2 godzin, więc zabierz coś do przeczytania.',
    source: 'Standardy opieki prenatalnej (redakcja demo)',
  },
  {
    keywords: [
      'ruchy dziecka',
      'kopnięcia',
      'kopniecia',
      'ile ruchów',
      'ile ruchow',
      'licznik ruchów',
    ],
    q: 'Jak liczyć ruchy dziecka?',
    a: 'Od ok. 28. tygodnia warto obserwować rytm ruchów malucha. Zasada praktyczna: w okresie aktywności dziecka powinno być co najmniej 10 wyczuwalnych ruchów w ciągu 2 godzin. Wyraźnie mniej lub nagła zmiana rytmu → kontakt z lekarzem/izbą przyjęć. Użyj licznika w zakładce Dziennik.',
    source: 'Materiał edukacyjny (redakcja demo)',
  },
  {
    keywords: ['torba', 'szpital', 'wyprawka do szpitala', 'co spakować', 'co spakowac'],
    q: 'Co spakować do szpitala?',
    a: 'Najważniejsze: dokumenty (dowód, karta ciąży, wyniki badań, grupa krwi), koszule do porodu/karmienia, wkłady poporodowe, kosmetyki, ubranka dla dziecka (56–62), pieluchy noworodkowe i… sprawdzony fotelik na drogę powrotną. Pełna checklista z odhaczaniem: zakładka Wiedza.',
    source: 'Checklista redakcyjna (demo)',
  },
  {
    keywords: [
      'jeść',
      'jesc',
      'dieta',
      'czego nie wolno',
      'sushi',
      'ser pleśniowy',
      'ser plesniowy',
      'ryby',
      'kawa',
      'alkohol',
    ],
    q: 'Czego unikać w diecie w ciąży?',
    a: 'Unikaj: surowego mięsa i ryb (sushi, tatar), niepasteryzowanych mleka i serów, surowych jaj, wątroby (nadmiar wit. A) oraz alkoholu — w całości. Kawę ogranicz do ok. 200 mg kofeiny dziennie. Duże ryby drapieżne (tuńczyk, miecznik) — ogranicz ze względu na rtęć.',
    source: 'Materiał edukacyjny (redakcja demo)',
  },
  {
    keywords: [
      'baby blues',
      'depresja',
      'smutno',
      'przygnęb',
      'przygneb',
      'płaczę',
      'placze',
      'nie radzę sobie',
      'nie radze sobie',
      'lęk',
      'lek',
      'stres',
    ],
    q: 'Baby blues czy depresja poporodowa?',
    a: 'Baby blues (płaczliwość, huśtawka nastroju) mija zwykle w 1–2 tygodnie po porodzie. Jeśli smutek, lęk lub wyczerpanie trwają dłużej, albo pojawiają się u Ciebie *lub u Twojego partnera* (depresja poporodowa dotyka też ojców) — to częste, nie Twoja wina i można temu skutecznie pomóc. Porozmawiaj z lekarzem lub zadzwoń do Centrum Wsparcia: 800 70 2222 (całodobowo).',
    source: 'Materiał psychoedukacyjny (redakcja demo)',
  },
  {
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
    q: 'Pytania o karmienie piersią',
    a: 'Karmienie na żądanie, częste przystawianie i poprawna technika (szeroko otwarta buzia, brodawka głęboko) to podstawa. Ból, który nie mija, zapalenie lub wątpliwości co do ilości mleka → skontaktuj się z doradczynią laktacyjną (IBCLC) lub mlecznym bankiem przy szpitalu. Karmienie mieszanką też jest OK — najważniejsze jest zdrowie Twoje i dziecka.',
    source: 'Materiał edukacyjny (redakcja demo)',
  },
  {
    keywords: ['szczepienie', 'szczepić', 'szczepic', 'pso', 'harmonogram szczepień', 'bcg', 'hbv'],
    q: 'Harmonogram szczepień',
    a: 'Pierwsze szczepienia: BCG i HBV tuż po urodzeniu (w szpitalu), następnie wg aktualnego Programu Szczepień Ochronnych (2, 4, 6, 13–16 mies. itd.). Sprawdź zakładkę Kalendarz — dodaliśmy przypomnienia; pełny harmonogram uzgodnij z pediatrą/położną środowiskową.',
    source: 'PSO (redakcja demo) — sprawdź aktualną wersję',
  },
  {
    keywords: ['poród', 'porod', 'znieczulenie', 'skurcze', 'wody odeszły', 'kiedy do szpitala'],
    q: 'Kiedy jechać do szpitala?',
    a: 'Jeśli to pierwsze dziecko: przy regularnych skurczach co ~5 minut przez godzinę, po odejściu wód (od razu) lub przy jakichkolwiek objawach alarmowych — od razu. Zabierz torbę (checklista w Wiedzy). Znieczulenie zewnątrzoponowe jest dostępne w większości szpitali — warto sprawdzić wcześniej zasady w Waszym.',
    source: 'Materiał edukacyjny (redakcja demo)',
  },
  {
    keywords: ['urlop ojcowski', 'tacierzyński', 'ojciec urlop', 'papa'],
    q: 'Urlop ojcowski — co wiedzieć?',
    a: 'Ojcu przysługuje płatny urlop ojcowski (2 tygodnie) oraz część urlopu rodzicielskiego, w tym pula nieprzenoszalna na matkę. Szczegółowe wymiary i zasady łączenia sprawdź według aktualnego stanu prawnego — zmieniają się, więc zweryfikuj na gov.pl lub z działem kadr.',
    source: 'Informator (demo) — zweryfikuj aktualne przepisy',
  },
  {
    keywords: ['ćwiczenia', 'cwiczenia', 'sport', 'biegać', 'biegac', 'basen', 'joga'],
    q: 'Aktywność w ciąży',
    a: 'Jeśli lekarz nie zalecił inaczej: 150 min umiarkowanej aktywności tygodniowo (spacer, basen, joga prenatalna) jest zalecane i poprawia samopoczucie. Unikaj sportów kontaktowych i z ryzykiem upadku. Ból, zawroty, krwawienie → przerwij i skonsultuj.',
    source: 'Materiał edukacyjny (redakcja demo)',
  },
  {
    keywords: [
      'sen niemowlęcia',
      'sen noworodka',
      'nie śpi',
      'nie spi',
      'wybudza',
      'jak spać',
      'bezpieczny sen',
    ],
    q: 'Bezpieczny sen niemowlęcia',
    a: 'Dziecko śpi na plecach, na twardej macie, w pustym łóżeczku (bez poduszek, kocyków luzem, maskotek), w pokoju ~18–20°C. Kojec/wózek nie zastępują łóżeczka na całonocny sen. Zasady te obniżają ryzyko SIDS.',
    source: 'Materiał edukacyjny (redakcja demo)',
  },
];

const FALLBACK: Answer = {
  text: 'Nie znalazłem tego w mojej zweryfikowanej bazie wiedzy. Spróbuj inaczej sformułować pytanie (np. „ruchy dziecka”, „OGTT”, „torba do szpitala”) albo zajrzyj do zakładki Wiedza. W sprawach zdrowotnych najpewniejszym źródłem jest lekarz lub położna.',
  source: 'Asystent (demo)',
};

export function ask(rawInput: string): Answer {
  const input = rawInput.toLowerCase();
  // 1. Twarde reguły bezpieczeństwa — zawsze nadrzędne
  if (SAFETY_KEYWORDS.some((k) => input.includes(k))) {
    return { text: CRISIS, source: 'Protokół bezpieczeństwa', isSafety: true };
  }
  // 2. Dopasowanie do bazy wiedzy po słowach kluczowych
  let best: Faq | null = null;
  let bestScore = 0;
  for (const f of FAQ) {
    const score = f.keywords.reduce((s, k) => s + (input.includes(k) ? k.length : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = f;
    }
  }
  if (!best || bestScore < 3) return FALLBACK;
  return { text: best.a, source: `📚 ${best.source}`, isSafety: false };
}

export const ASSISTANT_DISCLAIMER =
  'Jestem asystentem informacyjnym opartym o treści redakcyjne. Nie zastępuję lekarza ani położnej.';
export const SUGGESTED: string[] = [
  'Kiedy badanie OGTT?',
  'Jak liczyć ruchy dziecka?',
  'Co spakować do szpitala?',
  'Czuję się przygnębiona…',
];
