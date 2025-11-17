# Lokales Testing

## Voraussetzungen

- Node.js 20+
- npm 10+
- Docker + Docker Compose (für Postgres)

## Setup

1. `cp .env.example .env.local`
2. `docker compose up -d db`
3. `npm install`
4. `npx prisma migrate dev --name init`
5. `npx prisma db seed`
6. `npm run dev`

## Tests & Checks

- `npm run lint` – Next.js ESLint Regeln
- `npm run build` – Produktions-Build (führt auch TypeScript-Checks aus)

## Seed Accounts

- Demo User: `demo@dais.app` / `changeme`

## Datenbanken prüfen

```bash
docker compose exec db psql -U dais -d dais
```

Tabellen: `Program`, `ProgramUnit`, `Exercise`, `ProgramRun`, `Reward`, `RewardRedemption`, `Journal`, `JournalEntry`, `XpTransaction`, `User`.
