import { NextResponse } from "next/server";

import {
  HUMAN_ACTIVITY_VALUES,
  HUMAN_CADENCE_VALUES,
  HUMAN_RELATION_VALUES
} from "@/lib/human";
import type {
  HumanContactActivity,
  HumanContactCadence,
  HumanContactRelation
} from "@/lib/types";
import {
  HUMAN_CONTACT_FALLBACK_HEADERS,
  HUMAN_CONTACT_MIGRATION_HINT,
  buildHumanContactFallback,
  getHumanContactAssignmentClient,
  getHumanContactPersonClient,
  isMissingHumanContactTables,
  loadHumanContactAssignments,
  loadHumanContactPerson,
  loadHumanContactPersons,
  loadHumanContactStats
} from "@/server/human-contact-service";
import {
  fallbackCreateContact,
  fallbackDeleteContact,
  fallbackSetAssignment,
  fallbackUpdateContact
} from "@/server/human-contact-fallback-store";

function parseRelation(value: unknown): HumanContactRelation | null {
  const relation = String(value ?? "");
  return HUMAN_RELATION_VALUES.includes(relation as HumanContactRelation)
    ? (relation as HumanContactRelation)
    : null;
}

function parseActivity(value: unknown): HumanContactActivity | null {
  const data = String(value ?? "");
  return HUMAN_ACTIVITY_VALUES.includes(data as HumanContactActivity)
    ? (data as HumanContactActivity)
    : null;
}

function parseCadence(value: unknown): HumanContactCadence | null {
  const data = String(value ?? "");
  return HUMAN_CADENCE_VALUES.includes(data as HumanContactCadence)
    ? (data as HumanContactCadence)
    : null;
}

export async function GET() {
  try {
    const persons = await loadHumanContactPersons();
    const stats = await loadHumanContactStats(persons.map((person) => person.id));
    return NextResponse.json({ persons, stats });
  } catch (error) {
    if (isMissingHumanContactTables(error)) {
      const fallback = await buildHumanContactFallback();
      return NextResponse.json(
        fallback,
        { headers: HUMAN_CONTACT_FALLBACK_HEADERS }
      );
    }
    console.error("Human contacts GET failed", error);
    return NextResponse.json(
      { error: "Kontakte konnten nicht geladen werden." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const relation = parseRelation(body.relation);
  const noteValue =
    typeof body.note === "string" ? body.note.trim() : undefined;

  if (!name || !relation) {
    return NextResponse.json(
      { error: "Name und Beziehung sind Pflichtfelder." },
      { status: 400 }
    );
  }

  try {
    const personClient = getHumanContactPersonClient();
    const person = await personClient.create({
      data: {
        name,
        relation,
        note: noteValue ? noteValue : null
      }
    });
    const payload = await loadHumanContactPerson(person.id);
    if (!payload) {
      throw new Error("Kontakt konnte nach Erstellung nicht geladen werden.");
    }
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    if (isMissingHumanContactTables(error)) {
      const fallbackPerson = await fallbackCreateContact({
        name,
        relation,
        note: noteValue ?? undefined
      });
      return NextResponse.json(fallbackPerson, {
        status: 201,
        headers: HUMAN_CONTACT_FALLBACK_HEADERS
      });
    }
    console.error("Human contacts POST failed", error);
    return NextResponse.json(
      { error: "Kontakt konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json(
      { error: "Kontakt-ID erforderlich." },
      { status: 400 }
    );
  }

  const data: {
    name?: string;
    relation?: HumanContactRelation;
    note?: string | null;
  } = {};

  if (typeof body.name === "string") {
    const nextName = body.name.trim();
    if (nextName) {
      data.name = nextName;
    }
  }

  if (body.relation !== undefined) {
    const relation = parseRelation(body.relation);
    if (!relation) {
      return NextResponse.json({ error: "Ungültige Beziehung." }, { status: 400 });
    }
    data.relation = relation;
  }

  if (body.note !== undefined) {
    const noteValue =
      typeof body.note === "string" ? body.note.trim() : "";
    data.note = noteValue ? noteValue : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Keine Änderungen erkannt." },
      { status: 400 }
    );
  }

  try {
    const personClient = getHumanContactPersonClient();
    await personClient.update({
      where: { id },
      data
    });
    const payload = await loadHumanContactPerson(id);
    if (!payload) {
      return NextResponse.json(
        { error: "Kontakt nicht gefunden." },
        { status: 404 }
      );
    }
    return NextResponse.json(payload);
  } catch (error) {
    if (isMissingHumanContactTables(error)) {
      const fallbackPerson = await fallbackUpdateContact(id, data);
      if (!fallbackPerson) {
        return NextResponse.json(
          { error: "Kontakt nicht gefunden." },
          { status: 404, headers: HUMAN_CONTACT_FALLBACK_HEADERS }
        );
      }
      return NextResponse.json(fallbackPerson, {
        headers: HUMAN_CONTACT_FALLBACK_HEADERS
      });
    }
    console.error("Human contacts PUT failed", error);
    return NextResponse.json(
      { error: "Kontakt konnte nicht aktualisiert werden." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json(
      { error: "Kontakt-ID erforderlich." },
      { status: 400 }
    );
  }
  try {
    const personClient = getHumanContactPersonClient();
    await personClient.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isMissingHumanContactTables(error)) {
      const removed = await fallbackDeleteContact(id);
      if (!removed) {
        return NextResponse.json(
          { error: "Kontakt nicht gefunden." },
          { status: 404, headers: HUMAN_CONTACT_FALLBACK_HEADERS }
        );
      }
      return NextResponse.json({ success: true }, { headers: HUMAN_CONTACT_FALLBACK_HEADERS });
    }
    console.error("Human contacts DELETE failed", error);
    return NextResponse.json(
      { error: "Kontakt konnte nicht gelöscht werden." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const personId = typeof body.personId === "string" ? body.personId : "";
  const activity = parseActivity(body.activity);
  const cadence = parseCadence(body.cadence);
  const enabled =
    typeof body.enabled === "boolean" ? body.enabled : null;

  if (!personId || !activity || !cadence || enabled === null) {
    return NextResponse.json(
      { error: "Ungültige Aufgabenparameter." },
      { status: 400 }
    );
  }

  try {
    const assignmentClient = getHumanContactAssignmentClient();
    if (enabled) {
      await assignmentClient.upsert({
        where: {
          personId_activity_cadence: {
            personId,
            activity,
            cadence
          }
        },
        update: {},
        create: {
          personId,
          activity,
          cadence
        }
      });
    } else {
      await assignmentClient
        .delete({
          where: {
            personId_activity_cadence: {
              personId,
              activity,
              cadence
            }
          }
        })
        .catch((error) => {
          if (
            !error ||
            typeof error !== "object" ||
            (error as { code?: string }).code !== "P2025"
          ) {
            throw error;
          }
        });
    }
    const assignments = await loadHumanContactAssignments(personId);
    return NextResponse.json({ personId, assignments });
  } catch (error) {
    if (isMissingHumanContactTables(error)) {
      const assignments = await fallbackSetAssignment(personId, activity, cadence, enabled);
      return NextResponse.json(
        { personId, assignments },
        { headers: HUMAN_CONTACT_FALLBACK_HEADERS }
      );
    }
    console.error("Human contact assignment PATCH failed", error);
    return NextResponse.json(
      { error: "Aufgaben konnten nicht aktualisiert werden." },
      { status: 500 }
    );
  }
}
