"""Shared pytest fixtures."""

from __future__ import annotations

from pathlib import Path

import pytest

from dais_system.common.models import HouseholdStore, HumanContactStore
from dais_system.io.json_store import load_household_store, load_human_contact_store

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture(scope="session")
def household_fixture_path() -> Path:
    return FIXTURES_DIR / "household-store.json"


@pytest.fixture(scope="session")
def human_contact_fixture_path() -> Path:
    return FIXTURES_DIR / "human-contact-store.json"


@pytest.fixture()
def sample_household_store(household_fixture_path: Path) -> HouseholdStore:
    return load_household_store(household_fixture_path)


@pytest.fixture()
def sample_human_contact_store(human_contact_fixture_path: Path) -> HumanContactStore:
    return load_human_contact_store(human_contact_fixture_path)

