import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/groupes";
  const linkError = searchParams.get("error");

  const errorPath = (message: string) =>
    `${origin}/login?error=${encodeURIComponent(message)}`;

  if (linkError) {
    return NextResponse.redirect(errorPath("Lien invalide ou expiré. Demande un nouveau lien."));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
    return NextResponse.redirect(errorPath(`Échec de la connexion : ${error.message}`));
  }

  return NextResponse.redirect(errorPath("Lien invalide. Demande un nouveau lien."));
}
