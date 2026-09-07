import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GroupPageClient } from "./group-page-client";
import type { GroupMember } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!group) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Est-on membre ?
  const { data: membership } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("group_id", group.id)
    .maybeSingle();
  const isMember = !!membership;

  // Champ computed pour la query (streak calculé en SQL)
  const membersResult = await supabase
    .from("checkins")
    .select("user_id, profiles(display_name), get_current_streak(user_id)")
    .eq("group_id", group.id);

  // On calcule les streaks via la fonction SQL de façon fiable.
  const memberRows: { user_id: string; display_name: string | null }[] = [];
  const seen = new Set<string>();
  if (membersResult.error) {
    console.error("checkins query error", membersResult.error);
  } else {
    for (const row of membersResult.data) {
      if (!seen.has(row.user_id)) {
        seen.add(row.user_id);
        memberRows.push({
          user_id: row.user_id,
          display_name: (row as unknown as { profiles: { display_name: string | null } | null })
            .profiles?.display_name ?? null,
        });
      }
    }
  }

  // Streak pour chaque membre + checked_today, de façon robuste.
  const members: GroupMember[] = [];
  for (const m of memberRows) {
    const { data: streakData } = await supabase.rpc("get_current_streak", {
      p_user_id: m.user_id,
      p_group_id: group.id,
    });
    const today = new Date().toISOString().slice(0, 10);
    const { count: checkedToday } = await supabase
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", m.user_id)
      .eq("group_id", group.id)
      .eq("check_date", today);
    members.push({
      user_id: m.user_id,
      display_name: m.display_name,
      streak: streakData ?? 0,
      checked_today: (checkedToday ?? 0) > 0,
    });
  }

  const myStreak = members.find((m) => m.user_id === user.id)?.streak ?? 0;
  const checkedToday = members.find((m) => m.user_id === user.id)?.checked_today ?? false;

  return (
    <GroupPageClient
      group={group}
      user={user}
      isMember={isMember}
      members={members}
      myStreak={myStreak}
      checkedTodayToday={checkedToday}
    />
  );
}