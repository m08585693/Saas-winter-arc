# Arc — Groupes de motivation

Plateforme web (PWA) où les utilisateurs rejoignent des groupes publics liés à un objectif personnel. Check-in quotidien, classement par streak, effet de groupe.

## Stack

- **Next.js 16 (App Router)** + TypeScript + Tailwind CSS
- **Supabase** : auth par lien magique, base de données, Realtime
- **Resend** : digest email quotidien
- **Stripe** : abonnement mensuel / annuel
- **PWA** : manifest + service worker

## Démarrage local

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev
```

Ouvrir http://localhost:3000

## Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Renseigner `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (⚠️ uniquement côté serveur, jamais exposée)
3. Dans **Dashboard → SQL Editor**, coller le contenu de `supabase/migrations/0001_init.sql`
4. Dans **Authentication → URL Configuration** :
   - Site URL : `http://localhost:3000`
   - Redirect URLs : `http://localhost:3000/**` (et l'URL Vercel en prod)

> ⚠️ **Realtime** doit être activé pour la table `checkins` :
> **Database → Replication → enable** sur la table `checkins` (wal_level = logical par défaut en Supabase, il suffit de cocher la table).

## Structure

```
src/
  app/
    page.tsx                     # landing
    login/                       # auth lien magique
    auth/callback/               # retour du lien magique
    groupes/                     # liste + recherche + rejoindre
    groupe/[slug]/               # vue groupe + classement temps réel
    checkin/confirmation/        # après check-in : streak, rang, badge
    profil/                      # badges + groupes rejoints
    tarifs/                      # pricing + Stripe checkout
    api/checkout/                # session Stripe
    api/webhooks/stripe/         # active l'abonnement (is_paid)
    api/cron/digest/             # email quotidien (Vercel Cron 7h UTC)
  lib/supabase/                  # clients server / client / admin
  proxy.ts                       # protection des routes privées
supabase/migrations/0001_init.sql
```

## Déploiement Vercel

1. Importer le repo sur vercel.com
2. Ajouter les variables d'environnement de `.env.example`
3. Le cron `/api/cron/digest` (7h UTC) est configuré dans `vercel.json`
4. Ajouter l'URL de prod dans Supabase (Authentication → Redirect URLs)

## Fonctionnalités payantes (Arc +)

- Groupes illimités (la version gratuite limite à 1 groupe)
- Badges de palier 7 / 30 / 90 jours
- Création de groupes privés