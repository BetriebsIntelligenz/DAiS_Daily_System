"""Utility helpers for reading the JSON asset stores."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from dais_system.common.models import HouseholdStore, HumanContactStore

BASE_DIR = Path(__file__).resolve().parents[3]
ASSETS_DIR = BASE_DIR / "assets"
HOUSEHOLD_STORE_PATH = ASSETS_DIR / "household-store.json"
HUMAN_CONTACT_STORE_PATH = ASSETS_DIR / "human-contact-store.json"


def _load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Store not found: {path}")
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_household_store(path: str | Path | None = None) -> HouseholdStore:
    target = Path(path) if path else HOUSEHOLD_STORE_PATH
    return HouseholdStore.from_dict(_load_json(target))


def load_human_contact_store(path: str | Path | None = None) -> HumanContactStore:
    target = Path(path) if path else HUMAN_CONTACT_STORE_PATH
    return HumanContactStore.from_dict(_load_json(target))

