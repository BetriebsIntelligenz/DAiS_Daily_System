"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "./ui/button";
import { Card, CardDescription, CardTitle } from "./ui/card";

interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  active: boolean;
}

interface Redemption {
  id: string;
  status: string;
  requestedAt: string;
  resolvedAt?: string | null;
  reward: Reward;
}

export function RewardsGrid() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/rewards");
    const data = await response.json();
    setRewards(data.rewards);
    setRedemptions(data.redemptions);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRedeem = async (rewardId: string) => {
    await fetch("/api/rewards/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardId })
    });
    await refresh();
  };

  const handleRelist = async (rewardId: string, redemptionId: string) => {
    await fetch("/api/rewards/relist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardId, redemptionId })
    });
    await refresh();
  };

  const activeRewards = rewards.filter((reward) => reward.active);

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2">
        {activeRewards.map((reward) => (
          <Card key={reward.id}>
            <CardTitle>{reward.name}</CardTitle>
            <CardDescription>{reward.description}</CardDescription>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-2xl font-semibold text-daisy-600">
                {reward.cost} XP
              </p>
              <Button onClick={() => handleRedeem(reward.id)}>Einlösen</Button>
            </div>
          </Card>
        ))}
        {!activeRewards.length && (
          <p className="text-sm text-gray-500">
            Keine aktiven Rewards, sobald neue freigeschaltet werden tauchen sie
            hier auf.
          </p>
        )}
      </div>

      <section className="space-y-4">
        <header>
          <h3 className="text-xl font-semibold">Eingelöste Rewards</h3>
          <p className="text-sm text-gray-500">
            Historie der letzten Einlösungen inkl. Re-Listing.
          </p>
        </header>
        {redemptions.length === 0 ? (
          <p className="text-sm text-gray-500">
            Noch keine Reward-Einlösungen vorhanden.
          </p>
        ) : (
          <div className="space-y-3">
            {redemptions.map((redemption) => (
              <Card
                key={redemption.id}
                className="flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <CardTitle>{redemption.reward.name}</CardTitle>
                  <CardDescription>
                    Eingelöst am{" "}
                    {new Date(redemption.requestedAt).toLocaleString("de-DE")}
                    {redemption.resolvedAt
                      ? ` · abgeschlossen ${new Date(
                          redemption.resolvedAt
                        ).toLocaleString("de-DE")}`
                      : ""}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold uppercase tracking-wide text-daisy-600">
                    {redemption.status}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleRelist(redemption.reward.id, redemption.id)
                    }
                  >
                    Wieder listen
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
