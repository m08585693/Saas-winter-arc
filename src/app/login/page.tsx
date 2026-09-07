"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/groupes";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          window.location.origin + "/auth/callback?next=" + encodeURIComponent(next),
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full rounded-2xl border border-border bg-surface p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-semibold">Vérifie tes emails</h1>
          <p className="mt-2 text-muted text-sm">
            Nous avons envoyé un lien de connexion à <b>{email}</b>. Clique
            dessus pour entrer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <h1 className="text-2xl font-bold">Connexion</h1>
        <p className="mt-2 text-muted text-sm">
          Pas de mot de passe. On t&apos;envoie un lien magique par email.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm text-muted" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@exemple.com"
              className="mt-1.5 w-full h-11 rounded-xl bg-surface border border-border px-4 text-sm outline-none focus:border-accent transition-colors"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-accent font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Envoi..." : "Recevoir le lien"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-40 rounded-lg bg-border animate-pulse" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
