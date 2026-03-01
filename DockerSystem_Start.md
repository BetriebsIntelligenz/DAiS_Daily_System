# DockerSystem Start Anleitung

Diese Anleitung beschreibt den korrekten Start der DAiS-Docker-Umgebung mit dem aktuellen Entwicklungsstand.

## 1. Voraussetzungen

- Docker und Docker Compose sind installiert.
- Du bist im Projektordner:

```bash
cd /home/conceptarchitecture/DAiS
```

- Die Datei `.env.docker` ist vorhanden.

## 2. Erststart oder normaler Start

Starte das System mit Build:

```bash
docker compose up -d --build
```

Danach prüfen:

```bash
docker compose ps
docker compose logs -f web
```

Wenn im Log `✓ Ready` erscheint, läuft die App.

## 3. URLs

- Web-App: `http://localhost:51991`
- Datenbank (Postgres): `localhost:51992`

## 4. Login

- Benutzer: `admin`
- Passwort: `admin100`

## 5. Muss ich Migrationen manuell ausführen?

In der Regel: **Nein**.

Beim Start führt der `web`-Container automatisch aus:

```bash
npx prisma migrate deploy --schema src/pages/schema.prisma
```

Das passiert im `docker-entrypoint.sh`.

## 6. Migrationen manuell prüfen (optional)

Status prüfen:

```bash
docker exec dais-web-1 npx prisma migrate status --schema src/pages/schema.prisma
```

Migrationen manuell anwenden:

```bash
docker exec dais-web-1 npx prisma migrate deploy --schema src/pages/schema.prisma
```

## 7. Aktualisierung auf neuesten Code-Stand

Wenn neuer Code da ist:

```bash
git pull
docker compose up -d --build --force-recreate web
```

Wenn du sicherstellen willst, dass keine alten Build-Caches verwendet werden:

```bash
docker compose build --no-cache web
docker compose up -d --force-recreate web
```

## 8. Stoppen und Neustarten

Stoppen:

```bash
docker compose down
```

Starten:

```bash
docker compose up -d
```

## 9. Voller Reset (nur wenn nötig)

Achtung: Löscht Container und Volumes (inkl. DB-Daten).

```bash
docker compose down -v
docker compose up -d --build
```

## 10. Troubleshooting

Wenn `web` läuft, aber Funktionen fehlen:

```bash
docker compose logs --tail=200 web
docker compose build --no-cache web
docker compose up -d --force-recreate web
```

Wenn Migrationen blockiert sind:

```bash
docker exec dais-web-1 npx prisma migrate status --schema src/pages/schema.prisma
```

Dann gezielt Fehler aus den Logs beheben oder Migration per `prisma migrate resolve` korrigieren.
