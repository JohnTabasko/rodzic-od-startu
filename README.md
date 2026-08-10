# 🤱 Rodzic od Startu

> Warstwa wizualna: system projektowy inspirowany załączonym prototypem

Aplikacja mobilna „Rodzic od Startu” wspierająca rodziców od ciąży do ukończenia przez dziecko 3 lat.
Projekt składa się z aplikacji Expo/React Native oraz backendu Express/TypeScript.

> **Status:** demonstrator/MVP. Treści medyczne, wideo i integracje zewnętrzne wymagają
> weryfikacji i konfiguracji przed publikacją komercyjną.

## Zakres

- onboarding: mama/tata, ciąża/dziecko, termin porodu/data urodzenia;
- karta „Dziś” z treściami dopasowanymi do roli;
- wiedza tydzień po tygodniu i rozwój dziecka miesiąc po miesiącu;
- automatyczny plan badań prenatalnych i kalendarz;
- dziennik: nastrój, notatki, waga, obwód brzucha, ciśnienie i ruchy dziecka;
- checklista torby do szpitala;
- asystent Q&A z lokalnym fallbackiem i nadrzędnymi guardrails bezpieczeństwa;
- tryb pary: wspólny kalendarz i checklista, z prywatnością danych zdrowotnych;
- biblioteka wideo z pobieraniem offline — obecnie materiały demonstracyjne;
- społeczność z pseudonimami i automoderacją porad medycznych.

## Stack

### Aplikacja mobilna

- Expo SDK 57, React Native 0.86, TypeScript;
- React Navigation;
- Zustand z persystencją przez SecureStore (blokowanie dużych wartości);
- `expo-notifications`, `expo-video`, `expo-file-system`, `expo-font` i `@expo/vector-icons`;
- język domyślny: polski.

### Backend

- Express + TypeScript;
- JWT HS256 dla kont anonimowych, w bazie przechowywany jest hash tokenu;
- `JsonStorage` wyłącznie do developmentu, `PgStorage` dla produkcji;
- PostgreSQL z migracją schematu przy starcie;
- Helmet, CORS, rate limiting, walidacja payloadów;
- opcjonalnie: OpenAI retrieval/LLM oraz Apple/Google Sign-In.

## Uruchomienie lokalne

### 1. Zależności

Wymagany Node.js 20 lub nowszy.

```bash
npm ci
npm ci --prefix backend
```

### 2. Backend

Tryb lokalny korzysta z JSON-owego storage. Pliki danych powstają podczas uruchomienia i są ignorowane przez Git.

```bash
cd backend
npm run dev
# API: http://localhost:3000/api/health
```

### 3. Aplikacja

W drugim terminalu:

```bash
npm start
```

Expo Go wystarcza do podstawowego podglądu. Powiadomienia, SecureStore, odtwarzanie wideo
oraz integracje natywne wymagają development build:

```bash
npx expo run:android
# albo na macOS:
npx expo run:ios
```

### Adres backendu w aplikacji

Adres jest konfigurowany przez publiczną zmienną build-time `EXPO_PUBLIC_API_URL`.
Przykłady znajdują się w `.env.example`.

| Środowisko          | Wartość                          |
| ------------------- | -------------------------------- |
| emulator Android    | `http://10.0.2.2:3000/api`       |
| symulator iOS / web | `http://localhost:3000/api`      |
| telefon fizyczny    | `http://<IP-komputera>:3000/api` |
| produkcja           | `https://api.<domena>/api`       |

Expo automatycznie wczytuje zmienne `EXPO_PUBLIC_*` podczas bundlowania. Nie umieszczaj w nich sekretów.

## PostgreSQL i konfiguracja backendu

```bash
cd backend
docker compose up -d
DATABASE_URL=postgres://postgres:dev@localhost:5432/rodzic \
JWT_SECRET="$(openssl rand -hex 32)" \
CORS_ORIGIN=http://localhost:8081 \
npm run dev
```

Pełna lista zmiennych znajduje się w `backend/.env.example`. W produkcji wymagane są:

- `NODE_ENV=production`;
- `DATABASE_URL`;
- `JWT_SECRET` o długości co najmniej 32 znaków;
- jawnie określone `CORS_ORIGIN` — bez wildcardu;
- `SOCIAL_DEV_MODE` wyłączone.

## Kontrola jakości

```bash
npm run typecheck
npm run backend:typecheck
npm run backend:build
npm --prefix backend test
npm run format:check
npm run verify
npx expo-doctor
npx expo export --platform web
```

Testy backendu korzystają z wbudowanego `node:test` i obejmują między innymi:

- walidację dat, wydarzeń, checklist i wpisów społeczności;
- guardrails asystenta;
- LWW/tombstone dla wydarzeń;
- soft-OR dla checklist;
- JSON storage.

## Prywatność i bezpieczeństwo

- Dane zdrowotne są lokalne i nie należą do synchronizowanych danych pary.
- Konto anonimowe nie wymaga adresu e-mail.
- `DELETE /api/account` usuwa konto backendowe i członkostwo w parze.
- Log asystenta zapisuje hash pytania, a nie jego treść.
- Dane runtime (`backend/data.json`, `backend/community.json`, `backend/assistant.log`) nie są częścią repozytorium.
- Domyślne sekrety działają wyłącznie w development; konfiguracja produkcyjna jest walidowana przy starcie.

## Struktura

```text
├── App.tsx
├── src/
│   ├── navigation/       nawigacja i zakładki
│   ├── screens/          ekrany aplikacji
│   ├── services/         API, synchronizacja, powiadomienia, storage
│   ├── store/            stan aplikacji Zustand
│   ├── data/             demonstracyjne treści i wideo
│   └── components/       współdzielone komponenty UI
├── backend/
│   ├── src/server.ts     API Express
│   ├── src/storage.ts    adapter JSON/PostgreSQL
│   ├── src/validation.ts walidacja wejścia
│   ├── src/config.ts     konfiguracja i walidacja środowiska
│   └── tests/            testy backendu
├── BUILD.md
├── PRELAUNCH.md
└── projekt-aplikacji-rodzice.md
```

## Przed publikacją

Projekt nie jest jeszcze gotowy do publikacji jako produkt medyczny lub komercyjna usługa.
Przed release konieczne są co najmniej: recenzja treści przez zespół medyczny, polityka prywatności,
DPIA/RODO, pentest, testy TalkBack/VoiceOver, prawdziwe materiały wideo z napisami, monitoring,
backup/restore PostgreSQL oraz konfiguracja sklepów Apple/Google.

Szczegółowa checklista znajduje się w `PRELAUNCH.md`.
