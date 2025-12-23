"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "./ui/button";
import { Card, CardDescription, CardTitle } from "./ui/card";
import { useAuth } from "./auth-gate";

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
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [xpBalance, setXpBalance] = useState<number>(0);

  const refresh = useCallback(async () => {
    const emailQuery = user?.email ? `?email=${encodeURIComponent(user.email)}` : "";
    const response = await fetch(`/api/rewards${emailQuery}`);
    const data = await response.json();
    setRewards(data.rewards);
    setRedemptions(data.redemptions);

    const summaryResponse = await fetch(`/api/xp/summary${emailQuery}`);
    const summaryData = await summaryResponse.json();
    setXpBalance(summaryData.total ?? 0);
  }, [user?.email]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRedeem = async (rewardId: string) => {
    await fetch("/api/rewards/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardId, userEmail: user?.email, userName: user?.name })
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
      <div className="rounded-[36px] border-4 border-white/70 bg-gradient-to-r from-[#ffeab7]/90 via-[#ffb9df]/90 to-[#a5ddff]/90 p-6 text-[#2f1031] shadow-arcade">
        <p className="font-arcade text-[11px] uppercase tracking-[0.5em]">
          Aktuelle Punkte
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <p className="text-5xl font-black tracking-wide">
            {xpBalance.toLocaleString()} XP
          </p>
          <span className="rounded-xl bg-white/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em]">
            ready
          </span>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {activeRewards.map((reward) => (
          <Card key={reward.id}>
            <CardTitle>{reward.name}</CardTitle>
            <CardDescription>{reward.description}</CardDescription>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-2xl font-semibold text-[#f15997]">
                {reward.cost} XP
              </p>
              <Button variant="lagoon" onClick={() => handleRedeem(reward.id)}>
                Einlösen
              </Button>
            </div>
          </Card>
        ))}
        {!activeRewards.length && (
          <p className="text-sm text-[#4d5785]">
            Keine aktiven Rewards, sobald neue freigeschaltet werden tauchen sie
            hier auf.
          </p>
        )}
      </div>

      <section className="space-y-4">
        <header>
          <h3 className="font-arcade text-base uppercase tracking-[0.35em]">
            Eingelöste Rewards
          </h3>
          <p className="text-sm text-[#4c5680]">
            Historie der letzten Einlösungen inkl. Re-Listing.
          </p>
        </header>
        {redemptions.length === 0 ? (
          <p className="text-sm text-[#4c5680]">
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
                  <span className="text-xs font-arcade uppercase tracking-[0.4em] text-[#0c1d3a]">
                    {redemption.status}
                  </span>
                  <Button
                    variant="meadow"
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
