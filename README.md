# 🤱 Rodzic od Startu — MVP v0.3 (React Native / Expo + backend)

Implementacja na podstawie dokumentu koncepcyjnego (`../projekt-aplikacji-rodzice.md`).

## Uruchomienie

**Aplikacja mobilna:**
```bash
npm install
npm start              # Expo Go (na szybki podgląd)
npx expo run:android   # lub eas build — wymagane dla expo-notifications / secure-store
```

**Backend (tryb pary / sync):**
```bash
cd backend && npm install
npm run dev            # API na http://localhost:3000/api
# Adres API w aplikacji: src/services/api.ts → API_URL
# (emulator Android: 10.0.2.2 · iOS sim: localhost · telefon: IP komputera)
```

## Zaimplementowane

### v0.1 — szkielet MVP
Onboarding z rolą (👩/👨) i etapem · karta dnia osobno dla mamy i taty · treści tygodniowe/miesięczne · autoplan badań · kalendarz · notatki · checklisty · nastrój+waga · eksport JSON · duży tekst (WCAG)

### v0.2 — powiadomienia, szyfrowanie, monitoring, asystent
- 🔔 Przypomnienia push dzień przed wydarzeniem (9:00)
- 🔐 Szyfrowana trwałość (SecureStore: Keychain / Keystore) z adapterem blokowym
- 📊 Licznik ruchów dziecka (10/2 h), obwód brzucha, ciśnienie z flagą ≥140/90
- 💬 Asystent Q&A z **twardymi guardrails** (objawy alarmowe/kryzys → 112/999, 800 70 22 22)

### v0.3 — backend + tryb pary
**Serwer REST (`/backend`, Express+TS, persystencja JSON deweloperska; architektura zgodna z docelową NestJS+PostgreSQL):**
| Endpoint | Opis |
|---|---|
| `POST /api/auth/anon` | konto anonimowe (minimum danych — RODO) |
| `POST /api/pair/create` / `pair/join` / `pair/leave` | parowanie kodem 6-znakowym, rozparowanie w każdej chwili |
| `GET /api/pair/status` | status pary + rola partnera |
| `PUT/GET /api/sync/events` | wspólny kalendarz; merge per-rekord last-write-wins |
| `PUT/GET /api/sync/checklist` | wspólne checklisty (soft-OR: raz odhaczone zostaje) |
| `DELETE /api/account` | usunięcie konta + wypisanie z pary |

**Aplikacja:** profil → sekcja „💑 Tryb pary" (tworzenie kodu / dołączanie / synchronizacja / rozłączenie). Wspólne: kalendarz + checklisty. **Prywatne zostają:** notatki, nastrój, dane zdrowia — zgodnie z zasadą domyślnej prywatności z dokumentu.
✅ Test E2E pełnego przepływu (2 konta → parowanie → sync w obie strony → rozparowanie → 401) — przechodzi.

## Status realizacji względem dokumentu PRD

| Wymaganie | Status |
|---|---|
| Role i ścieżki treści | ✅ |
| Treści tygodniowe/miesięczne | ✅ (demo, do weryfikacji medycznej) |
| Kalendarz + autoplan + **push** | ✅ |
| Monitoring (nastrój, waga, ruchy, brzuch, ciśnienie) | ✅ |
| Notatnik, checklisty | ✅ |
| Szyfrowanie lokalne | ✅ (docelowo SQLCipher i na backendzie) |
| Chatbot z guardrails | ✅ regułowy (RAG+LLM = kolejny krok) |
| **Tryb pary + backend** | ✅ MVP (auth anonimowy; OIDC = kolejny krok) |
| WCAG 2.1 AA | 🟡 atrybuty/kontrast/duży tekst (audyt = kolejny krok) |
| Wideo, 3D, społeczność, wearables | ⬜ Faza 3 |

## Następne kroki w kolejce
1. Health-check w aplikacji + auto-sync po każdej zmianie kalendarza/checklisty (dziś: przycisk ręczny)
2. Audyt dostępności TalkBack/VoiceOver + poprawki
3. Migracja backendu: PostgreSQL + OIDC + SQLite/sync z konfliktami (danych prywatnych → wspólnych wg zgody)
4. Asystent → pełny RAG po stronie serwera z cytowaniem i logiem jakości

> Treści medyczne demonstracyjne — przed publikacją wymagana weryfikacja rady medycznej (workflow w dokumencie koncepcyjnym).

---

## v0.4 — auto-sync + audyt dostępności (wcześniejszy krok w kolejce)

**Auto-sync trybu pary** (`services/sync.ts`)
- Debounce 3 s po każdej zmianie wspólnych danych (dodanie/usunięcie wydarzenia, odhaczenie checklisty) — bez ręcznego przycisku
- Synchronizacja też przy starcie aplikacji i tuż po sparowaniu
- Health-check API: wskaźnik 🟢/🔴 przy tronie pary (Profil)
- Znane ograniczenie MVP: usuwanie wydarzeń nie propaguje jeszcze tombstone (kolejka: PostgreSQL + pełny sync)

**Audyt dostępności (WCAG 2.1 AA)**
- ✅ Zmierzony skrypt kontrast **wszystkich par kolorów** — 10/10 par ≥ 4.5:1 po korekcie `warning` (#B26A00 → #9A5B00)
- ✅ `accessibilityLiveRegion="polite"` na odpowiedziach asystenta (czytnik ogłasza je automatycznie)
- ✅ `accessibilityRole="header"` na ekranowych nagłówkach — nawigacja nagłówkami w TalkBack/VoiceOver
- Zachowane: role button/checkbox/link, etykiety wszystkich pól, obszary dotyku ≥44×44 pt, dynamiczna wielkość tekstu (przełącznik + `useType`)
- Do zrobienia z urządzeniem: pełny przepływ TalkBack/VoiceOver, kolejność fokusu modali, test 200% skalowania bez skrollowania poziomego

---

## v0.5 — PostgreSQL + JWT + pełny sync (tombstone)

**Backend:** wymienna warstwa `Storage` (`storage.ts`) — `PgStorage` przy `DATABASE_URL` (auto-migracja schematu: users/couples/events/checklist, ON CONFLICT last-write-wins) i `JsonStorage` do dev. Auth na **JWT HS256** (exp 90 dni; **w bazie tylko hash SHA-256 tokenu**), przygotowane pod OIDC — wymiana `verifyToken` wystarczy. `docker-compose.yml` z PostgreSQL 16 w repo.
✅ Test E2E: parowanie, LWW, **propagacja usunięcia** (deletedIds → tombstone widoczne u partnera), odrzucenie sfałszowanego JWT (401).

**Aplikacja:** `removeEvent` zapisuje tombstone, `autoSync` wysyła `deletedIds` i merguje pełny pull (usuwa lokalne po stronie partnera). Znane wcześniej ograniczenie **domknięte**.

## Następne kroki w kolejce
1. Asystent → serwerowe RAG (endpoint `/api/assistant/ask` z cytowaniem i logiem jakości odpowiedzi)
2. Pełny przepływ TalkBack/VoiceOver na urządzeniu fizycznym
3. Rate-limiting, helmet, strukturyzowane logi; PostgreSQL jako jedyny sterownik w produkcji
4. Apple/Google Sign-In (OIDC) zamiast kont anonimowych

---

## v0.6 — asystent na serwerze (krok RAG)

- `POST /api/assistant/ask`: baza wiedzy z datami recenzji medycznej (`knowledge.ts`), twarde guardrails, cytaty źródeł, log jakości JSONL **bez treści pytań** (hash SHA-256 → RODO)
- ✅ Test E2E: pytanie o cukier → brak dopasowania → fraza alarmowa (guardrail nadrzędny) → 400 na puste
- Aplikacja: asystent pyta serwera i pokazuje **„recenzja medyczna: RRRR-MM-DD"** pod odpowiedzią; przy braku sieci automatycznie przełącza się na lokalny silnik offline (guardrails działają w obu trybach); bąbelek „pending" + live-region
- Następny krok: podmiana dopasowywania na pgvector + LLM z wymuszonym cytowaniem `docId`; metryka pokrycia bazy z logów jakości

---

## v0.7 — hardening API

helmet (HSTS/nosniff/XFO/CSP) · rate-limit (API 300/15min, auth 10/min, asystent 20/min) · CORS per `CORS_ORIGIN` · spójne 404/500 JSON bez stacków · aplikacja: ładny komunikat przy 429 zamiast cichego błędu

---

## v0.8 — retrieval semantyczny + LLM dla asystenta

Lokalna wektoryzacja n-gramów (offline) + opcjonalne OpenAI embeddings/LLM (wymuszony cytat docId, timeouty, fallback ekstrakcyjny) · scoring semantyka+keywords skalibrowany testem 8/8 · odpowiedź z `mode`/`score` w logu jakości · guardrails bez zmian nadrzędne

---

## v0.9 — Apple/Google Sign-In (OIDC)

Backend weryfikuje id_token przez JWKS (RS256, iss/aud/exp), find-or-create po `external_sub` (unikalny indeks SQL + JSON) · `SOCIAL_DEV_MODE` do testów E2E (find-or-create ✅, 401 na zły token ✅, JWT działa dalej ✅) · aplikacja: funkcja `socialAuth()` w api; natywne przyciski po skonfigurowaniu `expo-auth-session` / `expo-apple-authentication` z prawdziwymi Client ID

---

## v1.0 — biblioteka wideo (Faza 3) + społeczność moderowana

**🎬 Wideo** (`VideoLibraryScreen`): katalog 8 materiałów w 4 kategoriach z ekspertem i datą recenzji, odtwarzanie przez expo-av, **pobieranie offline** (FileSystem), wejście z zakładki Wiedza; docelowo napisy/transkrypcje (WCAG 1.2.2)
**👥 Społeczność (beta)**: backend — grupy, posty z pseudonimami autorów, **automoderacja porad medycznych** → kolejka moderatora (ADMIN_TOKEN); aplikacja — ekran z zasadami „zero porad medycznych", lista, publikowanie; zgodne z zasadą wyłączalności modułu
PEŁNY ZAKRES DOKUMENTU PRD: wszystkie bloki Fazy 1–3 mają swoją implementację lub gotowe fundamenty ✅

---

## Dodane do projektu (finalizacja)
- 📘 **BUILD.md** — pełna instrukcja uruchomienia dev/prod (apka, backend, zmienne, sklepy, troubleshooting)
- ✅ **PRELAUNCH.md** — checklista przed publikacją (prawo/RODO · bezpieczeństwo · medycyna · dostępność · jakość · sklep · ops)
- 🗺 **docs/architektura.html** — interaktywne podsumowanie architektury (mapa systemu, moduły, przepływ asystenta, status 10 wydań)
- ⌚ **wearables.ts** — kroki z Health Connect/HealthKit z łagodną degradacją (karta „Aktywność” w Dzienniku)
