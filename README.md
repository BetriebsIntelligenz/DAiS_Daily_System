# DAiS App

Mobile-first Next.js Umsetzung der DAiS Programme inklusive Score-Dashboard, Rewards, Journale und Admin-Flows.

## Features

- Kategorie-Menü (Mind, Body, Human, Environment, Business) mit Programmlisten
- Dynamische Formularengine für Programme/Units/Exercises inkl. XP-Buchung
- Score Dashboard mit Kategorieverteilung und Aktivitätsfeed
- Rewards mit Einlöse-Workflow und XP-Transaktionen
- Journale (Lern, Erfolg, Dankbarkeit) als Append-only Logs
- Admin-Panel für Programme und Belohnungen
- PostgreSQL-Schema via Prisma + Seeds mit DAiS Programmen/Rewards/Journals
- Docker Compose (Next.js + Postgres)

## Quickstart

```bash
cp .env.example .env.local
docker compose up -d db
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

App läuft anschließend auf http://localhost:3000.

Weitere Details siehe `docs/LOCAL_TESTING.md`. Falls du Daten manuell einspielen willst, nutze `seed-data/manual-inserts.sql`.
