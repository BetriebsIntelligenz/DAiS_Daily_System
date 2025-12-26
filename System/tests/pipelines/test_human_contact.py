from __future__ import annotations

from datetime import date

from dais_system.pipelines.human_contact import build_contact_radar


def test_contact_radar(sample_human_contact_store) -> None:
    radar = build_contact_radar(sample_human_contact_store, date(2025, 1, 6))
    assert radar.summary.total_people == 4
    assert any(status.person_id == "person-dora" for status in radar.overdue)
    assert any(status.person_id == "person-ben" for status in radar.due_today)
    assert any(status.person_id == "person-anna" for status in radar.upcoming)

