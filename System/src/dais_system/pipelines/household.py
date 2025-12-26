"""Planning utilities for household routines."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Iterable

from dais_system.common.models import HouseholdCard, HouseholdStore, Task

DEFAULT_STALE_AFTER_DAYS = 7


@dataclass(frozen=True)
class TaskStatus:
    task_id: str
    label: str
    completed: bool


@dataclass(frozen=True)
class CardBriefing:
    card_id: str
    title: str
    summary: str
    weekday: int
    tasks: tuple[TaskStatus, ...]
    last_run_at: datetime | None
    staleness_days: int | None

    @property
    def completion_ratio(self) -> float:
        total = len(self.tasks)
        if total == 0:
            return 0.0
        completed = sum(1 for task in self.tasks if task.completed)
        return completed / total


@dataclass(frozen=True)
class DailyStats:
    total_cards: int
    total_tasks: int
    completed_tasks: int

    @property
    def completion_ratio(self) -> float:
        if self.total_tasks == 0:
            return 0.0
        return self.completed_tasks / self.total_tasks


@dataclass(frozen=True)
class DailyBriefing:
    weekday: int
    focus_cards: tuple[CardBriefing, ...]
    overdue_cards: tuple[CardBriefing, ...]
    stats: DailyStats
    recommendations: tuple[str, ...]


def build_daily_briefing(
    store: HouseholdStore,
    reference_date: date | None = None,
    *,
    stale_after_days: int = DEFAULT_STALE_AFTER_DAYS,
) -> DailyBriefing:
    target_date = reference_date or date.today()
    weekday = target_date.isoweekday()
    tasks_by_id = store.task_lookup()

    focus_cards = tuple(
        _build_card_briefing(card, store, tasks_by_id, target_date)
        for card in sorted(store.cards_for_weekday(weekday), key=lambda c: c.title)
    )

    overdue_cards = tuple(
        _build_card_briefing(card, store, tasks_by_id, target_date)
        for card in _overdue_candidates(store, weekday, target_date, stale_after_days)
    )

    stats = _build_stats(focus_cards)
    recommendations = _build_recommendations(stats, overdue_cards)

    return DailyBriefing(
        weekday=weekday,
        focus_cards=focus_cards,
        overdue_cards=overdue_cards,
        stats=stats,
        recommendations=recommendations,
    )


def _build_card_briefing(
    card: HouseholdCard,
    store: HouseholdStore,
    tasks_by_id: dict[str, Task],
    target_date: date,
) -> CardBriefing:
    entry = store.latest_entry_for_card(card.id)
    completed_task_ids = set(entry.completed_task_ids if entry else ())
    statuses = tuple(
        TaskStatus(task_id=task.id, label=task.label, completed=task.id in completed_task_ids)
        for task in _tasks_for_card(card, tasks_by_id)
    )

    last_run_at = entry.created_at if entry else None
    staleness_days = _staleness_days(last_run_at, target_date)

    return CardBriefing(
        card_id=card.id,
        title=card.title,
        summary=card.summary,
        weekday=card.weekday,
        tasks=statuses,
        last_run_at=last_run_at,
        staleness_days=staleness_days,
    )


def _tasks_for_card(card: HouseholdCard, tasks_by_id: dict[str, Task]) -> Iterable[Task]:
    for task_id in card.task_ids:
        task = tasks_by_id.get(task_id)
        if task is not None:
            yield task


def _staleness_days(last_run_at: datetime | None, target_date: date) -> int | None:
    if last_run_at is None:
        return None
    delta = target_date - last_run_at.date()
    return max(delta.days, 0)


def _build_stats(cards: tuple[CardBriefing, ...]) -> DailyStats:
    total_tasks = sum(len(card.tasks) for card in cards)
    completed = sum(sum(1 for task in card.tasks if task.completed) for card in cards)
    return DailyStats(total_cards=len(cards), total_tasks=total_tasks, completed_tasks=completed)


def _build_recommendations(stats: DailyStats, overdue_cards: tuple[CardBriefing, ...]) -> tuple[str, ...]:
    notes: list[str] = []
    if stats.total_tasks == 0:
        notes.append("Keine Karten geplant. Nutze das Zeitfenster fuer Planung oder Backlog.")
    elif stats.completion_ratio < 0.75:
        notes.append(
            "Plane mindestens einen fokussierten 25-Minuten-Block, da weniger als 75% abgeschlossen wurden."
        )

    if overdue_cards:
        top_card = overdue_cards[0]
        notes.append(
            f"Karte '{top_card.title}' ist ueberfaellig - ziehe sie als erstes in den heutigen Fokus."
        )

    return tuple(notes)


def _overdue_candidates(
    store: HouseholdStore,
    weekday: int,
    target_date: date,
    stale_after_days: int,
) -> tuple[HouseholdCard, ...]:
    results: list[tuple[int, HouseholdCard]] = []
    for card in store.cards:
        if card.weekday == weekday:
            continue
        entry = store.latest_entry_for_card(card.id)
        last_run_at = entry.created_at if entry else None
        days = _staleness_days(last_run_at, target_date)
        if days is None or days >= stale_after_days:
            score = days if days is not None else stale_after_days + 1
            results.append((score, card))

    results.sort(key=lambda item: item[0], reverse=True)
    return tuple(card for _, card in results[:3])

