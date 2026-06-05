# LaPlasse — Architecture & Product Master Document

# Tome 11 — Product Roadmap, MVP Strategy & Version Planning

## Partie 1 — Product Philosophy, MVP Framework, Versioning Logic & Execution Methodology

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 1. Introduction

Le plus grand risque produit :

> **vouloir tout construire trop tôt.**

LaPlasse est :

> une plateforme complexe.

Elle combine :

### référencement

---

### marketplace

---

### booking

---

### CRM

---

### payments

---

### reviews

---

### merchant tools

---

### ads

---

### analytics

---

### multi-country

---

Construire tout dès V1 :

> erreur stratégique.

La méthode retenue :

> **progressive product expansion**

Principe :

```txt id="x8m2pk"
simple
↓
valuable
↓
scalable
```

---

# 2. Product Philosophy

LaPlasse suit :

> **MVP-first, ecosystem-later**

Objectif :

lancer vite.

Apprendre vite.

Corriger vite.

Scaler ensuite.

---

## 2.1 Core Product Principle

Toujours :

> résoudre un vrai problème.

Pas :

> impressionner techniquement.

---

## Rule

Chaque fonctionnalité doit répondre :

à au moins un :

### user pain

---

### merchant pain

---

### monetization lever

---

### retention lever

---

### trust lever

---

Sinon :

> feature retardée.

---

# 3. Product Evolution Framework

Architecture roadmap :

```txt id="m7v9pk"
V0.5
↓
V0.8
↓
V1.0
↓
V1.5
↓
V2.0
```

Chaque version :

> objectif business précis.

---

# 4. V0.5 — Functional MVP

Objectif :

> **market validation**

Question :

> les gens veulent-ils vraiment LaPlasse ?

---

## 4.1 V0.5 Philosophy

Construire :

> minimum lovable product.

Pas :

> minimum terrible product.

---

## Goals

### marketplace liquidity

---

### local discovery

---

### first transactions

---

### first reviews

---

### merchant validation

---

### behavior learning

---

# 4.2 V0.5 Target Scope

Pays :

Côte d'Ivoire

---

Ville :

Abidjan

---

Zone prioritaire :

Cocody

---

Catégories :

### restaurants

---

### beauty

---

### boutiques sélectionnées

---

# 4.3 V0.5 Consumer Features

Minimum features.

---

## Discovery

### homepage

---

### search

---

### category pages

---

### business detail page

---

### nearby businesses

---

### favorites

---

### reviews

---

## Marketplace

### products

---

### cart

---

### checkout basic

---

### payment V1

---

## Booking

### booking basic

---

### reservation confirmation

---

### WhatsApp reminder

---

## User Account

### auth basic

---

### profile

---

### orders history

---

### booking history

---

# 4.4 V0.5 Merchant Features

Merchant MVP.

---

## Merchant Onboarding

### business creation

---

### category selection

---

### media upload

---

### WhatsApp CTA

---

### location

---

## Business Management

### edit profile

---

### opening hours

---

### products/services

---

### menu basic

---

### booking availability

---

## Merchant Dashboard

### simple analytics

---

### orders

---

### bookings

---

### reviews

---

## Communication

### WhatsApp shortcut

---

### customer contact

---

# 4.5 V0.5 Admin Features

Minimal admin.

---

## Moderation

### business approval

---

### review moderation

---

### merchant management

---

### payment tracking

---

### support tickets basic

---

## Analytics

### GMV

---

### active merchants

---

### transactions

---

### category performance

---

# 4.6 V0.5 Tech Priorities

Focus :

### speed

---

### stability

---

### analytics tracking

---

### mobile UX

---

### onboarding simplicity

---

### payment reliability

---

Pas :

> perfection technique.

---

# 5. V0.8 — MVP+

Objectif :

> **retention & monetization**

Question :

> les utilisateurs reviennent-ils ?

---

## Added Features

### loyalty basic

---

### CRM lite

---

### promotions

---

### sponsored placement

---

### merchant subscriptions

---

### WhatsApp automation basic

---

### push notifications

---

### referral basic

---

### analytics advanced lite

---

### improved onboarding

---

## Marketplace Improvements

### recommendations

---

### better search

---

### featured businesses

---

### personalized feed lite

---

# 6. V1.0 — Production Ready

Objectif :

> **scale citywide**

Question :

> peut-on dominer une ville ?

---

## Added Features

### advanced analytics

---

### advanced CRM

---

### advanced booking

---

### merchant campaigns

---

### ads marketplace

---

### loyalty expanded

---

### staff management

---

### multi-location lite

---

### advanced moderation

---

### fraud detection basic

---

## UX Improvements

### better recommendations

---

### performance optimization

---

### SEO scale

---

### creator system

---

# 7. V1.5 — Growth Scale

Objectif :

> expansion régionale.

---

## Added Features

### hotel vertical

---

### pharmacy vertical

---

### smart recommendations

---

### predictive analytics lite

---

### advanced merchant tools

---

### automation lite

---

### country localization

---

### advanced referral

---

### affiliate creator future

---

# 8. V2.0 — Ecosystem Platform

Objectif :

> **merchant operating system**

---

## Added Features

### merchant financing future

---

### advanced CRM automation

---

### AI recommendations

---

### predictive retention

---

### dynamic pricing future

---

### logistics integrations

---

### API ecosystem

---

### advanced personalization

---

### business intelligence

---

# 9. Feature Prioritization Framework

Très critique.

---

# 9.1 Prioritization Rule

Chaque feature score :

sur :

```txt id="r4m9pk"
User Value

Merchant Value

Revenue Impact

Complexity

Retention Impact
```

---

## Formula

Toujours :

```txt id="h2m8tm"
High impact
+
Low complexity
=
priority
```

---

## Example

Search :

```txt id="k7v1pk"
HIGH priority
```

---

AI Recommendations :

```txt id="p9m4tm"
LOW priority early
```

---

# 10. Product Prioritization Matrix

---

## Must Have

### search

---

### business pages

---

### reviews

---

### marketplace

---

### checkout

---

### payments

---

### merchant onboarding

---

### dashboard basic

---

### booking

---

## Should Have

### loyalty

---

### referrals

---

### promotions

---

### sponsored listings

---

### analytics advanced

---

## Nice to Have

### AI

---

### predictive CRM

---

### automation advanced

---

### creator marketplace

---

# 11. Product Execution Methodology

Méthode recommandée :

> **Vertical Slice Development**

Pas :

```txt id="n8v3pk"
build everything frontend
then backend
```

Toujours :

```txt id="x3m7pk"
feature
↓
frontend
↓
backend
↓
test
↓
launch
```

---

## Example

Restaurant Booking :

```txt id="t5v2tm"
UX
↓
API
↓
DB
↓
payment
↓
notification
↓
testing
```

---

# 12. Sprint Methodology

Recommandation :

> **2-week sprints**

---

## Sprint Structure

Week 1 :

### build

---

### internal QA

---

Week 2 :

### fixes

---

### polish

---

### release

---

# 13. MVP Success Criteria

V0.5 validé si :

---

## Supply Side

```txt id="g7m8pk"
100+ active merchants
```

---

```txt id="p2v4tm"
80% profile completion
```

---

## Demand Side

```txt id="w9k1pk"
1000+ monthly users
```

---

```txt id="v4m8tm"
30% repeat rate
```

---

## Marketplace

```txt id="z1k2pk"
consistent weekly transactions
```

---

## Trust

```txt id="d6m9tm"
review activity active
```

---

# 14. Biggest Product Risks

### low merchant activation

---

### empty inventory

---

### weak retention

---

### checkout friction

---

### poor liquidity

---

### too many features

---

## Biggest Mistake

```txt id="k8m4pk"
build too much too early
```

---

# 15. Product Governance

Chaque nouvelle feature :

doit répondre :

### pourquoi maintenant ?

---

### quel KPI impacte ?

---

### quel problème résout ?

---

### coût vs impact ?

---

# Conclusion Partie 1

La roadmap produit LaPlasse est désormais structurée :

### MVP roadmap

### version planning

### feature prioritization

### execution methodology

### sprint logic

### governance

### risk management

La prochaine partie documentera :

# Tome 11 — Partie 2

### Detailed V0.5 MVP Blueprint

### Sprint-by-sprint roadmap

### Technical sequencing

### Launch-ready execution plan

### Feature dependency map

### Cursor AI execution methodology
# LaPlasse — Architecture & Product Master Document

# Tome 11 — Product Roadmap, MVP Strategy & Version Planning

## Partie 2 — Detailed V0.5 MVP Blueprint, Sprint-by-Sprint Roadmap, Technical Sequencing & Launch Execution

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 16. V0.5 MVP Philosophy

Le MVP LaPlasse doit être :

> **petit mais extrêmement utile.**

Erreur classique :

> vouloir livrer toute la vision.

Objectif V0.5 :

> **valider le comportement réel du marché.**

Question principale :

> les utilisateurs utilisent-ils réellement LaPlasse ?

---

# 16.1 MVP Goals

Le MVP doit valider :

### découverte locale

---

### recherche business

---

### réservations

---

### commandes marketplace

---

### paiements

---

### reviews

---

### onboarding merchant

---

### first transactions

---

### repeat usage

---

# 16.2 MVP Scope Rule

Si une feature :

### augmente complexité

mais

### n’aide pas validation marché

Alors :

> reportée.

---

## Excluded from V0.5

### loyalty

---

### ads marketplace

---

### advanced CRM

---

### advanced analytics

---

### automation

---

### AI

---

### advanced referral

---

### hotel advanced

---

### pharmacy advanced

---

### creator marketplace

---

# 17. V0.5 Official Scope

Pays :

Côte d'Ivoire

---

Ville :

Abidjan

---

Zone :

Cocody

---

Verticals :

### restaurants

---

### beauty

---

### boutiques sélectionnées

---

# 18. V0.5 Consumer Scope

---

# 18.1 Public Discovery

Support :

### homepage

---

### nearby businesses

---

### trending businesses

---

### categories

---

### search

---

### filters basic

---

### favorites

---

### reviews

---

## Mandatory UX

### mobile-first

---

### WhatsApp CTA

---

### sticky actions

---

### fast search

---

# 18.2 Business Pages

Restaurant :

### menu

---

### booking

---

### reviews

---

### contact

---

### WhatsApp

---

Salon :

### services

---

### booking

---

### availability lite

---

Boutique :

### products

---

### add to cart

---

### checkout

---

# 18.3 Authentication MVP

Simple.

Support :

### email

---

### phone

---

### Google login

---

No complexity.

---

# 18.4 Marketplace MVP

Support :

### products

---

### cart

---

### checkout

---

### payment

---

### order tracking lite

---

### order history

---

## Excluded

### multi-merchant checkout advanced

---

### wallet

---

### cashback

---

# 18.5 Booking MVP

Support :

### basic reservation

---

### date/time

---

### reminder WhatsApp

---

### booking history

---

## Excluded

### advanced calendar sync

---

### smart scheduling

---

### dynamic pricing

---

# 19. Merchant MVP Scope

Très critique.

---

# 19.1 Merchant Onboarding

Support :

### business creation

---

### category

---

### cover

---

### logo

---

### gallery

---

### hours

---

### WhatsApp

---

### map pin

---

### description

---

## Goal

Temps cible :

```txt id="x2m9pk"
< 5 min
```

---

# 19.2 Merchant Dashboard MVP

Support :

### overview

---

### orders

---

### bookings

---

### products/services

---

### reviews

---

### profile editing

---

### analytics lite

---

## Excluded

### advanced CRM

---

### campaigns

---

### loyalty

---

### ads

---

# 19.3 Merchant Product Management

Boutique :

### products

---

### stock lite

---

### media

---

Restaurant :

### menu items

---

### categories

---

Salon :

### services

---

### pricing

---

# 20. Admin MVP Scope

Très minimal.

---

## Moderation

### merchant approval

---

### business moderation

---

### reviews moderation

---

### support lite

---

## Dashboard

### merchants

---

### transactions

---

### bookings

---

### GMV

---

### issues

---

# 21. Technical Sequencing Philosophy

Très critique.

Jamais :

```txt id="m8k4tm"
build randomly
```

Toujours :

> **dependency-first architecture**

---

## Sequencing Rule

Construire :

```txt id="r4v2pk"
foundation
↓
core systems
↓
transactions
↓
optimization
```

---

# 22. Sprint-by-Sprint MVP Roadmap

Recommandation :

> **2 semaines / sprint**

---

# Sprint 0 — Foundation Setup

Objectif :

> base propre.

---

## Deliverables

### monorepo setup

---

### Next.js architecture

---

### NestJS architecture

---

### Prisma setup

---

### PostgreSQL

---

### auth base

---

### design system foundation

---

### CI/CD base

---

### environments

---

## Success Criteria

Projet :

### compile

---

### auth works

---

### DB stable

---

# Sprint 1 — Discovery Foundation

Objectif :

> découverte locale.

---

## Features

### homepage

---

### categories

---

### business listing

---

### search basic

---

### filters basic

---

### business cards

---

### responsive mobile

---

## Backend

### business API

---

### search API basic

---

### category API

---

## Success

Utilisateur peut :

> découvrir business.

---

# Sprint 2 — Business Detail Pages

Objectif :

> trust + conversion.

---

## Features

Restaurant :

### menu

---

### WhatsApp

---

### reviews

---

Salon :

### services

---

### booking lite

---

Boutique :

### products

---

### add to cart

---

## Backend

### business detail

---

### reviews

---

### services/products

---

## Success

Utilisateur peut :

> choisir business.

---

# Sprint 3 — Authentication & Profile

Objectif :

> account system.

---

## Features

### auth

---

### login/register

---

### profile

---

### favorites

---

### history

---

## Backend

### JWT

---

### profile APIs

---

## Success

Utilisateur connecté.

---

# Sprint 4 — Merchant Onboarding

Très critique.

---

## Features

### create business

---

### upload media

---

### location

---

### products/services

---

### merchant profile

---

## Backend

### merchant APIs

---

### media upload

---

### moderation flow

---

## Success

Merchant peut publier business.

---

# Sprint 5 — Marketplace Transactions

Très critique.

---

## Features

### cart

---

### checkout

---

### payments

---

### order tracking lite

---

### order history

---

## Backend

### payment APIs

---

### order APIs

---

### webhook handling

---

## Success

Commande complète possible.

---

# Sprint 6 — Booking System

---

## Features

### reservations

---

### availability lite

---

### reminders

---

### booking history

---

## Backend

### booking engine

---

### booking API

---

## Success

Réservation fonctionne.

---

# Sprint 7 — Merchant Dashboard

---

## Features

### overview

---

### orders

---

### bookings

---

### reviews

---

### profile management

---

### analytics lite

---

## Success

Merchant autonome.

---

# Sprint 8 — Admin Panel MVP

---

## Features

### moderation

---

### merchant approval

---

### review moderation

---

### analytics

---

### support lite

---

## Success

Ops plateforme fonctionnent.

---

# Sprint 9 — Stabilization

Très critique.

---

## Focus

### bug fixing

---

### performance

---

### onboarding optimization

---

### payment reliability

---

### analytics instrumentation

---

### mobile UX polish

---

## Success

Produit stable.

---

# 23. Technical Dependency Map

Très critique.

---

## Order of Build

```txt id="q9m2pk"
Auth
↓
Businesses
↓
Search
↓
Business Pages
↓
Marketplace
↓
Payments
↓
Booking
↓
Merchant Dashboard
↓
Admin
```

---

# 24. Launch Readiness Checklist

Avant beta.

---

## Consumer

### search works

---

### business pages work

---

### checkout works

---

### booking works

---

### reviews work

---

## Merchant

### onboarding works

---

### dashboard works

---

### products work

---

### bookings work

---

## Admin

### moderation works

---

### payment tracking works

---

### support works

---

# 25. MVP Success Metrics

Validation :

---

## Merchant Side

```txt id="g4m8tm"
100+ merchants
```

---

```txt id="k7v2pk"
80% activated
```

---

## Consumer Side

```txt id="r1m9tm"
1000+ users
```

---

```txt id="t8k3pk"
30% repeat
```

---

## Marketplace

```txt id="v2m7tm"
weekly recurring transactions
```

---

# 26. Cursor AI Execution Methodology

Très critique pour ton workflow.

Comme avec EVENTIS :

> **prompts courts, précis, indépendants**

Jamais :

```txt id="m5v9pk"
build all MVP
```

Toujours :

```txt id="n8k2tm"
one feature
↓
one objective
↓
one validation
```

---

## Recommended Prompt Style

Structure :

```txt id="d3m7pk"
Context

Objective

Files concerned

Expected result

Rules

Validation checklist
```

---

## Example

Search Feature :

```txt id="f1k8tm"
Objectif :
Créer le moteur de recherche MVP.

Inclure :
- recherche business
- catégorie
- quartier

Contraintes :
- mobile-first
- debounce
- fast UX

Validation :
- recherche <1 sec
- responsive
```

---

# Conclusion Partie 2

Le blueprint exécution du MVP LaPlasse est désormais structuré :

### sprint roadmap

### feature sequencing

### technical dependencies

### launch readiness

### validation metrics

### Cursor methodology

La prochaine partie documentera :

# Tome 11 — Partie 3

### V0.8 MVP+ Blueprint

### V1 Production Blueprint

### Scaling roadmap

### Technical evolution plan

### Infrastructure scaling

### Team scaling plan
# LaPlasse — Architecture & Product Master Document

# Tome 11 — Product Roadmap, MVP Strategy & Version Planning

## Partie 3 — V0.8 MVP+, V1 Production Blueprint, Scaling Roadmap, Infrastructure Evolution & Team Scaling

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 27. Philosophy of Scale

Une erreur fréquente produit :

> **scaler un produit non validé.**

LaPlasse doit scaler :

seulement après validation :

### liquidité locale

---

### repeat usage

---

### merchant retention

---

### marketplace trust

---

### monetization proof

---

Rule :

```txt id="x7m2pk"
validate
↓
optimize
↓
scale
```

---

# 28. V0.8 — MVP+ Blueprint

Objectif :

> **améliorer rétention + monétisation initiale**

Question clé :

> les utilisateurs reviennent-ils naturellement ?

---

# 28.1 V0.8 Philosophy

Après validation MVP :

on améliore :

### retention

---

### engagement

---

### merchant ROI

---

### monetization lite

---

### operational efficiency

---

Pas encore :

> plateforme ultra complexe.

---

# 28.2 Consumer Features Added (V0.8)

---

## Loyalty Lite

Support :

### points basic

---

### reward progress

---

### simple redemption

---

Ex :

```txt id="m5v9tm"
5 commandes
=
1 bonus
```

---

## Referral Basic

Support :

### invite friend

---

### reward unlock

---

### WhatsApp sharing

---

## Smart Recommendations Lite

Based on :

### favorites

---

### viewed businesses

---

### nearby activity

---

### purchase history lite

---

## Push Notifications

Support :

### order updates

---

### booking reminders

---

### nearby promotions

---

### reactivation

---

## Better Search

Ajouts :

### autocomplete

---

### smart ranking

---

### trending searches

---

### better filters

---

# 28.3 Merchant Features Added (V0.8)

---

## Merchant Subscription

Activation :

### Starter

---

### Growth lite

---

## Sponsored Listings

Support :

### homepage boost

---

### search boost

---

### nearby boost

---

## Promotions Engine

Merchant peut :

### create discount

---

### time-based offers

---

### promo banners

---

## CRM Lite

Merchant voit :

### repeat customers

---

### inactive customers

---

### top spenders lite

---

## Analytics Lite+

Ajouts :

### top products

---

### repeat customers

---

### conversion overview

---

### business performance

---

# 28.4 Admin Features Added (V0.8)

---

## Better Moderation

Support :

### merchant verification

---

### reports handling

---

### trust score lite

---

## Growth Dashboard

KPIs :

### acquisition

---

### retention

---

### activation

---

### liquidity

---

### monetization

---

# 29. V1.0 — Production Blueprint

Objectif :

> **dominer une ville**

Question :

> peut-on devenir réflexe local ?

---

# 29.1 V1 Philosophy

V1 :

> **stable + scalable + monetizable**

Focus :

### performance

---

### retention

---

### merchant ROI

---

### city expansion

---

### operational maturity

---

# 29.2 Consumer Features Added (V1)

---

## Personalized Feed

Based on :

### location

---

### behavior

---

### favorites

---

### search history

---

### popular places nearby

---

## Better Recommendations

Support :

### similar businesses

---

### “people also visited”

---

### trending nearby

---

### reorder prompts

---

## Expanded Loyalty

Support :

### points

---

### tiers lite

---

### merchant rewards

---

### city campaigns

---

## Better Marketplace

Support :

### recommendations

---

### bundles

---

### featured products

---

### inventory improvements

---

## Better Booking

Support :

### smarter slots

---

### waitlist lite

---

### availability UX

---

# 29.3 Merchant Features Added (V1)

---

## Advanced Dashboard

Merchant voit :

### revenue

---

### trends

---

### best products

---

### peak hours

---

### customer retention

---

## CRM Basic+

Support :

### campaigns

---

### segmentation

---

### retention messages

---

### WhatsApp marketing lite

---

## Ads Self-Serve

Merchant lance :

### visibility campaign

---

### booking campaign

---

### WhatsApp campaign

---

## Staff Management Lite

Support :

### staff roles

---

### permissions lite

---

### activity tracking

---

## Multi-location Lite

Chaînes :

### branches

---

### local managers

---

# 29.4 Admin Features Added (V1)

---

## Fraud Detection Lite

Détection :

### fake reviews

---

### suspicious activity

---

### abuse

---

## Better Moderation

Support :

### disputes

---

### advanced approval

---

### escalations

---

## Country Settings

Configurer :

### currency

---

### payment methods

---

### commissions

---

### categories

---

# 30. Scaling Roadmap

Architecture officielle :

```txt id="q4m8pk"
Cocody
↓
Abidjan
↓
Côte d’Ivoire
↓
West Africa
```

---

# 30.1 Scaling Conditions

Expansion seulement si :

---

## Supply Health

```txt id="t9v2tm"
merchant density validated
```

---

## Demand Health

```txt id="x2m7pk"
repeat usage validated
```

---

## Marketplace Health

```txt id="n6k3tm"
consistent transactions
```

---

## Monetization Health

```txt id="r8m1pk"
merchant willingness to pay
```

---

# 31. Technical Evolution Roadmap

Très critique.

---

# 31.1 V0.5 Infrastructure

Simple.

Stack :

### monolith modular

ou

### modular monolith

Recommandé.

Pourquoi ?

> vitesse développement.

---

## Recommended Stack

Frontend :

### Next.js

---

Backend :

### NestJS

---

DB :

### PostgreSQL

---

ORM :

### Prisma

---

Cache :

### Redis

---

Storage :

### Supabase Storage / S3

---

Search :

### PostgreSQL Full-text

(V0.5)

---

# 31.2 V0.8 Infrastructure

Ajouts :

### Redis expansion

---

### queue system

---

### cron jobs

---

### notifications engine

---

### search optimization

---

## Search Evolution

```txt id="p7m9tm"
PostgreSQL search
↓
Meilisearch future
```

---

# 31.3 V1 Infrastructure

Ajouts :

### CDN

---

### image optimization

---

### background workers

---

### analytics warehouse lite

---

### monitoring

---

### rate limiting

---

### observability

---

## Search Upgrade

Recommandation :

Meilisearch

Pourquoi :

### fast

---

### typo tolerance

---

### geo search

---

### autocomplete

---

# 31.4 V1.5+ Infrastructure

Future :

### microservices selective

---

### recommendation engine

---

### analytics warehouse

---

### ML lite

---

### country architecture

---

## Rule

Jamais :

> microservices trop tôt.

---

# 32. Database Evolution Plan

V0.5 :

```txt id="g2m8pk"
single DB
```

---

V1 :

```txt id="z4v1tm"
read replicas lite
```

---

V2 :

```txt id="m9k2pk"
country-aware scaling
```

---

# 33. Team Scaling Roadmap

Très critique.

---

# 33.1 V0.5 Team

Lean.

Recommandation :

### founder product

---

### 1 frontend

---

### 1 backend fullstack

---

### 1 designer

---

### 1 growth/content

---

### 1 customer success

---

### founder-led sales

---

# 33.2 V0.8 Team

Ajouts :

### ops/moderation

---

### merchant success

---

### QA

---

### content/video creator

---

# 33.3 V1 Team

Ajouts :

### growth marketer

---

### performance marketing

---

### data analyst lite

---

### partnership manager

---

### community manager

---

### support lead

---

# 34. Engineering Methodology

Très critique.

---

## Recommended Method

Comme EVENTIS :

> **step-by-step execution**

Jamais :

```txt id="f6m3pk"
massive prompts
```

Toujours :

```txt id="v2k7tm"
small feature
↓
test
↓
fix
↓
validate
```

---

## Development Rule

Une feature :

n’est terminée que si :

### UX validée

---

### backend validé

---

### mobile tested

---

### analytics tracked

---

### edge cases checked

---

# 35. Product Quality Framework

Avant release :

chaque feature passe :

```txt id="h8m4pk"
functional QA
↓
mobile QA
↓
performance QA
↓
merchant QA
↓
analytics QA
```

---

# 36. Technical Debt Strategy

Dette technique :

> acceptable si contrôlée.

Rule :

```txt id="n1m8tm"
ship fast
↓
refactor later
```

Mais :

refactor planifié.

---

## Every 3 Sprints

Prévoir :

```txt id="r5k2pk"
stabilization sprint
```

---

# 37. Launch Readiness Framework

Avant lancement officiel.

Checklist :

---

## Product

### no critical bugs

---

### checkout works

---

### booking works

---

### onboarding smooth

---

### search fast

---

## Merchant

### enough inventory

---

### active merchants

---

### quality listings

---

## Growth

### content ready

---

### creators ready

---

### referral ready

---

### tracking ready

---

# Conclusion Partie 3

L’évolution produit & technique LaPlasse est désormais structurée :

### V0.8 blueprint

### V1 production

### scaling roadmap

### infra evolution

### team scaling

### engineering methodology

### QA framework

### technical debt strategy

La prochaine étape sera :

# Tome 11 — Partie 4

### Detailed Sprint Architecture

### Feature Dependency Graph

### Technical Modules Breakdown

### Cursor AI Development Framework

### Folder Architecture

### Engineering Playbook
# LaPlasse — Architecture & Product Master Document

# Tome 11 — Product Roadmap, MVP Strategy & Version Planning

## Partie 4 — Detailed Sprint Architecture, Feature Dependency Graph, Technical Modules Breakdown & Engineering Playbook

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 38. Engineering Philosophy

Le plus grand risque technique :

> **une architecture confuse dès le départ.**

LaPlasse doit être :

> **simple à construire, simple à maintenir, simple à scaler.**

Principe :

```txt id="x8m2pk"
clarity
↓
modularity
↓
speed
↓
stability
```

---

# 38.1 Engineering Rules

Toujours :

### feature-first

---

### modular

---

### mobile-first

---

### typed

---

### scalable

---

### analytics-ready

---

Jamais :

### spaghetti architecture

---

### premature optimization

---

### overengineering

---

# 39. Recommended Architecture Philosophy

Pour LaPlasse :

recommandation forte :

> **Modular Monolith First**

Pas :

> microservices early.

Pourquoi ?

---

## Faster Development

Moins complexité.

---

## Easier Debugging

Très important MVP.

---

## Lower Infra Cost

Critique early-stage.

---

## Better Developer Speed

---

## Easier Cursor Workflow

Très important pour toi.

---

## Recommended Evolution

Architecture :

```txt id="m7v8pk"
Modular Monolith
↓
Modular Scale
↓
Selective Microservices
```

---

# 40. Official Technical Architecture

Recommandation officielle.

---

## Frontend

### Next.js App Router

---

### TypeScript

---

### Tailwind CSS

---

### ShadCN UI

---

### TanStack Query

---

### Zustand

(state léger)

---

## Backend

### NestJS

---

### TypeScript

---

### Prisma ORM

---

### PostgreSQL

---

### Redis

---

### BullMQ

(queue future)

---

## Infrastructure

### Docker

---

### Supabase Auth

ou

### BetterAuth future

---

### S3 / Supabase Storage

---

### Cloudflare

---

### Railway / VPS early

---

### AWS future

---

# 41. Recommended Project Structure

Très critique.

---

## Monorepo Structure

Recommandé :

```txt id="k2m8pk"
cibooks/
│
├── apps/
│   ├── web/
│   ├── api/
│   └── admin/
│
├── packages/
│   ├── ui/
│   ├── config/
│   ├── types/
│   ├── utils/
│   └── shared/
│
├── prisma/
│
├── docs/
│
└── scripts/
```

---

## Why This Structure

### reusable

---

### scalable

---

### Cursor-friendly

---

### clean imports

---

### easy maintenance

---

# 42. Frontend Folder Architecture

Très important.

---

## Recommended Structure

```txt id="f8m1pk"
src/
│
├── app/
│
├── components/
│   ├── ui/
│   ├── shared/
│   ├── business/
│   ├── marketplace/
│   ├── booking/
│   ├── auth/
│   └── dashboard/
│
├── features/
│   ├── search/
│   ├── businesses/
│   ├── marketplace/
│   ├── booking/
│   ├── reviews/
│   ├── auth/
│   └── merchant/
│
├── hooks/
│
├── lib/
│
├── services/
│
├── store/
│
├── types/
│
├── constants/
│
└── utils/
```

---

## Rule

Toujours :

> **feature-based structure**

Pas :

```txt id="r4m9tm"
all components together
```

---

# 43. Backend Module Architecture

Très critique.

NestJS doit être :

> domain-driven.

---

## Recommended Modules

```txt id="v1m7pk"
auth

users

businesses

categories

search

marketplace

orders

bookings

payments

reviews

favorites

notifications

merchant-dashboard

analytics

admin

moderation
```

---

## Rule

1 module :

```txt id="q9m2pk"
controller
service
dto
entity
repository
types
```

---

# 44. Feature Dependency Graph

Très critique.

Ordre officiel.

---

## Foundation Layer

```txt id="x2m8tm"
Auth
Users
Categories
Businesses
```

---

## Discovery Layer

```txt id="p5v7pk"
Search
Homepage
Listings
Filters
Business Pages
```

---

## Trust Layer

```txt id="k8m4pk"
Reviews
Favorites
Ratings
```

---

## Marketplace Layer

```txt id="n4m1tm"
Products
Cart
Checkout
Orders
Payments
```

---

## Booking Layer

```txt id="z7k3pk"
Availability
Reservations
Booking History
```

---

## Merchant Layer

```txt id="m2v9pk"
Onboarding
Dashboard
Orders
Reviews
Analytics
```

---

## Admin Layer

```txt id="d8m5tm"
Moderation
Payments
Support
Platform Analytics
```

---

# 45. Detailed Sprint Architecture

Très important.

---

# Sprint 0 — Foundation

Deliverables :

### monorepo

---

### Next setup

---

### Nest setup

---

### Prisma

---

### DB connection

---

### auth base

---

### UI system

---

### typography

---

### theme

---

### environment configs

---

### Docker local

---

## Validation

Projet compile.

Auth fonctionne.

DB stable.

---

# Sprint 1 — Discovery System

Modules :

### categories

---

### homepage

---

### listings

---

### search MVP

---

### business cards

---

### filters basic

---

## APIs

### GET businesses

---

### search endpoint

---

### categories endpoint

---

## Validation

Search fonctionnelle.

---

# Sprint 2 — Business Detail System

Modules :

### business page

---

### reviews

---

### products/services

---

### WhatsApp CTA

---

### sticky actions

---

### business gallery

---

## Validation

Business complet consultable.

---

# Sprint 3 — Auth System

Modules :

### register

---

### login

---

### profile

---

### favorites

---

### history

---

## Validation

Compte stable.

---

# Sprint 4 — Merchant Onboarding

Très critique.

---

Modules :

### create business

---

### upload media

---

### categories

---

### products

---

### business hours

---

### map pin

---

## Validation

Merchant autonome.

---

# Sprint 5 — Marketplace Transactions

Très critique.

---

Modules :

### cart

---

### checkout

---

### payment integration

---

### orders

---

### tracking lite

---

## Validation

Commande complète.

---

# Sprint 6 — Booking

Modules :

### reservations

---

### booking calendar lite

---

### booking status

---

### reminders

---

## Validation

Réservation réelle.

---

# Sprint 7 — Merchant Dashboard

Modules :

### merchant overview

---

### products

---

### orders

---

### bookings

---

### analytics lite

---

## Validation

Merchant self-service.

---

# Sprint 8 — Admin

Modules :

### moderation

---

### merchants

---

### transactions

---

### disputes lite

---

### analytics

---

## Validation

Ops fonctionnelles.

---

# Sprint 9 — Stabilization

Très critique.

---

Focus :

### bug fixing

---

### performance

---

### analytics instrumentation

---

### onboarding optimization

---

### mobile QA

---

### SEO basics

---

### image optimization

---

## Validation

Launch-ready.

---

# 46. Database Design Philosophy

Très critique.

---

## Rules

Toujours :

### UUID

---

### timestamps

---

### soft delete

---

### indexes

---

### enums

---

### auditability

---

## Example Standard Fields

```txt id="w4m2pk"
id
createdAt
updatedAt
deletedAt
status
```

---

# 47. API Architecture Standards

Très critique.

---

## REST Convention

Exemple :

```txt id="h9m8pk"
/api/businesses

/api/businesses/:id

/api/search

/api/orders
```

---

## API Rules

### DTO validation

---

### typed responses

---

### pagination

---

### filters

---

### error handling

---

### rate limiting

---

# 48. State Management Strategy

Recommandation :

### TanStack Query

(server state)

---

### Zustand

(light client state)

---

## Avoid

### Redux too early

---

# 49. Media System Architecture

Très critique.

---

## Upload Types

### logo

---

### cover

---

### gallery

---

### product images

---

### review images

---

## Optimization Rules

Toujours :

### compression

---

### webp

---

### responsive sizes

---

### lazy loading

---

# 50. Search Architecture Evolution

V0.5 :

```txt id="b2v9tm"
Postgres Full Text
```

---

V1 :

Meilisearch

---

V2 :

Geo-intelligent search.

---

# 51. Cursor AI Engineering Framework

Très critique pour ton workflow.

---

## Rule #1

Un prompt :

> une feature.

---

## Rule #2

Toujours inclure :

```txt id="f5m7pk"
Context
Objective
Files
Constraints
Expected Result
Validation Checklist
```

---

## Rule #3

Toujours :

> demander code propre.

---

## Example Prompt Structure

```txt id="g8m3pk"
Context:
Nous développons le MVP LaPlasse.

Objective:
Créer le module Business Listing.

Requirements:
- responsive
- mobile-first
- loading skeleton
- pagination
- filters

Validation:
- mobile responsive
- no hydration issue
- API connected
```

---

# 52. Engineering Quality Checklist

Avant merge.

---

## Frontend

### responsive

---

### loading states

---

### empty states

---

### error states

---

### skeletons

---

### accessibility lite

---

## Backend

### validation

---

### auth guards

---

### logs

---

### rate limit

---

### error handling

---

### DB performance

---

# 53. Biggest Engineering Risks

### overengineering

---

### premature microservices

---

### weak search UX

---

### bad merchant onboarding

---

### payment instability

---

### poor mobile UX

---

### too many features

---

# Conclusion Partie 4

L’architecture engineering LaPlasse est désormais structurée :

### sprint architecture

### module system

### folder structure

### dependency graph

### infra plan

### engineering standards

### Cursor methodology

### quality framework

La prochaine étape sera :

# Tome 11 — Partie 5

### Full Prisma Schema Architecture

### Database Design Blueprint

### Entity Relationship Map

### Permission System

### Roles & Access Control

### Multi-country Data Architecture
# LaPlasse — Architecture & Product Master Document

# Tome 11 — Product Roadmap, MVP Strategy & Version Planning

## Partie 5 — Full Prisma Schema Architecture, Database Blueprint, Roles & Multi-country Data Model

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 54. Database Philosophy

La base de données LaPlasse doit être :

> **simple au départ, extensible à long terme.**

Erreur classique startup :

> créer un schéma ultra complexe dès V0.5.

Erreur inverse :

> schéma trop simple impossible à scaler.

LaPlasse adopte :

> **Scalable MVP Database Architecture**

Principe :

```txt id="x7m2pk"
simple today
↓
expand tomorrow
```

---

# 54.1 Database Objectives

Le schéma doit supporter :

### multi-country

---

### multi-vertical

---

### marketplace

---

### booking

---

### reviews

---

### payments

---

### merchant dashboards

---

### CRM future

---

### monetization

---

### scaling

---

# 55. Database Core Principles

Toujours :

### UUID IDs

---

### soft delete

---

### timestamps

---

### enums

---

### auditability

---

### country awareness

---

### future extensibility

---

## Standard Entity Fields

Toutes entités critiques :

```txt id="m8v2pk"
id
createdAt
updatedAt
deletedAt
status
```

---

## Recommended Prisma Base

Exemple :

```txt id="k5v7tm"
id String @id @default(uuid())
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
deletedAt DateTime?
```

---

# 56. Global Database Architecture

Architecture générale :

```txt id="f4m8pk"
Users
↓
Businesses
↓
Products / Services
↓
Orders / Bookings
↓
Payments
↓
Reviews
↓
Analytics
```

---

# 57. User System Architecture

Très critique.

---

# 57.1 User Model Philosophy

Un utilisateur peut être :

### consommateur

---

### merchant

---

### admin

---

### moderator

---

### multi-role future

---

## Recommended Role Strategy

Toujours :

> RBAC flexible.

Pas :

```txt id="r7k1tm"
1 user = 1 role
```

---

## User Entity

Champs :

### id

---

### email

---

### phone

---

### firstName

---

### lastName

---

### avatar

---

### countryId

---

### cityId

---

### language

---

### isVerified

---

### isMerchant

---

### lastLoginAt

---

### authProvider

---

### status

---

## Authentication Providers

Support :

### email

---

### phone

---

### Google

---

### Apple future

---

### WhatsApp future

---

# 58. RBAC — Roles & Permission System

Très critique.

---

# 58.1 Recommended RBAC

Architecture :

```txt id="v8m4pk"
User
↓
Role
↓
Permission
```

---

## Default Roles

### USER

---

### MERCHANT

---

### ADMIN

---

### MODERATOR

---

### SUPPORT_AGENT future

---

### COUNTRY_MANAGER future

---

## Permission Philosophy

Fine-grained.

Ex :

Merchant :

```txt id="q2m9tm"
manage_products
```

---

Admin :

```txt id="w6k1pk"
approve_business
```

---

Moderator :

```txt id="n4m7pk"
moderate_reviews
```

---

# 59. Geography Architecture

Très critique multi-pays.

---

# 59.1 Country Model

Toujours séparé.

Country entity :

### id

---

### name

---

### code

---

### currency

---

### language

---

### timezone

---

### status

---

### supportedPayments

---

---

## Initial Countries

V1 :

Côte d'Ivoire

---

Future :

Senegal

---

Ghana

---

Cameroon

---

# 59.2 City Model

Entity :

### id

---

### countryId

---

### name

---

### slug

---

### geoLat

---

### geoLng

---

### active

---

## Example

Abidjan

---

Districts :

### Cocody

---

### Marcory

---

### Plateau

---

### Yopougon

---

# 60. Business Architecture

Le cœur LaPlasse.

---

# 60.1 Business Model

Très critique.

Business entity :

### id

---

### ownerId

---

### categoryId

---

### cityId

---

### countryId

---

### businessName

---

### slug

---

### shortDescription

---

### longDescription

---

### logo

---

### coverImage

---

### gallery

---

### phone

---

### whatsapp

---

### email

---

### website optional

---

### address

---

### geoLat

---

### geoLng

---

### verificationStatus

---

### averageRating

---

### reviewCount

---

### featured

---

### sponsored

---

### businessStatus

---

## Business Types

Support :

### RESTAURANT

---

### BEAUTY

---

### BOUTIQUE

---

### HOTEL future

---

### PHARMACY future

---

### SERVICES future

---

# 60.2 Business Hours Model

Toujours séparé.

Entity :

### businessId

---

### day

---

### openTime

---

### closeTime

---

### closed

---

# 60.3 Business Media Model

Support :

### logo

---

### gallery

---

### videos future

---

### cover

---

# 61. Category System

Très critique.

---

# 61.1 Category Model

Structure :

```txt id="g9m2pk"
Category
↓
Subcategory
```

---

## Example

Restaurant :

```txt id="z4v8tm"
Restaurant
↓
African
↓
Fast Food
↓
Asian
```

---

Beauty :

```txt id="d7k1tm"
Beauty
↓
Hair
↓
Nails
↓
Spa
```

---

# 62. Marketplace Data Architecture

Très critique.

---

# 62.1 Product Model

Entity :

### id

---

### businessId

---

### categoryId

---

### title

---

### description

---

### images

---

### stockQuantity

---

### price

---

### comparePrice

---

### SKU optional

---

### availability

---

### featured

---

### status

---

## Product Variants Future

Support :

### size

---

### color

---

### package

---

# 62.2 Cart Architecture

Cart :

lié utilisateur.

Entity :

### userId

---

### merchantId

---

### items

---

### subtotal

---

### fees

---

### total

---

## Rule

V0.5 :

> single merchant cart.

Plus simple.

---

V1+ :

> multi-merchant cart.

---

# 63. Order Architecture

Très critique.

---

# 63.1 Order Model

Entity :

### id

---

### userId

---

### merchantId

---

### paymentId

---

### total

---

### fees

---

### orderStatus

---

### paymentStatus

---

### deliveryType

---

### deliveryAddress optional

---

### notes

---

## Order States

```txt id="p1m9tm"
PENDING

CONFIRMED

PREPARING

READY

COMPLETED

CANCELLED
```

---

# 63.2 Order Item Model

Toujours séparé.

Entity :

### orderId

---

### productId

---

### quantity

---

### unitPrice

---

### subtotal

---

# 64. Booking Architecture

Très critique.

---

# 64.1 Booking Model

Entity :

### id

---

### userId

---

### businessId

---

### serviceId optional

---

### bookingDate

---

### bookingTime

---

### guestCount optional

---

### bookingStatus

---

### notes

---

## Booking Status

```txt id="n8v4pk"
PENDING

CONFIRMED

COMPLETED

CANCELLED

NO_SHOW
```

---

# 65. Payment Architecture

Très critique.

---

# 65.1 Payment Model

Entity :

### id

---

### userId

---

### orderId optional

---

### bookingId optional

---

### amount

---

### provider

---

### currency

---

### paymentStatus

---

### transactionReference

---

### metadata JSON

---

## Supported Providers V1

Pour la Côte d'Ivoire :

### Wave

---

### Orange Money

---

### MTN MoMo

---

### Card payments

---

# 66. Reviews Architecture

Très critique.

---

# 66.1 Review Model

Entity :

### id

---

### userId

---

### businessId

---

### rating

---

### comment

---

### images optional

---

### moderationStatus

---

### helpfulCount future

---

### verifiedPurchase

---

## Rule

Seulement :

> vrais clients.

---

# 67. Favorites Architecture

Entity :

### userId

---

### businessId

---

### createdAt

---

# 68. Notification Architecture

Support :

### push

---

### WhatsApp

---

### email

---

### SMS

---

## Notification Entity

### userId

---

### type

---

### title

---

### content

---

### channel

---

### sentAt

---

### readAt

---

# 69. Multi-country Data Strategy

Très critique.

---

## Rule

Chaque donnée :

attachée :

```txt id="f2m7pk"
countryId
```

---

Pourquoi ?

### pricing local

---

### payment local

---

### moderation locale

---

### localization

---

### scaling propre

---

# 70. Analytics Data Model (Lite)

Track :

### searches

---

### business views

---

### orders

---

### bookings

---

### reviews

---

### CTR

---

### favorites

---

# 71. Prisma Evolution Strategy

V0.5 :

> simple schema.

---

V1 :

> optimization.

---

V2 :

> partitioning selective.

---

## Rule

Jamais :

> overengineering DB early.

---

# Conclusion Partie 5

L’architecture data LaPlasse est désormais structurée :

### Prisma philosophy

### RBAC

### business architecture

### marketplace schema

### booking schema

### payments schema

### reviews system

### multi-country model

### analytics architecture

La prochaine étape sera :

# Tome 11 — Partie 6

### Full Prisma Schema (Actual Models)

### Enum Architecture

### Relationship Mapping

### Access Control Implementation

### Multi-country Database Strategy

### Production-ready Prisma Blueprint
# LaPlasse — Architecture & Product Master Document

# Tome 11 — Product Roadmap, MVP Strategy & Version Planning

## Partie 6 — Full Prisma Schema, Enum Architecture, Relationship Mapping & Production-ready Database Blueprint

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 72. Prisma Philosophy

Cette section définit :

> **la structure réelle de la base de données LaPlasse.**

Objectif :

> fournir un schéma production-ready

mais :

> compatible MVP.

Le schéma doit être :

### scalable

---

### typed

---

### extensible

---

### multi-country

---

### marketplace-ready

---

### booking-ready

---

### merchant-ready

---

# 72.1 Prisma Design Rules

Toujours :

### UUID

---

### enums

---

### indexes

---

### relations explicites

---

### timestamps

---

### soft delete

---

### nullable seulement si utile

---

## Naming Convention

Toujours :

```txt id="x7m2pk"
camelCase
```

Pour champs.

Et :

```txt id="k5v8tm"
PascalCase
```

Pour modèles.

---

# 73. Core Enum Architecture

Très critique.

---

# 73.1 UserRole Enum

```txt id="m8v1pk"
USER
MERCHANT
ADMIN
MODERATOR
SUPPORT_AGENT
COUNTRY_MANAGER
```

---

# 73.2 UserStatus Enum

```txt id="r2m9tm"
ACTIVE
SUSPENDED
BLOCKED
PENDING
DELETED
```

---

# 73.3 AuthProvider Enum

```txt id="d9k4pk"
EMAIL
PHONE
GOOGLE
APPLE
WHATSAPP
```

---

# 73.4 BusinessType Enum

```txt id="w3m7pk"
RESTAURANT
BEAUTY
BOUTIQUE
HOTEL
PHARMACY
SERVICE
```

---

# 73.5 BusinessStatus Enum

```txt id="n6k2tm"
PENDING
ACTIVE
SUSPENDED
REJECTED
DRAFT
```

---

# 73.6 VerificationStatus Enum

```txt id="f8m1pk"
UNVERIFIED
PHONE_VERIFIED
BUSINESS_VERIFIED
PREMIUM_VERIFIED
```

---

# 73.7 ProductStatus Enum

```txt id="t4v8pk"
ACTIVE
OUT_OF_STOCK
DRAFT
ARCHIVED
```

---

# 73.8 OrderStatus Enum

```txt id="q2m7tm"
PENDING
CONFIRMED
PREPARING
READY
COMPLETED
CANCELLED
REFUNDED
```

---

# 73.9 BookingStatus Enum

```txt id="z9k1pk"
PENDING
CONFIRMED
COMPLETED
CANCELLED
NO_SHOW
```

---

# 73.10 PaymentStatus Enum

```txt id="v5m8tm"
PENDING
PROCESSING
SUCCESS
FAILED
REFUNDED
CANCELLED
```

---

# 73.11 PaymentProvider Enum

V1 :

```txt id="p4k2tm"
WAVE
ORANGE_MONEY
MTN_MOMO
CARD
CASH
```

---

# 73.12 ReviewModerationStatus Enum

```txt id="x1m9pk"
PENDING
APPROVED
REJECTED
FLAGGED
```

---

# 74. Full Relationship Architecture

Très critique.

Architecture globale :

```txt id="g7m2pk"
User
│
├── Businesses
│   ├── Products
│   ├── Services
│   ├── Bookings
│   ├── Orders
│   ├── Reviews
│   └── Media
│
├── Favorites
│
├── Payments
│
└── Notifications
```

---

# 75. User Model Blueprint

Très critique.

---

## User Model

Structure :

```txt id="v2k8tm"
User
```

Champs :

### id

---

### email

---

### phone

---

### passwordHash nullable

---

### firstName

---

### lastName

---

### avatar

---

### countryId

---

### cityId

---

### preferredLanguage

---

### role

---

### authProvider

---

### isVerified

---

### isMerchant

---

### lastLoginAt

---

### status

---

### createdAt

---

### updatedAt

---

### deletedAt

---

## Relations

```txt id="w8m4pk"
User
├── businesses[]
├── bookings[]
├── orders[]
├── reviews[]
├── favorites[]
├── notifications[]
```

---

# 76. Country & Geography Models

Très critique multi-country.

---

# Country Model

```txt id="h5m1pk"
Country
```

Champs :

### id

---

### name

---

### code

Ex :

```txt id="t7k9tm"
CI
GH
SN
```

---

### currency

---

### defaultLanguage

---

### timezone

---

### active

---

### paymentProviders JSON

---

## Relations

```txt id="b2m7pk"
Country
├── cities[]
├── users[]
├── businesses[]
```

---

# City Model

```txt id="r9v3tm"
City
```

Champs :

### id

---

### countryId

---

### name

---

### slug

---

### latitude

---

### longitude

---

### active

---

# 77. Category Architecture

Très critique.

---

## Category Model

```txt id="n4m8pk"
Category
```

Champs :

### id

---

### parentId nullable

---

### name

---

### slug

---

### icon

---

### businessType

---

### active

---

## Structure

```txt id="m8k2tm"
Restaurant
 ├── African
 ├── Asian
 ├── Fast Food

Beauty
 ├── Hair
 ├── Nails
 ├── Spa
```

---

# 78. Business Model Blueprint

Le cœur produit.

---

## Business Model

```txt id="x6m1pk"
Business
```

Champs critiques :

### id

---

### ownerId

---

### categoryId

---

### countryId

---

### cityId

---

### businessName

---

### slug

---

### shortDescription

---

### longDescription

---

### logo

---

### coverImage

---

### phone

---

### whatsapp

---

### email

---

### website

---

### address

---

### latitude

---

### longitude

---

### averageRating

---

### totalReviews

---

### featured

---

### sponsored

---

### verificationStatus

---

### businessType

---

### businessStatus

---

### responseTime

---

### responseRate

---

### createdAt

---

### updatedAt

---

### deletedAt

---

## Relations

```txt id="d7v2tm"
Business
├── products[]
├── services[]
├── reviews[]
├── bookings[]
├── orders[]
├── media[]
├── businessHours[]
```

---

# 79. Business Hours Model

```txt id="q9m4pk"
BusinessHour
```

Champs :

### businessId

---

### dayOfWeek

---

### openTime

---

### closeTime

---

### isClosed

---

# 80. Business Media Model

```txt id="p6k1tm"
BusinessMedia
```

Types :

### LOGO

---

### COVER

---

### GALLERY

---

### VIDEO future

---

Champs :

### businessId

---

### mediaUrl

---

### mediaType

---

### position

---

# 81. Marketplace Models

Très critique.

---

# Product Model

```txt id="f2m8pk"
Product
```

Champs :

### id

---

### businessId

---

### categoryId

---

### title

---

### slug

---

### description

---

### stockQuantity

---

### price

---

### comparePrice

---

### sku

---

### featured

---

### productStatus

---

### createdAt

---

### updatedAt

---

## Relations

```txt id="k8v3tm"
Product
├── media[]
├── orderItems[]
```

---

# Product Media Model

```txt id="m4k9tm"
ProductMedia
```

Champs :

### productId

---

### imageUrl

---

### position

---

# 82. Service Model (Beauty / Booking)

```txt id="z7m2pk"
Service
```

Champs :

### id

---

### businessId

---

### title

---

### description

---

### durationMinutes

---

### price

---

### active

---

# 83. Cart Architecture

V0.5 :

single merchant.

---

## Cart Model

```txt id="v1m8pk"
Cart
```

Champs :

### userId

---

### merchantId

---

### subtotal

---

### fees

---

### total

---

# Cart Item Model

```txt id="x3k2tm"
CartItem
```

Champs :

### cartId

---

### productId

---

### quantity

---

### unitPrice

---

### subtotal

---

# 84. Order Architecture

Très critique.

---

## Order Model

```txt id="n8m4pk"
Order
```

Champs :

### id

---

### userId

---

### merchantId

---

### paymentId

---

### subtotal

---

### fees

---

### total

---

### orderStatus

---

### paymentStatus

---

### deliveryType

---

### deliveryAddress

---

### notes

---

### createdAt

---

## Order Item Model

```txt id="w6k1tm"
OrderItem
```

Champs :

### orderId

---

### productId

---

### quantity

---

### unitPrice

---

### subtotal

---

# 85. Booking Architecture

Très critique.

---

## Booking Model

```txt id="g9m3pk"
Booking
```

Champs :

### id

---

### userId

---

### businessId

---

### serviceId

---

### bookingDate

---

### bookingTime

---

### guestCount

---

### bookingStatus

---

### notes

---

# 86. Payment Model

Très critique.

---

## Payment Model

```txt id="r4m8pk"
Payment
```

Champs :

### id

---

### userId

---

### orderId nullable

---

### bookingId nullable

---

### provider

---

### amount

---

### currency

---

### paymentStatus

---

### transactionReference

---

### metadata JSON

---

### paidAt

---

# 87. Review Model

Très critique.

---

## Review Model

```txt id="y2m7pk"
Review
```

Champs :

### id

---

### userId

---

### businessId

---

### rating

---

### comment

---

### moderationStatus

---

### verifiedPurchase

---

### helpfulCount

---

### createdAt

---

# 88. Favorites Model

```txt id="k7m1tm"
Favorite
```

Champs :

### userId

---

### businessId

---

### createdAt

---

# 89. Notification Model

```txt id="d5m9pk"
Notification
```

Champs :

### userId

---

### type

---

### title

---

### body

---

### channel

---

### sentAt

---

### readAt

---

### metadata JSON

---

# 90. Indexing Strategy

Très critique.

Toujours indexer :

### search fields

---

### slugs

---

### geo fields

---

### countryId

---

### cityId

---

### businessType

---

### status

---

### createdAt

---

## Example

Business :

index recommandé :

```txt id="q1m8tm"
countryId
cityId
businessType
businessStatus
averageRating
```

---

# 91. Production-ready Prisma Rules

Toujours :

### relation names explicites

---

### enums

---

### indexes

---

### DTO validation

---

### pagination ready

---

### audit fields

---

### soft delete

---

## Avoid

### giant JSON fields

---

### polymorphic mess

---

### duplicated logic

---

# Conclusion Partie 6

Le blueprint Prisma production-ready LaPlasse est désormais structuré :

### full schema architecture

### enums

### relations

### RBAC

### multi-country

### indexing

### production database rules

La prochaine étape sera :

# Tome 11 — Partie 7

### Full Actual Prisma Schema Code

### Production-ready Models

### Prisma Optimization

### DB Performance Strategy

### PostgreSQL Indexing

### Migration Strategy
# LaPlasse — Architecture & Product Master Document

# Tome 11 — Product Roadmap, MVP Strategy & Version Planning

## Partie 7 — Full Actual Prisma Schema, Production-ready Models, DB Optimization & Migration Strategy

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 92. Prisma Production Philosophy

Cette partie transforme :

> **la logique fonctionnelle**

en :

> **architecture technique réelle prête à coder.**

Objectif :

obtenir un schéma :

### MVP-friendly

---

### scalable

---

### performant

---

### Cursor-friendly

---

### multi-country ready

---

### production-safe

---

# 92.1 Prisma Architecture Rule

Toujours :

```txt id="x8m2pk"
normalized enough
```

mais :

```txt id="m4v7tm"
not over-normalized
```

Pourquoi ?

PostgreSQL performant.

Mais :

> complexité excessive = ralentissement dev.

---

# 93. Official Prisma Folder Strategy

Recommandation :

```txt id="k7m1pk"
prisma/
│
├── schema.prisma
│
├── seed/
│   ├── countries.ts
│   ├── cities.ts
│   ├── categories.ts
│   └── demoData.ts
│
├── migrations/
│
└── constants/
```

---

## Why

Permet :

### seed propre

---

### multi-country

---

### local onboarding fast

---

### test environment rapide

---

# 94. Official Prisma Datasource

Recommandation :

```txt id="n2m8tm"
provider = "postgresql"
```

Toujours.

---

## Prisma Config

Recommandé :

```txt id="d8k3pk"
DATABASE_URL
DIRECT_URL
```

Pourquoi ?

### pooled connection

---

### migration stable

---

### Supabase compatible

---

### Railway compatible

---

# 95. Production Schema Order

Toujours construire :

dans cet ordre :

```txt id="v1m9pk"
Enums
↓
Geography
↓
Users
↓
Categories
↓
Businesses
↓
Marketplace
↓
Booking
↓
Orders
↓
Payments
↓
Reviews
↓
Notifications
↓
Admin
```

Pourquoi ?

> éviter conflits migration.

---

# 96. Core Schema Relationships

Architecture officielle :

```txt id="w5m7tm"
Country
 └── City

User
 ├── Businesses
 ├── Orders
 ├── Reviews
 ├── Bookings
 └── Favorites

Business
 ├── Products
 ├── Services
 ├── Media
 ├── Reviews
 ├── Orders
 ├── Bookings
 └── BusinessHours

Order
 ├── OrderItems
 └── Payment
```

---

# 97. UUID Strategy

Très critique.

Toujours :

```txt id="q9m2pk"
uuid()
```

Jamais :

```txt id="h3m8tm"
autoincrement()
```

Pourquoi ?

### safer distributed systems

---

### public-safe IDs

---

### future scaling

---

### easier imports

---

# 98. Slug Strategy

Très critique SEO.

Business :

slug obligatoire.

---

## Example

Restaurant :

```txt id="m8k1tm"
chez-amy-cocody
```

---

Salon :

```txt id="x4m7pk"
beauty-house-angre
```

---

## Rule

Slug unique :

par pays.

Pas global.

Pourquoi ?

Future multi-country.

---

# 99. Media Storage Strategy

Très critique.

---

## Recommended Structure

```txt id="r7m4pk"
countries/
businesses/
products/
reviews/
users/
```

---

### Business Media

```txt id="f9m2tm"
businesses/{businessId}/logo

businesses/{businessId}/gallery
```

---

### Product Media

```txt id="d1k8pk"
products/{productId}
```

---

## Image Rules

Toujours :

### webp

---

### compression

---

### responsive sizes

---

### lazy loading

---

### CDN future

---

# 100. Database Optimization Philosophy

Très critique.

Ne jamais attendre :

> performance issues.

Prévenir tôt.

---

## Rule

Indexer :

avant problème.

---

# 100.1 Required Indexes

Business :

index :

```txt id="g2m9pk"
slug
countryId
cityId
businessType
businessStatus
featured
averageRating
```

---

Product :

index :

```txt id="t5m8tm"
businessId
categoryId
price
status
featured
```

---

Orders :

index :

```txt id="p8k4tm"
userId
merchantId
status
createdAt
```

---

Reviews :

index :

```txt id="v3m1pk"
businessId
rating
createdAt
moderationStatus
```

---

Bookings :

index :

```txt id="z6m9tm"
businessId
bookingDate
bookingStatus
```

---

# 101. Geo-search Strategy

Très critique.

---

## V0.5

Simple.

Support :

```txt id="w9m4pk"
latitude
longitude
```

*

radius search.

---

## V1

Geo optimization.

---

## V2

Geo ranking intelligent.

---

## Recommendation

Use :

Postgres extension future :

```txt id="h2k7tm"
PostGIS
```

Pas V0.5.

---

# 102. Search Architecture

Très critique.

---

## V0.5

Postgres Full Text Search.

Pourquoi ?

### simple

---

### cheap

---

### enough MVP

---

Search sur :

### business name

---

### categories

---

### products

---

### city

---

### keywords future

---

## V1

Migration :

Meilisearch

Pourquoi :

### autocomplete

---

### typo tolerance

---

### ranking

---

### geo search

---

### filters

---

# 103. Migration Strategy

Très critique.

---

## Rule #1

Petites migrations.

Jamais :

```txt id="x1m8pk"
huge schema migration
```

---

## Rule #2

1 migration :

```txt id="b7k2tm"
1 concern
```

---

## Example

Migration :

```txt id="m4v9pk"
create_business_model
```

Puis :

```txt id="n6m3tm"
add_business_hours
```

Puis :

```txt id="q5k1tm"
add_business_media
```

---

## Rule #3

Toujours :

```txt id="r2m7pk"
test migration locally
```

avant prod.

---

# 104. Seed Strategy

Très critique.

---

## Required Seeds

### countries

---

### cities

---

### districts

---

### categories

---

### subcategories

---

### payment providers

---

### demo businesses

---

## Initial Seed Countries

V1 :

Côte d'Ivoire

---

Future :

Senegal

---

Ghana

---

# 105. Production Safety Rules

Très critique.

---

Toujours :

### soft delete

---

### audit logs future

---

### timestamps

---

### constraints

---

### validation

---

### cascading carefully

---

## Avoid

Jamais :

```txt id="d9m4pk"
onDelete: Cascade
```

partout.

Danger.

---

Préférer :

```txt id="g5m2tm"
SetNull
```

ou logique soft delete.

---

# 106. RBAC Implementation Strategy

Très critique.

---

## Recommended Pattern

Toujours :

```txt id="j7m1pk"
Role
+
Permission
```

Pas :

```txt id="x8k4tm"
hardcoded if admin
```

---

## Example Permissions

Merchant :

```txt id="v4m8pk"
manage_business
manage_products
manage_bookings
manage_orders
```

---

Admin :

```txt id="k1m7tm"
approve_business
moderate_reviews
manage_payments
```

---

# 107. Event-driven Architecture Lite

Très recommandé.

---

## Example Events

```txt id="n8v2pk"
order.created

payment.success

booking.confirmed

review.created
```

---

Pourquoi ?

Notifications simples.

---

Analytics.

---

CRM future.

---

# 108. Logging Strategy

Très critique.

Toujours logger :

### auth errors

---

### payment failures

---

### booking failures

---

### moderation actions

---

### suspicious activity

---

## Recommendation

Use :

```txt id="q2m8tm"
Pino logger
```

---

# 109. Backup Strategy

Très critique.

---

## MVP

Daily backups.

---

## V1

Point-in-time recovery.

---

## Rule

Toujours :

> tested restore process.

---

# 110. Production Readiness Checklist

Avant lancement :

---

## Database

### indexes ready

---

### migrations tested

---

### seeds tested

---

### backups configured

---

## Backend

### DTO validation

---

### rate limiting

---

### auth guards

---

### logs

---

### monitoring lite

---

## Frontend

### loading states

---

### error states

---

### responsive

---

### SEO basics

---

### skeleton loading

---

# 111. Recommended Development Order (Prisma)

Toujours :

```txt id="f6m1pk"
Enums
↓
Country
↓
City
↓
User
↓
Category
↓
Business
↓
BusinessHours
↓
BusinessMedia
↓
Product
↓
Service
↓
Cart
↓
Order
↓
Payment
↓
Booking
↓
Review
↓
Favorite
↓
Notification
```

---

# Conclusion Partie 7

L’architecture Prisma & database LaPlasse est désormais production-ready :

### migration strategy

### optimization

### indexing

### geo-search

### seed strategy

### RBAC

### event architecture

### production safety

### deployment readiness

La prochaine étape sera :

# Tome 12 — Full Engineering Execution System

### Cursor AI Prompt Framework

### Step-by-step Development Playbook

### Full Development Documentation Structure

### Code Standards

### QA System

### Deployment Blueprint
# LaPlasse — Architecture & Product Master Document

