import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { JoinButton } from "./join-button";

async function getGroupsAndMemberships() {
  const supabase = createAdminClient();

  const { data: groups } = await supabase
    .from("groups")
    .select("*, memberships(count)")
    .eq("is_private", false)
    .order("name");

  return { groups: (groups ?? []) as GroupWithCount[] };
}

type GroupWithCount = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
  created_by: string | null;
  memberships_count: number;
};

export const dynamic = "force-dynamic";

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { groups } = await getGroupsAndMemberships();
  const { q } = await searchParams;

  const query = (q ?? "").trim().toLowerCase();
  const filtered = query
    ? groups.filter(
        (g) =>
          g.name.toLowerCase().includes(query) ||
          (g.description ?? "").toLowerCase().includes(query)
      )
    : groups;

  return (
    <div className="flex-1 mx-auto max-w-3xl w-full px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Groupes publics</h1>
          <p className="mt-1 text-muted text-sm">
            Rejoins un objectif et commence ta série aujourd&apos;hui.
          </p>
        </div>
      </div>

      <form method="get" className="mt-6">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Rechercher un objectif... (ex : musculation, 6h)"
          className="w-full h-12 rounded-xl bg-surface border border-border px-4 text-sm outline-none focus:border-accent transition-colors"
        />
      </form>

      <div className="mt-6 space-y-3">
        {filtered.length === 0 && (
          <p className="text-muted text-sm text-center py-10">
            Aucun groupe trouvé pour « {q} ».
          </p>
        )}
        {filtered.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>

      <p className="mt-8 text-xs text-muted">
        💡 Tu peux rejoindre <b>1 groupe gratuitement</b>. Arc + débloque les
        groupes illimités{" "}
        <Link href="/tarifs" className="text-accent hover:underline">
          → voir les tarifs
        </Link>
      </p>
    </div>
  );
}

async function GroupCard({ group }: { group: GroupWithCount }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isMember = user
    ? await isMemberOfGroup(user.id, group.id)
    : false;

  return (
    <div className="rounded-2xl bg-surface border border-border p-5 flex items-center justify-between gap-4">
      <div>
        <h2 className="font-semibold">{group.name}</h2>
        <p className="mt-1 text-sm text-muted line-clamp-2">
          {group.description}
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {group.memberships_count} membre{group.memberships_count > 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <div className="shrink-0">
        {isMember ? (
          <Link
            href={`/groupe/${group.slug}`}
            className="inline-flex h-10 items-center rounded-xl border border-accent text-accent px-4 text-sm font-medium hover:bg-accent/10 transition-colors"
          >
            Voir le groupe
          </Link>
        ) : (
          <JoinButton
            groupId={group.id}
            groupSlug={group.slug}
            isLoggedIn={!!user}
          />
        )}
      </div>
    </div>
  );
}

async function isMemberOfGroup(userId: string, groupId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("group_id", groupId);
  return (count ?? 0) > 0;
}