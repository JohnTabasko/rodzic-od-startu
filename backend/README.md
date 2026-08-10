# Backend — Rodzic od Startu

REST API dla anonimowych kont, trybu pary, synchronizacji wspólnego kalendarza i checklist,
asystenta oraz moderowanej społeczności.

## Uruchomienie

```bash
npm ci
npm run dev
```

API działa domyślnie na `http://localhost:3000`. Sprawdzenie:

```bash
curl http://localhost:3000/api/health
```

Brak `DATABASE_URL` oznacza lokalny `JsonStorage`. Runtime artifacts (`data.json`,
`community.json`, `assistant.log`) są tworzone w katalogu backendu i nie są śledzone przez Git.

## PostgreSQL

```bash
docker compose up -d
DATABASE_URL=postgres://postgres:dev@localhost:5432/rodzic \
JWT_SECRET="$(openssl rand -hex 32)" \
CORS_ORIGIN=http://localhost:8081 \
npm run dev
```

Połączenie z `DATABASE_URL` przełącza backend na `PgStorage`, a migracje schematu wykonują się
przy starcie.

## Zmienne środowiskowe

Pełny przykład znajduje się w `.env.example`.

| Zmienna             | Opis                                                     |
| ------------------- | -------------------------------------------------------- |
| `NODE_ENV`          | `development`, `test` lub `production`                   |
| `PORT`              | port HTTP, domyślnie `3000`                              |
| `DATA_DIR`          | opcjonalny katalog runtime dla JSON/logów                |
| `DATABASE_URL`      | wymagane w produkcji; bez niego JSON storage             |
| `JWT_SECRET`        | wymagany w produkcji, minimum 32 znaki                   |
| `CORS_ORIGIN`       | jawna lista originów rozdzielona przecinkami w produkcji |
| `ADMIN_TOKEN`       | token kolejki moderacji                                  |
| `OPENAI_API_KEY`    | opcjonalny retrieval/LLM                                 |
| `GOOGLE_CLIENT_IDS` | dozwolone aud dla Google OIDC                            |
| `APPLE_CLIENT_ID`   | dozwolone aud dla Apple OIDC                             |
| `SOCIAL_DEV_MODE`   | tylko lokalne testy, musi być wyłączone w produkcji      |

Konfiguracja jest walidowana podczas startu. Produkcja nie uruchomi się z domyślnym sekretem,
JSON storage, wildcardem CORS ani trybem social dev.

## API

| Metoda   | Ścieżka               | Opis                                     |
| -------- | --------------------- | ---------------------------------------- |
| GET      | `/api/health`         | status i aktywny storage                 |
| POST     | `/api/auth/anon`      | konto anonimowe i JWT                    |
| POST     | `/api/auth/social`    | Apple/Google OIDC → lokalny JWT          |
| POST     | `/api/pair/create`    | utworzenie kodu pary                     |
| POST     | `/api/pair/join`      | dołączenie kodem                         |
| GET      | `/api/pair/status`    | liczba członków i rola partnera          |
| POST     | `/api/pair/leave`     | rozłączenie                              |
| PUT/GET  | `/api/sync/events`    | kalendarz, LWW i tombstones              |
| PUT/GET  | `/api/sync/checklist` | checklista z soft-OR                     |
| DELETE   | `/api/account`        | usunięcie konta i członkostwa            |
| POST     | `/api/assistant/ask`  | Q&A z guardrails                         |
| GET/POST | `/api/community/...`  | grupy, posty i automoderacja             |
| GET/POST | `/api/moderation/...` | kolejka moderatora przez `x-admin-token` |

Payloady wydarzeń, checklist i postów są walidowane po stronie API. Daty kalendarza muszą być
prawidłowymi datami `YYYY-MM-DD`, a timestampy kanonicznym UTC ISO-8601.

## Synchronizacja

- wydarzenia: last-write-wins po `updatedAt`;
- usunięcia: tombstones przekazywane przez `deletedIds`;
- checklista: timestamp per klucz i soft-OR, więc odhaczenie nie zostaje przypadkowo cofnięte;
- synchronizacja wymaga dokładnie dwóch członków pary.

## Asystent

`POST /api/assistant/ask` zwraca `answer`, `source`, `docId`, `reviewedAt`, `isSafety`, `mode` i `score`.

Guardrails są wykonywane przed retrievalem. Log jakości zawiera hash pytania i metadane,
ale nie zapisuje jego treści. Przy braku `OPENAI_API_KEY` działa lokalna wektoryzacja i odpowiedź
ekstrakcyjna.

## Jakość

```bash
npm run typecheck
npm run build
npm test
```

Testy znajdują się w `tests/` i wykorzystują `node:test`.
