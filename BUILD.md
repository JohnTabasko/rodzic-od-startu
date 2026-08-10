# BUILD — uruchomienie i wdrożenie

## Wymagania

- Node.js 20+;
- Git;
- Android Studio lub Xcode dla development build;
- Docker opcjonalnie dla PostgreSQL;
- EAS CLI opcjonalnie dla buildów w chmurze.

## Instalacja

Z katalogu głównego repozytorium:

```bash
npm ci
npm ci --prefix backend
```

`npm ci` jest zalecane w CI i przed release, ponieważ korzysta z lockfile.

## Development

### Backend — JSON storage

```bash
cd backend
npm run dev
```

Backend słucha na `http://localhost:3000`. Health check:

```bash
curl http://localhost:3000/api/health
```

W trybie JSON pliki `data.json`, `community.json` i `assistant.log` są runtime artifacts
ignorowanymi przez Git. Nie należy używać tego storage w produkcji.

### Aplikacja — Expo Go

W drugim terminalu, z katalogu głównego:

```bash
npm start
```

Do testów na urządzeniu fizycznym ustaw `EXPO_PUBLIC_API_URL` na adres komputera dostępny
w tej samej sieci Wi-Fi. Przykład:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.34:3000/api npm start
```

### Development build

Expo Go nie udostępnia wszystkich modułów natywnych. Dla powiadomień, SecureStore,
wideo i integracji z urządzeniem użyj:

```bash
npx expo run:android
# macOS + Xcode:
npx expo run:ios
```

Albo EAS:

```bash
npm install --global eas-cli
eas build --profile development --platform android
eas build --profile development --platform ios
```

## PostgreSQL

```bash
cd backend
docker compose up -d
DATABASE_URL=postgres://postgres:dev@localhost:5432/rodzic \
JWT_SECRET="$(openssl rand -hex 32)" \
CORS_ORIGIN=http://localhost:8081 \
npm run dev
```

Schemat jest tworzony przez `PgStorage.migrate()` przy starcie backendu.

W produkcji konfiguracja jest walidowana przy starcie. Wymagane są `DATABASE_URL`, silny
`JWT_SECRET`, jawny `CORS_ORIGIN` i `NODE_ENV=production`. Zobacz `backend/.env.example`.

## Integracje opcjonalne

- `OPENAI_API_KEY` — embeddingi i odpowiedzi LLM; brak klucza uruchamia lokalny retrieval/
  odpowiedź ekstrakcyjną;
- `ADMIN_TOKEN` — dostęp do `/api/moderation/queue` i moderacji;
- `GOOGLE_CLIENT_IDS`, `APPLE_CLIENT_ID` — weryfikacja OIDC;
- `SOCIAL_DEV_MODE=true` — wyłącznie lokalne testy, nigdy produkcja;
- integracja Health Connect jest obecnie łagodnym fallbackiem; HealthKit wymaga osobnego modułu,
  zgód i konfiguracji natywnej.

## Kontrola jakości

```bash
npm run typecheck
npm run backend:typecheck
npm run backend:build
npm --prefix backend test
npm run format:check
npm run verify
```

## Release checklist techniczny

1. Ustaw `NODE_ENV=production` i wszystkie wymagane sekrety w secret managerze.
2. Uruchom `npm ci` oraz `npm run verify`.
3. Uruchom testy backendu i testy integracyjne z PostgreSQL.
4. Zbuduj aplikację przez EAS dla iOS i Androida.
5. Sprawdź uprawnienia powiadomień, politykę prywatności, Data Safety i privacy manifest.
6. Skonfiguruj TLS/reverse proxy, backup PostgreSQL, monitoring i procedurę rollbacku.
7. Wykonaj test urządzeniowy: onboarding, tryb offline, parowanie, synchronizacja,
   usuwanie konta, powiadomienia, TalkBack i VoiceOver.
