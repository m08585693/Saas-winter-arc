"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinGroup } from "@/app/actions";

export function JoinButton({
  groupId,
  groupSlug,
  isLoggedIn,
}: {
  groupId: string;
  groupSlug: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!isLoggedIn) {
      router.push(`/login?next=/groupe/${groupSlug}`);
      return;
    }
    startTransition(async () => {
      const res = await joinGroup(groupId);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.push(`/groupe/${groupSlug}`);
      router.refresh();
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {pending ? "..." : isLoggedIn ? "Rejoindre" : "Rejoindre (connexion)"}
    </button>
  );
}