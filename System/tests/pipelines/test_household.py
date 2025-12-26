from __future__ import annotations

from datetime import date

import pytest

from dais_system.pipelines.household import build_daily_briefing


def test_daily_briefing_focus(sample_household_store) -> None:
    briefing = build_daily_briefing(sample_household_store, date(2025, 1, 6))
    assert briefing.weekday == 1
    assert briefing.stats.total_tasks == 2
    assert briefing.stats.completed_tasks == 1
    assert pytest.approx(0.5, rel=1e-2) == briefing.stats.completion_ratio


def test_overdue_cards(sample_household_store) -> None:
    briefing = build_daily_briefing(sample_household_store, date(2025, 1, 6))
    overdue_ids = {card.card_id for card in briefing.overdue_cards}
    assert "card-wednesday-garden" in overdue_ids
    assert any("ueberfaellig" in note for note in briefing.recommendations)

