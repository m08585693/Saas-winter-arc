"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-background font-bold text-lg">
        a
      </span>
      <span className="font-semibold text-lg tracking-tight">Arc</span>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl flex h-14 items-center justify-between px-4">
        <Logo />
        <nav className="hidden sm:flex items-center gap-6 text-sm text-muted">
          <Link
            href="/groupes"
            className={pathname.startsWith("/groupes") ? "text-foreground" : "hover:text-foreground"}
          >
            Groupes
          </Link>
          <Link
            href="/tarifs"
            className={pathname === "/tarifs" ? "text-foreground" : "hover:text-foreground"}
          >
            Tarifs
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {user === null ? (
            <div className="h-9 w-24 rounded-lg bg-border animate-pulse" />
          ) : user ? (
            <Link
              href="/profil"
              className="inline-flex h-9 items-center rounded-lg bg-surface border border-border px-3 text-sm hover:border-accent transition-colors"
            >
              Mon profil
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-background hover:opacity-90 transition-opacity"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
