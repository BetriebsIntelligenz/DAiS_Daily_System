# Prisma Befehle & Workflows

Dieses Dokument bietet eine Übersicht über die wichtigsten Prisma-Befehle, die in diesem Projekt verwendet werden, sowie die korrekten Abläufe für Updates, Resets und Migrationen.

## 1. Wichtige Befehle im Detail

Diese Befehle werden meist innerhalb des Docker-Containers (`web`) ausgeführt.

### Prisma Hauptbefehle

| Befehl | Erklärung & Verwendung |
| :--- | :--- |
| `npx prisma migrate deploy` | **Anwenden von Migrationen.**<br>Dieser Befehl führt ausstehende SQL-Migrationen auf der Datenbank aus. Er verändert das Datenbankschema, damit es zum Code passt.<br>**Wann:** Nach jedem `git pull`, der neue Dateien in `prisma/migrations` enthält. Auf dem VPS fast immer der erste Schritt nach dem Update. |
| `npx prisma generate` | **Client Aktualisieren.**<br>Generiert den Prisma Client basierend auf dem aktuellen Schema neu. Notwendig, damit der TypeScript-Code die neuen Datenbankfelder "kennt".<br>**Wann:** Immer wenn sich `schema.prisma` geändert hat oder nach einem Update. Meist automatisch beim Build, aber manuell nötig bei Fehlern. |
| `npm run db:seed` | **Datenbank befüllen.**<br>Führt das Seed-Skript aus, um Basisdaten (z.B. Test-User, Standard-Kategorien) in die DB zu laden.<br>**Wann:** Nach einem kompletten Datenbank-Reset oder initialer Einrichtung. |

### Docker Hilfsbefehle

Für die Interaktion mit Prisma in unserer Umgebung nutzen wir `docker compose`:

*   `sudo docker compose exec web <BEFEHL>`: Führt einen Befehl im _laufenden_ Container namens `web` aus.
*   `sudo docker compose up -d db web`: Startet die Container (DB und Web) im Hintergrund.
*   `sudo docker compose down --volumes`: Stoppt Container und **löscht die Datenbankinhalte**. (Vorsicht!)

---

## 2. Workflows & Reihenfolgen

Hier sind die korrekten Abläufe für verschiedene Szenarien.

### A. Datenbank Update (Routine)
*Verwendung: Wenn du Updates vom Git Server ziehst (`git pull`), die Datenbank-Änderungen enthalten.*

1.  **Dienste sicherstellen**: DB und Web müssen laufen.
    ```bash
    sudo docker compose up -d db web
    ```
2.  **Migrationen anwenden**: Passt die DB an den neuen Code an.
    ```bash
    sudo docker compose exec web npx prisma migrate deploy --schema src/pages/schema.prisma
    ```
3.  **Client generieren**: Damit der Server die neuen Felder kennt.
    ```bash
    sudo docker compose exec web npx prisma generate
    ```
    *(Hinweis: Manchmal reicht auch ein Neustart des Containers, da `generate` oft beim Start läuft, aber manuell ist sicherer.)*

### B. Datenbank Komplett-Reset (Clean Start)
*Verwendung: Wenn die Datenbank korrupt ist oder du komplett von vorne anfangen willst. **Löscht alle Daten!***

1.  **Alles stoppen & löschen**:
    ```bash
    sudo docker compose down --volumes
    ```
2.  **Code aktualisieren** (Wichtig!):
    *Damit der Container beim Neustart den aktuellsten Migrations-Stand hat.*
    ```bash
    git pull origin main
    ```
3.  **Neustart**:
    ```bash
    sudo docker compose up -d db web
    ```
4.  **Schema & Datenbank initialisieren**:
    ```bash
    sudo docker compose exec web npx prisma migrate deploy --schema src/pages/schema.prisma
    ```
5.  **Daten befüllen** (Seed):
    ```bash
    sudo docker compose exec web npm run db:seed
    ```

### C. VPS Onboarding / Erst-Installation
*Verwendung: Einrichten eines frischen Servers.*

1.  **Repository klonen**:
    ```bash
    git clone https://github.com/BetriebsIntelligenz/DAiS_Daily_System
    cd DAiS
    ```
2.  **Branch wählen**:
    ```bash
    git checkout main
    ```
3.  **Environment setzen**: `.env` und `.env.docker` erstellen/kopieren.
4.  **Starten**:
    ```bash
    sudo docker compose up --build -d
    ```
5.  **Initialisierung** (Kombinierter Befehl):
    ```bash
    sudo docker compose exec web npx prisma migrate deploy --schema src/pages/schema.prisma
    sudo docker compose exec web npx prisma db seed
    ```

---

## Häufige Fehlerquellen

*   **"Table does not exist"**: Meistens wurde `migrate deploy` vergessen oder vor dem Reset kein `git pull` gemacht, sodass die Migrationen lokal fehlten.
*   **Schema Fehler im Code**: Der Prisma Client ist veraltet. Lösung: `sudo docker compose exec web npx prisma generate`.
