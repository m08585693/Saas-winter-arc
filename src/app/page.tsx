import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATS = [
  { value: "5 000+", label: "membres actifs" },
  { value: "78%", label: "de rétention à 14 jours" },
  { value: "10", label: "groupes au lancement" },
];

const PRICING = [
  {
    name: "Gratuit",
    price: "0€",
    period: "/mois",
    description: "Pour tester l'effet de groupe.",
    features: [
      "1 groupe public",
      "Check-in quotidien",
      "Classement par streak",
      "Email de rappel quotidien",
    ],
    cta: "Commencer",
    highlighted: false,
  },
  {
    name: "Arc +",
    price: "4,99€",
    period: "/mois",
    description: "Tout pour tenir tes objectifs.",
    features: [
      "Groupes illimités",
      "Badges de palier (7/30/90 jours)",
      "Création de groupes privés",
      "Check-in quotidien",
      "Email de rappel quotidien",
    ],
    cta: "Essayer 14 jours",
    highlighted: true,
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-24 pb-16 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          Tenir un objectif,
          <br />
          <span className="text-accent">plus jamais seul.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-muted text-lg">
          Rejoins un groupe de personnes qui poursuivent le même objectif que
          toi. Un check-in par jour, un classement, un effet de groupe réel.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={user ? "/groupes" : "/login"}
            className="inline-flex h-12 items-center rounded-xl bg-accent px-6 text-base font-medium text-background hover:opacity-90 transition-opacity"
          >
            {user ? "Voir les groupes" : "Commencer gratuitement"}
          </Link>
          <Link
            href="/groupes"
            className="inline-flex h-12 items-center rounded-xl bg-surface border border-border px-6 text-base hover:border-accent transition-colors"
          >
            Explorer les groupes
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-surface/30">
        <div className="mx-auto max-w-4xl grid grid-cols-3 gap-4 px-4 py-10 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-2xl sm:text-4xl font-bold text-accent">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold">
          Comment ça marche
        </h2>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            {
              n: "01",
              t: "Rejoins un groupe",
              d: "Choisis un objectif correspondant à une de tes résolutions.",
            },
            {
              n: "02",
              t: "Check-in chaque jour",
              d: "Confirme en un clic que tu as tenu. Ta série s'allonge.",
            },
            {
              n: "03",
              t: "Grimpe le classement",
              d: "L'effet de groupe te pousse à rester dans le jeu.",
            },
          ].map((f) => (
            <div
              key={f.n}
              className="rounded-2xl bg-surface border border-border p-6"
            >
              <div className="text-3xl font-bold text-accent-blue">{f.n}</div>
              <div className="mt-4 text-lg font-semibold">{f.t}</div>
              <p className="mt-2 text-muted text-sm">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold">Un prix simple</h2>
        <p className="mt-3 text-center text-muted">
          Commence gratuitement. Passe à Arc + quand tu veux.
        </p>
        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {PRICING.map((p) => (
            <div
              key={p.name}
              className={
                "rounded-2xl border p-6 flex flex-col " +
                (p.highlighted
                  ? "border-accent bg-surface"
                  : "border-border bg-surface")
              }
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                {p.highlighted && (
                  <span className="rounded-full bg-accent/15 text-accent text-xs px-3 py-1">
                    Populaire
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="text-muted">{p.period}</span>
              </div>
              <p className="mt-2 text-sm text-muted">{p.description}</p>
              <ul className="mt-6 space-y-3 text-sm flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={p.highlighted ? "/tarifs" : "/groupes"}
                className={
                  "mt-8 inline-flex h-11 items-center justify-center rounded-xl text-sm font-medium " +
                  (p.highlighted
                    ? "bg-accent text-background hover:opacity-90"
                    : "bg-surface-2 text-foreground border border-border hover:border-accent")
                }
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold">
            Ton groupe n&apos;attend que toi.
          </h2>
          <Link
            href={user ? "/groupes" : "/login"}
            className="mt-6 inline-flex h-12 items-center rounded-xl bg-accent px-6 font-medium text-background hover:opacity-90 transition-opacity"
          >
            Rejoindre un groupe
          </Link>
        </div>
      </section>
    </div>
  );
}
