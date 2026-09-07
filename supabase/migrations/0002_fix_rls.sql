-- ============================================================
-- Arc - Fix 0002 : correction RLS (infinite recursion)
-- Cause : les policies lisaient public.memberships dans leur
-- propre condition, ce qui recursait a l infini.
-- Correctif : fonction SECURITY DEFINER is_group_member.
-- ============================================================

create or replace function public.is_group_member(p_user_id uuid, p_group_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.memberships
    where user_id = p_user_id and group_id = p_group_id
  );
$$;

-- Groupes : public lisible par tous, prive seulement par les membres
drop policy if exists "groups_select" on public.groups;
create policy "groups_select" on public.groups for select using (
  not is_private
  or public.is_group_member(auth.uid(), id)
);

-- Adhesions : chacun lit les siennes, ou celles de son groupe
drop policy if exists "memberships_select" on public.memberships;
create policy "memberships_select" on public.memberships for select using (
  user_id = auth.uid()
  or public.is_group_member(auth.uid(), group_id)
);

-- Check-ins : chacun lit les siens, ou ceux des membres de son groupe
drop policy if exists "checkins_select" on public.checkins;
create policy "checkins_select" on public.checkins for select using (
  user_id = auth.uid()
  or public.is_group_member(auth.uid(), group_id)
);