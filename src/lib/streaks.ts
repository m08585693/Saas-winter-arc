import { createClient } from "@/lib/supabase/server";

/**
 * Calcule le streak courant de l'utilisateur pour une liste de groupes.
 */
export async function getStreaks(
  userId: string,
  groupIds: string[]
): Promise<Map<string, number>> {
  const supabase = await createClient();
  const map = new Map<string, number>();
  for (const groupId of groupIds) {
    const { data } = await supabase.rpc("get_current_streak", {
      p_user_id: userId,
      p_group_id: groupId,
    });
    map.set(groupId, data ?? 0);
  }
  return map;
}

/**
 * Retourne les badges de palier.
 */
export async function getBadges() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_all_badges");
  return data as
    | { id: number; name: string; days_required: number; icon: string | null }[]
    | null;
}