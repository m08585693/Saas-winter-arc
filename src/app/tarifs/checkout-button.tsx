"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function CheckoutButton({
  mode,
  isLoggedIn,
}: {
  mode: "monthly" | "yearly";
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!isLoggedIn) {
      router.push("/login?next=/tarifs");
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?next=/tarifs");
        return;
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Une erreur est survenue.");
      }
    });
  }

  if (!isLoggedIn) {
    return (
      <Link
        href="/login?next=/tarifs"
        className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-6 text-sm font-medium text-background hover:opacity-90 transition-opacity"
      >
        Se connecter
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-6 text-sm font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {pending ? "Redirection..." : "Choisir cette offre"}
    </button>
  );
}