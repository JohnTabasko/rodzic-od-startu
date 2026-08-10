# Backend — Rodzic od Startu (v0.5)

REST API: konta anonimowe (JWT), parowanie partnerów, synchronizacja wspólnego kalendarza i checklist.

## Szybki start

```bash
npm install
npm run dev            # tryb dev: dane w data.json
```

## PostgreSQL (produkcyjny sterownik)

```bash
docker compose up -d   # PostgreSQL 16
DATABASE_URL=postgres://postgres:dev@localhost:5432/rodzic \
JWT_SECRET=$(openssl rand -hex 32) \
npm run dev            # auto-migracja schematu przy starcie
```

Sterownik wybierany automatycznie: `DATABASE_URL` ustawione → `PgStorage`, inaczej `JsonStorage` (dev). Interfejs `Storage` (`src/storage.ts`) mapuje się 1:1 na docelowe repozytoria NestJS.

## Bezpieczeństwo
- Tokeny **JWT (HS256, exp 90 dni)** — w bazie przechowywany **wyłącznie hash SHA-256** tokenu
- Sfałszowany podpis/payload → 401
- Docelowo: OIDC (zewnętrzny issuer, JWKS), Apple/Google Sign-In; migracja = wymiana `verifyToken`
- `DELETE /api/account` — kaskadowe usunięcie użytkownika i członkostwa w parze (RODO)

## Sync (merge)
- Zdarzenia: per-rekord **last-write-wins** po `updatedAt` + **tombstone** (`deletedIds`) dla propagacji usunięć
- Checklisty: timestamp per klucz + soft-OR (raz odhaczone zostaje)
- `GET /api/sync/events?since=<ISO>` — synchronizacja przyrostowa

## Endpointy
| Metoda | Ścieżka | Opis |
|---|---|---|
| GET | `/api/health` | status + tryb storage |
| POST | `/api/auth/anon` | konto anonimowe → JWT |
| POST | `/api/pair/create` · `pair/join` · `pair/leave` | parowanie kodem 6-znakowym |
| GET | `/api/pair/status` | status pary |
| PUT/GET | `/api/sync/events` | wspólny kalendarz (+tombstone) |
| PUT/GET | `/api/sync/checklist` | wspólne checklisty |
| DELETE | `/api/account` | usunięcie konta |

## 🤖 Asystent AI (v0.6 — krok RAG)

`POST /api/assistant/ask` `{ "question": "…" }` →
`{ answer, source, docId, reviewedAt, isSafety }`

- **Baza wiedzy** (`src/knowledge.ts`): każdy dokument ma `id`, źródło i **datę recenzji medycznej** — pola te trafiają do cytowania i logów; produkcyjnie z CMS + pgvector
- **Guardrails twarde:** frazy alarmowe/kryzysowe → zawsze protokół bezpieczeństwa (112/999, 800 70 22 22), sprawdzane przed dopasowaniem
- **Log jakości** (`assistant.log`, JSONL): `ts, q_hash, docId, isSafety, latencyMs` — **bez treści pytań** (pseudonimizacja, RODO) → metryki: pokrycie bazy, % fallbacków, czas odpowiedzi
- Walidacja wejścia (max 1000 znaków, niepuste → 400)

## 🛡 Hardening API (v0.7)

- **helmet**: HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, CSP, wyłączone `X-Powered-By`
- **Rate-limiting**: globalny 300/15 min + wrażliwe trasy: `/auth/anon` 10/min, `/assistant/ask` 20/min (standardowe nagłówki `RateLimit-*`)
- **CORS** konfigurowalny przez `CORS_ORIGIN` (lista domen po przecinku; dev: otwarte)
- Spójne odpowiedzi błędów JSON: `404 NOT_FOUND`, `500 INTERNAL` — bez leaku stacka
- ✅ Test E2E: nagłówki bezpieczeństwa obecne, limity odpalają dokładnie przy 10 i 20 (429), klient aplikacji pokazuje przyjazny komunikat przy `RATE_LIMITED`

## 🧠 Retrieval semantyczny + LLM (v0.8 — krok RAG 2)

- **`retrieval.ts`**: wektoryzacja n-gramów (dim 384, działa offline) lub **OpenAI embeddings** przy `OPENAI_API_KEY` (cache w RAM); interfejs zgodny z docelowym `ORDER BY embedding <=> $1` (pgvector)
- Scoring: `max(semantyka, 0.6·semantyka + 0.4·bonus słownikowy)`, próg kalibrowany testem — **8/8** przypadków (parafrazy, literówki, out-of-scope → fallback)
- **Opcjonalny LLM** (`gpt-4o-mini`): odpowiada WYŁĄCZNIE z pobranego dokumentu z wymuszonym cytatem docId; przy braku klucza/błędu → odpowiedź ekstrakcyjna. Guardrails zawsze pierwsze.
- Odpowiedź zawiera `mode` (crisis/extractive/llm/fallback) i `score`; log jakości rozszerzony o te pola
- Zmienne: `OPENAI_API_KEY` (opcjonalne) — bez niej system w pełni działa ekstrakcyjnie

## 🔑 Apple/Google Sign-In (v0.9 — OIDC)

`POST /api/auth/social` `{ provider: "google"|"apple", idToken }` → `{ userId, token, role, isNew }`

- Weryfikacja **id_token po stronie serwera**: JWKS dostawcy (cache), RS256, kontrola `iss` + `aud` + `exp`
- **find-or-create** po `external_sub` (unikalny indeks; kolumny `provider`/`external_sub`/`email` dodane migracją w PgStorage)
- Zmienne: `GOOGLE_CLIENT_IDS` (csv), `APPLE_CLIENT_ID` — bez nich `aud` nie jest ograniczane (tylko dev)
- `SOCIAL_DEV_MODE=true` → testy E2E tokenami z `dev:true` (bez podpisu) — **wyłączyć w produkcji**
- ✅ Test E2E: pierwsze logowanie tworzy konto, ponowne logowanie tym samym `sub` → to samo konto; token bez flagi dev → 401; JWT z social działa na pozostałych trasach
- Klient niezbędny w aplikacji: `expo-auth-session` + skonfigurowane Client ID (Google) / `expo-apple-authentication` (iOS) → funkcja `socialAuth()` w `services/api.ts` już gotowa

## 👥 Społeczność moderowana (v1.0)

- 4 grupy demo (Pierwsze dziecko · Tata strefa · Karmienie · Sen); lista bez treści prywatnych użytkownika
- **Moderacja hybrydowa**: automoderacja (wzorce porad medycznych: dawkowanie, nazwy leków, antyszczepionkowość; wzorce wyzwisk) → `flagged` do kolejki człowieka; neutralne treści → auto-approve
- Autor: **pseudonim** (hash ID) dla innych — data minimalization
- Kolejka moderatora: `x-admin-token` (env `ADMIN_TOKEN`) · `GET /api/moderation/queue` · `POST /api/moderation/:id {action}`
- ✅ Test E2E: neutralny post approved · porada medyczna flagged z komunikatem edukacyjnym · 403 bez tokena admina · reject działa
- Persystencja demo: `community.json` (docelowo: tabele PostgreSQL)
