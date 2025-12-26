"""Core data models shared across the DAiS System runtime."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Iterable, Mapping, Sequence


def _parse_datetime(value: str | datetime | None) -> datetime:
    """Convert ISO strings into timezone-aware datetimes."""

    if isinstance(value, datetime):
        dt = value
    elif isinstance(value, str):
        sanitized = value.replace("Z", "+00:00")
        dt = datetime.fromisoformat(sanitized)
    else:  # fall back to epoch
        dt = datetime.fromtimestamp(0, tz=timezone.utc)

    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _tuple(values: Sequence[str] | Iterable[str]) -> tuple[str, ...]:
    return tuple(values)


@dataclass(frozen=True)
class Task:
    id: str
    label: str
    order: int
    active: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "Task":
        return cls(
            id=str(data["id"]),
            label=str(data["label"]),
            order=int(data.get("order", 0)),
            active=bool(data.get("active", True)),
            created_at=_parse_datetime(data.get("createdAt")),
            updated_at=_parse_datetime(data.get("updatedAt")),
        )


@dataclass(frozen=True)
class HouseholdCard:
    id: str
    title: str
    summary: str
    weekday: int
    task_ids: tuple[str, ...]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "HouseholdCard":
        return cls(
            id=str(data["id"]),
            title=str(data["title"]),
            summary=str(data.get("summary", "")),
            weekday=int(data.get("weekday", 1)),
            task_ids=_tuple(data.get("taskIds", ()) or ()),
            created_at=_parse_datetime(data.get("createdAt")),
            updated_at=_parse_datetime(data.get("updatedAt")),
        )


@dataclass(frozen=True)
class CardSnapshotTask:
    id: str
    label: str
    order: int

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "CardSnapshotTask":
        task = data.get("task") or {}
        return cls(
            id=str(task.get("id", data.get("taskId", ""))),
            label=str(task.get("label", "")),
            order=int(data.get("order", task.get("order", 0))),
        )


@dataclass(frozen=True)
class HouseholdCardSnapshot:
    id: str
    title: str
    summary: str
    weekday: int
    task_ids: tuple[str, ...]
    tasks: tuple[CardSnapshotTask, ...]

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "HouseholdCardSnapshot":
        return cls(
            id=str(data.get("id", "")),
            title=str(data.get("title", "")),
            summary=str(data.get("summary", "")),
            weekday=int(data.get("weekday", 1)),
            task_ids=_tuple(data.get("taskIds", ()) or ()),
            tasks=tuple(CardSnapshotTask.from_dict(item) for item in data.get("tasks", ())),
        )


@dataclass(frozen=True)
class HouseholdEntry:
    id: str
    card_id: str
    user_id: str
    program_run_id: str | None
    completed_task_ids: tuple[str, ...]
    note: str | None
    created_at: datetime
    card_snapshot: HouseholdCardSnapshot | None

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "HouseholdEntry":
        snapshot = data.get("cardSnapshot")
        return cls(
            id=str(data.get("id", "")),
            card_id=str(data.get("cardId", "")),
            user_id=str(data.get("userId", "")),
            program_run_id=data.get("programRunId"),
            completed_task_ids=_tuple(data.get("completedTaskIds", ()) or ()),
            note=data.get("note"),
            created_at=_parse_datetime(data.get("createdAt")),
            card_snapshot=HouseholdCardSnapshot.from_dict(snapshot) if snapshot else None,
        )


@dataclass(frozen=True)
class HouseholdStore:
    version: int
    tasks: tuple[Task, ...]
    cards: tuple[HouseholdCard, ...]
    entries: tuple[HouseholdEntry, ...]

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "HouseholdStore":
        return cls(
            version=int(data.get("version", 1)),
            tasks=tuple(Task.from_dict(item) for item in data.get("tasks", ())),
            cards=tuple(HouseholdCard.from_dict(item) for item in data.get("cards", ())),
            entries=tuple(HouseholdEntry.from_dict(item) for item in data.get("entries", ())),
        )

    def cards_for_weekday(self, weekday: int) -> tuple[HouseholdCard, ...]:
        return tuple(card for card in self.cards if card.weekday == weekday)

    def latest_entry_for_card(self, card_id: str) -> HouseholdEntry | None:
        matches = [entry for entry in self.entries if entry.card_id == card_id]
        return max(matches, key=lambda entry: entry.created_at, default=None)

    def task_lookup(self) -> dict[str, Task]:
        return {task.id: task for task in self.tasks}


@dataclass(frozen=True)
class Person:
    id: str
    name: str
    relation: str
    note: str | None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "Person":
        return cls(
            id=str(data["id"]),
            name=str(data["name"]),
            relation=str(data.get("relation", "unknown")),
            note=data.get("note"),
            created_at=_parse_datetime(data.get("createdAt")),
            updated_at=_parse_datetime(data.get("updatedAt")),
        )


@dataclass(frozen=True)
class ContactAssignment:
    id: str
    person_id: str
    activity: str
    cadence: str
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "ContactAssignment":
        return cls(
            id=str(data["id"]),
            person_id=str(data["personId"]),
            activity=str(data.get("activity", "")),
            cadence=str(data.get("cadence", "weekly")),
            created_at=_parse_datetime(data.get("createdAt")),
            updated_at=_parse_datetime(data.get("updatedAt")),
        )


@dataclass(frozen=True)
class ContactLog:
    id: str
    person_id: str
    activity: str
    note: str | None
    created_at: datetime

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "ContactLog":
        return cls(
            id=str(data["id"]),
            person_id=str(data["personId"]),
            activity=str(data.get("activity", "")),
            note=data.get("note"),
            created_at=_parse_datetime(data.get("createdAt")),
        )


@dataclass(frozen=True)
class HumanContactStore:
    version: int
    persons: tuple[Person, ...]
    assignments: tuple[ContactAssignment, ...]
    logs: tuple[ContactLog, ...]

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "HumanContactStore":
        return cls(
            version=int(data.get("version", 1)),
            persons=tuple(Person.from_dict(item) for item in data.get("persons", ())),
            assignments=tuple(
                ContactAssignment.from_dict(item) for item in data.get("assignments", ())
            ),
            logs=tuple(ContactLog.from_dict(item) for item in data.get("logs", ())),
        )

    def person_lookup(self) -> dict[str, Person]:
        return {person.id: person for person in self.persons}

    def latest_log_for(self, person_id: str, activity: str) -> ContactLog | None:
        candidates = [
            log for log in self.logs if log.person_id == person_id and log.activity == activity
        ]
        return max(candidates, key=lambda log: log.created_at, default=None)

