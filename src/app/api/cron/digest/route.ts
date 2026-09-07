export const maxDuration = 300;

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Cron quotidien via Vercel : '0 7 * * *' (7h UTC = 9h en France)
export const dynamic = "force-dynamic";

/**
 * Digest quotidien :
 * pour chaque membre d'un groupe actif, envoie un email avec
 *  - le nombre de check-ins du jour dans le groupe
 *  - le streak du membre
 *  - un lien direct de check-in
 * Utile surtout en phase de test : en production, on veut éviter le spam.
 */
export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY non configurée." },
      { status: 500 }
    );
  }

  const admin = createAdminClient();

  // Groupes publics (tous pour le MVP)
  const { data: groups } = await admin.from("groups").select("*");

  const today = new Date().toISOString().slice(0, 10);
  let emailsSent = 0;
  const from =
    process.env.EMAIL_FROM ?? "Arc <onboarding@resend.dev>";

  for (const group of groups ?? []) {
    const { data: members } = await admin
      .from("memberships")
      .select("user_id, profiles(email, display_name)")
      .eq("group_id", group.id);

    if (!members || members.length === 0) continue;

    const { count: todayCount } = await admin
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .eq("group_id", group.id)
      .eq("check_date", today);

    for (const member of members) {
      const profile = member
        .profiles as unknown as { email?: string; display_name?: string } | null;
      const email = profile?.email;
      if (!email) continue;

      // Déjà check-in aujourd'hui ? Pas besoin de rappel.
      const { count } = await admin
        .from("checkins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", member.user_id)
        .eq("group_id", group.id)
        .eq("check_date", today);
      if ((count ?? 0) > 0) continue;

      const { data: streak } = await admin.rpc("get_current_streak", {
        p_user_id: member.user_id,
        p_group_id: group.id,
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const subject = `Arc — ${todayCount ?? 0} personne${
        (todayCount ?? 0) > 1 ? "s" : ""
      } a déjà check-in dans « ${group.name} »`;

      try {
        const Resend = (await import("resend")).Resend;
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from,
          to: [email],
          subject,
          html: digestHtml({
            email,
            groupName: group.name,
            streak: streak ?? 0,
            todayCount: todayCount ?? 0,
            checkinUrl: `${baseUrl}/groupe/${group.slug}`,
            profileUrl: `${baseUrl}/profil`,
          }),
        });
        emailsSent++;
      } catch (e) {
        console.error("Email digest error", e);
      }
    }
  }

  return NextResponse.json({ emailsSent });
}

function digestHtml(opts: {
  email: string;
  groupName: string;
  streak: number;
  todayCount: number;
  checkinUrl: string;
  profileUrl: string;
}) {
  const name = opts.email.split("@")[0];
  return `<body style="margin:0;background:#0B0B0E;font-family:-apple-system,Segoe UI,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0B0B0E;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="420" cellspacing="0" cellpadding="0">
        <tr><td style="text-align:center;font-size:22px;font-weight:700;color:#EDEDED;padding-bottom:24px;">
          <span style="background:#3ECF8E;color:#0B0B0E;border-radius:8px;display:inline-block;width:32px;height:32px;line-height:32px;">a</span>
          &nbsp;Arc
        </td></tr>
        <tr><td style="background:#17171B;border:1px solid #26262B;border-radius:16px;padding:32px;">
          <div style="color:#EDEDED;font-weight:600;font-size:18px;">Bonjour ${name} 👋</div>
          <div style="color:#8A8A93;font-size:14px;margin-top:8px;">
            <b style="color:#EDEDED;">${opts.todayCount}</b> personne${opts.todayCount > 1 ? "s" : ""} a déjà
            fait son check-in aujourd'hui dans <b style="color:#3ECF8E;">${opts.groupName}</b>.
          </div>
          <div style="background:#1E1E24;border:1px solid #26262B;border-radius:12px;padding:16px;margin-top:16px;text-align:center;">
            <div style="font-size:34px;font-weight:700;color:#3ECF8E;">${opts.streak} j</div>
            <div style="color:#8A8A93;font-size:12px;">de série</div>
          </div>
          <a href="${opts.checkinUrl}" style="display:block;background:#3ECF8E;color:#0B0B0E;text-decoration:none;font-weight:600;text-align:center;border-radius:12px;padding:14px;margin-top:20px;">
            Faire mon check-in
          </a>
          <a href="${opts.profileUrl}" style="display:block;color:#8A8A93;text-decoration:none;font-size:12px;text-align:center;margin-top:12px;">
            Voir mes stats
          </a>
        </td></tr>
        <tr><td style="color:#5a5a61;font-size:12px;text-align:center;padding-top:16px;">
          Reçu automatiquement — tu peux te désabonner en supprimant ton compte dans l'app.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>`;
}