"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Enregistre le check-in de l'utilisateur pour aujourd'hui dans un groupe.
 * La contrainte unique (user, group, date) garantit un seul check-in par jour.
 */
export async function doCheckin(groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connecte-toi d'abord." };

  const { count, error: countError } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("group_id", groupId);
  if (countError) return { error: "Erreur serveur." };
  if ((count ?? 0) === 0)
    return { error: "Tu dois rejoindre ce groupe avant de te check-in." };

  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from("checkins")
    .select("id")
    .eq("user_id", user.id)
    .eq("group_id", groupId)
    .eq("check_date", today)
    .maybeSingle();
  if (existing) return { error: "Tu as déjà fait ton check-in aujourd'hui." };

  const { error } = await supabase
    .from("checkins")
    .insert({ user_id: user.id, group_id: groupId, check_date: today });
  if (error) return { error: "Impossible d'enregistrer le check-in." };

  return { success: true };
}