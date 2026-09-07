import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CheckinConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group: groupSlug } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let streak = 0;
  let rank = 0;
  let today = false;
  let nextBadge: { target: number; remaining: number } | null = null;

  if (user && groupSlug) {
    const { data: group } = await supabase
      .from("groups")
      .select("id, name, slug")
      .eq("slug", groupSlug)
      .maybeSingle();

    if (group) {
      const { data: streakData } = await supabase.rpc("get_current_streak", {
        p_user_id: user.id,
        p_group_id: group.id,
      });
      streak = streakData ?? 0;

      const todayStr = new Date().toISOString().slice(0, 10);
      const { count: todayCount } = await supabase
        .from("checkins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("group_id", group.id)
        .eq("check_date", todayStr);
      today = (todayCount ?? 0) > 0;

      // Rang : membres du groupe triés par streak
      const { data: allMembers } = await supabase
        .from("memberships")
        .select("user_id")
        .eq("group_id", group.id);
      const ranks: { user_id: string; streak: number }[] = [];
      if (allMembers) {
        for (const m of allMembers) {
          const { data: s } = await supabase.rpc("get_current_streak", {
            p_user_id: m.user_id,
            p_group_id: group.id,
          });
          ranks.push({ user_id: m.user_id, streak: s ?? 0 });
        }
        ranks.sort((a, b) => b.streak - a.streak);
        rank = ranks.findIndex((r) => r.user_id === user.id) + 1;
      }

      const tiers = [7, 30, 90];
      const next = tiers.find((t) => t > streak);
      nextBadge = next ? { target: next, remaining: next - streak } : null;
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        {today ? (
          <div className="rounded-2xl bg-surface border border-border p-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold">
              Check-in enregistré !
            </h1>
            <p className="mt-2 text-muted text-sm">
              Un jour de plus dans la série. La discipline, jour après jour.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface-2 border border-border p-4">
                <div className="text-3xl font-bold text-accent">{streak}</div>
                <div className="mt-1 text-xs text-muted">jours de série</div>
              </div>
              <div className="rounded-xl bg-surface-2 border border-border p-4">
                <div className="text-3xl font-bold">
                  {rank > 0 ? `#${rank}` : "—"}
                </div>
                <div className="mt-1 text-xs text-muted">rang du groupe</div>
              </div>
            </div>

            {nextBadge && (
              <div className="mt-4 rounded-xl bg-accent/10 border border-accent/20 p-4 text-sm">
                <span className="text-accent font-medium">
                  Prochain badge : {nextBadge.target} jours
                </span>
                <span className="text-muted ml-1">
                  (encore {nextBadge.remaining} j)
                </span>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href={`/groupe/${groupSlug}`}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface-2 text-sm font-medium hover:border-accent transition-colors"
              >
                Voir le classement
              </Link>
              <Link
                href="/profil"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-accent text-sm font-medium text-background hover:opacity-90 transition-opacity"
              >
                Voir mon profil
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-8">
            <h1 className="text-xl font-semibold">Aucun check-in ajourd&apos;hui</h1>
            <p className="mt-2 text-muted text-sm">
              Fais ton check-in depuis la page de ton groupe.
            </p>
            <Link
              href={groupSlug ? `/groupe/${groupSlug}` : "/groupes"}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-accent px-6 text-sm font-medium text-background hover:opacity-90 transition-opacity"
            >
              Retour au groupe
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}