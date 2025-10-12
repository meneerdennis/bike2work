# Bike2Work — Fietsregistratie (React)

Korte projectbeschrijving

Kleine React-app om je gefietste dagen bij te houden, een maandoverzicht te tonen en een vergoeding te berekenen.

Belangrijkste features

- Google-authenticatie via Firebase
- Dagen registreren via de kalender of de knop "Vandaag gefietst"
- Maandoverzicht in een staafdiagram (Recharts)
- Instellingen voor enkele-rit afstand en vergoeding per km
- Data export/import (JSON)

Geschikt voor lokale ontwikkeling en eenvoudige deployment (bijv. Netlify, Vercel of GitHub Pages).

## Snelle start

- Dependencies installeren

```bash
yarn install
# of: npm install
```

- Lokale Firebase-config aanmaken (zie sectie hieronder)

- Ontwikkelserver starten

```bash
yarn start
# of: npm start
```

- Open de app in je browser: [http://localhost:3000](http://localhost:3000)

## Firebase configuratie

De app gebruikt Firebase (Authentication en Firestore). Maak een lokaal bestand `src/firebaseConfig.js` dat het configuratie-object als default export bevat.

Er is een voorbeeldbestand aanwezig: `src/firebaseConfig.example.js`.

Maak je lokale config door het voorbeeld te kopiëren en je eigen waarden in te vullen:

```bash
cp src/firebaseConfig.example.js src/firebaseConfig.js
# of: kopieer handmatig en vul waarden in
```

Let op: `src/firebaseConfig.js` staat in `.gitignore` zodat je keys niet naar de repository worden gepusht.

Alternatief (aanbevolen): gebruik environment-variabelen (Create React App)

- Kopieer het voorbeeldbestand `.env.example` naar `.env.local` in de projectroot:

```bash
copy .env.example .env.local
# of op mac/linux: cp .env.example .env.local
```

- Vul je Firebase-waarden in `.env.local`. De app leest variabelen met het `REACT_APP_` prefix.

- Start de dev-server of build zoals gewoonlijk. `.env.local` staat in `.gitignore` en wordt niet gecommit.

## Voorkom per ongeluk committen van secrets

We hebben een eenvoudige pre-commit hook toegevoegd die gestage bestanden scant op veelvoorkomende secretpatronen (API-keys, private key headers). Om dit lokaal te gebruiken:

Installeer `pre-commit` (Python):

```bash
pip install pre-commit
```

Installeer hooks in je repository:

```bash
pre-commit install
```

Vanaf nu voert `pre-commit` bij elke commit het script `scripts/check_for_secrets.sh` uit en blokkeert de commit als er vermoedelijke secrets worden gevonden.

Je kunt de hook handmatig testen op alle bestanden:

```bash
pre-commit run --all-files
```

## Deployment

Build de app en deploy de inhoud van de `build/` map naar je hostingprovider:

```bash
yarn build
# of: npm run build
```

Als je Firebase Hosting gebruikt, configureer `firebase.json` en gebruik `firebase deploy`.

## Projectstructuur (kort)

- `src/` — broncode
- `src/App.js` — hoofdcomponent en gebruikersinterface
- `src/firebaseConfig.example.js` — voorbeeldconfig (in repo)
- `src/firebaseConfig.js` — lokale config (NIET in repo)
- `public/` — statische bestanden

## Tips & privacy

- Firebase client keys zijn niet volledig gevoelig, maar behandel ze als secrets en deel ze niet publiek.
- Overweeg environment-variabelen of een secret manager voor productie.
