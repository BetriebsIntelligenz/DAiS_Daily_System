# Docker Datenbank updaten
docker compose run --rm web npx prisma migrate dev


# Neu Starten
1. docker compose up -d db
2. npx prisma migrate deploy --schema src/pages/schema.prisma


# Via Terminal auf Datenbank verbinden:
DATABASE_URL="postgresql://dais:dais@localhost:5432/dais" \ 

# Seed ausführen:
npm run db:seed

# Datenbank Updaten
npx prisma migrate deploy --schema src/pages/schema.prisma


# Neue DB Version einspielen
DATABASE_URL="postgresql://dais:dais@localhost:5432/dais" npx prisma migrate dev --name add_requirements --schema src/pages/schema.prisma