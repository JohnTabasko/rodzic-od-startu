# 🚀 Pełna instrukcja uruchomienia — „Rodzic od Startu"

Przewodnik od zera do działającej aplikacji na telefonie z backendem. Trzy ścieżki — wybierz swoją:

| Ścieżka                      | Czas    | Co dostaniesz                                                          |
| ---------------------------- | ------- | ---------------------------------------------------------------------- |
| 🟢 **Szybka** (bez backendu) | ~10 min | Aplikacja na telefonie: onboarding, treści, dziennik, asystent offline |
| 🟡 **Standardowa**           | ~25 min | + backend lokalny: asystent serwerowy, tryb pary, społeczność          |
| 🔵 **Pełna**                 | ~50 min | + PostgreSQL, development build, wideo offline, powiadomienia push     |

---

## KROK 0 — Wymagania (jednorazowo)

**Na komputerze (Windows / macOS / Linux):**

1. **Node.js ≥ 20** — sprawdź:

   ```bash
   node -v    # ma być v20.x.x lub nowszy
   ```

   Brak? Pobierz z https://nodejs.org (wersja LTS) lub przez nvm:

   ```bash
   # macOS/Linux:
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   nvm install 20 && nvm use 20
   ```

2. **Git** (opcjonalnie): `git --version`

3. Tylko 🔵 ścieżka pełna:
   - **Docker Desktop** (PostgreSQL) — https://www.docker.com/products/docker-desktop
   - **Android Studio** (development build Androida) albo **Xcode** (iOS, tylko macOS)

**Na telefonie:**

- Zainstaluj **Expo Go** ze sklepu (App Store / Google Play) — wystarczy do ścieżek 🟢 i 🟡
- Telefon i komputer muszą być w **tej samej sieci Wi-Fi**

---

## KROK 1 — Pliki projektu

Jeśli masz projekt jako katalog (np. z workspace): przejdź do niego w terminalu:

```bash
cd rodzic-od-startu
```

Jeśli z repozytorium: `git clone <adres> && cd rodzic-od-startu`

Struktura, którą powinieneś zobaczyć:

```
rodzic-od-startu/
├── App.tsx  package.json  app.json        ← aplikacja mobilna
├── src/                                    ← kod aplikacji
└── backend/                                ← serwer API
```

---

## KROK 2 — 🟢 SZYBKI START (tylko aplikacja)

```bash
npm ci              # instaluje wersje z package-lock
npm start            # uruchamia Expo Dev Server
```

W terminalu pojawi się **kod QR**:

- **Android:** otwórz Expo Go → „Scan QR code”
- **iPhone:** otwórz aplikację **Aparat** → skieruj na kod → kliknij powiadomienie „Open in Expo Go”

✅ Powinien załadować się ekran powitalny (onboarding). Kod na telefonie odświeża się na żywo przy każdej zmianie plików.

> ⚠️ W Expo Go **nie działają**: powiadomienia push, szyfrowanie SecureStore, wideo (aplikacja i tak wystartuje, a te funkcje aktywują się dopiero w development build — KROK 5). Jeśli widzisz błąd o brakującym module natywnym — przejdź od razu do KROKU 5.

**Pierwsze kroki w aplikacji (scenariusz testowy):**

1. Wybierz rolę: 👩 **Jestem mamą**
2. Etap: **Jesteśmy w ciąży**, termin np. `2026-12-01` (format zawsze RRRR-MM-DD)
3. Zaznacz „Tak, pierwsze” → **Rozpocznij**
4. Na „Dziś” zobaczysz kartę Twojego tygodnia + automatycznie dopisane badania (USG, OGTT…) w Kalendarzu
5. 💬 kliknij przycisk czatu i zapytaj: „kiedy badanie OGTT?” — zadziała **tryb offline**

---

## KROK 3 — 🟡 BACKEND (tryb pary, asystent online, społeczność)

W **nowym oknie terminalu** (aplikacja dalej działa w pierwszym):

```bash
cd backend
npm ci
npm run dev
```

Powinno wypisać:

```
Storage: JSON (dev) — ustaw DATABASE_URL dla PostgreSQL
API → http://localhost:3000/api/health
```

**Test:** otwórz http://localhost:3000/api/health w przeglądarce → `{"ok":true,...}`

### Połączenie aplikacji z backendem

Ustaw publiczną zmienną build-time `EXPO_PUBLIC_API_URL` (przykład znajduje się w `.env.example`):

```bash
EXPO_PUBLIC_API_URL=http://IP-KOMPUTERA:3000/api npm start
```

| Gdzie testujesz                | Co wpisać                      |
| ------------------------------ | ------------------------------ |
| Emulator Android               | `http://10.0.2.2:3000/api`     |
| Symulator iOS                  | `http://localhost:3000/api`    |
| **Telefon fizyczny (Expo Go)** | `http://IP-KOMPUTERA:3000/api` |

IP komputera znajdziesz: `ipconfig` (Windows → IPv4), `ifconfig | grep inet` (macOS/Linux) — np. `http://192.168.1.34:3000/api`.

Zrestartuj aplikację (w terminalu Expo: `r`, albo zamknij i otwórz w Expo Go).

### Weryfikacja ścieżki 🟡

1. **Asystent online:** 💬 pytanie → pod odpowiedzią ma być „**recenzja medyczna: RRRR-MM-DD**” (dane z serwera, nie offline)
2. **Tryb pary:** Profil → „💑 Tryb pary” → **Utwórz kod dla partnera** → z drugiego telefonu (lub tymczasowo w tej samej apce po resecie) → **Połącz kodem** → zielony napis „Konta połączone” + wskaźnik 🟢 przy tytule
3. **Sync:** dodaj wydarzenie w Kalendarzu → u partnera pojawi się po ~3 s (auto-sync)
4. **Społeczność:** Wiedza → „👥 Społeczność” → wybierz grupę → opublikuj post (porada medyczna typu „podaj 2 ml ibuprofenu” trafi do moderacji — to celowe zachowanie)

---

## KROK 4 — 🔵 PostgreSQL (opcjonalnie, trwalsza baza)

```bash
cd backend
docker compose up -d      # startuje PostgreSQL 16 (port 5432)
DATABASE_URL=postgres://postgres:dev@localhost:5432/rodzic \
JWT_SECRET=testowy-sekret-32-znaki-minimum-abcdef \
npm run dev
```

Teraz start wypisze `Storage: PostgreSQL`, a health pokaże `"storage":"postgresql"`. Schemat tworzy się sam.

> Windows (PowerShell): zmienne ustawia się tak:
>
> ```powershell
> $env:DATABASE_URL="postgres://postgres:dev@localhost:5432/rodzic"; $env:JWT_SECRET="test-sekret-32-znaki-minimum-x1"; npm run dev
> ```

---

## KROK 5 — 🔵 Development build (push, wideo, szyfrowanie)

**Android (najprościej):**

```bash
npx expo run:android
```

(wymaga Android Studio + SDK; skrypt sam zbuduje APK i wgra na emulator/podłączony telefon)

**iOS (tylko Mac):** `npx expo run:ios`

**Bez lokalnego SDK (dowolny OS):**

```bash
npm i -g eas-cli && eas login
eas build --profile development --platform android   # APK pobierzesz z linku
```

Po starcie development buildu działa:

- 🔔 **Powiadomienia** — przypomnienie o wydarzeniu dzień wcześniej o 9:00 (dodaj testowe wydarzenie na jutro, żeby zaplanować)
- 🎬 **Wideo** — Wiedza → „Biblioteka wideo” → ▶ i ⬇ Offline
- 🔐 **SecureStore** — dane zapisują się zaszyfrowane (działa to przezroczycie)
- ⌚ **Kroki** — Dziennik → „Aktywność” (wymaga zgody i modułu)

---

## KROK 6 — Funkcje opcjonalne (env backendu)

```bash
cd backend
ADMIN_TOKEN=moj-sekret \              # kolejka moderacji: /api/moderation/queue
OPENAI_API_KEY=sk-... \               # embeddings + LLM asystenta (bez klucza: tryb ekstrakcyjny — też działa)
SOCIAL_DEV_MODE=true \                # TYLKO DEV: testy Apple/Google Sign-In bez kluczy
npm run dev
```

> ⚠️ `SOCIAL_DEV_MODE=true` nigdy w produkcji. Prawdziwy Sign-In wymaga Client ID Google/Apple + natywnych przycisków (`expo-auth-session`), funkcja `socialAuth()` w aplikacji jest już gotowa.

---

## ✅ Weryfikacja — pełna checklista „działa”

| #   | Test                 | Gdzie                   | Oczekiwany efekt                                        |
| --- | -------------------- | ----------------------- | ------------------------------------------------------- |
| 1   | Onboarding           | start                   | 4 kroki, potem 5 zakładek                               |
| 2   | Treści dla roli      | Dziś                    | Mama i tata widzą RÓŻNE teksty dla tego samego tygodnia |
| 3   | Autoplan badań       | Kalendarz               | ~9 pozycji (USG, OGTT…) z datami                        |
| 4   | Nastrój              | Dziś → emoji            | Dziennik rysuje słupek                                  |
| 5   | Licznik ruchów       | Dziennik                | kliknięcia → „✅ Sesja pełna” przy 10                   |
| 6   | Waga / ciśnienie     | Dziennik                | wpis; ≥140/90 → ⚠ czerwone                             |
| 7   | Asystent             | 💬 „jaka będzie pogoda” | uczciwy fallback (nie zgaduje)                          |
| 8   | Guardrail            | 💬 „krwawienie”         | od razu protokół 112/999                                |
| 9   | Tryb pary            | Profil                  | kod → para → sync wydarzeń obustronnie                  |
| 10  | Usunięcie wydarzenia | Kalendarz               | znika też u partnera (tombstone)                        |
| 11  | Wideo                | Wiedza → 🎬             | odtwarza; ⬇ → znacznik 📥 offline                      |
| 12  | Społeczność          | Wiedza → 👥             | post lekowy → komunikat o moderacji                     |
| 13  | Eksport/reset        | Profil                  | JSON z danymi; reset wraca do onboardingu               |

---

## 🆘 Rozwiązywanie problemów

| Problem                                                  | Przyczyna                          | Rozwiązanie                                                                                        |
| -------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| „Network request failed” w apce                          | zły `API_URL` / backend nie działa | `curl http://<adres>:3000/api/health`; sprawdź tabelę IP w KROKU 3; telefon i PC w tej samej sieci |
| Błąd o module natywnym (SecureStore/Video/Notifications) | Expo Go nie ma modułu              | development build (KROK 5); apka z Expo Go działa w trybie okrojonym                               |
| QR nie skanuje / zawieszenie na „Bundling”               | zaporowe sieci                     | `npm start -- --tunnel` (wolniejsze, ale omija sieć lokalną)                                       |
| `401` po restarcie backendu                              | zmienił się `JWT_SECRET`           | para: rozłącz i sparuj ponownie; konto anonimowe tworzy się z automatu                             |
| Asystent nie pokazuje „recenzji medycznej”               | brak połączenia z API              | działa w trybie offline — to poprawne; sprawdź API                                                 |
| Limity „RATE_LIMITED”                                    | za dużo zapytań w teście           | poczekaj minutę — limit auth 10/min, asystent 20/min                                               |
| Docker: port 5432 zajęty                                 | lokalna instancja PG               | zmień port w compose (`"5433:5432"`) i w `DATABASE_URL`                                            |

---

## 📋 Cheat-sheet — najczęstsze komendy

```bash
# APLIKACJA
npm ci && npm start                         # start dev
r                                            # reload w terminalu Expo
npm run typecheck                            # kontrola typów

# BACKEND
cd backend
npm run dev                                  # dev (JSON)
docker compose up -d                         # PostgreSQL
DATABASE_URL=... JWT_SECRET=... npm run dev  # prod-like
curl http://localhost:3000/api/health        # test
cat backend/assistant.log                    # log jakości asystenta
```

Powodzenia! 🤱 W razie problemów zacznij od tabeli „Rozwiązywanie problemów” — 95% przypadków to adres API albo Expo Go zamiast development build.
