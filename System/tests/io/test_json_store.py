from __future__ import annotations

from pathlib import Path

import pytest

from dais_system.io.json_store import load_household_store, load_human_contact_store


def test_load_household_store(sample_household_store) -> None:
    assert sample_household_store.version == 1
    monday_cards = sample_household_store.cards_for_weekday(1)
    assert len(monday_cards) == 1
    assert sample_household_store.latest_entry_for_card(monday_cards[0].id) is not None


def test_load_human_contact_store(sample_human_contact_store) -> None:
    assert sample_human_contact_store.version == 1
    assert len(sample_human_contact_store.persons) == 4
    assert "person-anna" in sample_human_contact_store.person_lookup()


def test_missing_file_raises(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError):
        load_household_store(tmp_path / "missing.json")

