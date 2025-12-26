"""Agent that merges pipelines into a single daily planning briefing."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Any

from dais_system.common.models import HouseholdStore, HumanContactStore
from dais_system.io.json_store import load_household_store, load_human_contact_store
from dais_system.pipelines.household import (
    CardBriefing,
    DailyBriefing as HouseholdDailyBriefing,
    build_daily_briefing,
)
from dais_system.pipelines.human_contact import ContactRadar, ContactStatus, build_contact_radar


@dataclass(frozen=True)
class DailyOperationsBriefing:
    generated_at: datetime
    target_date: date
    household: HouseholdDailyBriefing
    human_contacts: ContactRadar

    def to_dict(self) -> dict[str, Any]:
        return {
            "generated_at": self.generated_at.isoformat(),
            "target_date": self.target_date.isoformat(),
            "household": _serialize_household(self.household),
            "human_contacts": _serialize_contacts(self.human_contacts),
        }


class DailyOperationsAgent:
    """Loads persistent stores and generates daily reports."""

    def __init__(self, household_store: HouseholdStore, contact_store: HumanContactStore) -> None:
        self._household_store = household_store
        self._contact_store = contact_store

    @classmethod
    def from_assets(cls) -> "DailyOperationsAgent":
        return cls(load_household_store(), load_human_contact_store())

    def generate_briefing(self, for_date: date | None = None) -> DailyOperationsBriefing:
        target = for_date or date.today()
        household = build_daily_briefing(self._household_store, target)
        contact_radar = build_contact_radar(self._contact_store, target)
        return DailyOperationsBriefing(
            generated_at=datetime.now(tz=timezone.utc),
            target_date=target,
            household=household,
            human_contacts=contact_radar,
        )

    def generate_briefing_json(self, for_date: date | None = None) -> str:
        return json.dumps(self.generate_briefing(for_date).to_dict(), indent=2, sort_keys=True)


def _serialize_household(briefing: HouseholdDailyBriefing) -> dict[str, Any]:
    return {
        "weekday": briefing.weekday,
        "focus_cards": [_serialize_card(card) for card in briefing.focus_cards],
        "overdue_cards": [_serialize_card(card) for card in briefing.overdue_cards],
        "stats": {
            "total_cards": briefing.stats.total_cards,
            "total_tasks": briefing.stats.total_tasks,
            "completed_tasks": briefing.stats.completed_tasks,
            "completion_ratio": briefing.stats.completion_ratio,
        },
        "recommendations": list(briefing.recommendations),
    }


def _serialize_card(card: CardBriefing) -> dict[str, Any]:
    return {
        "card_id": card.card_id,
        "title": card.title,
        "summary": card.summary,
        "weekday": card.weekday,
        "last_run_at": card.last_run_at.isoformat() if card.last_run_at else None,
        "staleness_days": card.staleness_days,
        "completion_ratio": card.completion_ratio,
        "tasks": [
            {"task_id": task.task_id, "label": task.label, "completed": task.completed}
            for task in card.tasks
        ],
    }


def _serialize_contacts(radar: ContactRadar) -> dict[str, Any]:
    return {
        "overdue": [_serialize_contact(status) for status in radar.overdue],
        "due_today": [_serialize_contact(status) for status in radar.due_today],
        "upcoming": [_serialize_contact(status) for status in radar.upcoming],
        "summary": {
            "total_people": radar.summary.total_people,
            "overdue_assignments": radar.summary.overdue_assignments,
            "due_today": radar.summary.due_today,
            "upcoming_assignments": radar.summary.upcoming_assignments,
        },
    }


def _serialize_contact(status: ContactStatus) -> dict[str, Any]:
    return {
        "person_id": status.person_id,
        "name": status.name,
        "relation": status.relation,
        "activity": status.activity,
        "cadence": status.cadence,
        "due_in_days": status.due_in_days,
        "last_touch": status.last_touch.isoformat() if status.last_touch else None,
        "note": status.note,
        "status": status.status,
    }


def main() -> None:
    agent = DailyOperationsAgent.from_assets()
    print(agent.generate_briefing_json())


if __name__ == "__main__":
    main()

