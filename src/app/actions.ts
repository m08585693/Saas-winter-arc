"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Rejoint un groupe.
 * Règle freemium MVP : les utilisateurs non-payants ne peuvent être
 * membres que d'UN SEUL groupe.
 */
export async function joinGroup(groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connecte-toi d'abord." };

  const { data: existing } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("group_id", groupId)
    .maybeSingle();
  if (existing) return { error: "Tu es déjà membre de ce groupe." };

  // Vérification freemium : est-il déjà dans un groupe ? Est-il payant ?
  const { count: groupCount, error: countError } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (countError) return { error: "Erreur serveur." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_paid")
    .eq("id", user.id)
    .maybeSingle();

  if ((groupCount ?? 0) >= 1 && !profile?.is_paid) {
    return {
      error:
        "La version gratuite permet de rejoindre 1 seul groupe. Passe à Arc + pour les groupes illimités.",
    };
  }

  const { error } = await supabase
    .from("memberships")
    .insert({ user_id: user.id, group_id: groupId });
  if (error) return { error: "Impossible de rejoindre ce groupe." };

  return { success: true };
}