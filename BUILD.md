# 🛠 BUILD — instrukcja uruchomienia i wdrożenia

**Rodzic od Startu** — aplikacja (Expo/React Native) + backend (Express/TypeScript).

## 1. Wymagania

| Narzędzie | Wersja | Do czego |
|---|---|---|
| Node.js | ≥ 20 | obie części |
| Android Studio / Xcode | dowolne | development build (`expo-av`, `secure-store`, `notifications` wymagają natywnych modułów) |
| EAS CLI | `npm i -g eas-cli` | buildy na sklep |
| Docker | opcjonalnie | PostgreSQL (`backend/docker-compose.yml`) |

## 2. Aplikacja mobilna

```bash
npm install

# Szybki podgląd (bez funkcji natywnych)
npm start                    # Expo Go → skan QR

# Pełna funkcjonalność (wideo, szyfrowanie, powiadomienia)
npx expo run:android         # lub: npx expo run:ios (macOS)
# albo build w chmurze:
eas build --profile development --platform android
```

**Adres API** — `src/services/api.ts → API_URL`:
| Środowisko | Wartość |
|---|---|
| Emulator Android | `http://10.0.2.2:3000/api` |
| Symulator iOS | `http://localhost:3000/api` |
| Telefon fizyczny | `http://<IP-komputera>:3000/api` |
| Produkcja | `https://api.<domena>/api` |

## 3. Backend

```bash
cd backend && npm install

# Dev — dane w plikach JSON (zero konfiguracji)
npm run dev                               # http://localhost:3000/api/health

# Z bazą PostgreSQL
docker compose up -d
DATABASE_URL=postgres://postgres:dev@localhost:5432/rodzic \
JWT_SECRET=$(openssl rand -hex 32) \
npm run dev
```

### Zmienne środowiskowe

| Zmienna | Wymagana | Opis |
|---|---|---|
| `PORT` | nie (3000) | Port HTTP |
| `DATABASE_URL` | prod: **tak** | PostgreSQL connection string; brak → JSON dev |
| `JWT_SECRET` | prod: **tak** | Podpis JWT (HS256) — min. 32 B losowe |
| `CORS_ORIGIN` | prod: tak | Lista domen po przecinku |
| `ADMIN_TOKEN` | dla społeczności | Dostęp do kolejki moderacji |
| `OPENAI_API_KEY` | nie | Embeddings + LLM asystenta (bez klucza: tryb ekstrakcyjny offline) |
| `GOOGLE_CLIENT_IDS` | dla Sign-In | aud Google (CSV) |
| `APPLE_CLIENT_ID` | dla Sign-In | Bundle ID |
| `SOCIAL_DEV_MODE` | **tylko dev** | `true` akceptuje tokeny testowe — NIGDY w produkcji |

### Wdrożenie produkcyjne (propozycja)

```
[Apka w sklepach] → https://api.twojadomena.pl/api → [Reverse proxy TLS]
     → [Node: dist/server.js] → [PostgreSQL 16 (dane UE)]
```

Region UE (RODO) · kopie zapasowe PG z testem odtworzenia · sekrety w managerze (nie w repo).

## 4. Wydania na sklepy

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit
```

`app.json`: ikony/splash, `ios.bundleIdentifier`, `android.package`, privacy manifest (iOS 17+), opisy uprawnień (powiadomienia, opcjonalnie HealthKit/Health Connect).

## 5. Integracje opcjonalne

- **Asystent LLM**: `OPENAI_API_KEY` — bez klucza wszystko działa ekstrakcyjnie z lokalnym retrieval
- **Społeczność**: `ADMIN_TOKEN` — bez niego panel moderatora zwraca 403 (funkcja działa, kolejka nie)
- **Sign-In**: skonfiguruj Client ID Google + Apple, potem natywne przyciski przez `expo-auth-session` / `expo-apple-authentication` (funkcja `socialAuth()` gotowa)
- **Wearables**: `src/services/wearables.ts` — wykrywa moduł kroków, łagodna degradacja gdy brak

## 6. Struktura repo

```
rodzic-od-startu/
├── App.tsx                    wejście + statyczny handler nawigacji
├── src/
│   ├── navigation/            stos: Onboarding → Tabs + Assistant/Video/Community
│   ├── screens/               9 ekranów
│   ├── services/              api · sync · notifications · secureStore · assistant (offline) · wearables
│   ├── store/                 Zustand + persist (szyfrowane)
│   ├── data/                  treści demo, wideo
│   ├── theme/ i18n/ utils/ components/
└── backend/
    ├── src/server.ts          REST API (helmet + rate-limit)
    ├── src/storage.ts         Storage: PgStorage / JsonStorage
    ├── src/auth.ts oidc.ts    JWT + Apple/Google Sign-In
    ├── src/assistant.ts retrieval.ts knowledge.ts
    ├── src/community.ts       społeczność + automoderacja
    └── docker-compose.yml     PostgreSQL 16
```

## 7. Problemy?

| Objaw | Rozwiązanie |
|---|---|
| Aplikacja nie łączy się z API | sprawdź `API_URL` wg tabeli wyżej + `curl /api/health` |
| Brak powiadomień | wymagany development build, nie Expo Go |
| Wideo się nie buforuje | demo-stream; podmień `DEMO_STREAM` w `src/data/videos.ts` |
| `401` po restarcie backendu dev | zmieniony `JWT_SECRET` → w aplikacji połącz parę ponownie |
