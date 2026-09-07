import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Filet de sécurité : certains templates d'email Supabase pointent vers
// <SiteURL>/auth/v1/verify au lieu de <projet>.supabase.co.
// On intercepte et on valide le token ici pour éviter un 404.

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const redirectTo = searchParams.get("redirect_to");
  const next = searchParams.get("next") ?? "/groupes";

  const errorPath = (message: string) =>
    `${origin}/login?error=${encodeURIComponent(message)}`;

  if (!tokenHash || !type) {
    // Pas de token : redirige le flux vers /auth/callback (PKCE)
    const to = redirectTo ?? `${origin}/auth/callback`;
    return NextResponse.redirect(to);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "magiclink" | "email" | "sms" | "recovery" | "invite",
  });

  if (error || !data.session) {
    return NextResponse.redirect(errorPath("Lien invalide ou expiré. Demande un nouveau lien."));
  }

  const target = redirectTo?.startsWith(origin)
    ? redirectTo
    : `${origin}${next}`;
  return NextResponse.redirect(target);
}