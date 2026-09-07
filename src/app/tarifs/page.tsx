import { createClient } from "@/lib/supabase/server";
import { CheckoutButton } from "./checkout-button";

export const dynamic = "force-dynamic";

export default async function TarifsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex-1 mx-auto max-w-3xl w-full px-4 py-14">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Arc +</h1>
        <p className="mt-3 text-muted">
          Tous les groupes. Tous les badges. Pas de limites.
        </p>
      </div>

      {/* Mensuel */}
      <div className="mt-10 rounded-2xl border border-accent bg-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <span className="font-semibold">Mensuel</span>
          <span className="rounded-full bg-accent/15 text-accent text-xs px-3 py-1">
            Engagement libre
          </span>
        </div>
        <div className="px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-6">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">4,99€</span>
              <span className="text-muted">/mois</span>
            </div>
            <p className="mt-1 text-sm text-muted">Résiliable à tout moment.</p>
          </div>
          <div className="flex-1" />
          <CheckoutButton mode="monthly" isLoggedIn={!!user} />
        </div>
      </div>

      {/* Annuel */}
      <div className="mt-6 rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <span className="font-semibold">Annuel</span>
          <span className="rounded-full bg-accent/15 text-accent text-xs px-3 py-1">
            -35% · 2 mois offerts
          </span>
        </div>
        <div className="px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-6">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">39€</span>
              <span className="text-muted">/an</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              Soit 3,25€/mois. Payable une fois.
            </p>
          </div>
          <div className="flex-1" />
          <CheckoutButton mode="yearly" isLoggedIn={!!user} />
        </div>
      </div>

      <div className="mt-10 space-y-3">
        {[
          "Groupes illimités",
          "Badges de palier (7 / 30 / 90 jours)",
          "Création de groupes privés (coachs, salles...)",
          "Tout le classement en temps réel",
        ].map((f) => (
          <div key={f} className="flex items-center gap-3 text-sm">
            <svg className="w-4 h-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}