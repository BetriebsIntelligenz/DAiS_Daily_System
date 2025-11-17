"use client";

import { useState } from "react";
import { programDefinitions, rewardDefinitions } from "@/lib/data";
import { Button } from "./ui/button";

export function AdminPanels() {
  const [programName, setProgramName] = useState("");
  const [category, setCategory] = useState("mind");
  const [rewardName, setRewardName] = useState("");
  const [rewardCost, setRewardCost] = useState(1000);

  const createProgram = async () => {
    await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: programName, category })
    });
    setProgramName("");
    alert("Programm stub angelegt – erweitere anschließend Units & Exercises.");
  };

  const createReward = async () => {
    await fetch("/api/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: rewardName, cost: rewardCost })
    });
    setRewardName("");
    setRewardCost(1000);
    alert("Belohnung gespeichert.");
  };

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-white/80 p-6">
        <header>
          <h2 className="text-xl font-semibold">Programme verwalten</h2>
          <p className="text-sm text-gray-500">
            Bestehende Programme ({programDefinitions.length}) aus der Seed-Liste.
          </p>
        </header>

        <div className="mt-4 grid gap-3">
          <input
            value={programName}
            onChange={(event) => setProgramName(event.target.value)}
            placeholder="Programmname"
            className="rounded-2xl border border-daisy-200 px-4 py-3"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-2xl border border-daisy-200 px-4 py-3"
          >
            <option value="mind">Mind</option>
            <option value="body">Body</option>
            <option value="human">Human</option>
            <option value="environment">Environment</option>
            <option value="business">Business</option>
          </select>
          <Button onClick={createProgram}>Programm anlegen</Button>
        </div>
      </section>

      <section className="rounded-3xl bg-white/80 p-6">
        <header>
          <h2 className="text-xl font-semibold">Belohnungen verwalten</h2>
          <p className="text-sm text-gray-500">
            Aktive Rewards: {rewardDefinitions.filter((r) => r.active).length}
          </p>
        </header>

        <div className="mt-4 grid gap-3">
          <input
            value={rewardName}
            onChange={(event) => setRewardName(event.target.value)}
            placeholder="Belohnungsname"
            className="rounded-2xl border border-daisy-200 px-4 py-3"
          />
          <input
            type="number"
            value={rewardCost}
            onChange={(event) => setRewardCost(Number(event.target.value))}
            className="rounded-2xl border border-daisy-200 px-4 py-3"
          />
          <Button onClick={createReward}>Belohnung speichern</Button>
        </div>
      </section>
    </div>
  );
}
