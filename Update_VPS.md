# DAiS VPS Update (Docker + Datenbank sichern/wiederherstellen)

Diese Anleitung zeigt, wie du auf Ubuntu den laufenden Docker-Stand auf den neuesten GitHub-Code bringst, ohne Daten zu verlieren.

## Ziel

- Neuen Code aus GitHub deployen
- Container sauber neu bauen/starten
- Datenbank-Einträge behalten oder bei Bedarf aus Backup wieder einspielen

## Voraussetzungen

- SSH-Zugriff auf den VPS
- Docker + Docker Compose installiert
- Projekt liegt auf dem Server, z. B. unter:

```bash
cd /home/conceptarchitecture/DAiS
```

## Wichtig vorab

- Die Postgres-Daten liegen im Docker-Volume `pgdata`.
- Solange du **nicht** `docker compose down -v` ausführst, bleibt das Volume erhalten.
- Trotzdem: Vor jedem Update immer ein DB-Backup machen.

---

## 1. In den Projektordner wechseln

```bash
cd /home/conceptarchitecture/DAiS
```

---

## 2. Laufende Container und Stand prüfen

```bash
docker compose ps
git status
git rev-parse --short HEAD
```

---

## 3. Datenbank-Backup erstellen (Pflicht)

Backup-Ordner anlegen:

```bash
mkdir -p backups
```

Dump erstellen (komprimiertes PostgreSQL Custom-Format):

```bash
docker compose exec -T db pg_dump -U dais -d dais -Fc > backups/dais_$(date +%F_%H-%M-%S).dump
```

Prüfen, ob Datei existiert:

```bash
ls -lh backups/
```

Optional zusätzlich `.env`-Dateien sichern:

```bash
cp -a .env .env.backup.$(date +%F_%H-%M-%S) 2>/dev/null || true
cp -a .env.docker .env.docker.backup.$(date +%F_%H-%M-%S) 2>/dev/null || true
```

---

## 4. Neuen Code von GitHub ziehen

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
```

Falls du mit einem anderen Branch arbeitest, ersetze `main` entsprechend.

---

## 5. Container mit neuem Code aktualisieren

Empfohlen (Web neu bauen, DB beibehalten):

```bash
docker compose up -d --build --force-recreate web
```

Wenn auch DB/alles neu gestartet werden soll:

```bash
docker compose up -d --build --force-recreate
```

Mit komplett neuem Image-Build ohne Cache:

```bash
docker compose build --no-cache web
docker compose up -d --force-recreate web
```

---

## 6. Migrationen anwenden und Logs prüfen

Migrationen laufen über `docker-entrypoint.sh` automatisch. Manuell prüfen:

```bash
docker compose exec web npx prisma migrate deploy --schema src/pages/schema.prisma
```

Status prüfen:

```bash
docker compose exec web npx prisma migrate status --schema src/pages/schema.prisma
```

Logs:

```bash
docker compose logs --tail=200 web
docker compose logs --tail=200 db
```

---

## 7. Funktionsprüfung

```bash
docker compose ps
```

App im Browser testen:

- `http://<VPS-IP-ODER-DOMAIN>:51991`

Insbesondere prüfen:

- Login funktioniert
- Programme anlegen/speichern funktioniert
- Bestehende Daten sind weiterhin vorhanden

---

## 8. Datenbank aus Backup wiederherstellen (nur falls nötig)

Nutze das nur, wenn Daten fehlen oder die DB beschädigt wurde.

### 8.1 Backup-Datei auswählen

```bash
ls -lh backups/
```

Beispiel-Datei:

`backups/dais_2026-03-01_23-30-00.dump`

### 8.2 Datenbank zurücksetzen

```bash
docker compose exec -T db psql -U dais -d postgres -c "DROP DATABASE IF EXISTS dais;"
docker compose exec -T db psql -U dais -d postgres -c "CREATE DATABASE dais;"
```

### 8.3 Backup einspielen

```bash
docker compose exec -T db pg_restore -U dais -d dais --clean --if-exists --no-owner --no-privileges < backups/DATEI.dump
```

Beispiel:

```bash
docker compose exec -T db pg_restore -U dais -d dais --clean --if-exists --no-owner --no-privileges < backups/dais_2026-03-01_23-30-00.dump
```

### 8.4 Danach Migrationen erneut ausführen

```bash
docker compose exec web npx prisma migrate deploy --schema src/pages/schema.prisma
```

---

## 9. Häufige Fehler vermeiden

- **Nicht** `docker compose down -v` ausführen, wenn du kein frisches Backup hast.
- Vor Restore immer sicherstellen, dass die richtige Dump-Datei verwendet wird.
- Bei Merge-Konflikten in Git zuerst lösen, dann erst neu bauen.
- Bei anhaltenden Fehlern zuerst Logs prüfen:

```bash
docker compose logs -f web
docker compose logs -f db
```

---

## 10. Kurzablauf (Schnellreferenz)

```bash
cd /home/conceptarchitecture/DAiS
mkdir -p backups
docker compose exec -T db pg_dump -U dais -d dais -Fc > backups/dais_$(date +%F_%H-%M-%S).dump
git fetch origin && git checkout main && git pull --ff-only origin main
docker compose up -d --build --force-recreate web
docker compose exec web npx prisma migrate deploy --schema src/pages/schema.prisma
docker compose ps
docker compose logs --tail=200 web
```

