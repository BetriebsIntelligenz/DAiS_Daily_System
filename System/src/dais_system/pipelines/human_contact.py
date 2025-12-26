"""Pipelines for summarising the human contact ledger."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Iterable

from dais_system.common.models import HumanContactStore, Person

CADENCE_TO_DAYS = {
    "daily": 1,
    "every_other_day": 2,
    "weekly": 7,
    "biweekly": 14,
    "monthly": 30,
    "quarterly": 90,
}


@dataclass(frozen=True)
class ContactStatus:
    person_id: str
    name: str
    relation: str
    activity: str
    cadence: str
    due_in_days: int
    last_touch: datetime | None
    note: str | None

    @property
    def status(self) -> str:
        if self.due_in_days < 0:
            return "overdue"
        if self.due_in_days == 0:
            return "due"
        return "upcoming"


@dataclass(frozen=True)
class ContactSummary:
    total_people: int
    overdue_assignments: int
    due_today: int
    upcoming_assignments: int


@dataclass(frozen=True)
class ContactRadar:
    overdue: tuple[ContactStatus, ...]
    due_today: tuple[ContactStatus, ...]
    upcoming: tuple[ContactStatus, ...]
    summary: ContactSummary


def build_contact_radar(
    store: HumanContactStore, reference_date: date | datetime | None = None
) -> ContactRadar:
    target_date = _normalize_date(reference_date)
    persons = store.person_lookup()
    statuses = tuple(_build_statuses(store, persons, target_date))

    overdue = tuple(sorted((s for s in statuses if s.due_in_days < 0), key=lambda s: s.due_in_days))
    due_today = tuple(sorted((s for s in statuses if s.due_in_days == 0), key=lambda s: s.name))
    upcoming = tuple(sorted((s for s in statuses if s.due_in_days > 0), key=lambda s: s.due_in_days))

    summary = ContactSummary(
        total_people=len(persons),
        overdue_assignments=len(overdue),
        due_today=len(due_today),
        upcoming_assignments=len(upcoming),
    )

    return ContactRadar(overdue=overdue, due_today=due_today, upcoming=upcoming, summary=summary)


def _normalize_date(reference_date: date | datetime | None) -> date:
    if reference_date is None:
        return date.today()
    if isinstance(reference_date, datetime):
        return reference_date.date()
    return reference_date


def _build_statuses(
    store: HumanContactStore, persons: dict[str, Person], target_date: date
) -> Iterable[ContactStatus]:
    for assignment in store.assignments:
        person = persons.get(assignment.person_id)
        if person is None:
            continue
        last_log = store.latest_log_for(assignment.person_id, assignment.activity)
        cadence_days = CADENCE_TO_DAYS.get(assignment.cadence, 7)
        base = last_log.created_at.date() if last_log else assignment.created_at.date()
        next_due = base + timedelta(days=cadence_days)
        due_in_days = (next_due - target_date).days
        yield ContactStatus(
            person_id=person.id,
            name=person.name,
            relation=person.relation,
            activity=assignment.activity,
            cadence=assignment.cadence,
            due_in_days=due_in_days,
            last_touch=last_log.created_at if last_log else None,
            note=person.note,
        )

