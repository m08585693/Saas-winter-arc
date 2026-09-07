import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStreaks } from "@/lib/streaks";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center rounded-2xl border border-border bg-surface p-8 max-w-sm">
          <h1 className="text-xl font-semibold">Connecte-toi</h1>
          <p className="mt-2 text-muted text-sm">
            Accède à ton profil pour suivre tes badges et tes groupes.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-accent px-6 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            Connexion
          </Link>
        </div>
      </div>
    );
  }

  const [profileData, groupsData, membershipsData, badgesData, userBadgesData] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("groups").select("id, name, slug, description, is_private"),
      supabase.from("memberships").select("group_id").eq("user_id", user.id),
      supabase.rpc("get_all_badges"),
      supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", user.id),
    ]);

  const profile = profileData.data;
  const groups = groupsData.data ?? [];
  const memberships = membershipsData.data ?? [];
  const badges = badgesData.data ?? [];
  const userBadges = userBadgesData.data ?? [];

  const myGroupIds = new Set(memberships.map((m) => m.group_id));
  const myGroups = groups.filter((g) => myGroupIds.has(g.id));

  // Streak par groupe
  const streaks = await getStreaks(user.id, myGroups.map((g) => g.id));

  const earnedBadgeIds = new Set(userBadges.map((b) => b.badge_id));
  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "toi";
  const isPaid = profile?.is_paid ?? false;

  return (
    <div className="flex-1 mx-auto max-w-3xl w-full px-4 py-10">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-accent/15 flex items-center justify-center text-xl font-bold text-accent">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-sm text-muted">
            {user.email} {isPaid && <span className="text-accent">· Arc +</span>}
          </p>
        </div>
      </div>

      {/* Badges */}
      <h2 className="mt-10 text-xl font-semibold">Badges</h2>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {badges.map((b: { id: number; name: string; days_required: number; icon: string | null }) => {
          const earned = earnedBadgeIds.has(b.id);
          return (
            <div
              key={b.id}
              className={
                "rounded-2xl border p-4 text-center " +
                (earned ? "border-accent/40 bg-accent/5" : "border-border bg-surface opacity-50")
              }
            >
              <div className="text-2xl">{b.icon ?? "🎖️"}</div>
              <div className="mt-2 text-sm font-medium">{b.name}</div>
              <div className="text-xs text-muted mt-1">
                {earned ? "Débloqué" : `${b.days_required} jours`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Groupes rejoints */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Mes groupes</h2>
        <Link href="/groupes" className="text-sm text-accent hover:underline">
          + Rejoindre
        </Link>
      </div>
      <div className="mt-4 space-y-2">
        {myGroups.length === 0 && (
          <p className="text-muted text-sm text-center py-8">
            Tu n&apos;as pas encore rejoint de groupe.{" "}
            <Link href="/groupes" className="text-accent hover:underline">
              C&apos;est le moment.
            </Link>
          </p>
        )}
        {myGroups.map((g) => (
          <Link
            key={g.id}
            href={`/groupe/${g.slug}`}
            className="block rounded-xl border border-border bg-surface p-4 hover:border-accent transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{g.name}</div>
                <div className="text-xs text-muted mt-0.5">{g.description}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-accent">
                  {streaks.get(g.id) ?? 0}
                  <span className="text-muted text-xs font-normal"> j</span>
                </div>
                <div className="text-xs text-muted">streak</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}