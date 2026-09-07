import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PLANS: Record<string, { priceId: string }> = {
  monthly: { priceId: process.env.STRIPE_PRICE_MONTHLY ?? "" },
  yearly: { priceId: process.env.STRIPE_PRICE_YEARLY ?? "" },
};

export async function POST(request: Request) {
  const { mode } = await request.json();
  const plan = PLANS[mode as "monthly" | "yearly"];

  if (!plan?.priceId) {
    return NextResponse.json(
      { error: "Paiement non configuré (priceId manquant)." },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/tarifs?success=1`,
      cancel_url: `${baseUrl}/tarifs?cancelled=1`,
      metadata: { userId: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Stripe checkout error", e);
    return NextResponse.json(
      { error: "Impossible de créer la session de paiement." },
      { status: 500 }
    );
  }
}