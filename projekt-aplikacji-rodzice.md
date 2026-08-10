# 📱 „Rodzic od Startu” — Kompleksowy projekt aplikacji mobilnej dla przyszłych i młodych rodziców

**Wersja dokumentu:** 1.0 | **Data:** lipiec 2026 | **Status:** koncepcja projektowa (PRD)

> Inteligentny, spersonalizowany asystent wspierający rodziców od poczęcia dziecka do jego 3. roku życia — dla mam **i** dla tatów.

---

## Spis treści

1. [Wizja i cele produktu](#1-wizja-i-cele-produktu)
2. [Grupa docelowa i persony](#2-grupa-docelowa-i-persony)
3. [Model personalizacji](#3-model-personalizacji)
4. [Architektura informacji i nawigacja](#4-architektura-informacji-i-nawigacja)
5. [Specyfikacja modułów funkcjonalnych](#5-specyfikacja-modułów-funkcjonalnych)
6. [Moduł AI](#6-moduł-ai)
7. [Wsparcie emocjonalne i partnerskie](#7-wsparcie-emocjonalne-i-partnerskie)
8. [Zarządzanie treścią medyczną (content governance)](#8-zarządzanie-treścią-medyczną)
9. [Architektura techniczna](#9-architektura-techniczna)
10. [Model danych (szkic)](#10-model-danych-szkic)
11. [Bezpieczeństwo, prywatność i RODO](#11-bezpieczeństwo-prywatność-i-rodo)
12. [Dostępność cyfrowa (WCAG 2.1)](#12-dostępność-cyfrowa-wcag-21)
13. [UX/UI — wytyczne projektowe](#13-uxui--wytyczne-projektowe)
14. [Plan wdrożenia (roadmap MVP → rozszerzenia)](#14-plan-wdrożenia)
15. [Model biznesowy](#15-model-biznesowy)
16. [KPI i analityka produktu](#16-kpi-i-analityka-produktu)
17. [Ryzyka i mitygacje](#17-ryzyka-i-mitygacje)

---

## 1. Wizja i cele produktu

**Misja:** Żaden rodzic nie powinien czuć się samotny i zagubiony. Aplikacja dostarcza rzetelną wiedzę medyczną, narzędzia organizacyjne i wsparcie emocjonalne — w odpowiednim momencie, w odpowiedniej formie, odpowiedniej osobie (mamie lub tacie).

**Wyróżnik (USP):**

- Pełna personalizacja względem **roli rodzica** (większość aplikacji jest „mamocentryczna” — my traktujemy ojca jako pełnoprawnego użytkownika, nie dodatek).
- Ciągłość: **jedna aplikacja od poczęcia do 3. roku życia** (brak „przesiadki” między aplikacją ciążową a rozwojową).
- Treści medyczne **werdykowane przez zespół specjalistów** z oznaczeniem źródeł i datą weryfikacji.
- Tryb pary: dwa profile, wspólne dziecko, wymiana zadań i wsparcie wzajemne.

**Cele mierzalne (rok 1):**

- 100 tys. pobrań, 40 tys. MAU
- Retencja D30 ≥ 35%, D90 ≥ 20%
- NPS ≥ 50
- ≥ 30% użytkowników zaprasza partnera (tryb pary)

---

## 2. Grupa docelowa i persony

| Persona                              | Opis                                                   | Kluczowe potrzeby                                                                   | Poziom wiedzy                              |
| ------------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------ |
| **Anna, 29 lat, pierwsza ciąża**     | 14. tydzień, pracuje zdalnie, dużo czyta, stresuje się | Potwierdzenie „czy to normalne”, kalendarz badań, dieta, emocje                     | Podstawowy — potrzebuje prostego języka    |
| **Marek, 32 lata, przyszły tata**    | Partner Anny; czuje się „zbędny” na wizytach           | Konkretne instrukcje: co robić, jak wspierać, co się dzieje z dzieckiem i partnerką | Podstawowy — potrzebuje treści „dla niego” |
| **Kasia, 34 lata, drugie dziecko**   | 6 mies. po porodzie, ma 3-latkę                        | Kamienie milowe, szczepienia, sen, żywienie; nie chce czytać podstaw                | Zaawansowany — tryb „doświadczony rodzic”  |
| **Piotr, 36 lat, ojciec niemowlaka** | Wraca do pracy, ograniczony czas                       | Szybkie podsumowania, delegowanie zadań, budowanie więzi „po godzinach”             | Początkujący jako rodzic                   |

**Zasada segmentacji:** `rola (matka/ojciec) × etap (ciąża T1/T2/T3 / 0–3 lata) × doświadczenie (pierwsze/kolejne dziecko)` — każda kombinacja = inna ścieżka treści i inne powiadomienia. Użytkownik „drugiego dziecka” dostaje skrótowe wersje treści („Znasz już podstawy? Pomiń”).

---

## 3. Model personalizacji

### 3.1 Onboarding (pierwsze uruchomienie)

1. Wybór roli: 👩 **Jestem mamą** / 👨 **Jestem tatą/partnerem** (opcjonalnie: inna opiekun)
2. Etap: ciąża (termin porodu lub tydzień ciąży) **lub** dziecko już jest (data urodzenia)
3. Pierwsze czy kolejne dziecko?
4. Dziecko/dzieci: imię (opcjonalnie), płeć (opcjonalnie)
5. Uwagi zdrowotne (opcjonalnie, oznaczone jako dane wrażliwe): ciąża wielopłodowa, cukrzyca ciążowa, nadciśnienie, inne — wpływa na treści i przypomnienia
6. Preferencje: powiadomienia, wielkość tekstu, język (PL domyślnie; architektura i18n od dnia 1)
7. Zaproszenie partnera (kod/SMS/link) — opcjonalne, możliwe w każdej chwili

### 3.2 Ścieżki treści

| Obszar            | 👩 Mama                                                                                               | 👨 Tata/partner                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ciąża             | Zmiany fizjologiczne tygodniowo, dieta, suplementy, aktywność fizyczna, dolegliwości, objawy alarmowe | Co dzieje się z partnerką i dzieckiem; jak pomóc przy konkretnych dolegliwościach; prawa ojca (wizyty, poród rodzinny, urlop ojcowski); przygotowanie domu |
| Poród             | Rodzaje porodu, plan porodu, torba do szpitala                                                        | Rola w sali porodowej, co mówić/robić, dokumenty, logistyka                                                                                                |
| Pospół (0–8 tyg.) | Regeneracja, karmienie, baby blues, dziennik snu dziecka                                              | Wsparcie doby poporodowej, rozpoznawanie depresji poporodowej u partnerki, przejmowanie obowiązków, więź z niemowlakiem (kontakt skóra–skóra)              |
| 0–3 lata          | Rozwój, żywienie, sen, zdrowie                                                                        | Rozwój, zabawa wg wieku, wychowanie bez przemocy, relacja partnerska po narodzinach                                                                        |
| Emocje            | Zadbaj o siebie (codzienne mikro-praktyki)                                                            | „Jak dziś możesz wesprzeć partnerkę?” + własne zdrowie psychiczne ojca                                                                                     |

### 3.3 Silnik personalizacji

- **Regułowy (MVP):** macierz `rola × etap × doświadczenie × flagi zdrowotne` → przypisane karty treści, checklisty i przypomnienia według kalendarza ciążowego/rozwojowego.
- **ML/AI (faza 2+):** rekomendacje uczące się z interakcji (czytane tematy, ukończone checklisty, logowany nastrój, wykresy wagi) — z zachowaniem reguł bezpieczeństwa (np. nigdy nie „optymalizujemy pod zaangażowanie” kosztem objawów alarmowych).

---

## 4. Architektura informacji i nawigacja

**Dolna nawigacja (5 zakładek):**

```
 🏠 Dziś      📖 Wiedza      📅 Kalendarz      📊 Dziennik      👤 Profil
```

- **Dziś** — spersonalizowany feed: „Twój tydzień 24”, karta dnia, zadania z checklisty, nadchodzące wizyty, afirmacja, wskazówka partnerska, szybkie logowanie (nastrój/waga).
- **Wiedza** — biblioteka: ciąża tydzień po tygodniu / rozwój miesiąc po miesiącu / poród / karmienie / sen / zdrowie / pierwsza pomoc / relacje; wyszukiwarka, ulubione, tryb offline.
- **Kalendarz** — wizyty, badania, szczepienia, kamienie milowe; synchronizacja Google/Apple.
- **Dziennik** — monitoring (waga, brzuch, ciśnienie, nastrój, ruchy dziecka, aktywność), notatki ze zdjęciami, „pytania do lekarza”.
- **Profil** — dane dziecka/ciazowe, partner, ustawienia, prywatność, eksport danych, język.

**Globalne:** 🔔 centrum powiadomień, 💬 przycisk chatbota AI (FAB), 🔍 wyszukiwarka, 🆘 „Objawy alarmowe / Pierwsza pomoc” zawsze w zasięgu 2 dotknięć.

---

## 5. Specyfikacja modułów funkcjonalnych

### 5.1 Moduł „Ciąża tydzień po tygodniu”

- Karta tygodnia: rozwój płodu (rozmiar = porównanie do owocu/warzywa + wizualizacja; **3D opcjonalnie w fazie 2**), zmiany u mamy, „co warto zrobić w tym tygodniu”, objawy typowe vs alarmowe.
- Oś czasu z możliwością zaglądania wstecz i (z ograniczeniem) wprzód.
- Wersja taty: ten sam tydzień, inna perspektywa („W 20. tygodniu dziecko słyszy Twój głos — porozmawiaj do brzucha”).

### 5.2 Moduł „Rozwój dziecka 0–3 lata”

- Kamienie milowe wg wieku (motoryka duża/mała, mowa, społeczne) zgodne z aktualnymi kartami rozwoju; **zastrzeżenie: każde dziecko w swoim tempie**.
- Harmonogram szczepień (PL — aktualny PSO) z przypomnieniami i odhaczaniem; uwzględnienie szczepień zalecanych.
- Propozycje zabaw i aktywności wspierających rozwój (krótkie, wg wieku).
- Miesięczne podsumowania: „Co potrafi przeciętne 9-miesięczne dziecko”.

### 5.3 Kalendarz 📅

- Typy wydarzeń: wizyta lekarska, badanie (USG, morfologia, OGTT…), szczepienie, kamień milowy, własne.
- **Autoplanowanie:** na bazie terminu porodu system proponuje harmonogram wizyt i badań zgodny ze standardami opieki prenatalnej w Polsce (użytkownik potwierdza/edytuje).
- Synchronizacja dwukierunkowa z Google Calendar / Apple Calendar (opcjonalna, wyłącznie za zgodą; dane kalendarza nie są analizowane).
- Przypomnienia konfigurowalne (dzień wcześniej/2h wcześniej), powiadomienia kontekstowe.

### 5.4 Notatnik 📝

- Szablony: objaw, pytanie do lekarza, notatka prywatna, wspomnienie (ze zdjęciem).
- Tagi, wyszukiwarka, przypięcie.
- Eksport „pytań do lekarza” do PDF przed wizytą.

### 5.5 Monitoring zdrowia (profil Mamy) 📊

- Waga (wykres z referencyjnym zakresem przyrostu), obwód brzucha, ciśnienie, nastrój (skala + emotikony + pole tekstowe), aktywność, licznik ruchów dziecka (sesje z timelinem).
- **Wykresy i analiza:** trendy tygodniowe, wykrywanie odchyleń (np. nagły skok wagi + obrzęki → karta „porozmawiaj z lekarzem o preeklampsji” — **nigdy diagnoza, zawsze odesłanie do specjalisty**).
- Po porodzie: karmienie/pieluchy (opcjonalnie), sen dziecka.

### 5.6 Checklisty ✅

- Gotowe, redagowane przez specjalistów: wyprawka, torba do szpitala, pokój dziecka, formalności po narodzinach (zaległościowo aktualizowane: akt urodzenia, dowód, PESEL, ubezpieczenie, 500+/800+ wg aktualnego stanu prawnego), powrót do pracy, żłobek/przedszkole.
- Pełna edycja, współdzielenie w trybie pary (podział zadań „kto to załatwia”), postęp %.

### 5.7 Tryb pary 💑

- Wspólny profil dziecka/ciąży; każde ma swoje konto i role.
- Widoczność: wspólny kalendarz i checklisty domyślnie; notatki i nastrój — **domyślnie prywatne** (świadome udostępnianie wybranych wpisów).
- Funkcja „poproś o pomoc” (jednym kliknięciem zadanie z checklisty trafia do partnera).
- Zgoda każdej ze stron na parowanie; rozparowanie w każdej chwili.

### 5.8 Biblioteka wideo 🎬 (faza 2)

- Ćwiczenia w ciąży i po porodzie, techniki oddechowe, pielęgnacja noworodka, pozycje karmienia — krótkie materiały z certyfikowanymi prowadzącymi; streaming + pobieranie offline.

### 5.9 Moduł pierwszej pomocy 🆘

- Instrukcje krok po kroku (resuscytacja niemowląt, zakrzztuszenie, gorączka, poparzenie, upadek) — tekst + grafika, **dostępne offline**, tryb dużych przycisków, szybki przycisk 112/999.
- Treści zgodne z aktualnymi wytycznymi resuscytacji; data ostatniej aktualizacji widoczna.

### 5.10 Społeczność (faza 3, opcjonalna) 👥

- Grupy tematyczne i wg terminu porodu; **moderacja hybrydowa** (AI + moderatorzy + zasady „zero porad medycznych od użytkowników — oznaczanie i odesłanie do wiedzy zweryfikowanej”).
- Możliwość jej całkowitego wyłączenia.

### 5.11 Integracja z wearables ⌚ (faza 3)

- Odczyt kroków/snu/tętna (HealthKit / Health Connect); smartwatch: szybkie logowanie nastroju i ruchów dziecka z nadgarstka.

### 5.12 Tryb offline

- Cała biblioteka „Wiedza” i pierwsza pomoc dostępne offline (paczka ~50–80 MB, aktualizowana).
- Notatki, monitoring, checklisty działają lokalnie i synchronizują się po odzyskaniu łączności.

---

## 6. Moduł AI

| Funkcja                           | Opis                                                                                           | Bezpieczeństwo                                                                                                                                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Chatbot-asystent**              | Q&A konwersacyjne oparte o **zamkniętą, zweryfikowaną bazę wiedzy** (RAG), z cytowaniem źródła | System prompt: „nie jestem lekarzem”; twarda detekcja objawów alarmowych i kryzysowych (np. myśli samobójcze → karta pomocy + numery telefonu zaufania); brak porad dawkowania leków poza informacją zweryfikowaną |
| **Rekomendacje spersonalizowane** | Na bazie tygodnia/wieku, historii czytania, logów (nastrój, waga) — karty „Dla Ciebie”         | Reguły medyczne nadpisują ML                                                                                                                                                                                       |
| **Analiza nastroju**              | Trend + krótki wpis głosowy/tekstowy; wykrycie przedłużonego obniżenia                         | Skala EPDS jako opcjonalny przesiew; wynik sugerujący ryzyko → delikatny komunikat + lista zasobów pomocy (zgodność z wytycznymi RPO/ZTM)                                                                          |
| **Powiadomienia kontekstowe**     | „Jesteś w 26. tygodniu — to czas na badanie OGTT” wg kalendarza badań                          | Maks. 1–2/dzień, łatwe wyłączenie, brak „ciemnych wzorców”                                                                                                                                                         |
| **Podsumowania dla taty**         | Cotygodniowe 60-sekundowe „Co się dzieje i co możesz zrobić”                                   | —                                                                                                                                                                                                                  |

Uwagi wdrożeniowe: osobna warstwa AI (orchestrator + RAG nad bazą treści), logowanie jakości odpowiedzi, przycisk „Zgłoś odpowiedź”, pełna transparentność („Ten tekst wygenerowało AI na bazie źródeł redakcyjnych”).

---

## 7. Wsparcie emocjonalne i partnerskie

- **Codzienna afirmacja / karta dnia** dopasowana do roli i etapu (nie „motywacyjny kalendarzyk” — treści pisane przez psychologa perinatalnego).
- **Dla taty:** codzienna mikro-wskazówka „Jak dziś możesz wesprzeć partnerkę” (konkret: „zagadnij o jej sen”, „przygotuj posiłek”, „odhacz badanie z kalendarza”).
- **Dla mamy:** sekcja „Zadbaj o siebie” — 3–5-minutowe praktyki (oddech, uważność, ciało po porodzie).
- **Zdrowie psychiczne:** merytoryczne artykuły o baby blues vs depresja poporodowa (też u ojców — depresja poporodowa dotyczy też mężczyzn), **zawsze z konkretnymi kontaktami**: Telefon Zaufania, Centrum Wsparcia (całodobowe 800 70 2222), linia kryzysowa dla mężczyzn, adnotacja „porozmawiaj z lekarzem”.
- **Relacja partnerska:** cykl artykułów + cotygodniowe „pytanie dla pary” (konwersacje budujące bliskość).

---

## 8. Zarządzanie treścią medyczną (content governance)

Kluczowe dla zaufania — proces, nie tylko „dobre artykuły”:

1. **Rada medyczna:** położnik/ginekolog, neonatolog/pediatra, położna, psycholog perinatalny, doradca laktacyjny (IBCLC). Nazwiska i kompetencje publikowane w aplikacji.
2. **Workflow:** autor → redakcja (język prosty, poziom czytelności) → **double review medyczny** → publikacja z metadanymi: źródła, data weryfikacji, wersja wytycznych.
3. **Rewalidacja cykliczna:** każda treść ma „termin ważności” 12 mies. lub krótszy przy zmianie wytycznych (np. harmonogram szczepień, standardy prenatalne, ERC dla pierwszej pomocy).
4. **Źródła bazowe:** wytyczne PTGiP, PTP, WHO, CDC/AAP (jako uzupełnienie), ERC; przepisy PL (urlopy, świadczenia).
5. **Zasada redakcyjna:** żadnych diagnoz; objawy alarmowe → zawsze jasna ścieżka „skontaktuj się z lekarzem/pogotowie”.

---

## 9. Architektura techniczna

### 9.1 Klient mobilny

- **React Native (New Architecture) + TypeScript** — jedna baza kodu dla iOS/Android; Expo lub bare workflow wg potrzeb natywnych (HealthKit/Health Connect).
- Nawigacja: React Navigation; stan: TanStack Query + Zustand; cache/DB lokalna: **SQLite z szyfrowaniem (SQLCipher)**; kolejka synchronizacji offline-first.
- i18n: `i18next` od dnia 1 (PL domyślnie); formatowanie dat/jednostek lokalne.
- Powiadomienia: FCM + APNs przez warstwę backendową; deeplinki do treści.

### 9.2 Backend

- API: **NestJS (Node/TS)** — REST (+ opcjonalnie GraphQL później); autoryzacja: OIDC/OAuth2 (Apple/Google/e-mail), JWT z rotacją refresh tokenów.
- Baza: **PostgreSQL 16** (dane powiązane) + Redis (cache, kolejki lekkie) + S3-compatible object storage (zdjęcia notatek, wideo; szyfrowanie SSE).
- Silnik treści: headless CMS z modelem „karta treści + targeting (rola/etap/flagi)” + wersjonowanie i daty przeglądu medycznego.
- Silnik przypomnień: schedulery per-użytkownik (kalendarz badań, szczepienia, checklisty) + reguły kontekstowe.
- Warstwa AI: osobny serwis (RAG nad zatwierdzoną bazą wiedzy, guardrails, logi jakości); brak wysyłania danych identyfikujących do modelu — pseudonimizacja kontekstu.
- Analityka produktu: privacy-first (PostHog self-hosted lub podobny), zgody granularne.
- Hosting: UE (RODO), np. AWS eu-central-1 / dostawca europejski; IaC (Terraform), CI/CD, środowiska dev/stage/prod.

### 9.3 Diagram (uproszczony)

```
[React Native App] ⇄ HTTPS/TLS ⇄ [API Gateway] ─┬─ Auth (OIDC)
   │ offline SQLite (SQLCipher)                ├─ Users/Couples Service
   ▼                                           ├─ Content CMS + Targeting
[HealthKit / Health Connect]                    ├─ Calendar/Reminders Engine
[Google/Apple Calendar sync]                    ├─ Journal/Monitoring Service
                                                ├─ AI Service (RAG, guardrails)
                                                └─ PostgreSQL · Redis · S3
```

---

## 10. Model danych (szkic)

```sql
users(id, role ENUM('mother','father','other'), locale, experience ENUM('first','experienced'),
      consent_json, created_at ...)
children(id, name_opt, birth_date OR due_date, sex_opt, created_at)
user_child_link(user_id, child_id, relation)          -- tryb pary = 2 userów ↔ 1 dziecko
health_flags(user_id, flag, note)                     -- dane wrażliwe: osobna tabela, szyfrowana kolumna
content_cards(id, module, week_from, week_to / age_from_m, age_to_m,
              roles[], experience[], flags[], body_md, sources[], medical_review_at, version)
events(id, child_id, type, title, starts_at, remind_at, source(external/local))
journal_entries(id, user_id, child_id, kind ENUM('symptom','question','private','memory'),
                body, photo_keys[], private BOOL)
measurements(id, user_id, child_id, metric ENUM('weight','belly','bp_sys','bp_dia','mood',
             'activity','kicks'), value_json, measured_at)
checklists(id, template_id?, child_id); checklist_items(id, checklist_id, title, assignee_user_id, done)
vaccinations(child_id, vaccine_code, planned_at, done_at)
chat_threads / chat_messages(id, thread_id, role, content, citations[], flagged)
mood_logs(user_id, score, note, logged_at)            -- do analizy trendu
```

Zasady: dane zdrowotne oznaczone jednoznacznie (art. 9 RODO), minimalizacja (pola `*_opt`), wszystko usuwalne kaskadowo na żądanie użytkownika.

---

## 11. Bezpieczeństwo, prywatność i RODO

| Obszar                       | Rozwiązanie                                                                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Podstawa prawna              | Zgoda (art. 6 ust. 1 lit. a) + wyraźna zgoda na dane zdrowotne (art. 9 ust. 2 lit. a); oddzielne, granularne zgody (zdrowie, powiadomienia, analityka, sync kalendarza)                                                                                       |
| Szyfrowanie                  | TLS 1.3 w tranzycie; AES-256 w spoczynku (DB, S3, kopie zapasowe); SQLCipher lokalnie na urządzeniu; klucze w KMS                                                                                                                                             |
| Dostęp                       | RBAC po stronie backendu; zasada najmniejszych uprawnień; audyt dostępu do danych zdrowotnych                                                                                                                                                                 |
| Prawa użytkownika            | Eksport danych (JSON/PDF) w aplikacji; **usunięcie konta 1 kliknięciem + kaskadowe usunięcie danych**; cofanie zgód w każdej chwili                                                                                                                           |
| Anonimizacja/pseudonimizacja | Kontekst do AI pseudonimizowany; analityka zagregowana; możliwość korzystania bez konta społeczności                                                                                                                                                          |
| Zgodność                     | DPIA przed startem; rejestr czynności; umowy powierzenia z podmiotami przetwarzającymi; dane w UE; **kwalifikacja jako produkt opieki zdrowotnej — analiza, czy aplikacja nie stanowi wyrób medyczny (MDR); jeśli tylko informacyjna — wyraźne zastrzeżenia** |
| Incident response            | Procedura zgłaszania naruszeń (72h), cykliczne testy penetracyjne, program bug-bounty w późniejszej fazie                                                                                                                                                     |

---

## 12. Dostępność cyfrowa (WCAG 2.1 poziom AA)

- Pełne wsparcie **VoiceOver (iOS) / TalkBack (Android)**: semantyczne etykiety, role, kolejność fokusu; testowane scenariusze „od onboarding do dodania pomiaru”.
- Kontrast ≥ 4.5:1 (tekst), ≥ 3:1 (elementy UI); brak przekazywania informacji samym kolorem.
- Dynamiczna wielkość tekstu (skalowanie do 200% bez utraty funkcji), min. 44×44 pt obszary dotyku.
- Język prosty w treściach (cel: poziom czytelności B1); napisy i transkrypcje do wszystkich wideo.
- Redukcja ruchu (prefers-reduced-motion), brak migania > 3/s.
- Audyt dostępności + testy z użytkownikami z niepełnosprawnościami przed każdym dużym wydaniem; deklaracja dostępności w sklepie z aplikacjami (wymóg ustawowy w UE).

---

## 13. UX/UI — wytyczne projektowe

- **Ton wizualny:** ciepły, spokojny (pastelowa paleta + wysoki kontrast w trybie dostępnym); ilustracje gender-neutralne; tryb jasny/ciemy.
- **Dwa motywy drobnych akcentów** personalizacji (rola), ale jeden spójny design system (tokens, komponenty).
- **Zasada „60 sekund dziennie jest OK”** — karta dnia i mikroakcje; głębokie treści opcjonalne.
- Dostęp jedną ręką (klawisze główne w zasięgu kciuka; karta dnia = thumb zone).
- Wykresy czytelne dla nie-specjalistów (pas referencyjny kolorowany, oś tygodni ciąży).
- Wizualizacja rozwoju płodu: ilustracje + realistyczne porównanie rozmiaru; 3D (faza 2) z opcją uproszczoną.
- Empty states edukacyjne, nigdy „puste ekrany-błędy”.
- Brak dark patterns: łatwa rezygnacja z subskrypcji, neutralne „Nie teraz” zamiast „Tak, później”.

---

## 14. Plan wdrożenia

**Faza 0 — Discovery (6–8 tyg.):** badania z użytkownikami (20+ wywiadów: mamy, tatusiowie, mamy doświadczone), warsztat z radą medyczną, prototypy klikalne, testy użyteczności, DPIA, makiety instytucjonalne.

**MVP (ok. 5–6 mies.):**

- Onboarding z rolą i datą, ścieżki treści Matka/Ojciec, tryb „pierwsze/kolejne dziecko”
- Ciąża tydzień po tygodniu + rozwój 0–12 mies. (0–3 lata w paczce 1.1)
- Kalendarz lokalny + autoplan badań + przypomnienia (bez sync zewnętrznego)
- Notatnik (tekst + zdjęcia), checklisty bazowe
- Monitoring: waga, nastrój, ruchy dziecka + wykresy
- Pierwsza pomoc offline, „Dziś”, powiadomienia kontekstowe z silnika reguł
- Prywatność: eksport, usuwanie konta, szyfrowanie, zgody

**Faza 2 (M+3–4 po MVP):**

- Tryb pary (współdzielenie, zadania), sync Google/Apple Calendar
- Chatbot AI z RAG + rekomendacje, analiza nastroju z EPDS
- Biblioteka wideo, wizualizacje 3D, rozszerzone wykresy i analityka
- Monitoring rozszerzony (ciśnienie, brzuch, karmienie/sen)

**Faza 3 (M+8–12):**

- Społeczność moderowana, integracje wearables, smartwatch companion
- Kolejne języki (i18n już gotowe), tryb „druga ciąża” pogłębiony
- Płatne konsultacje ekspertów (położna/laktacja) — jeśli biznesowo potwierdzone

---

## 15. Model biznesowy

**Freemium:**

- **Darmowe:** karta dnia, ciąża tygodniowo, rozwój, kalendarz, notatnik, monitoring podstawowy, checklisty, pierwsza pomoc, podstawowy asystent AI (limit pytań/mies.).
- **Premium (subskrypcja ~29–39 zł/mies.; roczna taniej; okres próbny 14 dni):** pełny chatbot AI bez limitów, biblioteka wideo, wizualizacje 3D, zaawansowana analityka i raporty PDF dla lekarza, checklisty premium, tryb pary+ (ułatwienia), personalizowane plany tygodnia.
- Zasada etyczna: **bezpieczeństwo zdrowotne nigdy za paywallem** (objawy alarmowe, pierwsza pomoc, kontakt do pomocy psychologicznej zawsze darmowe).

---

## 16. KPI i analityka produktu

- Aktywacja: % ukończonego onboardingu, % połączonych z partnerem, D1/D7/D30 retencja
- Zaangażowanie: MAU/DAU, karty dnia przeczytane, wpisy dziennika/tydzień, ukończenia checklist
- Wartość zdrowotna (proxy): % realizujących harmonogram badań, CTR powiadomień kontekstowych, skuteczność wykrywania ryzyka nastroju (feedback oznaczony)
- AI: CSAT odpowiedzi, % oflagowanych, % cytujących źródło, zerowa tolerancja incydentów „porady medycznej”
- Biznes: konwersja trial→paid, churn, LTV/CAC
- Jakość: crash-free sessions ≥ 99.5%, p95 API < 300 ms, NPS kwartalny

---

## 17. Ryzyka i mitygacje

| Ryzyko                                                       | Wpływ     | Mitygacja                                                                                                                            |
| ------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Ryzyko medyczne (błędna/przestarzała treść, AI „halucynuje”) | Krytyczny | Rada medyczna, cykliczne rewalidacje, AI tylko na bazie RAG z cytowaniami, guardrails, zasada „odesłanie do lekarza”, testy red-team |
| Kwalifikacja jako wyrób medyczny (MDR)                       | Wysoki    | Analiza regulacyjna na starcie; zakres informacyjny; wystrzeganie się funkcji diagnostycznych                                        |
| Naruszenie danych zdrowotnych                                | Krytyczny | Szyfrowanie, minimalizacja, pentesty, DPIA, plan IR, hosting UE                                                                      |
| Spadek retencji po porodzie                                  | Średni    | Zaplanowana „ścieżka poporodowa” osobno projektowana, treści dla obojga rodziców, moduł karmienia/snu                                |
| Pominięcie ojców w retencji                                  | Średni    | Osobny feed taty, push-y „twój moment”, mikrotreści, mierzenie retencji per rola                                                     |
| Koszty AI                                                    | Średni    | Limity, cache odpowiedzi Q&A, mały model do klasyfikacji, duży tylko do generowania                                                  |
| Moderacja społeczności                                       | Średni    | Start od małych grup, moderatorzy + AI filtr, jasne zasady, łatwe wycofanie funkcji                                                  |

---

## Załącznik A — Definition of Done (MVP), skrót

- [ ] QA na iOS/Android (min. Android 10, iOS 16+)
- [ ] Audyt bezpieczeństwa + DPIA podpisane
- [ ] Audyt WCAG 2.1 AA i deklaracja dostępności
- [ ] 100% treści z podpisem recenzenta medycznego i datą
- [ ] Testy obciążeniowe API, kopie zapasowe z testem odtworzenia
- [ ] Polityka prywatności i regulamin PL; ekrany zgód granularnych

## Załącznik B — Przykładowe treści pierwszego tygodnia użycia (próbka tonu)

- Karta mamy, tydzień 12: „Koniec I trymestru — ryzyko poronienia znacząco spada. To często moment oddechu.”
- Karta taty, tydzień 12: „Dzisiejsza mikroakcja: umówcie razem wizytę w 13. tygodniu i pojedź z nią. Twoja obecność naprawdę zmienia przebieg wizyty.”
- Miesiąc 2, niemowlę, karta taty: „Skóra do skóry działa też na tatę — 20 minut dziennie buduje więź i uspokaja dziecko.”

---

_Dokument koncepcyjny. Treści medyczne przed publikacją wymagają weryfikacji przez radę medyczną projektu._
