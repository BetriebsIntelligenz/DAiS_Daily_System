# DAiS System – Laufzeitbeschreibung

Die Python Runtime verarbeitet zwei JSON Stores (`household-store` und
`human-contact-store`) und erzeugt daraus analytische Briefings fuer den Alltag.

## Komponenten

| Ebene        | Modulpfad                                      | Zweck |
| ------------ | ---------------------------------------------- | ----- |
| Modelle      | `System/src/dais_system/common`                | Dataclasses fuer Tasks, Karten, Kontakte, Logs |
| IO           | `System/src/dais_system/io/json_store.py`      | Lesezugriff auf Assets + Pfadauflosung |
| Pipelines    | `System/src/dais_system/pipelines/*`           | Verdichtung fuer Haushalt bzw. Kontakte |
| Agent        | `System/src/dais_system/agents/coordinator.py` | Kombiniert Pipelines zu einem Daily Briefing |
| Assets       | `System/assets`                                | Persistente Demo-Stores |
| Tests        | `System/tests`                                 | Fixtures + Pytest Suites |

## Haushalts-Pipeline

`dais_system/pipelines/household.py`

- Gruppiert Karten nach Wochentag
- Markiert ueberfaellige Karten (Default: 7 Tage)
- Berechnet Completion-Ratio & Empfehlungen

## Human-Contact-Pipeline

`dais_system/pipelines/human_contact.py`

- Mappt Assignments in Overdue/Due/Upcoming
- Interpretiert Cadence (daily, weekly, biweekly, ...)
- Liefert `ContactSummary`

## Agent

1. Laedt beide Stores (per Default `System/assets`)
2. Fuehrt beide Pipelines aus
3. Serialisiert Ergebnis als JSON (nur Primitive fuer einfache Weitergabe)

CLI: `python3 -m dais_system.agents.coordinator`

## Entwicklung

1. `python3 -m pip install -r requirements.txt`
2. `ruff check System/src`
3. `mypy System/src`
4. `python3 -m pytest System/tests`

Fixtures liegen unter `System/tests/fixtures` und sichern reproduzierbare
Testergebnisse.

