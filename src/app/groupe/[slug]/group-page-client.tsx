"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Group } from "@/lib/types";
import { doCheckin } from "./actions";

type Props = {
  group: Group;
  user: { id: string; email?: string };
  isMember: boolean;
  members: {
    user_id: string;
    display_name: string | null;
    streak: number;
    checked_today: boolean;
  }[];
  myStreak: number;
  checkedTodayToday: boolean;
};

type NewCheckin = {
  user_id: string;
  group_id: string;
  check_date: string;
};

export function GroupPageClient({
  group,
  user,
  isMember,
  members: initialMembers,
  myStreak,
  checkedTodayToday,
}: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [checkedToday, setCheckedToday] = useState(checkedTodayToday);
  const [streak, setStreak] = useState(myStreak);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Realtime : écoute les nouveaux check-ins dans le groupe
  useEffect(() => {
    const supabase = createClient();

    // Stream des checkins du groupe
    const channel = supabase
      .channel(`checkins-${group.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "checkins",
          filter: `group_id=eq.${group.id}`,
        },
        (payload) => {
          const row = payload.new as NewCheckin;
          setMembers((prev) => {
            const target = prev.find((m) => m.user_id === row.user_id);
            if (!target) return prev;
            const isToday =
              row.check_date === new Date().toISOString().slice(0, 10);
            if (!isToday) return prev;
            return prev.map((m) =>
              m.user_id === row.user_id
                ? { ...m, checked_today: true, streak: m.streak + 1 }
                : m
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [group.id]);

  const onCheckin = useCallback(() => {
    startTransition(async () => {
      const res = await doCheckin(group.id);
      if (res.error) {
        alert(res.error);
        return;
      }
      setCheckedToday(true);
      setStreak((s) => s + 1);
      router.refresh();
    });
  }, [group.id, router]);

  const sorted = useMemo(
    () => [...members].sort((a, b) => b.streak - a.streak),
    [members]
  );

  const myRow = useMemo(
    () => sorted.findIndex((m) => m.user_id === user.id) + 1,
    [sorted, user.id]
  );

  const nextBadge = useMemo(() => {
    const tiers = [7, 30, 90];
    const next = tiers.find((t) => t > streak);
    return next ? { target: next, remaining: next - streak } : null;
  }, [streak]);

  return (
    <div className="flex-1 mx-auto max-w-3xl w-full px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <p className="mt-1 text-muted text-sm">{group.description}</p>
      </div>

      {/* Carte d'état personnel */}
      <div className="mt-6 rounded-2xl bg-surface border border-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
          <div>
            <div className="text-sm text-muted">Ta série</div>
            <div className="mt-1 text-4xl font-bold">
              {streak}
              <span className="text-lg text-muted font-normal"> jours</span>
            </div>
            {nextBadge && (
              <div className="mt-2 text-xs text-muted">
                Prochain badge à {nextBadge.target} jours :{" "}
                <span className="text-accent">{nextBadge.remaining} jours</span>{" "}
                restants
              </div>
            )}
          </div>
          <div className="flex-1" />
          {checkedToday ? (
            <div className="inline-flex h-11 items-center rounded-xl bg-accent/10 text-accent px-5 text-sm font-medium">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Check-in fait aujourd&apos;hui
            </div>
          ) : (
            <button
              onClick={onCheckin}
              disabled={pending}
              className="inline-flex h-11 items-center rounded-xl bg-accent px-6 text-sm font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pending ? "..." : "Faire mon check-in"}
            </button>
          )}
        </div>
        {isMember && (
          <div className="mt-4 text-sm text-muted">
            Rang dans le groupe :{" "}
            <span className="text-foreground font-semibold">#{myRow}</span>
          </div>
        )}
      </div>

      {/* Classement */}
      <h2 className="mt-10 text-xl font-semibold">Classement</h2>
      <div className="mt-4 space-y-2">
        {sorted.map((m, i) => {
          const isMe = m.user_id === user.id;
          return (
            <div
              key={m.user_id}
              className={
                "flex items-center gap-4 rounded-xl border p-3.5 " +
                (isMe ? "border-accent bg-accent/5" : "border-border bg-surface")
              }
            >
              <div className="w-7 text-center font-bold text-muted">
                {i + 1}
              </div>
              <div
                className={
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold " +
                  (i === 0 ? "bg-accent/20 text-accent" : "bg-surface-2")
                }
              >
                {m.display_name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {m.display_name ?? "Membre"}
                  {isMe && <span className="text-accent text-xs ml-1">(toi)</span>}
                </div>
              </div>
              {m.checked_today && (
                <span className="text-accent" title="Check-in aujourd'hui">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </span>
              )}
              <div className="text-right">
                <span className="font-bold">{m.streak}</span>
                <span className="text-muted text-xs ml-1">j</span>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-muted text-sm text-center py-8">
            Aucun membre pour l&apos;instant. Rejoins ce groupe et sois le premier !
          </p>
        )}
      </div>

      <p className="mt-8 text-xs text-muted">
        Le classement se met à jour en temps réel.
      </p>
    </div>
  );
}