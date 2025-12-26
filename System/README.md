# DAiS System

Python Referenz fuer Betriebsintelligenz rund um Haushalts- und Human-Contact
Stores. Die Runtime konzentriert sich auf Datamodelle, Analysepipelines sowie
Agenten, die kombinierte Daily-Briefings bereitstellen.

## Struktur

```
System/
├── assets/                # JSON Stores
├── config/                # Beispielkonfigurationen
├── docs/                  # Technische Dokus & Security Notes
├── src/
│   └── dais_system/
│       ├── agents/
│       ├── common/
│       ├── io/
│       └── pipelines/
└── tests/                 # Pytest Suites & Fixtures
```

## Setup

```bash
python3 -m pip install -r requirements.txt
```

## Qualitätschecks

```bash
ruff check System/src
ruff format System/src System/tests --check
mypy System/src
python3 -m pytest System/tests
python3 -m build
```

## Agent Quickstart

```bash
PYTHONPATH=System/src python3 -m dais_system.agents.coordinator
```

Der Agent laedt die Stores aus `System/assets` und generiert ein JSON Briefing
fuer Haushalt und Kontakte. Fuer reproduzierbare Tests koennen stattdessen die
Fixtures unter `System/tests/fixtures` verwendet werden.

