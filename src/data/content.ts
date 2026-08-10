// Treści startowe (demo) — docelowo z CMS, z podpisem recenzenta medycznego i datą weryfikacji.
import { addDays } from '../utils/dates';

export type Role = 'mother' | 'father';

export interface WeekCard {
  week: number;
  mother: { title: string; summary: string; tips: string[] };
  father: { title: string; summary: string; tips: string[] };
}

export const weekCards: WeekCard[] = [
  {
    week: 12,
    mother: {
      title: 'Koniec I trymestru',
      summary: 'Ryzyko poronienia znacząco spada. Dziecko ma ok. 5–6 cm — jak limonka. USG do 13+6 tyg. określa wiek ciążowy.',
      tips: ['Zadbaj o foliany i wit. D (zgodnie z zaleceniami lekarza)', 'Zapisz się na USG I trymestru, jeśli jeszcze nie byłaś', 'Krótkie spacery poprawiają samopoczucie'],
    },
    father: {
      title: 'Dziecko jak limonka',
      summary: 'Do 13+6 tyg. warto pojechać razem na USG — Twoja obecność naprawdę zmienia przebieg wizyty.',
      tips: ['Umówcie razem wizytę i bądź na niej', 'Poproś o zdjęcie z USG dla Was obojga', 'Zapytaj partnerkę, jak się dziś czuje'],
    },
  },
  {
    week: 20,
    mother: {
      title: 'Połowa drogi',
      summary: 'USG połówkowe oceniania rozwój malucha. Możesz już czuć pierwsze ruchy — jak „motyle w brzuchu”.',
      tips: ['USG połówkowe między 18. a 22. tygodniem', 'Obserwuj ruchy dziecka — za jakiś czas poznasz rytm', 'Zadbaj o nawodnienie i odpoczynek z nogami wyżej'],
    },
    father: {
      title: 'Pierwsze kopnięcia',
      summary: 'W 20. tygodniu dziecko słyszy Twój głos — rozmawiaj do brzucha. Wkrótce możesz poczuć kopnięcia dłonią.',
      tips: ['Codziennie pogadaj do brzucha 5 minut', 'Poproś, żeby przycisnąć Twoją dłoń przy ruchach', 'Przejmij dziś jeden obowiązek domowy'],
    },
  },
  {
    week: 26,
    mother: {
      title: 'Obciążeniowa próba glukozy',
      summary: 'Między 24. a 28. tygodniem standardem jest badanie OGTT (cukrzyca ciążowa).',
      tips: ['Umów OGTT, jeśli jesteś między 24. a 28. tygodniem', 'Sprawdź, czy żelazo i morfologia są aktualne', 'Objawy alarmowe: silny ból głowy, plamienie, brak ruchów — kontakt z lekarzem'],
    },
    father: {
      title: 'Logistyka przed badaniem',
      summary: 'OGTT trwa ok. 2 godziny — odwieź partnerkę, weź coś do przeczytania, plan posiłku na zaraz po.',
      tips: ['Zarezerwuj wolne na badanie', 'Przygotuj kanapkę na po badaniu', 'Zadbaj o spokojny wieczór wcześniej'],
    },
  },
  {
    week: 32,
    mother: {
      title: 'III trymestr w pełni',
      summary: 'Dziecko waży ok. 1,7 kg. Czas przygotować torbę do szpitala i plan porodu.',
      tips: ['Zamknij torbę do szpitala (checklista w zakładce Wiedza)', 'Omów z lekarzem preferencje porodu', 'Zacznij zapisywać pytania przed kolejną wizytą'],
    },
    father: {
      title: 'Plan na dzień porodu',
      summary: 'Ustalcie trasę do szpitala, ładowarkę, dokumenty i „opiekuna zwierząt / starszego dziecka”.',
      tips: ['Przejedź trasę do szpitala', 'Sprawdź zasady porodu rodzinnego w Waszym szpitalu', 'Miej naładowany powerbank'],
    },
  },
  {
    week: 37,
    mother: {
      title: 'Dzień może nadejść w każde chwili',
      summary: 'Skurcze przepowiadające? Ucz się rozpoznawać prawdziwe skurcze: regularne, narastające.',
      tips: ['W razie krwawienia, odejścia wód lub osłabionych ruchów dziecka — kontakt ze szpitalem od razu', 'Odpoczywaj ile potrzebujesz', 'Miej numer na izbę przyjęć pod ręką'],
    },
    father: {
      title: 'Ostatnia prosta',
      summary: 'Bądź osiągalny telefonicznie. Lista rzeczy „na teraz”: auto zatankowane, fotelik sprawdzony.',
      tips: ['Zainstaluj i sprawdź fotelik', 'Trzymaj telefon z pełną baterią', 'Wiedz, jak przyjąć telefon „zaczyna się”'],
    },
  },
  {
    week: 40,
    mother: {
      title: 'Termin porodu',
      summary: 'Tylko ~5% dzieci rodzi się w terminie — od 37. do 42. tygodnia jest w normie. Kontrole jak zleci lekarz.',
      tips: ['Liczenie ruchów dziecka codziennie', 'Ustal z lekarzem plan po 40. tygodniu', 'Śpij, kiedy się da — nadrabianie będzie trudne'],
    },
    father: {
      title: 'Wsparcie w oczekiwaniu',
      summary: 'Czekanie bywa stresujące. Rozładowuj sytuację: spacer, kino w domu, spokojne rozmowy.',
      tips: ['Organizuj spokojne wieczory', 'Potwierdź dyspozycyjność w pracy', 'Nie pytaj „jeszcze nic?” 10 razy dziennie 😊'],
    },
  },
];

export function getWeekCard(week: number): WeekCard {
  const eligible = weekCards.filter(c => c.week <= week);
  return eligible.length ? eligible[eligible.length - 1] : weekCards[0];
}

// --------- Rozwój dziecka 0–36 msc. (skrót demo) ---------
export interface MonthCard { month: number; title: string; development: string; play: string; }
export const monthCards: MonthCard[] = [
  { month: 0, title: 'Pierwszy miesiąc', development: 'Dziecko skupia wzrok na 20–30 cm — idealnie na Twoją twarz przy karmieniu.', play: 'Kontakt skóra-do-skóry (też u taty!), spokojne rozmawianie.' },
  { month: 3, title: 'Trzeci miesiąc', development: 'Pierwsze gulgane, utrzymuje główkę, śledzi przedmioty wzrokiem.', play: 'Czas na brzuszku w małych dawkach, kontrastowe plansze.' },
  { month: 6, title: 'Szósty miesiąc', development: 'Siada z podparciem / samodzielnie, przekłada przedmioty, czas rozszerzania diety wg zaleceń.', play: 'Zabawki do chwytania, pokazywanie i nazywanie rzeczy.' },
  { month: 9, title: 'Dziewiąty miesiąc', development: 'Raczkuje lub pełza, lęk separacyjny to norma rozwojowa.', play: 'A-kuku, „koniki na luniki”, chowany przedmiot.' },
  { month: 12, title: 'Pierwsze urodziny', development: 'Pierwsze kroki lub blisko, pierwsze wyrazy, rozumie proste polecenia.', play: 'Stosy z kubeczków, układanki z dużymi elementami, wspólne „czytanie” obrazków.' },
  { month: 24, title: 'Dwa lata', development: 'Łączy słowa w proste zdania, faza „nie!” — budowanie samodzielności.', play: 'Zabawy naśladowcze, proste zadania „pomóż mi”.' },
  { month: 36, title: 'Trzy lata', development: 'Prawdziwe rozmowy, zabawy z rówieśnikami, rozwija się wyobraźnia.', play: 'Zabawy w odgrywanie ról, puzzle, biegi i huśtawka.' },
];
export function getMonthCard(months: number): MonthCard {
  const eligible = monthCards.filter(c => c.month <= months);
  return eligible.length ? eligible[eligible.length - 1] : monthCards[0];
}

// --------- Checklista: torba do szpitala ---------
export const hospitalBag = [
  'Dokumenty: dowód osobisty, karta ciąży, wyniki badań, grupa krwi',
  'Wygodna koszula do porodu i karmienia',
  'Bielizna jednorazowa + wkłady poporodowe',
  'Kosmetyki i ręczniki',
  'Szczoteczka, pasty, szlafrok, klapki',
  'Ubranka dla dziecka (56–62), pieluchy noworodkowe',
  'Rękawiczki, czapeczka, kołderka',
  'Przekąski, woda, ładowarka, powerbank',
  'Fotelik samochodowy (sprawdzony przed wyjazdem!)',
  'Notatki: pytania do położnej, plan porodu',
];

// --------- Automatyczny harmonogram badań (wg standardów opieki prenatalnej PL, uproszczony) ---------
export interface PlannedEvent { title: string; weekFrom: number; weekTo: number; type: 'badanie'|'wizyta'|'szczepienie'; }
export const prenatalSchedule: PlannedEvent[] = [
  { title: 'Pierwsza wizyta + potwierdzenie ciąży', weekFrom: 6, weekTo: 10, type: 'wizyta' },
  { title: 'USG I trymestru (ocena wieku ciążowego)', weekFrom: 11, weekTo: 14, type: 'badanie' },
  { title: 'Badania krwi: morfologia, grupa, HBsAg', weekFrom: 11, weekTo: 14, type: 'badanie' },
  { title: 'USG II trymestru (połówkowe)', weekFrom: 18, weekTo: 22, type: 'badanie' },
  { title: 'OGTT — obciążenie glukozą', weekFrom: 24, weekTo: 28, type: 'badanie' },
  { title: 'Wizyta kontrolna + morfologia', weekFrom: 28, weekTo: 32, type: 'wizyta' },
  { title: 'USG III trymestru', weekFrom: 28, weekTo: 32, type: 'badanie' },
  { title: 'Wizyta kontrola + posiew z pochwy', weekFrom: 33, weekTo: 37, type: 'wizyta' },
  { title: 'Wizyta tygodniowa (stan przedporodowy)', weekFrom: 38, weekTo: 39, type: 'wizyta' },
];

/** Zamienia tydzień ciąży na datę na podstawie terminu porodu. */
export function planPrenatalEvents(dueISO: string): { id: string; title: string; date: string; type: PlannedEvent['type'] }[] {
  return prenatalSchedule.map((e, i) => {
    const midWeek = Math.round((e.weekFrom + e.weekTo) / 2);
    return {
      id: `prenatal-${i}`,
      title: `${e.title} (ok. ${e.weekFrom}–${e.weekTo} tydz.)`,
      date: addDays(dueISO, -(40 - midWeek) * 7),
      type: e.type,
    };
  });
}

// --------- Ostrzeżenia / alarmowe (zawsze widoczne) ---------
export const emergencyNotice = '🆘 Objawy alarmowe (silny ból, krwawienie, odejście wód, osłabione ruchy dziecka, wysoka gorączka): nie czekaj — zadzwoń na izbę przyjęć lub 112/999.';
export const mentalHealthNotice = '💛 Jeśli od dłuższego czasu czujesz się przygnębiona/y: to częste i można temu zaradzić. Porozmawiaj z lekarzem lub zadzwoń do Centrum Wsparcia (całodobowe 800 70 2222).';
