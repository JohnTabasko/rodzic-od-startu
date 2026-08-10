# PRE-LAUNCH CHECKLIST

Legenda: ✅ wykonane w kodzie · 🔧 wymaga konfiguracji/audytu/urządzenia · ⬜ planowane.

## 1. Prawo i RODO

- ✅ eksport danych do JSON;
- ✅ usunięcie konta lokalnego i backendowego przez `DELETE /api/account`;
- ✅ minimalizacja danych: konto anonimowe, prywatne dane zdrowotne poza synchronizacją pary;
- ✅ log asystenta nie zapisuje treści pytania;
- 🔧 DPIA, rejestr czynności przetwarzania i konsultacja z IOD;
- 🔧 polityka prywatności, regulamin, zgody i procedura praw osób;
- 🔧 umowy powierzenia z hostingiem, dostawcami AI i analityki;
- 🔧 ocena MDR oraz kwalifikacja aplikacji jako produktu informacyjnego.

## 2. Bezpieczeństwo

- ✅ JWT HS256 z przechowywaniem hashy tokenów;
- ✅ jawne wymuszenie silnego `JWT_SECRET` i PostgreSQL w produkcji;
- ✅ Helmet, CORS z konfiguracją produkcyjną, rate limiting i walidacja payloadów;
- ✅ LWW/tombstones wydarzeń oraz soft-OR checklist;
- ✅ usunięcie runtime data files z repozytorium;
- ✅ `npm audit --omit=dev` backendu nie zgłasza podatności po wymuszeniu bezpiecznego `ip-address`;
- 🔧 `npm audit --omit=dev` frontendu nadal raportuje 11 wysokich podatności transitive w Metro/image-size używanych przez Expo SDK 57 — wymagają aktualizacji upstream, nie wymuszonego `npm audit fix`;
- 🔧 test penetracyjny i przegląd zależności;
- 🔧 sekrety w secret managerze, rotacja i kontrola dostępu;
- 🔧 backup PostgreSQL i udokumentowany test odtworzenia;
- 🔧 TLS/reverse proxy, monitoring, alerty i procedura naruszeń;
- 🔧 audyt fallbacku SecureStore → AsyncStorage — fallback nie zapewnia szyfrowania.

## 3. Medycyna i treści

- 🔧 recenzja wszystkich treści przez właściwy zespół medyczny;
- 🔧 podpis recenzenta, źródło, data i cykl ponownej weryfikacji;
- 🔧 aktualizacja PSO, standardów prenatalnych, zaleceń dotyczących snu i zdrowia psychicznego;
- 🔧 red-team guardrails: minimum 50 wariantów objawów alarmowych;
- 🔧 procedura zgłoszenia błędnej odpowiedzi i SLA redakcji;
- 🔧 formalny disclaimer w aplikacji i polityka odpowiedzialności.

## 4. Dostępność

- ✅ kontrasty, role accessibility, live-region asystenta, obszary dotyku min. 44 pt;
- ✅ przełącznik dużego tekstu;
- 🔧 pełny przepływ TalkBack i VoiceOver na urządzeniach fizycznych;
- 🔧 test powiększenia 200% bez poziomego scrolla;
- 🔧 napisy i transkrypcje wszystkich materiałów wideo;
- 🔧 deklaracja dostępności.

## 5. Jakość

- ✅ typecheck frontendu i backendu;
- ✅ backend build oraz testy `node:test`;
- ✅ formatowanie i kontrola Prettier;
- 🔧 testy integracyjne z PostgreSQL;
- 🔧 testy urządzeniowe Android 10–15 i iOS 16+;
- 🔧 E2E onboarding → para → sync → rozparowanie → usunięcie konta;
- 🔧 crash reporting, p95 API i testy obciążeniowe;
- ⬜ CI z `npm ci`, `npm run verify`, testami backendu i audytem zależności.

## 6. Integracje i sklep

- 🔧 prawdziwe materiały wideo z CDN, napisami i transkrypcjami;
- 🔧 konfiguracja Google/Apple Sign-In i natywnych przycisków;
- 🔧 pełna integracja Health Connect/HealthKit, zgody i privacy manifest;
- 🔧 ikony, splash screen, opis uprawnień i Data Safety;
- 🔧 klasyfikacja wiekowa, privacy labels i strona wsparcia;
- 🔧 TestFlight/Play Internal z grupą pilotażową.

## Bramka release

Publikacja nie powinna nastąpić, dopóki punkty 🔧 z sekcji 1–4 nie zostaną zamknięte,
a treści demonstracyjne nie zostaną zastąpione zatwierdzonym materiałem produkcyjnym.
