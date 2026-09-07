-- ============================================================
-- Arc - Plateforme de groupes de motivation
-- Migration 0001 : schema de base + auth
-- A coller dans Supabase Dashboard > SQL Editor
-- (version ASCII-safe : aucun caractere special)
-- ============================================================

-- ---------- Profil utilisateur (lie a auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  is_paid boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Groupes ----------
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- ---------- Adhesions (memberships) ----------
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (user_id, group_id)
);

-- ---------- Check-ins ----------
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  check_date date not null default (now() at time zone 'utc')::date,
  checked_at timestamptz not null default now(),
  -- un seul check-in par jour et par groupe, par utilisateur
  unique (user_id, group_id, check_date)
);

-- ---------- Badges de palier ----------
create table if not exists public.badges (
  id bigint primary key generated always as identity,
  name text not null,
  days_required int not null,
  icon text
);

insert into public.badges (name, days_required, icon) values
  ('7 jours', 7, 'flamme'),
  ('30 jours', 30, 'eclair'),
  ('90 jours', 90, 'coupe')
on conflict do nothing;

-- ---------- Badges debloques par utilisateur ----------
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id bigint not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- ============================================================
-- Fonction de calcul du streak courant d'un membre dans un groupe
-- (serie de jours consecutifs de check-in se terminant aujourd'hui
--  ou hier, sinon le streak est reinitialise / nul)
-- ============================================================
create or replace function public.get_current_streak(
  p_user_id uuid,
  p_group_id uuid
) returns int language plpgsql stable as $$
declare
  streak int := 0;
  cursor_date date := (now() at time zone 'utc')::date;
begin
  -- Si pas de check-in aujourd'hui, on regarde si celui d'hier est present
  if not exists (
    select 1 from public.checkins
    where user_id = p_user_id and group_id = p_group_id and check_date = cursor_date
  ) then
    cursor_date := cursor_date - 1;
  end if;

  -- Compte les jours consecutifs en remontant dans le passe
  while exists (
    select 1 from public.checkins
    where user_id = p_user_id and group_id = p_group_id and check_date = cursor_date
  ) loop
    streak := streak + 1;
    cursor_date := cursor_date - 1;
  end loop;

  return streak;
end;
$$;

-- ============================================================
-- Fonction : renvoie tous les badges (pour la page profil)
-- ============================================================
create or replace function public.get_all_badges()
returns table (id bigint, name text, days_required int, icon text)
language sql stable as $$
  select b.id, b.name, b.days_required, b.icon
  from public.badges b
  order by b.days_required;
$$;

-- ============================================================
-- Fonction : l'utilisateur p_user_id est-il membre du groupe ?
-- (SECURITY DEFINER pour eviter la recursion RLS)
-- ============================================================
create or replace function public.is_group_member(p_user_id uuid, p_group_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.memberships
    where user_id = p_user_id and group_id = p_group_id
  );
$$;

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.memberships enable row level security;
alter table public.checkins enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

-- Profils : chacun lit les profils, chacun edite le sien
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Groupes : publics lisibles par tous (les prives uniquement par membres)
create policy "groups_select" on public.groups for select using (
  not is_private
  or public.is_group_member(auth.uid(), id)
);
create policy "groups_insert" on public.groups for insert
  with check (auth.uid() = created_by);

-- Adhesions : l'utilisateur gere les siennes, lecture par les membres du groupe
create policy "memberships_select" on public.memberships for select using (
  user_id = auth.uid()
  or public.is_group_member(auth.uid(), group_id)
);
create policy "memberships_insert" on public.memberships for insert
  with check (user_id = auth.uid());
create policy "memberships_delete" on public.memberships for delete
  using (user_id = auth.uid());

-- Check-ins : chacun ne cree/lit que les siens (les membres voient les autres via query)
create policy "checkins_select" on public.checkins for select using (
  user_id = auth.uid()
  or public.is_group_member(auth.uid(), group_id)
);
create policy "checkins_insert" on public.checkins for insert
  with check (user_id = auth.uid());
create policy "checkins_delete" on public.checkins for delete
  using (user_id = auth.uid());

-- Badges : lecture publique
create policy "badges_select" on public.badges for select using (true);

-- User badges : chacun lit/attribue les siens
create policy "user_badges_select" on public.user_badges for select using (true);
create policy "user_badges_insert" on public.user_badges for insert
  with check (user_id = auth.uid());

-- ============================================================
-- Trigger : creation automatique du profil a l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Seed : groupes publics de lancement
-- ============================================================
insert into public.groups (name, slug, description, is_private) values
  ('Winter arc musculation', 'winter-arc-muscu', 'S entrainer 5x par semaine pendant tout l hiver', false),
  ('Reveil a 6h', 'reveil-6h', 'Se lever a 6h tous les matins', false),
  ('Arret ecrans', 'arret-ecrans', 'Limiter le temps d ecran a 1h/jour hors travail', false),
  ('Lecture quotidienne', 'lecture-quotidienne', 'Lire 20 pages par jour', false),
  ('Meditation matinale', 'meditation-matin', '20 min de meditation au reveil', false),
  ('Eau & hydratation', 'eau-hydratation', 'Boire 2L d eau par jour', false),
  ('Course a pied', 'course-a-pied', 'Courir 3x par semaine', false),
  ('Sommeil regulier', 'sommeil-regulier', 'Couche avant 23h, 8h de sommeil', false),
  ('Ecriture quotidienne', 'ecriture-quotidienne', 'Ecrire 500 mots par jour', false),
  ('No sucre', 'no-sucre', 'Supprimer le sucre ajoute', false)
on conflict (slug) do nothing;