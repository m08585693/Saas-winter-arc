import { NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (userId) {
        await admin
          .from("profiles")
          .upsert({ id: userId, is_paid: true }, { onConflict: "id" });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      // Récupérer l'utilisateur via le customer_id
      const customerId = subscription.customer as string;
      const { data } = await admin
        .from("profiles")
        .select("id")
        .eq("email", customerId)
        .maybeSingle();
      if (data?.id) {
        await admin
          .from("profiles")
          .update({ is_paid: false })
          .eq("id", data.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}