from __future__ import annotations

from datetime import date

from dais_system.agents.coordinator import DailyOperationsAgent


def test_agent_serialization(sample_household_store, sample_human_contact_store) -> None:
    agent = DailyOperationsAgent(sample_household_store, sample_human_contact_store)
    payload = agent.generate_briefing(date(2025, 1, 6)).to_dict()
    assert payload["household"]["stats"]["total_tasks"] == 2
    assert payload["human_contacts"]["summary"]["total_people"] == 4
    assert "T" in payload["generated_at"]

