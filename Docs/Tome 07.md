# LaPlasse — Architecture & Product Master Document

# Tome 7 — Frontend Architecture, UX System & Design Engineering

## Partie 1 — Frontend Philosophy, Next.js Architecture, App Router, Modular Frontend & State Management

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 1. Introduction

Le frontend de LaPlasse doit répondre à une contrainte extrêmement complexe :

> **être simple pour l’utilisateur, mais très puissant en interne.**

La plateforme devra supporter :

### référencement

---

### marketplace

---

### réservation

---

### dashboards business

---

### multi-country

---

### multi-business types

---

### mobile-first usage

---

### forte charge média

---

### UX Afrique-first

---

Le frontend doit donc être pensé :

> **performance-first + modular-first + mobile-first**

---

# 2. Frontend Philosophy

LaPlasse suit 10 principes UX/engineering.

---

## 2.1 Mobile-first Mandatory

L’usage principal en Afrique :

> smartphone.

Le desktop :

> secondaire.

Priorité UX :

```txt id="k2p8xm"
mobile
↓
tablet
↓
desktop
```

Jamais l’inverse.

---

## 2.2 Fast-by-default UX

Objectif :

> impression de rapidité permanente.

Même avec réseau faible.

Techniques :

### optimistic UI

---

### skeleton loading

---

### caching

---

### image lazy loading

---

### pagination

---

### background fetching

---

## 2.3 Progressive Complexity

Un utilisateur novice :

> ne doit jamais être submergé.

Merchant dashboard :

simple au départ.

Puis :

> débloque complexité.

---

## 2.4 WhatsApp-native UX

Afrique-first implique :

> WhatsApp intégré naturellement.

Ex :

Restaurant :

```txt id="v8m2tk"
Réserver via WhatsApp
```

---

## 2.5 Trust-first Design

Le frontend doit rassurer.

Toujours afficher :

### verified badge

---

### reviews

---

### response rate

---

### business credibility

---

### payment trust

---

## 2.6 Low-bandwidth Friendly

Support :

### image optimization

---

### reduced animations

---

### compressed payloads

---

### lite mode future

---

## 2.7 Adaptive UX

Restaurant ≠ salon ≠ hôtel.

L’interface doit s’adapter :

> automatiquement au business type.

---

# 3. Why Next.js

Framework officiel retenu :

Next.js

Pourquoi ?

---

## 3.1 Hybrid Rendering

Support :

### SSR

---

### SSG

---

### ISR

---

### CSR

---

Parfait pour :

> référencement + marketplace.

---

## 3.2 SEO Advantage

Très critique pour :

> référencement business.

Ex :

```txt id="z7k1tw"
/restaurant/cocody/maquis-chez-jules
```

SEO natif.

---

## 3.3 Performance

Avantages :

### image optimization

---

### route optimization

---

### code splitting

---

### server rendering

---

### edge future

---

## 3.4 Future-proof

Compatible :

### web

---

### mobile web

---

### PWA future

---

### super app future

---

# 4. App Router Architecture

LaPlasse adopte :

> **App Router**

de :

Next.js

---

## 4.1 Routing Philosophy

Architecture :

> feature-driven.

Pas :

> page chaos.

---

## Structure recommandée

```txt id="t9w2pk"
src/

app/

(public)

(auth)

(dashboard)

(admin)

api/
```

---

## 4.2 Route Groups

### Public

Pages publiques.

---

### Auth

Login/register.

---

### Dashboard

Merchant.

---

### Admin

Back-office.

---

### API

Server actions future.

---

## 4.3 Public Routes

Structure :

```txt id="h3m8vk"
/

search

/business/[slug]

/products

/product/[slug]

/category/[slug]

/city/[slug]

/booking

/favorites
```

---

## 4.4 Merchant Routes

Structure :

```txt id="g8k2tm"
/dashboard

/dashboard/orders

/dashboard/bookings

/dashboard/products

/dashboard/customers

/dashboard/reviews

/dashboard/analytics

/dashboard/settings
```

---

## 4.5 Admin Routes

Structure :

```txt id="m5p9tx"
/admin

/admin/businesses

/admin/reviews

/admin/moderation

/admin/payments

/admin/users

/admin/analytics
```

---

# 5. Frontend Modular Architecture

Le frontend suit :

> **feature-based architecture**

---

## Structure recommandée

```txt id="p2k7xm"
src/

features/

business/

marketplace/

booking/

payment/

review/

search/

crm/

analytics/

admin/
```

---

Chaque feature contient :

```txt id="n4v1pk"
components

hooks

services

types

schemas

utils
```

---

## Example

Marketplace :

```txt id="d9m3tw"
marketplace/

components/

hooks/

services/

types/
```

---

# 6. UI Component System

LaPlasse adopte :

> **design system centralisé**

---

## 6.1 Philosophy

Jamais :

> UI improvisée page par page.

Toujours :

> reusable components.

---

## UI Layers

```txt id="y8k4tm"
tokens
↓
primitives
↓
components
↓
patterns
↓
pages
```

---

## 6.2 Component Structure

Recommandée :

```txt id="z2v9pk"
components/

ui/

business/

marketplace/

booking/

dashboard/

layout/
```

---

## 6.3 UI Primitives

Base components :

### button

---

### input

---

### modal

---

### sheet

---

### dropdown

---

### select

---

### tabs

---

### tooltip

---

### skeleton

---

### card

---

### badge

---

### avatar

---

## 6.4 Business Components

Composants métier.

Ex :

### BusinessCard

---

### ProductCard

---

### ReviewCard

---

### BookingCard

---

### MerchantAnalyticsCard

---

### RestaurantMenuCard

---

### BusinessMapCard

---

# 7. State Management Strategy

Le frontend doit :

> éviter chaos state.

---

# 7.1 Philosophy

Utiliser :

> **minimal global state**

---

## Local State

Pour UI simple.

Utiliser :

```txt id="q7m2tw"
useState
```

---

## Server State

Toujours :

TanStack Query

---

## Global State

Uniquement :

auth

theme

cart

user settings.

Utiliser :

Zustand

---

## Rule

Jamais :

> tout mettre global.

---

# 7.2 React Query Architecture

Responsable :

### caching

---

### fetching

---

### mutations

---

### retries

---

### stale management

---

## Query Keys Convention

Convention stricte.

Ex :

```txt id="r9k1pm"
businesses

business-detail

products

orders

bookings
```

---

## Cache Strategy

Business details :

```txt id="x4m8tk"
5 min stale
```

Reviews :

```txt id="p7w2xn"
2 min
```

Categories :

```txt id="n5v9pk"
24h
```

---

# 8. Form Architecture

Les formulaires sont critiques.

Merchant onboarding.

Products.

Booking.

Checkout.

---

## Form Stack

Recommandé :

React Hook Form

*

Zod

---

## Form Philosophy

Toujours :

### validation client

*

### validation serveur

---

## Progressive Forms

Formulaires longs :

> multi-step.

Ex :

Business onboarding.

---

# 9. API Integration Strategy

Frontend :

> backend-driven.

---

## Pattern

Jamais :

```txt id="b8m4tx"
fetch in components everywhere
```

Toujours :

```txt id="v3k9pn"
service layer
```

---

## Example

```txt id="h1w8tm"
business.service.ts
```

---

## Benefits

### maintainability

---

### reusable calls

---

### testing easier

---

### backend swap easier

---

# 10. Frontend Security

---

## Never Trust Frontend

Toujours :

> validation backend.

---

## Protected Routes

Middleware :

### auth

---

### roles

---

### permissions

---

### merchant ownership

---

## Sensitive Data

Jamais exposer :

### secrets

---

### provider keys

---

### admin permissions

---

# Conclusion Partie 1

Le frontend LaPlasse est désormais pensé comme :

> **une architecture scalable, modulaire et mobile-first.**

Fondations validées :

### Next.js App Router

### modular frontend

### React Query

### Zustand

### reusable design system

### adaptive UX

### performance-first rendering

La prochaine partie documentera :

### Design System

### Design Tokens

### Responsive System

### Mobile UX

### Navigation Architecture

### Dashboard UX System
# LaPlasse — Architecture & Product Master Document

# Tome 7 — Frontend Architecture, UX System & Design Engineering

## Partie 2 — Design System, Design Tokens, Responsive Architecture, Mobile UX & Navigation System

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 11. Design System Philosophy

Le design LaPlasse doit respecter une règle simple :

> **simple en apparence, sophistiqué dans le système.**

L’objectif n’est pas seulement :

> être beau.

L’objectif est :

> convertir, rassurer, faire agir.

Le design system doit permettre :

### cohérence

---

### rapidité développement

---

### scalabilité UI

---

### adaptation business type

---

### UX mobile premium

---

## 11.1 Core UX Principles

### clarity first

Toujours compréhensible.

---

### trust first

Toujours rassurant.

---

### speed perception

Toujours rapide.

---

### progressive disclosure

Complexité graduelle.

---

### thumb-friendly UX

Pensé mobile.

---

### business-first conversion

Toujours pousser action.

---

# 12. Design Tokens System

LaPlasse adopte :

> **Token-based design architecture**

Pourquoi ?

Éviter :

> chaos visuel.

---

## 12.1 Token Categories

### colors

---

### typography

---

### spacing

---

### radius

---

### shadows

---

### animation

---

### z-index

---

### breakpoints

---

## 12.2 Color Philosophy

Palette :

> moderne + premium + confiance.

Éviter :

> look cheap marketplace.

Structure :

```txt id="h5m9pk"
Primary

Secondary

Neutral

Success

Warning

Danger

Info
```

---

## 12.3 Semantic Colors

Toujours :

> semantic-first.

Ex :

```txt id="p3k8tm"
success
warning
error
verified
premium
trusted
```

Jamais :

```txt id="n1v4pk"
greenButton
redText
```

---

## 12.4 Typography System

Objectif :

> lisibilité mobile.

Recommandation :

Police principale :

```txt id="v9m2tw"
Inter
```

Alternative premium :

```txt id="z4p8kn"
Manrope
```

(Très cohérent avec ton approche Eventis.)

---

## 12.5 Typography Scale

Structure :

```txt id="d6w7pk"
Display

Heading

Title

Body

Caption

Micro
```

---

## 12.6 Spacing System

Convention :

> 8pt system.

Ex :

```txt id="r2m9tx"
4
8
12
16
24
32
48
64
```

Pourquoi ?

### cohérence

---

### responsive facilité

---

### meilleure hiérarchie

---

# 13. Component Design Rules

Composants doivent être :

### reusable

---

### composable

---

### accessible

---

### mobile optimized

---

### adaptive

---

# 13.1 Component States

Chaque composant supporte :

### default

---

### hover

---

### active

---

### loading

---

### disabled

---

### success

---

### error

---

## 13.2 Loading Philosophy

Jamais :

> page blanche.

Toujours :

### skeleton loading

---

### optimistic UI

---

### progressive rendering

---

## 13.3 Card Philosophy

Marketplace =

> card-driven UI.

Cards standardisées.

Ex :

### BusinessCard

---

### ProductCard

---

### BookingCard

---

### ReviewCard

---

### MerchantCard

---

## 13.4 CTA Philosophy

Toujours :

> action visible.

CTA prioritaires :

### réserver

---

### commander

---

### appeler

---

### WhatsApp

---

### itinéraire

---

### ajouter panier

---

# 14. Responsive Architecture

Responsive :

> non négociable.

---

# 14.1 Breakpoint Strategy

Convention :

```txt id="x5w2tm"
mobile

tablet

desktop

wide
```

---

## 14.2 Mobile-first Rule

Toujours :

```txt id="f7m1pk"
mobile
↓
expand desktop
```

Jamais :

desktop-first.

---

## 14.3 Adaptive Layout System

Public :

### feed layout

---

### map layout

---

### search layout

---

Dashboard :

### collapsible sidebar

---

### stacked mobile cards

---

### simplified actions

---

## 14.4 Responsive Priorities

Mobile :

priorité :

### action CTA

---

### trust

---

### speed

---

### readability

---

Desktop :

priorité :

### data density

---

### dashboards

---

### management

---

# 15. Mobile UX Architecture

L’Afrique :

> mobile-first.

Donc UX :

> thumb-first.

---

## 15.1 Thumb Zone Principle

CTA critiques :

placés :

> zone pouce.

Bas écran.

---

## 15.2 Sticky Actions

Ex :

Restaurant :

sticky bottom CTA :

```txt id="b9m7pk"
réserver
commander
WhatsApp
```

---

Boutique :

```txt id="y3k1tm"
Ajouter panier
```

---

## 15.3 Bottom Sheet Strategy

Mobile :

préférer :

> bottom sheets

à :

> modals desktop-style.

---

## 15.4 One-handed Navigation

Éviter :

> actions critiques en haut.

---

## 15.5 Network-aware UX

Faible réseau :

support :

### retry states

---

### offline messaging future

---

### cached browsing

---

### graceful degradation

---

# 16. Navigation Architecture

Navigation :

> doit être extrêmement simple.

---

# 16.1 Public Navigation

Navigation principale :

```txt id="w4m8pk"
Accueil

Explorer

Catégories

Favoris

Profil
```

Bottom navigation mobile.

---

## 16.2 Discovery Navigation

Accès rapide :

### nearby

---

### trending

---

### restaurants

---

### boutiques

---

### beauté

---

### hôtels

---

### promos

---

## 16.3 Search-first Navigation

Recherche :

> centrale.

Toujours accessible.

Sticky.

---

## 16.4 Merchant Navigation

Sidebar dashboard :

```txt id="z8k3tm"
Dashboard

Commandes

Réservations

Produits

Clients

Analytics

Reviews

Campagnes

Paramètres
```

---

## 16.5 Contextual Navigation

Salon :

menu adapté.

Restaurant :

menu adapté.

Hotel :

menu adapté.

---

# 17. Dashboard UX System

Dashboard merchant :

> business-first.

---

## 17.1 Dashboard Philosophy

Objectif :

> voir l’essentiel rapidement.

---

## 17.2 Merchant Dashboard Layout

Home dashboard :

### today metrics

---

### pending actions

---

### quick actions

---

### performance snapshot

---

### alerts

---

## 17.3 Quick Actions

Ex :

Restaurant :

```txt id="m1w9tx"
ajouter produit

voir commandes

réservations

promo
```

---

## 17.4 Empty States Philosophy

Jamais vide.

Toujours :

### onboarding guidance

---

### suggested actions

---

### educational hints

---

## 17.5 Progressive Dashboard Complexity

Merchant débutant :

simple.

Merchant avancé :

plus de KPIs.

---

# 18. Marketplace UX System

Le commerce doit être :

> frictionless.

---

## Product Grid Rules

### large images

---

### visible price

---

### trust badge

---

### stock status

---

### quick add to cart

---

## Checkout UX

Objectif :

> < 90 sec.

Étapes minimales.

---

## Guest Checkout

Support obligatoire.

---

# 19. Booking UX System

Réservation :

> ultra simple.

Flow :

```txt id="n7k2pm"
date
↓
heure
↓
confirmation
```

Minimum friction.

---

# 20. Accessibility Strategy

Support :

### readable typography

---

### contrast minimum

---

### large tap targets

---

### loading feedback

---

### keyboard future

---

# Conclusion Partie 2

Le système UX/UI LaPlasse est désormais pensé :

> **conversion-first, mobile-first et scalable.**

Fondations validées :

### Design Tokens

### Responsive System

### Navigation Architecture

### Merchant Dashboard UX

### Marketplace UX

### Booking UX

### Thumb-first mobile design

La prochaine partie documentera :

### Frontend Performance Architecture

### SEO Strategy

### PWA Strategy

### Image Optimization

### Rendering Strategy

### Frontend Security & Analytics
# LaPlasse — Architecture & Product Master Document

# Tome 7 — Frontend Architecture, UX System & Design Engineering

## Partie 3 — Frontend Performance Architecture, SEO Strategy, PWA Strategy, Rendering System & Frontend Security

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 21. Frontend Performance Philosophy

Le frontend LaPlasse doit être :

> **fast-by-default**

La performance n’est pas :

> une optimisation future.

Elle est :

> un principe fondateur.

Pourquoi ?

Le contexte Afrique implique :

### réseau instable

---

### téléphones milieu de gamme

---

### data limitée

---

### faible patience utilisateur

---

Objectif UX :

> impression de vitesse constante.

---

## 21.1 Performance Goals

Objectifs V1 :

### First Load

< 3 sec mobile.

---

### Search Results

< 200 ms perçu.

---

### Business Page

< 2 sec.

---

### Checkout

< 500 ms interaction.

---

### Dashboard

< 2 sec.

---

## 21.2 Frontend Performance Rules

Toujours :

### lazy loading

---

### skeleton loading

---

### code splitting

---

### server rendering intelligent

---

### image optimization

---

### query caching

---

### route prefetching

---

Jamais :

> bundle énorme.

---

# 22. Rendering Strategy

Le rendu frontend doit être :

> hybride.

Pourquoi ?

Marketplace + référencement + dashboard.

---

# 22.1 Rendering Philosophy

Choisir le rendu selon :

> le besoin métier.

Pas :

> une seule méthode partout.

---

## 22.2 SSR (Server-side Rendering)

Utiliser pour :

### business pages

---

### product pages

---

### category pages

---

### city landing pages

---

### SEO pages

---

Pourquoi ?

### SEO

---

### fast indexing

---

### better first load

---

## Example

```txt id="m8k2tp"
/restaurant/cocody/maquis-chez-jules
```

SSR recommandé.

---

## 22.3 SSG (Static Generation)

Pour :

### static pages

---

### landing pages

---

### legal pages

---

### category SEO pages

---

### country pages

---

## Example

```txt id="v4m7pk"
/abidjan/restaurants
```

---

## 22.4 ISR (Incremental Static Regeneration)

Très puissant pour LaPlasse.

Utiliser :

### popular businesses

---

### trending products

---

### homepage sections

---

### SEO category pages

---

Objectif :

> SEO + performance.

---

## 22.5 CSR (Client-side Rendering)

Uniquement :

### dashboards

---

### analytics

---

### merchant operations

---

### settings

---

### cart state

---

Pourquoi ?

Pas besoin SEO.

---

# 23. Code Splitting Strategy

Objectif :

> charger uniquement nécessaire.

---

## Route-based Splitting

Automatique :

Next.js

---

## Component Lazy Loading

Composants lourds :

### maps

---

### analytics charts

---

### media gallery

---

### merchant dashboards

---

### editor future

---

Chargement différé.

---

## Example

Page business :

```txt id="y8m1tx"
hero section
↓
essential info
↓
reviews lazy
↓
map lazy
↓
recommendations lazy
```

---

# 24. Image Optimization Strategy

Marketplace =

> image-heavy platform.

---

# 24.1 Image Philosophy

Jamais :

> image originale brute.

Toujours :

> optimized pipeline.

---

## 24.2 Image Sizes

Support :

### thumbnail

---

### card

---

### medium

---

### hero

---

### original

---

## 24.3 Modern Formats

Toujours :

### WebP

---

### AVIF future

---

Fallback :

### JPEG

---

## 24.4 Lazy Loading

Images :

> lazy by default.

Sauf :

### hero image

---

### first viewport

---

## 24.5 Placeholder Strategy

Support :

### skeleton

---

### blurred placeholder

---

### progressive loading

---

# 25. Search Performance UX

La recherche est :

> le cœur produit.

---

## 25.1 Search Experience

Objectif :

> instant feeling.

---

## Autocomplete

Temps cible :

```txt id="w6m9pk"
<100 ms
```

---

## Search Debounce

Éviter spam API.

Ex :

```txt id="d1k4tm"
300ms debounce
```

---

## Optimistic Search

Préchargement intelligent.

---

## Recent Searches

Stockage local.

---

## Popular Searches

Par :

### ville

---

### catégorie

---

### pays

---

# 26. SEO Strategy

Le SEO constitue :

> un canal acquisition majeur.

LaPlasse doit fonctionner comme :

> Google Business + marketplace SEO engine.

---

# 26.1 SEO Philosophy

Chaque business :

> page indexable.

Chaque catégorie :

> page indexable.

Chaque ville :

> page indexable.

---

## 26.2 SEO URL Structure

Convention :

Business :

```txt id="x4m2pk"
/restaurant/abidjan/cocody/chez-jules
```

---

Category :

```txt id="p8v7tm"
/restaurants/abidjan
```

---

Product :

```txt id="h3k9tw"
/product/pate-pistache-premium
```

---

## 26.3 Metadata Strategy

Chaque page :

### dynamic title

---

### meta description

---

### OG image

---

### structured schema future

---

### canonical URL

---

## 26.4 Local SEO

Très critique.

Optimiser :

### ville

---

### quartier

---

### landmarks

---

### nearby search intent

---

Ex :

```txt id="n5p2xm"
restaurant cocody angre
```

---

## 26.5 Internal Linking

Automatique.

Ex :

Business page :

```txt id="v1m8pk"
restaurants similaires
```

---

### nearby businesses

---

### same category

---

### trending nearby

---

# 27. PWA Strategy

LaPlasse doit être :

> **PWA-ready**

Pas application native immédiate.

---

## 27.1 Why PWA

Avantages :

### app-like experience

---

### installable

---

### push notifications

---

### offline support futur

---

### low cost

---

## 27.2 PWA Features

### install prompt

---

### splash screen

---

### offline browsing future

---

### cached pages

---

### notification support

---

## 27.3 Offline Strategy Future

Support :

### cached favorites

---

### viewed businesses

---

### booking history

---

### recent products

---

# 28. Frontend Security

Le frontend :

> ne doit jamais être trusted.

---

## 28.1 Security Philosophy

Frontend :

> presentation layer only.

Validation :

> backend obligatoire.

---

## 28.2 Protected Data Rules

Jamais exposer :

### secret keys

---

### admin rules

---

### permission logic

---

### payment verification logic

---

## 28.3 Secure Storage

Jamais :

```txt id="g9k4tm"
tokens localStorage
```

Préférer :

```txt id="f2m7pk"
secure cookies
```

---

## 28.4 XSS Protection

Protection :

### sanitization

---

### escaped rendering

---

### CSP future

---

# 29. Frontend Analytics

Objectif :

> comprendre comportement utilisateur.

---

## Events Tracking

### search

---

### click business

---

### booking start

---

### booking completed

---

### add to cart

---

### checkout

---

### payment completed

---

### review submitted

---

## Funnel Tracking

Ex :

```txt id="m4v8pk"
search
↓
business click
↓
booking start
↓
booking success
```

---

# 30. Error Handling UX

Jamais :

> écran cassé.

Toujours :

### graceful fallback

---

### retry

---

### informative message

---

### offline handling

---

## Example

Paiement échoue :

Pas :

```txt id="x1k9tm"
Erreur inconnue
```

Mais :

```txt id="z5m2pk"
Le paiement n’a pas abouti.
Veuillez réessayer ou changer de moyen de paiement.
```

---

# 31. Frontend Technical Stack Recommendation

Stack officielle :

### Framework

Next.js

---

### Language

TypeScript

---

### Styling

Tailwind CSS

---

### Components

shadcn/ui

---

### State

Zustand

---

### Server State

TanStack Query

---

### Forms

React Hook Form

*

Zod

---

### Maps

Google Maps

(configurable future)

---

### Animation

Framer Motion

minimal use only.

---

# Conclusion Partie 3

Le frontend LaPlasse est désormais :

> **high-performance, SEO-first et mobile-first.**

L’architecture supporte :

### référencement massif

### marketplace

### booking

### dashboards business

### faible bande passante

### future PWA

### scalable UX

La prochaine étape sera :

# Tome 8 — UI/UX Blueprint & Complete Product Screens

où nous documenterons :

### toutes les pages publiques

### toutes les pages dashboard

### navigation détaillée

### wireframes fonctionnels

### flows utilisateurs complets

### architecture visuelle LaPlasse
# LaPlasse — Architecture & Product Master Document

# Tome 8 — UI/UX Blueprint & Complete Product Screens

## Partie 1 — Global UX Architecture, Public Navigation, Homepage System & Discovery Experience

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 1. Introduction

Ce tome documente :

> **l’expérience utilisateur complète de LaPlasse écran par écran.**

L’objectif :

définir précisément :

### toutes les pages

---

### tous les composants

---

### tous les parcours

---

### toutes les interactions

---

### les hiérarchies UX

---

### les logiques de conversion

---

Ce tome servira directement à :

### Readdy AI

---

### Figma future

---

### Cursor AI

---

### développement frontend

---

### design system implementation

---

# 2. UX Philosophy

L’UX LaPlasse suit une logique :

> **Discovery → Trust → Action**

Chaque écran doit :

### rassurer

---

### guider

---

### convertir

---

### réduire friction

---

Architecture UX globale :

```txt id="n5m8pk"
Discover
↓
Compare
↓
Trust
↓
Action
↓
Transaction
↓
Retention
```

---

# 3. Global Navigation Architecture

Navigation pensée :

> mobile-first.

---

# 3.1 Public Mobile Navigation

Navigation basse permanente.

Structure :

```txt id="h2v7tm"
Accueil

Explorer

Favoris

Commandes/Réservations

Profil
```

---

## Rationale

Pourquoi ?

Pouce mobile.

Navigation simple.

Très proche habitudes :

super apps.

---

# 3.2 Desktop Navigation

Header sticky.

Sections :

```txt id="p7m2tw"
Explorer

Restaurants

Boutiques

Beauté

Hôtels

Marketplace

Promos

Favoris
```

À droite :

```txt id="x1k9pm"
Recherche

Connexion

Dashboard
```

---

## 3.3 Contextual Navigation

Navigation adaptative.

Restaurant :

onglets :

```txt id="q8m3tx"
Menu

Avis

Photos

Réservation

Infos
```

---

Salon :

```txt id="v2k4pk"
Services

Horaires

Disponibilités

Avis
```

---

Hotel :

```txt id="m6w9tn"
Chambres

Disponibilité

Services

Avis
```

---

# 4. Homepage Architecture

La homepage est :

> **l’écran le plus stratégique du produit.**

Objectif :

> pousser rapidement à une action.

---

# 4.1 Homepage Goals

### découvrir rapidement

---

### chercher immédiatement

---

### générer confiance

---

### pousser conversion

---

### montrer catégories

---

### générer rétention

---

# 4.2 Homepage Structure

Architecture recommandée :

```txt id="z5p1tm"
Hero Search
↓
Categories
↓
Nearby
↓
Trending
↓
Promotions
↓
Popular Businesses
↓
Recommended
↓
Marketplace
↓
Recently Viewed
```

---

# 4.3 Hero Section

Objectif :

> démarrer par la recherche.

Très important.

---

## Hero Components

### search bar

centrale.

---

### location selector

---

### categories shortcuts

---

### quick actions

Ex :

```txt id="w3m8pk"
Restaurant

Beauté

Boutique

Hôtel

Livraison
```

---

## Search UX

Support :

### autocomplete

---

### suggestions

---

### recent search

---

### trending search

---

# 4.4 Categories Section

Grid scrollable.

Catégories prioritaires :

```txt id="j9k2tm"
Restaurants

Boutiques

Beauté

Hôtels

Pharmacies

Événementiel

Services
```

---

# 4.5 Nearby Section

Très important.

Objectif :

> proximité immédiate.

Card design :

### image

---

### note

---

### open now

---

### distance

---

### CTA

---

# 4.6 Trending Section

Objectif :

> social proof.

Ex :

```txt id="b8m1tx"
Restaurants populaires

Salons tendances

Boutiques populaires
```

---

# 4.7 Marketplace Homepage Block

Produits populaires.

Structure :

```txt id="f2v9pk"
best sellers
↓
promotions
↓
recommended products
```

---

# 4.8 Personalized Feed Future

Basé sur :

### historique

---

### favoris

---

### comportement

---

### ville

---

# 5. Discovery Experience

Le Discovery Experience constitue :

> le cœur UX.

---

# 5.1 Search-first UX

Recherche :

toujours visible.

Sticky.

---

## Search Input Behavior

Dès saisie :

suggestions :

### business

---

### products

---

### categories

---

### locations

---

## Example

Utilisateur tape :

```txt id="m4k7tn"
pizza
```

Résultats :

```txt id="y8v2pm"
restaurants pizza

produits pizza

catégorie pizza

nearby pizza
```

---

# 5.2 Discovery Filters

Filtres dynamiques.

### nearby

---

### open now

---

### verified

---

### rating

---

### price

---

### delivery

---

### booking available

---

### promotions

---

### premium

---

# 5.3 Discovery Layout

Vue :

### feed

ou

### map

---

Toggle.

---

## Feed Layout

Liste cards.

Optimisée mobile.

---

## Map Layout

Carte interactive.

Business previews.

---

# 6. Category Pages Blueprint

Chaque catégorie :

> template spécialisé.

---

# 6.1 Restaurant Category Page

Sections :

```txt id="k2m9tw"
hero search
↓
featured restaurants
↓
nearby
↓
top rated
↓
open now
↓
popular cuisines
↓
promotions
```

---

## Restaurant Filters

### cuisine type

---

### price range

---

### reservation

---

### delivery

---

### open now

---

### ambiance

---

# 6.2 Beauty Category Page

Sections :

```txt id="v5k3pm"
featured salons
↓
available now
↓
top rated
↓
popular services
```

---

Filters :

### service

---

### price

---

### appointment availability

---

### gender

---

# 6.3 Hotel Category Page

Sections :

```txt id="n8m2tx"
available hotels
↓
popular hotels
↓
premium hotels
```

---

Filters :

### budget

---

### amenities

---

### room availability

---

### distance

---

# 7. Favorites System UX

Très critique rétention.

---

## Save Experience

Bouton :

❤️

Partout.

---

## Favorites Types

### businesses

---

### products

---

### services

---

## Favorites Page

Sections :

```txt id="r4k8pm"
saved places

saved products

saved bookings
```

---

# 8. Recently Viewed System

Support :

### businesses viewed

---

### products viewed

---

### searches

---

Objectif :

> retour rapide.

---

# 9. Empty State UX

Jamais vide.

---

## Example

Aucun favori :

Pas :

```txt id="t7v1xm"
Aucun favori
```

Mais :

```txt id="d3k9tm"
Découvrez des restaurants populaires
```

CTA visible.

---

# 10. UX Conversion Principles

Toujours réduire :

### clicks

---

### confusion

---

### cognitive load

---

Toujours augmenter :

### trust

---

### speed perception

---

### action visibility

---

### conversion

---

# Conclusion Partie 1

L’architecture UX publique LaPlasse est désormais définie :

### homepage

### navigation

### discovery

### categories

### search

### favorites

### nearby

### trending

### marketplace homepage

La prochaine partie documentera :

### Business Detail Pages

### Restaurant Page

### Boutique Page

### Hotel Page

### Salon Page

### Review UX

### Booking UX

### Marketplace Product UX
# LaPlasse — Architecture & Product Master Document

# Tome 8 — UI/UX Blueprint & Complete Product Screens

## Partie 2 — Business Detail Pages, Restaurant UX, Boutique UX, Salon UX, Hotel UX, Reviews & Booking Experience

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 11. Business Detail Page Philosophy

La page business est :

> **l’écran de conversion principal.**

C’est ici que l’utilisateur décide :

### réserver

---

### commander

---

### acheter

---

### appeler

---

### WhatsApp

---

### visiter

---

Objectif UX :

> conversion maximale avec friction minimale.

---

# 11.1 Universal Business Page Structure

Toutes les pages business suivent :

> une structure commune.

Puis :

> adaptation verticale.

Architecture :

```txt id="k2v7pm"
Hero Section
↓
Trust Signals
↓
Business Content
↓
Marketplace/Booking
↓
Reviews
↓
Nearby Recommendations
↓
Sticky CTA
```

---

# 11.2 Sticky Mobile CTA

Toujours visible.

Très critique.

Ex :

Restaurant :

```txt id="v5m2tk"
Commander
Réserver
WhatsApp
```

---

Salon :

```txt id="f9k4pm"
Prendre RDV
WhatsApp
```

---

Boutique :

```txt id="x3m8tn"
Ajouter panier
```

---

# 12. Restaurant Detail Page Blueprint

Le restaurant est :

> la page la plus transactionnelle.

---

# 12.1 Restaurant Hero Section

Contient :

### cover premium

---

### gallery preview

---

### restaurant name

---

### verified badge

---

### rating

---

### cuisine type

---

### open now

---

### ETA livraison

---

### address

---

### distance

---

### CTA quick actions

Ex :

```txt id="h8v2pk"
Appeler

WhatsApp

Itinéraire

Partager
```

---

## 12.2 Trust Section

Affichage critique :

### reviews count

---

### response rate

---

### response time

---

### popular dishes

---

### verified reviews

---

## 12.3 Restaurant Navigation Tabs

Tabs sticky.

```txt id="n4m9tw"
Menu

Photos

Avis

Réservation

Infos
```

---

## 12.4 Menu Experience

Très critique.

Structure :

```txt id="q8k1pm"
Category
↓
Menu Card
↓
Variants
↓
Add-ons
↓
Add to cart
```

---

### Menu Categories

Ex :

```txt id="y2v7tn"
Entrées

Plats

Desserts

Boissons
```

---

### Dish Card

Contient :

### image

---

### name

---

### short description

---

### spicy icon future

---

### price

---

### add button

---

### favorite

---

## 12.5 Reservation UX

Ultra rapide.

Flow :

```txt id="w6k3tm"
date
↓
time
↓
guest count
↓
confirm
```

Objectif :

< 30 sec.

---

## 12.6 Delivery UX

Affichage :

### delivery ETA

---

### fees

---

### minimum order

---

### delivery radius

---

## 12.7 Restaurant Reviews UX

Filtres :

### latest

---

### highest rated

---

### media reviews

---

### verified only

---

# 13. Boutique / Retail Detail Page

Objectif :

> ecommerce conversion.

---

# 13.1 Store Hero

Contient :

### cover

---

### store name

---

### categories

---

### verified badge

---

### trust score future

---

### promotions

---

### delivery availability

---

## 13.2 Product Grid

Structure :

### filters

---

### sort

---

### product cards

---

### promotions

---

### stock indicator

---

## 13.3 Product Card UX

Affichage :

### image

---

### title

---

### price

---

### compare price

---

### stock

---

### add to cart

---

### favorite

---

## 13.4 Product Detail Page

Architecture :

```txt id="m5v8pk"
Gallery
↓
Product Info
↓
Variants
↓
Description
↓
Reviews
↓
Related Products
```

---

## 13.5 Add-to-cart UX

Objectif :

> one-tap add.

---

## 13.6 Checkout Shortcut

Sticky cart button.

Toujours visible.

---

# 14. Beauty / Salon Detail Page

Objectif :

> réservation simple.

---

# 14.1 Hero Section

Affichage :

### salon cover

---

### services preview

---

### verified badge

---

### open now

---

### available today

---

### stylist highlights future

---

## 14.2 Services Section

Exemple :

```txt id="d7k2pm"
Braids

Haircut

Coloring

Nails
```

Chaque service :

### duration

---

### price

---

### availability

---

### quick booking

---

## 14.3 Booking Experience

Flow :

```txt id="z8v1tm"
choose service
↓
choose time
↓
confirm
```

Minimal friction.

---

## 14.4 Availability UX

Toujours visible :

### available today

---

### next available slot

---

### peak hours

---

# 15. Hotel Detail Page

Objectif :

> réservation chambre.

---

# 15.1 Hotel Hero

Contient :

### premium gallery

---

### amenities

---

### rating

---

### room availability

---

### average pricing

---

## 15.2 Room Experience

Cards :

### room images

---

### room type

---

### occupancy

---

### amenities

---

### pricing

---

### availability

---

### book CTA

---

## 15.3 Booking Flow

Flow :

```txt id="n2m9pk"
dates
↓
room selection
↓
guest details
↓
payment
↓
confirmation
```

---

## 15.4 Trust UX

Très critique.

Afficher :

### verified hotel

---

### real photos

---

### guest reviews

---

### cancellation policy

---

# 16. Reviews UX System

La confiance :

> se construit ici.

---

# 16.1 Review Structure

Affichage :

### profile photo

---

### verified badge

---

### date

---

### rating

---

### media

---

### tags

---

### owner response

---

## 16.2 Review Filters

### latest

---

### photos

---

### best rated

---

### critical

---

### verified only

---

## 16.3 Review Submission Flow

Flow :

```txt id="p4v7tm"
rating
↓
comment
↓
photos optional
↓
submit
```

Ultra simple.

---

# 17. Booking UX Blueprint

Objectif :

> friction minimale.

---

## 17.1 Universal Booking Sheet

Mobile :

bottom sheet.

---

## Booking Flow

```txt id="y9k2pm"
date
↓
time
↓
details
↓
confirmation
```

---

## Booking Confirmation

Affichage :

### confirmation number

---

### reminder settings

---

### WhatsApp shortcut

---

### calendar add future

---

# 18. Contact UX

Toujours simple.

Actions visibles :

### call

---

### WhatsApp

---

### directions

---

### website

---

### share

---

# 19. Recommendation UX

Bas page :

```txt id="m7w4pk"
similar businesses
↓
nearby places
↓
popular nearby
```

Objectif :

> session length.

---

# 20. Conversion Optimization Rules

Chaque page doit :

réduire :

### friction

---

### doubt

---

### decision fatigue

---

augmenter :

### trust

---

### CTA visibility

---

### conversion speed

---

### retention

---

# Conclusion Partie 2

Les écrans business critiques sont désormais définis :

### Restaurants

### Boutiques

### Salons

### Hôtels

### Reviews

### Booking

### Contact

### Recommendation system

La prochaine partie documentera :

### Authentication UX

### Merchant Onboarding UX

### Claim Business UX

### Merchant Dashboard Screens

### Orders & Booking Screens

### CRM & Analytics Screens
# LaPlasse — Architecture & Product Master Document

# Tome 8 — UI/UX Blueprint & Complete Product Screens

## Partie 3 — Authentication UX, Merchant Onboarding, Claim Business UX & Merchant Dashboard Screens

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 21. Authentication UX Philosophy

L’authentification doit être :

> **ultra simple, rapide et rassurante.**

Objectif :

> réduire abandon onboarding.

Contexte Afrique :

### utilisateurs peu patients

---

### usage mobile dominant

---

### WhatsApp culture

---

### faible tolérance friction

---

Principe :

> **discover first, account later**

L’utilisateur peut :

### explorer

---

### rechercher

---

### comparer

---

sans compte.

Le compte devient obligatoire seulement pour :

### réserver

---

### commander

---

### acheter

---

### laisser avis

---

### favoris

---

# 21.1 Authentication Methods

V1 :

### téléphone

---

### email

---

### Google login

---

Future :

### Apple

---

### WhatsApp OTP future

---

## 21.2 Authentication Modal

Pas page froide.

Préférer :

> bottom sheet mobile

ou

> modal desktop.

Objectif :

> ne jamais casser flow.

---

## Login Screen Structure

```txt id="x8m4pk"
Welcome message
↓
phone/email input
↓
continue
↓
social login
↓
create account
```

---

## 21.3 Progressive Registration

Ne jamais demander :

```txt id="v4k7tm"
20 champs
```

V1 minimal :

### prénom

---

### téléphone/email

---

### password

---

Puis enrichissement progressif.

---

## 21.4 OTP UX Future

Flow :

```txt id="p2m9tk"
phone number
↓
OTP
↓
success
```

Temps cible :

< 30 sec.

---

# 22. Merchant Onboarding UX

Très critique.

Le succès business dépend ici.

Objectif :

> publier business rapidement.

Temps cible :

> < 5 minutes.

---

# 22.1 Onboarding Philosophy

Merchant onboarding :

> wizard multi-step.

Jamais gros formulaire.

---

## Flow Global

```txt id="n6k3pm"
business type
↓
business info
↓
location
↓
services/products
↓
media
↓
verification
↓
publish
```

---

# 22.2 Step 1 — Business Type

Merchant choisit :

```txt id="f9v2tk"
Restaurant

Boutique

Beauté

Hôtel

Pharmacie

Service
```

UX :

cards visuelles.

---

# 22.3 Step 2 — Business Information

Informations :

### business name

---

### category

---

### description

---

### phone

---

### WhatsApp

---

### email optional

---

### opening hours

---

Auto-suggestion.

---

# 22.4 Step 3 — Location

Très critique Afrique.

Support :

### Google Maps pin

---

### landmark

---

### manual description

---

### WhatsApp location future

---

Ex :

```txt id="d5m8pk"
Après le supermarché X,
près du feu.
```

---

# 22.5 Step 4 — Products / Services

Restaurant :

> menu.

Boutique :

> catalogue.

Salon :

> services.

Support :

### skip and continue

---

Pourquoi ?

> réduire friction onboarding.

---

# 22.6 Step 5 — Media Upload

Support :

### logo

---

### cover

---

### gallery

---

Auto compression.

---

## 22.7 Step 6 — Verification

Business verification.

Niveaux :

```txt id="r7k1tm"
basic
↓
phone verified
↓
business verified
↓
premium verified
```

---

## 22.8 Publish Success Screen

Affichage :

### congratulations

---

### quick actions

---

### dashboard shortcut

---

### share business

---

### add products

---

# 23. Claim Business UX

Feature :

> Google Business style.

Très critique.

---

# 23.1 Claim Philosophy

Business déjà référencé.

Merchant devient :

> propriétaire officiel.

---

## Flow

```txt id="k3m9pk"
find business
↓
claim button
↓
proof
↓
review
↓
approval
```

---

## 23.2 Verification Methods

### phone verification

---

### WhatsApp verification

---

### document upload

---

### manual moderation

---

## 23.3 Claim Pending UX

Affichage :

```txt id="h8v2tm"
En cours de vérification
```

Temps estimé.

---

# 24. Merchant Dashboard Philosophy

Le dashboard doit être :

> **business-first, not software-first.**

Merchant veut voir :

> ce qui lui rapporte argent.

Pas :

> dashboard complexe SaaS.

---

## 24.1 Merchant Home Dashboard

Structure :

```txt id="t4m8pk"
Today Metrics
↓
Orders / Bookings
↓
Quick Actions
↓
Performance Snapshot
↓
Reviews
↓
Recommendations
```

---

## Today Metrics

### sales

---

### bookings

---

### visitors

---

### pending orders

---

### missed opportunities

---

## Quick Actions

Ex :

Restaurant :

```txt id="y2k9tm"
Ajouter plat

Voir commandes

Promo

WhatsApp clients
```

---

# 25. Orders Management Screen

Très critique.

---

# 25.1 Restaurant Orders

Structure :

```txt id="p9m4tk"
New
Preparing
Ready
Completed
Cancelled
```

Kanban mobile-friendly.

---

## Order Card

Affichage :

### order number

---

### customer

---

### items

---

### amount

---

### ETA

---

### status CTA

---

## Quick Actions

### confirm

---

### reject

---

### ready

---

### message customer

---

# 26. Booking Management Screen

Restaurant.

Salon.

Hotel.

---

## Booking States

```txt id="q6v1pk"
Pending
Confirmed
Completed
Cancelled
No-show
```

---

## Booking Card

### client

---

### date

---

### time

---

### service

---

### status

---

### WhatsApp shortcut

---

# 27. Products & Services Management

---

## Product Management

Structure :

```txt id="v8m2tk"
Products List
↓
Categories
↓
Inventory
↓
Promotions
```

---

## Quick Add Product

Objectif :

< 60 sec.

---

## Bulk Upload Future

CSV support.

---

## Service Management

Salon :

### service

---

### price

---

### duration

---

### availability

---

# 28. Merchant CRM Screens

Merchant doit voir :

> ses clients.

---

## CRM Dashboard

Sections :

### VIP clients

---

### inactive clients

---

### repeat customers

---

### birthdays future

---

## Campaign UX

Flow :

```txt id="w4k9pm"
choose audience
↓
create message
↓
schedule
↓
send
```

---

# 29. Analytics Dashboard UX

Très important.

---

## Merchant KPIs

Restaurant :

### top dishes

---

### sales

---

### peak hours

---

Salon :

### repeat clients

---

### utilization

---

Boutique :

### top products

---

### conversion

---

## Visualization

Préférer :

### cards

---

### trends

---

### simple charts

---

Pas dashboard finance complexe.

---

# 30. Reviews Management UX

Merchant peut :

### respond

---

### report

---

### filter

---

### track satisfaction

---

## Smart Suggestions Future

IA propose :

> réponses avis.

---

# 31. Subscription & Monetization UX

Merchant voit :

### current plan

---

### benefits

---

### upgrade

---

### ads credits future

---

## Upgrade Flow

Simple.

Objectif :

< 2 minutes.

---

# 32. Empty States UX (Merchant)

Jamais vide.

Ex :

Aucune commande :

Pas :

```txt id="m2v8pk"
No orders
```

Mais :

```txt id="x7k1tm"
Ajoutez votre menu pour commencer à recevoir des commandes.
```

---

# Conclusion Partie 3

Les flows business critiques sont désormais définis :

### Auth UX

### Merchant onboarding

### Claim business

### Merchant dashboard

### Orders management

### Booking management

### CRM

### Analytics

### Reviews management

### Subscription UX

La prochaine partie documentera :

### Checkout UX

### Payment UX

### Marketplace Cart UX

### Notifications UX

### Admin Backoffice UX

### Moderation UX

### Multi-country UX
# LaPlasse — Architecture & Product Master Document

# Tome 8 — UI/UX Blueprint & Complete Product Screens

## Partie 4 — Checkout UX, Payment UX, Marketplace Cart, Notifications UX, Admin Backoffice & Multi-country UX

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 33. Checkout UX Philosophy

Le checkout constitue :

> **l’étape de conversion la plus critique.**

Objectif :

> réduire abandon panier.

Principe :

> **friction minimale + confiance maximale**

Temps cible :

> **< 90 secondes**

---

# 33.1 Checkout Principles

Toujours :

### simple

---

### rassurant

---

### mobile-first

---

### fast

---

### transparent pricing

---

### trust visible

---

Jamais :

> checkout compliqué.

---

# 33.2 Universal Checkout Structure

Architecture :

```txt id="m4v9pk"
Cart Review
↓
Delivery/Pickup
↓
Contact Details
↓
Payment Method
↓
Confirmation
```

---

## Mobile UX Rule

Progressive.

Une étape à la fois.

---

# 33.3 Guest Checkout

Obligatoire V1.

Utilisateur peut :

### commander sans compte

---

### réserver sans compte future

---

À la fin :

> conversion douce vers création compte.

---

## Smart Account Creation

Exemple :

```txt id="w2k8tm"
Votre commande est enregistrée.

Créez un compte en 1 clic
pour suivre vos commandes.
```

---

# 34. Cart UX System

Le panier doit être :

> extrêmement simple.

---

# 34.1 Sticky Cart

Toujours visible.

Mobile :

bottom sticky.

Ex :

```txt id="q7m1tx"
Voir panier (3)
35 000 FCFA
```

---

# 34.2 Cart Structure

Affichage :

### products

---

### variants

---

### quantity

---

### add-ons

---

### merchant grouping

---

### subtotal

---

### fees

---

### estimated delivery

---

## Multi-merchant Cart Logic

Très important.

Support :

```txt id="r9k3pm"
Merchant A
↓
Sub-order A

Merchant B
↓
Sub-order B
```

Paiement unique possible.

---

## 34.3 Cart Recovery Future

Support :

### abandoned cart

---

### WhatsApp reminder

---

### push reminder

---

# 35. Payment UX

Le paiement doit inspirer :

> confiance immédiate.

---

# 35.1 Payment Philosophy

Toujours afficher :

### secure payment

---

### verified provider

---

### payment status

---

### retry flow

---

## 35.2 Supported Payment UX (V1)

Pour la Côte d'Ivoire :

### Wave

---

### Orange Money

---

### MTN MoMo

---

### cartes bancaires

---

### cash on delivery future

---

## 35.3 Payment Flow

Architecture :

```txt id="k4v7pm"
choose payment
↓
provider redirect/modal
↓
verification
↓
confirmation
```

---

## 35.4 Payment Failure UX

Jamais :

```txt id="v6m1pk"
Paiement échoué
```

Toujours :

```txt id="x8k4tm"
Le paiement n’a pas abouti.

Réessayer
Changer méthode
Contacter support
```

---

## 35.5 Payment Confirmation Screen

Affichage :

### success message

---

### order summary

---

### estimated delivery

---

### WhatsApp shortcut

---

### tracking CTA

---

### recommended businesses

---

# 36. Order Tracking UX

Très critique.

---

# 36.1 Tracking Philosophy

Toujours :

> visibilité.

---

## Tracking States

Restaurant :

```txt id="d5m9pk"
Commande reçue
↓
Préparation
↓
Prête
↓
En livraison
↓
Livrée
```

---

Salon :

```txt id="n2v8tm"
Réservation confirmée
↓
Rappel
↓
Visite
↓
Terminé
```

---

Hotel :

```txt id="p9k1tx"
Réservation confirmée
↓
Check-in
↓
Séjour
↓
Check-out
```

---

## Tracking Screen

Affichage :

### timeline

---

### ETA

---

### merchant contact

---

### WhatsApp

---

### support

---

# 37. Notification UX System

Notifications :

> moteur engagement.

---

# 37.1 Notification Philosophy

Bonne information.

Bon moment.

Bon canal.

---

## Notification Categories

### orders

---

### bookings

---

### promotions

---

### reviews

---

### payment

---

### loyalty future

---

### nearby recommendations future

---

## 37.2 Notification Center

Page dédiée.

Structure :

```txt id="m8w2pk"
Today
Yesterday
Earlier
```

---

## Notification Actions

Actionables.

Ex :

```txt id="g4v9tm"
Commande prête
↓
Voir commande
```

---

## 37.3 Push Hierarchy

Critique :

### payment

---

### booking

---

### delivery

---

Marketing :

moins intrusif.

---

# 38. Admin Backoffice Philosophy

Le backoffice admin doit être :

> **operations-first**

Pas juste :

> dashboard analytics.

Objectif :

> contrôler plateforme.

---

# 38.1 Admin Navigation

Sidebar :

```txt id="r7k2pm"
Overview

Businesses

Users

Moderation

Payments

Orders

Bookings

Reviews

Support

Analytics

Countries

Settings
```

---

# 39. Admin Dashboard Screen

Vue globale plateforme.

KPIs :

### GMV

---

### bookings

---

### active businesses

---

### active users

---

### conversion

---

### moderation alerts

---

### payment issues

---

### fraud signals

---

# 40. Business Moderation UX

Très critique.

---

## Moderation Queue

Structure :

```txt id="v3m8tk"
Pending Review
↓
Under Review
↓
Approved
↓
Rejected
```

---

## Business Review Screen

Admin voit :

### photos

---

### location

---

### documents

---

### claim proof

---

### moderation history

---

### risk score future

---

## Actions

### approve

---

### reject

---

### request proof

---

### suspend

---

# 41. Payments Admin UX

Admin suit :

### transactions

---

### refunds

---

### payouts

---

### disputes

---

### failed payments

---

## Payment Detail Screen

Afficher :

### provider

---

### logs

---

### merchant

---

### customer

---

### timeline

---

### fraud flags

---

# 42. Support & Dispute UX

Support screen :

```txt id="z6m1pk"
Open
Pending
Resolved
Escalated
```

---

## Ticket View

Afficher :

### messages

---

### merchant

---

### customer

---

### history

---

### resolution actions

---

# 43. Multi-country UX

LaPlasse :

> multi-country native.

---

# 43.1 Country Detection UX

Auto détecter :

### pays

---

### ville

---

### devise

---

### langue

---

Mais :

override manuel.

---

## Country Selector

Toujours visible.

Ex :

```txt id="c9k3tm"
🇨🇮 Côte d’Ivoire

🇬🇭 Ghana

🇸🇳 Sénégal
```

---

## 43.2 Localization UX

Adapter :

### monnaie

---

### paiement

---

### promotions

---

### langue

---

### featured businesses

---

## Example

Côte d'Ivoire :

```txt id="f1m8pk"
FCFA
Wave
Orange
French
```

---

Ghana :

```txt id="t4v7pm"
GHS
MTN
English
```

---

# 44. Fraud & Trust UX

La confiance doit être visible.

---

## Trust Indicators

### verified merchant

---

### verified reviews

---

### secure payment

---

### response rate

---

### response time

---

### business age future

---

### trusted merchant badge

---

# 45. Error States UX

Jamais :

> dead end.

Toujours :

### retry

---

### recommendation

---

### support option

---

### alternative action

---

## Example

Aucun restaurant trouvé :

Pas :

```txt id="w9m2pk"
Aucun résultat
```

Mais :

```txt id="d2k7tm"
Essayez un autre quartier
ou découvrez les restaurants populaires proches.
```

---

# Conclusion Partie 4

Les expériences critiques sont désormais documentées :

### Checkout UX

### Payment UX

### Cart UX

### Tracking UX

### Notifications UX

### Admin UX

### Moderation UX

### Multi-country UX

### Trust UX

La prochaine partie documentera :

# Tome 8 — Partie 5

### Complete User Flows

### Consumer Journey

### Merchant Journey

### Merchant Lifecycle

### Retention UX

### Loyalty UX

### Referral UX

### Full End-to-end Product Experience
