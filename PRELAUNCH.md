# ✅ PRE-LAUNCH CHECKLIST — „Rodzic od Startu"

Definition of Done przed publikacją (rozwinięcie Załącznika A dokumentu koncepcyjnego). Legenda: ✅ gotowe · 🔧 wymaga pracy/środowiska · ⬜ do zaplanowania.

## 1. Prawo i RODO
- ✅ Eksport danych użytkownika (JSON) i usunięcie konta w aplikacji
- ✅ Minimalizacja danych (konta anonimowe; pola zdrowotne oznaczone)
- ✅ Dane i logi bez treści wrażliwych (log asystenta: hash pytań)
- 🔧 DPIA podpisana z IOD; rejestr czynności przetwarzania
- 🔧 Polityka prywatności + regulamin PL (prawnik), zgody granularne w onboarding
- 🔧 Umowy powierzenia z poddostawcami (hosting UE, OpenAI — jeśli używany, inżynier transferu danych do USA!)
- 🔧 Ocena MDR: aplikacja informacyjna (nie wyrób medyczny) — opinia prawna + zastrzeżenia w UI

## 2. Bezpieczeństwo
- ✅ Szyfrowanie lokalne (SecureStore), JWT z hashed storage, helmet, rate-limit, spójne 404/500
- ✅ Tombstone/merge bez konfliktów współbieżnych w PgStorage (ON CONFLICT)
- 🔧 Pentest zewnętrzny aplikacji + API przed startem
- 🔧 Sekrety w managerze; rotacja `JWT_SECRET` i `ADMIN_TOKEN`; `SOCIAL_DEV_MODE=false`
- 🔧 Kopie PG + **test odtworzenia backupu** (udokumentowany)
- 🔧 Procedura naruszeń (72 h) + kontakt security@

## 3. Medycyna i treści
- 🔧 **100% treści z podpisem recenzenta rady medycznej** (położnik, neonatolog, psycholog perinatalny, IBCLC) — w tym demo-treści z `content.ts` i `knowledge.ts`
- 🔧 Daty recenzji widoczne przy wiedzy/asystencie (mechanizm ✅ — dane do rewizji)
- 🔧 Ustalony cykl rewalidacji (12 mies. lub przy zmianie wytycznych: PSO, standardy prenatalne, ERC)
- 🔧 Test red-team asystenta: 50+ wariantów objawów alarmowych → 100% ingerencji guardrails
- ⬜ Program „zgłoś odpowiedź AI" z SLA reakcji redakcji

## 4. Dostępność (WCAG 2.1 AA)
- ✅ Kontrasty zmierzone skryptem (10/10 ≥ 4.5:1), role a11y, live-region, 44×44, duży tekst
- 🔧 Pełny przepływ z **TalkBack i VoiceOver** na urządzeniach fizycznych (onboarding → logowanie nastroju → asystent)
- 🔧 Test 200% skalowania bez scrolla poziomego; napisy/transkrypcje wszystkich wideo (1.2.2)
- 🔧 Deklaracja dostępności w sklepach + strona dostępności

## 5. Jakość i wydajność
- ✅ Typecheck obu części w CI-like flow; testy E2E backendu (sync, auth, asystent, społeczność, hardening)
- 🔧 Crash-free ≥ 99,5% (Sentry/Crashlytics); p95 API < 300 ms pod obciążeniem (k6)
- 🔧 Testy na matrycy urządzeń (Android 10–15, iOS 16+), tryb offline wszystkich modułów offline-capable
- ⬜ Automatyzacja E2E w CI (GitHub Actions: typecheck + testy backendu)

## 6. Sklep i marketing
- 🔧 Zrzuty ekranu PL (obie role!), opis, słowa kluczowe, privacy labels (App Store), Data safety (Play)
- 🔧 Klasyfikacja wiekowa, strona produktu, wsparcie + FAQ
- ⬜ Landing + plan soft-launch (beta z TestFlight/Play Internal, 100–200 rodziców)

## 7. Operacje i produkt
- 🔧 Monitoring: uptime API, kolejka moderacji SLA < 24 h, alert logu asystenta (skoki `crisis`/`fallback`)
- 🔧 Test onboardingu z 10+ rodzicami (obie role); ankieta NPS w aplikacji po 7 dniach
- ⬜ Panel redakcyjny CMS (treści/wideo/FAQ) — obecnie edycja plików `data/*`
- ⬜ Roadmap post-launch: pełny RAG+LLM, CMS, panel moderatora web, i18n kolejne języki

> **Bramka release:** punkty 🔧 z sekcji 1–4 muszą być ✅. Sekcje 5–7 według oceny ryzyka zespołu.

## 8. Zależności (npm audit)
- Backend: 0 podatności ✅
- Aplikacja: 18 raportów (12 moderate/5 high/1 critical) — **wszystkie w dev-dependency** Expo/Metro (np. cacache), nie w kodzie produkcyjnym apki
- Zasada: NIE `npm audit fix --force` (łamie przypięcie wersji SDK 52 + RN 0.76); naprawa = aktualizacja do nowszego Expo SDK (zaakceptować podczas pierwszego cyklu upgrade'ów) + cykliczny przegląd przy każdym release
- 🔧 przed launch: `npm audit --omit=dev` jako bramka CI (tylko podatności runtime mają znaczenie dla produktu)
