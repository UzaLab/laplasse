# LaPlasse — Architecture & Product Master Document

# Tome 13 — UX/UI System & Design Architecture

## Partie 1 — Design Philosophy, UX Rules, Mobile-first System & Product Experience Framework

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 1. UX Philosophy

Le plus grand risque marketplace :

> **une expérience confuse.**

Si utilisateur :

réfléchit trop,

cherche trop,

clique trop,

ou se perd :

> conversion baisse.

Pour LaPlasse :

philosophie officielle :

> **simple, fast, trusted, delightful**

Principe :

```txt id="x8m2pk"
discover
↓
trust
↓
convert
↓
retain
```

---

# 1.1 UX Objectives

Le design LaPlasse doit maximiser :

### découverte rapide

---

### confiance

---

### conversion

---

### réservation facile

---

### commande simple

---

### rétention

---

### usage quotidien

---

## Goal

Utilisateur doit penser :

> **“je trouve vite ce qu’il me faut.”**

---

# 2. Design Philosophy

Très critique.

LaPlasse doit être :

### premium

---

### moderne

---

### africain sans cliché

---

### clean

---

### rapide

---

### mobile-first

---

### conversion-oriented

---

## Avoid

Jamais :

### surcharge UI

---

### trop de couleurs

---

### menus compliqués

---

### UX lourde

---

### friction excessive

---

# 2.1 Visual Identity Direction

Recommandation forte.

Style :

> **Google Business × Airbnb × Uber Eats × Glovo × Instagram modern UI**

Mais :

adapté marché africain.

---

## Visual Feel

### premium accessible

---

### clean cards

---

### rounded corners

---

### soft shadows

---

### whitespace important

---

### fast readability

---

### large tap areas

---

# 3. UX Core Principles

Très critique.

---

# Principle 1 — Fast Discovery

Objectif :

> trouver rapidement.

Toujours montrer :

### search

---

### nearby

---

### trending

---

### categories

---

### recommendations

---

## Rule

Maximum :

```txt id="m7v9tm"
3 taps
```

pour trouver business.

---

# Principle 2 — Trust First

Marketplace locale :

confiance critique.

Toujours afficher :

### ratings

---

### reviews

---

### verified badge

---

### photos

---

### opening hours

---

### WhatsApp

---

### map location

---

### merchant response rate future

---

# Principle 3 — Mobile First

Très critique.

Pour :

Côte d'Ivoire

usage :

> principalement mobile.

---

## Rule

Toujours penser :

```txt id="k4m8pk"
thumb-first UX
```

---

# Principle 4 — Frictionless Conversion

Objectif :

réserver ou commander vite.

---

## Rule

Toujours :

### sticky CTA

---

### fast checkout

---

### minimal forms

---

### autofill

---

### WhatsApp fallback

---

# Principle 5 — Progressive Disclosure

Très critique.

Ne jamais tout afficher.

Toujours :

```txt id="r2m7pk"
important first
↓
details later
```

---

## Example

Restaurant :

Above fold :

### photos

---

### rating

---

### CTA

---

### menu preview

---

Puis :

### details

---

### reviews

---

### location

---

# 4. Official UX Architecture

Très critique.

Architecture UX :

```txt id="f8m3tm"
Discover
↓
Explore
↓
Trust
↓
Convert
↓
Retain
```

---

# 4.1 Discover Layer

Support :

### homepage

---

### search

---

### nearby

---

### categories

---

### trending

---

### featured businesses

---

## Goal

Créer :

> exploration addictive.

---

# 4.2 Explore Layer

Support :

### business cards

---

### business detail

---

### gallery

---

### menu/products

---

### services

---

### recommendations

---

## Goal

Créer :

> envie d’acheter/réserver.

---

# 4.3 Trust Layer

Très critique.

Support :

### reviews

---

### verified merchants

---

### photos

---

### map

---

### open/closed status

---

### social proof

---

### business completeness score future

---

# 4.4 Conversion Layer

Support :

### booking CTA

---

### add to cart

---

### WhatsApp CTA

---

### checkout

---

### sticky CTA mobile

---

## Goal

Réduire friction.

---

# 4.5 Retention Layer

Support :

### favorites

---

### reorder future

---

### recommendations

---

### push notifications

---

### loyalty future

---

# 5. Mobile-first Design System

Très critique.

---

# Screen Priority

Toujours designer :

```txt id="w5m9pk"
mobile first
↓
tablet
↓
desktop
```

Jamais inverse.

---

## Recommended Breakpoints

```txt id="t9m3pk"
320px
375px
390px
414px
768px
1024px
1440px
```

---

## Rule

Desktop :

adaptation.

Pas :

design principal.

---

# 6. Thumb-first UX Framework

Très critique.

---

## Reachable Areas

CTA critique :

toujours :

```txt id="f1m8tm"
bottom zone
```

sur mobile.

---

## Sticky CTA Examples

Restaurant :

```txt id="g5m1tm"
Book Table
WhatsApp
```

---

Boutique :

```txt id="n8k4pk"
Add to Cart
Buy Now
```

---

Salon :

```txt id="v2k7tm"
Book Appointment
```

---

# 7. Navigation Philosophy

Très critique.

Navigation doit être :

### intuitive

---

### shallow

---

### fast

---

### familiar

---

## Avoid

Jamais :

```txt id="p2k9tm"
deep navigation
```

---

## Recommended Structure

Bottom nav :

### Home

---

### Search

---

### Favorites

---

### Orders/Bookings

---

### Profile

---

# 8. Homepage UX Architecture

Très critique.

Homepage :

cœur produit.

---

## Recommended Order

```txt id="z4m8pk"
Search hero
↓
Categories
↓
Trending
↓
Nearby
↓
Featured
↓
Recommendations future
```

---

## Rule

Above fold :

doit donner envie d’explorer.

---

# 9. Search UX Principles

Ultra critique.

Search :

feature #1.

---

## Search Must Be

### instant

---

### forgiving

---

### smart

---

### mobile optimized

---

## Include

### autocomplete future

---

### recent searches

---

### popular searches

---

### filters

---

### geo context

---

## Rule

Search response :

```txt id="r7m4pk"
<1 second
```

---

# 10. Empty State Philosophy

Très critique.

Jamais :

écran vide.

---

## Example

No restaurant found :

```txt id="m8k1tm"
Aucun restaurant trouvé.

Essayez :
- un autre quartier
- une autre catégorie
```

---

Favorites empty :

```txt id="x4m7pk"
Sauvegardez vos lieux favoris ici.
```

---

# 11. Loading Experience

Très critique.

Toujours :

### skeleton loading

---

Jamais :

```txt id="d1k8pk"
spinner only
```

---

Pourquoi ?

Perception vitesse meilleure.

---

# 12. Error UX Framework

Très critique.

Toujours :

### human message

---

### retry CTA

---

### fallback option

---

## Example

Booking failed :

```txt id="g2m9pk"
Impossible de réserver.

Réessayez ou contactez le lieu via WhatsApp.
```

---

# 13. WhatsApp-first UX

Très critique Afrique.

Toujours intégrer :

### WhatsApp CTA

---

### fallback support

---

### quick contact

---

### merchant conversion

---

## Rule

Si système échoue :

WhatsApp reste backup.

---

# 14. UX Anti-patterns

Jamais :

### too many modals

---

### too many steps

---

### giant forms

---

### hidden CTA

---

### cluttered UI

---

### aggressive popups

---

### forced registration too early

---

# 15. Official UX Mantra

LaPlasse :

```txt id="b1m8pk"
fast
simple
trusted
mobile-first
```

---

# Conclusion Partie 1

Le framework UX LaPlasse est désormais structuré :

### UX philosophy

### mobile-first rules

### thumb-first UX

### homepage logic

### trust framework

### conversion UX

### WhatsApp-first strategy

### navigation system

La prochaine étape sera :

# Tome 13 — Partie 2

### Design System

### Design Tokens

### Typography

### Color System

### Spacing Rules

### Shadows

### Radius System

### UI Consistency Framework
# LaPlasse — Architecture & Product Master Document

# Tome 13 — UX/UI System & Design Architecture

## Partie 2 — Design System, Design Tokens, Typography, Color System & UI Consistency Framework

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 16. Design System Philosophy

Le plus grand risque UI :

> **une plateforme incohérente.**

Résultat :

### confusion utilisateur

---

### mauvaise perception marque

---

### UX cassée

---

### dette design

---

### développement lent

---

LaPlasse doit être :

> **visuellement cohérent partout.**

Principe :

```txt id="x8m2pk"
consistency
↓
trust
↓
speed
↓
conversion
```

---

# 16.1 Design Objectives

Le design system doit garantir :

### cohérence UI

---

### rapidité développement

---

### réutilisabilité

---

### expérience premium

---

### mobile-first

---

### conversion optimization

---

### scalability

---

# 17. Visual Identity Direction

Très critique.

Direction recommandée :

> **Premium Local Discovery Platform**

Inspiration :

### Google Business

---

### Airbnb

---

### Uber Eats

---

### Glovo

---

### Apple UI simplicity

---

Mais :

adapté Afrique.

---

## Visual Feel

### premium accessible

---

### modern

---

### warm

---

### trustworthy

---

### minimal

---

### clean

---

### soft depth

---

## Avoid

Jamais :

### flashy gradients everywhere

---

### too many colors

---

### aggressive shadows

---

### over-designed UI

---

### visual clutter

---

# 18. Official Typography System

Très critique.

Police validée :

```txt id="m7v9tm"
Manrope
```

Très bon choix.

Pourquoi ?

### premium feel

---

### excellent readability

---

### modern

---

### scalable

---

### mobile friendly

---

# 18.1 Typography Scale

Très critique.

Toujours :

> système cohérent.

---

## Display Large

Usage :

Hero.

Landing.

Big CTA.

```txt id="k4m8pk"
48–56px
```

---

## Heading 1

Pages principales.

```txt id="r2m7pk"
36–40px
```

---

## Heading 2

Sections.

```txt id="f8m3tm"
28–32px
```

---

## Heading 3

Cards.

Modules.

```txt id="w5m9pk"
22–24px
```

---

## Heading 4

Subsections.

```txt id="t9m3pk"
18–20px
```

---

## Body Large

Texte principal.

```txt id="f1m8tm"
16–18px
```

---

## Body Standard

Mobile principal.

```txt id="g5m1tm"
14–16px
```

---

## Small Text

Metadata.

```txt id="n8k4pk"
12–14px
```

---

# 18.2 Typography Rules

Toujours :

### high contrast

---

### readable line-height

---

### enough spacing

---

### no tiny text

---

## Rule

Mobile :

jamais :

```txt id="v2k7tm"
<14px
```

---

# 19. Official Color System

Très critique.

Pour LaPlasse :

recommandation :

> **neutral-first design**

Pourquoi ?

Laisse :

### photos briller

---

### restaurants ressortir

---

### products visibles

---

### premium perception

---

# 19.1 Color Philosophy

Architecture :

```txt id="p2k9tm"
Neutral Base
+
Strong Accent
+
 Semantic Colors
```

---

## Neutral Base

Backgrounds.

Cards.

Layout.

---

### Background

```txt id="z4m8pk"
#FFFFFF
```

---

### Secondary Background

```txt id="r7m4pk"
#F8F9FB
```

---

### Borders

```txt id="m8k1tm"
#EAECEF
```

---

### Text Primary

```txt id="x4m7pk"
#111827
```

---

### Text Secondary

```txt id="d1k8pk"
#6B7280
```

---

# 19.2 Primary Brand Color

Très critique.

Recommandation forte :

Un accent :

### mémorable

---

### premium

---

### local

---

### confiance

---

### marketplace-friendly

---

## Recommended Direction

Option 1 :

Deep Gold / Warm Amber

Premium.

Commerce.

Trust.

```txt id="g2m9pk"
#D97706
```

---

Option 2 :

Modern Green

Discovery + trust.

```txt id="r2m7pk"
#15803D
```

---

Option 3 (fortement recommandé)

Deep Terracotta / Burnt Orange

Très premium Afrique moderne.

```txt id="q5k1tm"
#C2410C
```

---

## Recommendation

Pour LaPlasse :

> **Terracotta premium modernisée**

Très différenciant.

---

# 19.3 Semantic Colors

Très critique.

---

## Success

```txt id="q2m8tm"
#16A34A
```

---

## Error

```txt id="f6m1pk"
#DC2626
```

---

## Warning

```txt id="y2m9pk"
#F59E0B
```

---

## Info

```txt id="x4m2pk"
#2563EB
```

---

# 20. Radius System

Très critique.

LaPlasse :

> soft rounded UI.

---

## Recommended Radius

Cards :

```txt id="b1m8pk"
20px
```

---

Buttons :

```txt id="x6m4pk"
14–16px
```

---

Inputs :

```txt id="p2k9tm"
14px
```

---

Modals :

```txt id="z4m8pk"
28px
```

---

Bottom Sheets :

```txt id="r7m4pk"
32px top radius
```

---

# 21. Shadow System

Très critique.

Toujours :

> subtle shadows.

Jamais :

```txt id="m8k1tm"
heavy shadows
```

---

## Recommended Depth

### Surface 1

Très léger.

---

### Surface 2

Cards.

---

### Surface 3

Dropdowns.

---

### Surface 4

Modals.

---

## Rule

Shadow :

doit créer :

> profondeur douce.

---

# 22. Spacing System

Très critique.

Toujours :

> 8px grid system.

Architecture :

```txt id="x4m7pk"
4
8
12
16
24
32
40
48
64
```

---

## Rule

Jamais spacing aléatoire.

---

## Card Padding

Recommended :

```txt id="d1k8pk"
16–24px
```

---

## Section Spacing

Recommended :

```txt id="g2m9pk"
32–64px
```

---

# 23. Grid System

Très critique.

---

## Mobile

```txt id="r2m7pk"
1 column
```

---

## Tablet

```txt id="q5k1tm"
2 columns
```

---

## Desktop

```txt id="q2m8tm"
3–4 columns
```

---

## Rule

Toujours :

### breathing room

---

### no overcrowding

---

# 24. Card Design System

Très critique.

Cards :

cœur produit.

---

## Business Card

Toujours :

### large image

---

### clear title

---

### rating visible

---

### location

---

### category

---

### CTA visible

---

### sponsored badge subtle

---

## Product Card

Toujours :

### image-first

---

### title

---

### price

---

### merchant trust

---

### add to cart

---

## Rule

Card :

> scanable in 2 seconds.

---

# 25. Button System

Très critique.

---

## Primary Button

Usage :

main CTA.

Ex :

### Book

---

### Buy

---

### Checkout

---

## Secondary Button

Less important.

---

## Ghost Button

Minimal actions.

---

## Floating CTA

Mobile critical.

---

## Rule

Toujours :

### big tap target

---

### thumb reachable

---

### obvious interaction

---

# 26. Input System

Très critique.

Forms :

friction critique.

---

## Inputs Must Be

### large

---

### touch-friendly

---

### autofill-ready

---

### clear labels

---

### validation visible

---

## Avoid

Jamais :

### placeholder-only labels

---

### tiny inputs

---

### unclear errors

---

# 27. Skeleton Loading System

Très critique.

Toujours :

### cards skeleton

---

### business page skeleton

---

### reviews skeleton

---

### checkout skeleton

---

## Rule

No layout shift.

---

# 28. Empty State Design System

Très critique.

Toujours inclure :

### icon/illustration

---

### helpful text

---

### CTA

---

## Example

No favorites :

```txt id="f6m1pk"
Explorez des lieux
et ajoutez vos favoris.
```

---

# 29. Dark Mode Strategy

Recommandation :

Pas V0.5.

---

Pourquoi ?

Complexité.

---

V1 :

possible.

---

## Rule

Pas priorité early.

---

# 30. Accessibility Lite

Très important.

Toujours :

### readable contrast

---

### large tap targets

---

### visible states

---

### keyboard basics

---

### semantic HTML

---

## Rule

Accessible :

sans ralentir MVP.

---

# 31. UI Consistency Rules

Très critique.

Toujours :

### same radius

---

### same spacing

---

### same typography

---

### same buttons

---

### same shadows

---

### same interaction patterns

---

## Rule

Utilisateur doit sentir :

> une seule plateforme cohérente.

---

# 32. Design System Mantra

LaPlasse :

```txt id="g8m3pk"
simple
clean
premium
consistent
mobile-first
```

---

# Conclusion Partie 2

Le design system LaPlasse est désormais structuré :

### typography

### color system

### spacing

### shadows

### radius

### buttons

### inputs

### cards

### UI consistency

La prochaine étape sera :

# Tome 13 — Partie 3

### Homepage UX/UI Architecture

### Search Experience Design

### Business Listing UI

### Discovery UX

### Marketplace Homepage Logic
# LaPlasse — Architecture & Product Master Document

# Tome 13 — UX/UI System & Design Architecture

## Partie 3 — Homepage UX/UI Architecture, Search Experience Design, Business Listing UI & Discovery System

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 33. Homepage Philosophy

Très critique.

La homepage LaPlasse est :

> **le moteur principal de découverte.**

Erreur fréquente :

```txt id="x8m2pk"
homepage = landing page marketing
```

Pour LaPlasse :

> **homepage = exploration engine**

Objectif :

Utilisateur doit immédiatement penser :

> **“je peux trouver ce qu’il me faut rapidement.”**

---

# 33.1 Homepage Goals

La homepage doit maximiser :

### découverte

---

### exploration

---

### engagement

---

### confiance

---

### conversion

---

### rétention

---

## KPI principal

```txt id="m7v9tm"
Search → Business View
```

---

# 34. Official Homepage UX Architecture

Très critique.

Ordre recommandé :

```txt id="k4m8pk"
Header
↓
Search Hero
↓
Quick Categories
↓
Trending Places
↓
Nearby Businesses
↓
Featured Collections
↓
Marketplace Highlights
↓
Recommended Future
↓
Footer
```

---

## Rule

Above fold :

doit être :

> **ultra utile immédiatement.**

---

# 35. Header UX

Très critique.

Header :

minimal.

---

## Mobile Header

Toujours :

### logo

---

### search shortcut

---

### location selector

---

### notifications future

---

### profile

---

## Rule

Jamais :

> header encombré.

---

## Desktop Header

Support :

### logo

---

### search bar

---

### categories

---

### favorites

---

### orders/bookings

---

### profile

---

# 36. Hero Search Section

Ultra critique.

Feature #1.

---

## Hero Goal

Faire comprendre :

> **tu peux trouver n’importe quel lieu rapidement.**

---

## Search Bar UX

Toujours :

### prominent

---

### large

---

### sticky future

---

### mobile-first

---

## Placeholder Examples

Restaurant :

```txt id="r2m7pk"
Rechercher un restaurant...
```

---

Beauty :

```txt id="f8m3tm"
Trouver un salon de beauté...
```

---

General :

```txt id="w5m9pk"
Restaurants, salons, boutiques...
```

---

## Include

### location awareness

---

### category suggestions

---

### recent searches future

---

### trending searches future

---

## Rule

Search :

doit sembler :

> instant.

---

# 37. Quick Categories Section

Très critique.

Objectif :

> exploration rapide.

---

## Recommended Categories V0.5

### Restaurants

---

### Beauté

---

### Boutiques

---

### Livraison future

---

### Pharmacie future

---

### Hôtel future

---

## UX Rule

Categories :

### visual

---

### icon-first

---

### large tap area

---

### horizontally scrollable mobile

---

## Goal

1 tap :

→ exploration.

---

# 38. Trending Businesses Section

Très critique.

Objectif :

> social proof.

---

## Show

### popular restaurants

---

### trending beauty places

---

### popular boutiques

---

## Business Card Must Show

### image

---

### rating

---

### category

---

### distance future

---

### verified badge

---

### sponsored subtle

---

## Rule

Cards :

> addictive to browse.

---

# 39. Nearby Businesses Section

Très critique.

Afrique :

proximité très importante.

---

## Show

### near me

---

### open now

---

### best rated nearby

---

### quick CTA

---

## Rule

Toujours :

> geo relevance first.

---

# 40. Featured Collections

Très recommandé.

Objectif :

> exploration guidée.

---

## Examples

```txt id="t9m3pk"
Best Restaurants in Cocody

Top Beauty Spots

Best Coffee Places

Luxury Dining

Affordable Places
```

---

## UX Goal

Créer :

> browsing behavior.

---

# 41. Marketplace Homepage Integration

Très critique.

Marketplace :

active dès V1.

Mais :

pas dominer homepage.

---

## Recommended Position

Après :

Discovery sections.

---

## Show

### trending products

---

### best sellers

---

### local favorites

---

### featured stores

---

## Rule

Marketplace :

complément.

Pas :

remplacer discovery.

---

# 42. Homepage Mobile UX Rules

Très critique.

---

## Sticky Search Future

Recommended.

---

## Thumb Reachability

CTA critiques :

bas écran.

---

## Scroll Rhythm

Toujours :

alternance :

```txt id="f1m8tm"
cards
↓
carousel
↓
grid
↓
featured
```

Pourquoi ?

Éviter fatigue visuelle.

---

## Rule

Never :

```txt id="g5m1tm"
infinite boring feed
```

---

# 43. Homepage Empty State

Très critique.

Nouveau quartier ?

No data ?

---

## Show

### popular categories

---

### suggested places

---

### invite merchants

---

### WhatsApp recommendation CTA

---

## Example

```txt id="n8k4pk"
Aucun lieu trouvé près de vous.

Découvrez les lieux populaires à Abidjan.
```

---

# 44. Search Experience Philosophy

Ultra critique.

Search :

cœur produit.

---

## Search Goals

Trouver :

### vite

---

### facilement

---

### sans frustration

---

## Rule

Search UX :

doit battre :

> navigation.

---

# 45. Search UX Architecture

Très critique.

Architecture :

```txt id="v2k7tm"
Search Input
↓
Suggestions
↓
Filters
↓
Results
↓
Recommendations
```

---

# 45.1 Search Input

Toujours :

### visible

---

### large

---

### accessible

---

### fast

---

## Include Future

### voice search

---

### image search future

---

# 45.2 Search Suggestions

Très critique.

Avant recherche :

montrer :

### recent searches

---

### trending places

---

### categories

---

### popular searches

---

## Goal

Réduire effort.

---

# 45.3 Search Filters

Très critique.

V0.5 :

minimal.

---

## Recommended Filters

### category

---

### open now

---

### rating

---

### distance future

---

### price future

---

## Rule

Pas :

```txt id="p2k9tm"
50 filters
```

---

# 45.4 Search Results Page

Très critique.

Résultats :

doivent être :

### fast

---

### clean

---

### scanable

---

### trust-first

---

## Business Card Info

Toujours :

### image

---

### business name

---

### rating

---

### category

---

### location

---

### open status

---

### CTA

---

## Rule

Card compréhensible :

```txt id="z4m8pk"
<2 seconds
```

---

# 46. Search Empty State

Très critique.

Toujours aider.

---

## Example

```txt id="r7m4pk"
Aucun résultat trouvé.

Essayez :
- un autre quartier
- une autre catégorie
- un mot-clé différent
```

---

## Include

### suggested categories

---

### nearby businesses

---

### WhatsApp support future

---

# 47. Business Listing Page UX

Très critique.

---

## Recommended Layout

```txt id="m8k1tm"
Filters
↓
Results count
↓
Business Grid
↓
Pagination
```

---

## Mobile

Filters :

### bottom sheet

---

### sticky top shortcut

---

## Desktop

Sidebar filters.

---

# 48. Business Card Architecture

Ultra critique.

Card :

cœur conversion.

---

## Hierarchy

```txt id="x4m7pk"
Image
↓
Business Name
↓
Rating
↓
Category
↓
Location
↓
Open Status
↓
CTA
```

---

## Must Include

### favorite icon

---

### verified badge

---

### subtle sponsored label

---

### WhatsApp quick action future

---

## Rule

Business card :

> conversion card.

---

# 49. Discovery UX Rules

Très critique.

Toujours montrer :

### nearby

---

### trending

---

### recommended

---

### top rated

---

### new places

---

## Goal

Créer :

> habitude d’exploration.

---

# 50. Personalization Future

V1.

Homepage future :

based on :

### location

---

### favorites

---

### browsing

---

### orders

---

### bookings

---

## Example

```txt id="d1k8pk"
Restaurants que vous pourriez aimer
```

---

# 51. Homepage Performance Rules

Très critique.

Toujours :

### lazy loading

---

### skeleton loading

---

### image optimization

---

### pagination

---

### caching

---

## Rule

Homepage :

```txt id="g2m9pk"
<2 sec load
```

---

# 52. Homepage UX Mantra

LaPlasse :

```txt id="r2m7pk"
discover fast
trust quickly
convert easily
come back often
```

---

# Conclusion Partie 3

L’architecture homepage & discovery LaPlasse est désormais structurée :

### homepage UX

### discovery engine

### search experience

### listing architecture

### business cards

### marketplace integration

### personalization future

### mobile-first discovery

La prochaine étape sera :

# Tome 13 — Partie 4

### Business Detail Pages UX/UI

### Restaurant UX

### Beauty UX

### Boutique UX

### Conversion Architecture

### Sticky CTA System

### Trust Framework
# LaPlasse — Architecture & Product Master Document

# Tome 13 — UX/UI System & Design Architecture

## Partie 4 — Business Detail Pages UX/UI, Restaurant UX, Beauty UX, Boutique UX, Sticky CTA System & Conversion Architecture

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 53. Business Detail Philosophy

Très critique.

La page business :

> **fait gagner ou perdre la conversion.**

Erreur classique :

```txt id="x8m2pk"
too much information
```

ou :

```txt id="m7v9tm"
not enough trust
```

Pour LaPlasse :

philosophie officielle :

> **trust first, convert fast**

Objectif :

Utilisateur doit rapidement répondre :

### est-ce fiable ?

---

### est-ce proche ?

---

### est-ce bon ?

---

### puis-je commander/réserver rapidement ?

---

# 53.1 Business Detail Goals

La page doit maximiser :

### confiance

---

### conversion

---

### engagement

---

### WhatsApp contact

---

### reviews

---

### marketplace conversion

---

### booking conversion

---

# 54. Universal Business Page Architecture

Très critique.

Ordre recommandé :

```txt id="k4m8pk"
Hero Gallery
↓
Business Info
↓
Trust Signals
↓
Primary CTA
↓
Content (menu/products/services)
↓
Reviews
↓
Location
↓
Recommendations
```

---

## Rule

Above fold :

doit permettre :

> **prendre une décision rapide.**

---

# 55. Hero Section Architecture

Ultra critique.

---

## Include

### cover image

---

### swipe gallery

---

### verified badge

---

### favorite button

---

### share button

---

### business status

(open / closed)

---

## Rule

Photos :

> selling tool.

Pas décoration.

---

## Mobile UX

Gallery :

### swipe friendly

---

### full-width

---

### immersive

---

# 56. Business Information Block

Très critique.

Toujours afficher :

### business name

---

### rating

---

### review count

---

### category

---

### address

---

### opening hours

---

### response time future

---

### WhatsApp availability

---

## Example Hierarchy

```txt id="r2m7pk"
Restaurant Name
★★★★☆ 4.8 (245)
Restaurant africain
Cocody, Abidjan
Ouvert maintenant
```

---

## Rule

Information critique :

> visible sans scroll.

---

# 57. Trust Framework

Ultra critique Afrique.

Confiance :

plus importante que design.

---

## Trust Signals

Toujours afficher :

### verified badge

---

### photos réelles

---

### reviews

---

### opening hours

---

### map

---

### WhatsApp

---

### merchant activity future

---

### response rate future

---

## Rule

Utilisateur doit penser :

> **ce lieu existe vraiment.**

---

# 58. Sticky CTA System

Très critique mobile.

---

## Restaurant CTA

Toujours :

```txt id="f8m3tm"
Book Table
```

*

```txt id="w5m9pk"
WhatsApp
```

---

## Beauty CTA

Toujours :

```txt id="t9m3pk"
Book Appointment
```

*

```txt id="f1m8tm"
WhatsApp
```

---

## Boutique CTA

Toujours :

```txt id="g5m1tm"
Add to Cart
```

ou

```txt id="n8k4pk"
Buy Now
```

---

## Rule

CTA :

toujours :

```txt id="v2k7tm"
bottom sticky mobile
```

---

## Desktop

Sticky sidebar.

---

# 59. Restaurant UX Architecture

Très critique.

Restaurant :

vertical #1.

---

## Page Structure

```txt id="p2k9tm"
Gallery
↓
Business Info
↓
Sticky CTA
↓
Menu
↓
Popular Dishes
↓
Reviews
↓
Map
↓
Similar Restaurants
```

---

# 59.1 Menu UX

Très critique.

Menu :

doit être :

### image-first

---

### fast scan

---

### clear pricing

---

### categorized

---

## Example Categories

```txt id="z4m8pk"
Entrées

Plats principaux

Desserts

Boissons
```

---

## Menu Card Must Show

### image

---

### title

---

### short description

---

### price

---

### add-to-cart future

---

## Rule

Utilisateur :

doit choisir rapidement.

---

# 59.2 Reservation UX

Très critique.

Booking :

maximum simplicité.

---

## Flow

```txt id="r7m4pk"
Select date
↓
Select time
↓
Guests
↓
Confirm
```

---

## Rule

Maximum :

```txt id="m8k1tm"
30 seconds
```

pour réserver.

---

# 60. Beauty UX Architecture

Très critique.

Beauté :

vertical différent.

---

## Page Structure

```txt id="x4m7pk"
Gallery
↓
Business Info
↓
Services
↓
Pricing
↓
Availability Lite
↓
Reviews
↓
CTA
```

---

# 60.1 Service UX

Très critique.

Chaque service :

doit afficher :

### title

---

### duration

---

### price

---

### availability future

---

### quick booking

---

## Example

```txt id="d1k8pk"
Tresse Africaine
2h
15 000 FCFA
```

---

## Rule

Très scanable.

---

# 61. Beauty Booking UX

Très critique.

Flow :

```txt id="g2m9pk"
Choose Service
↓
Choose Time
↓
Confirm
```

---

## Rule

Minimal friction.

---

# 62. Boutique UX Architecture

Très critique.

Marketplace V1.

---

## Structure

```txt id="r2m7pk"
Hero
↓
Business Info
↓
Products
↓
Categories
↓
Reviews
↓
Recommendations
```

---

# 62.1 Product Grid UX

Très critique.

Produits :

### image-first

---

### clean

---

### trust-oriented

---

## Product Card

Toujours :

### image

---

### title

---

### price

---

### merchant trust

---

### quick add to cart

---

## Rule

Produit compréhensible :

```txt id="q5k1tm"
<2 seconds
```

---

# 63. Reviews UX Framework

Ultra critique.

Reviews :

> confiance.

---

## Review Must Show

### avatar

---

### name

---

### rating

---

### comment

---

### photos optional

---

### verified badge

---

### date

---

## Rule

Top reviews :

above fold preview.

---

# 64. Reviews Sorting

Recommended :

### most relevant

---

### recent

---

### highest rated

---

### with photos

---

## Rule

Default :

```txt id="q2m8tm"
most relevant
```

---

# 65. Location UX

Très critique Afrique.

Toujours afficher :

### map preview

---

### Google Maps future

---

### directions future

---

### WhatsApp fallback

---

## Rule

Adresse seule :

pas suffisante.

---

# 66. Recommendation Section

Très recommandé.

Toujours montrer :

### similar places

---

### nearby places

---

### same category

---

### top-rated

---

## Goal

Créer :

> endless discovery.

---

# 67. Business Empty States

Très critique.

No menu ?

Afficher :

```txt id="f6m1pk"
Menu bientôt disponible.
Contactez le restaurant via WhatsApp.
```

---

No reviews ?

Afficher :

```txt id="y2m9pk"
Soyez le premier à laisser un avis.
```

---

No products ?

Afficher :

```txt id="x4m2pk"
Produits bientôt disponibles.
```

---

# 68. Performance Rules

Très critique.

Business page :

doit charger :

```txt id="b1m8pk"
<2 sec
```

---

Toujours :

### lazy gallery

---

### optimized images

---

### skeleton loading

---

### cached requests

---

# 69. Conversion Psychology Framework

Très critique.

Ordre mental :

```txt id="x6m4pk"
Looks good
↓
Feels trustworthy
↓
Easy to contact
↓
Easy to book/order
↓
Convert
```

---

## Rule

Page business :

> doit rassurer avant vendre.

---

# 70. Business Detail Mantra

LaPlasse :

```txt id="p2k9tm"
show trust
reduce friction
convert fast
```

---

# Conclusion Partie 4

L’architecture UX/UI des business pages LaPlasse est désormais structurée :

### restaurant UX

### beauty UX

### boutique UX

### sticky CTA

### trust framework

### booking UX

### reviews system

### recommendation engine

### conversion architecture

La prochaine étape sera :

# Tome 13 — Partie 5

### Marketplace UX/UI Architecture

### Product Detail UX

### Cart UX

### Checkout UX

### Mobile Money UX

### Ecommerce Conversion Framework
# LaPlasse — Architecture & Product Master Document

# Tome 13 — UX/UI System & Design Architecture

## Partie 5 — Marketplace UX/UI Architecture, Product Detail UX, Cart UX, Checkout UX & Ecommerce Conversion Framework

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 71. Marketplace Philosophy

Très critique.

Marketplace LaPlasse :

> **complément naturel du discovery local.**

Erreur classique :

```txt id="x8m2pk"
marketplace separate experience
```

Pour LaPlasse :

> **marketplace intégrée aux lieux.**

Exemple :

Restaurant :

### commander un plat

---

Salon :

### réserver un service

---

Boutique :

### acheter un produit

---

## Rule

Toujours :

```txt id="m7v9tm"
place first
↓
trust
↓
commerce
```

---

# 71.1 Marketplace Goals

La marketplace doit maximiser :

### conversion

---

### confiance

---

### simplicité

---

### repeat purchase

---

### panier rapide

---

### friction minimale

---

## KPI principal

```txt id="k4m8pk"
Product View
↓
Add To Cart
↓
Checkout
↓
Paid Order
```

---

# 72. Marketplace UX Architecture

Très critique.

Structure recommandée :

```txt id="r2m7pk"
Discovery
↓
Business Detail
↓
Products
↓
Product Detail
↓
Cart
↓
Checkout
↓
Order Tracking
```

---

## Rule

Jamais :

> UX ecommerce lourde.

---

# 73. Marketplace Homepage Integration

Très critique.

Marketplace :

visible.

Mais :

ne doit pas tuer logique découverte.

---

## Recommended Position

Après :

### trending businesses

---

### nearby places

---

### featured collections

---

## Homepage Marketplace Modules

### trending products

---

### best sellers

---

### local favorites

---

### new arrivals future

---

### featured stores

---

## Rule

Marketplace :

> discovery-driven.

Pas :

> Amazon clone.

---

# 74. Product Listing UX

Très critique.

---

## Product Grid

Toujours :

### image-first

---

### scanable

---

### clean

---

### mobile optimized

---

## Product Card Hierarchy

```txt id="f8m3tm"
Image
↓
Product Name
↓
Price
↓
Merchant Name
↓
Rating
↓
Add To Cart
```

---

## Must Include

### favorite icon future

---

### availability

---

### promo badge subtle

---

### verified merchant

---

## Rule

Produit compréhensible :

```txt id="w5m9pk"
<2 seconds
```

---

# 75. Product Detail Philosophy

Ultra critique.

Objectif :

> supprimer hésitation.

Utilisateur doit comprendre :

### ce que c’est

---

### combien ça coûte

---

### si c’est fiable

---

### comment acheter vite

---

# 75.1 Product Detail Architecture

Très critique.

Ordre recommandé :

```txt id="t9m3pk"
Gallery
↓
Product Info
↓
Trust Signals
↓
Price
↓
CTA
↓
Description
↓
Merchant
↓
Reviews
↓
Related Products
```

---

# 75.2 Product Hero Section

Toujours afficher :

### large images

---

### swipe gallery

---

### zoom future

---

### promo badge

---

### stock status

---

## Rule

Images :

> vendent le produit.

---

# 75.3 Product Info Block

Toujours afficher :

### title

---

### price

---

### compare price future

---

### availability

---

### merchant

---

### location

---

### delivery availability future

---

### WhatsApp quick order

---

## Example

```txt id="f1m8tm"
Pâte de pistache artisanale

9 500 FCFA

Disponible

Par Pistachio House
Cocody, Abidjan
```

---

# 76. Trust Framework Ecommerce

Ultra critique Afrique.

Toujours montrer :

### merchant verified

---

### merchant rating

---

### reviews

---

### real photos

---

### WhatsApp

---

### store existence

---

## Rule

Utilisateur doit penser :

> **je peux faire confiance.**

---

# 77. Add to Cart UX

Très critique.

CTA :

doit être :

### visible

---

### sticky mobile

---

### large tap target

---

### frictionless

---

## Mobile Sticky CTA

Toujours :

```txt id="g5m1tm"
Price
+
Add To Cart
```

fixé bas écran.

---

## Feedback UX

Après ajout :

Toujours montrer :

```txt id="n8k4pk"
Produit ajouté au panier
```

*

shortcut panier.

---

# 78. Cart UX Philosophy

Très critique.

Objectif :

> réduire abandon panier.

---

## Cart Structure

```txt id="v2k7tm"
Items
↓
Quantity
↓
Summary
↓
Payment CTA
```

---

## Must Show

### product image

---

### title

---

### quantity control

---

### merchant

---

### subtotal

---

### remove item

---

## Rule

Modifier panier :

> ultra simple.

---

# 78.1 Single Merchant Cart (V0.5)

Très recommandé.

Pourquoi ?

### simple UX

---

### moins bugs

---

### checkout plus facile

---

### moins confusion

---

## Rule

Un merchant :

```txt id="p2k9tm"
1 cart
```

---

V1 :

multi merchant.

---

# 79. Checkout Philosophy

Ultra critique.

Objectif :

> paiement rapide.

---

## Rule

Checkout :

maximum :

```txt id="z4m8pk"
60 seconds
```

---

## Avoid

Jamais :

### giant forms

---

### too many steps

---

### forced complexity

---

# 79.1 Checkout Architecture

Très critique.

Flow recommandé :

```txt id="r7m4pk"
Summary
↓
Delivery/Pickup
↓
Payment Method
↓
Confirmation
```

---

## V0.5

Très simple.

---

## Include

### order summary

---

### merchant

---

### delivery type

---

### phone confirmation

---

### payment method

---

### total

---

### CTA payer

---

# 80. Mobile Money UX

Ultra critique.

Afrique :

paiement local.

---

## Recommended Methods

Pour :

Côte d'Ivoire

### Wave

---

### Orange Money

---

### MTN MoMo

---

### Card

---

## UX Rule

Toujours :

### logos visibles

---

### trusted feel

---

### clear instructions

---

### retry option

---

## Payment Error UX

Toujours afficher :

```txt id="m8k1tm"
Paiement échoué.

Réessayez ou utilisez un autre moyen.
```

---

# 81. Checkout Trust Signals

Très critique.

Toujours montrer :

### secure payment

---

### verified merchant

---

### order summary

---

### support contact

---

### WhatsApp fallback

---

## Rule

Checkout :

doit rassurer.

---

# 82. Order Confirmation UX

Très critique.

Après paiement :

Toujours montrer :

### success state

---

### order number

---

### merchant info

---

### WhatsApp shortcut

---

### order status

---

### estimated timeline future

---

## Example

```txt id="x4m7pk"
Commande confirmée.

Le marchand prépare votre commande.
```

---

# 83. Order Tracking UX

V0.5 :

simple.

---

## States

```txt id="d1k8pk"
Pending
Confirmed
Preparing
Ready
Completed
```

---

## Rule

Toujours montrer :

### clear status

---

### WhatsApp merchant

---

### order details

---

# 84. Ecommerce Empty States

Très critique.

No products :

```txt id="g2m9pk"
Produits bientôt disponibles.
```

---

Empty cart :

```txt id="r2m7pk"
Votre panier est vide.

Découvrez des produits locaux.
```

---

# 85. Conversion Psychology Framework

Très critique.

Flow mental :

```txt id="q5k1tm"
Looks trustworthy
↓
Looks valuable
↓
Feels easy
↓
Feels safe
↓
Buy
```

---

## Rule

Commerce :

> confiance > prix.

---

# 86. Marketplace Performance Rules

Très critique.

Toujours :

### lazy loading

---

### optimized images

---

### cached cart

---

### fast checkout

---

### skeleton loading

---

## Goal

Marketplace :

```txt id="q2m8tm"
<2 sec load
```

---

# 87. Ecommerce UX Anti-patterns

Jamais :

### hidden cart

---

### confusing checkout

---

### forced registration too early

---

### giant forms

---

### unclear pricing

---

### hidden fees

---

### payment surprises

---

# 88. Marketplace UX Mantra

LaPlasse :

```txt id="f6m1pk"
trust first
buy fast
keep simple
```

---

# Conclusion Partie 5

L’architecture UX/UI marketplace LaPlasse est désormais structurée :

### marketplace UX

### product detail

### cart UX

### checkout UX

### mobile money UX

### ecommerce trust framework

### conversion psychology

### order tracking

La prochaine étape sera :

# Tome 13 — Partie 6

### Merchant Dashboard UX/UI

### Merchant Onboarding UX

### Admin UX

### Role-based Experience

### Dashboard Architecture

### Merchant Conversion UX
# LaPlasse — Architecture & Product Master Document

# Tome 13 — UX/UI System & Design Architecture

## Partie 6 — Merchant Dashboard UX/UI, Merchant Onboarding UX, Admin UX, Role-based Experience & Dashboard Architecture

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 89. Merchant Experience Philosophy

Très critique.

Le merchant est :

> **le moteur économique de LaPlasse.**

Erreur marketplace classique :

```txt id="x8m2pk"
great consumer UX
bad merchant UX
```

Résultat :

### merchants churn

---

### inventory faible

---

### mauvaise qualité plateforme

---

### faible rétention

---

Pour LaPlasse :

philosophie officielle :

> **merchant success = platform success**

---

# 89.1 Merchant UX Goals

Le dashboard merchant doit maximiser :

### autonomie

---

### simplicité

---

### rapidité

---

### visibilité business

---

### ventes

---

### réservation

---

### confiance plateforme

---

## Goal

Merchant doit penser :

> **“je peux gérer mon business facilement.”**

---

# 90. Merchant UX Principles

Très critique.

---

# Principle 1 — Simplicity First

Merchant :

pas toujours tech-savvy.

Toujours :

### simple navigation

---

### gros boutons

---

### peu friction

---

### langage clair

---

## Rule

Dashboard :

> compréhensible sans formation.

---

# Principle 2 — Action-first UX

Merchant doit rapidement voir :

### commandes

---

### réservations

---

### business status

---

### nouveaux avis

---

### performance

---

## Rule

Toujours afficher :

> ce qui demande action.

---

# Principle 3 — Mobile-first Merchant

Très critique Afrique.

Merchant :

souvent sur téléphone.

---

## Rule

Dashboard :

doit fonctionner :

```txt id="m7v9tm"
100% mobile
```

---

# Principle 4 — Revenue Visibility

Toujours montrer :

### commandes

---

### ventes

---

### réservations

---

### activité business

---

Merchant doit sentir :

> valeur plateforme.

---

# 91. Merchant Dashboard Architecture

Très critique.

Navigation recommandée :

```txt id="k4m8pk"
Overview
↓
Orders
↓
Bookings
↓
Products/Services
↓
Reviews
↓
Business Profile
↓
Analytics
↓
Settings
```

---

## Mobile Navigation

Recommended :

### bottom nav

ou

### collapsible menu

---

## Desktop

Sidebar.

---

# 92. Merchant Homepage Dashboard

Ultra critique.

Premier écran :

doit rassurer.

---

## Show Above Fold

### business status

---

### open/closed

---

### today's orders

---

### today's bookings

---

### pending actions

---

### recent reviews

---

### quick actions

---

## Example Layout

```txt id="r2m7pk"
Business Card
↓
Today's Revenue
↓
Orders
↓
Bookings
↓
Reviews
↓
Quick Actions
```

---

## Rule

Merchant doit voir :

> ce qui est important immédiatement.

---

# 93. Merchant Quick Actions

Très critique.

Toujours afficher :

### Add Product

---

### Add Service

---

### Edit Business

---

### View Orders

---

### View Bookings

---

### WhatsApp Customers future

---

## Rule

Maximum :

```txt id="f8m3tm"
1 tap
```

---

# 94. Merchant Onboarding Philosophy

Ultra critique.

Onboarding merchant :

plus critique que signup utilisateur.

---

## Goal

Merchant publié :

```txt id="w5m9pk"
<5 minutes
```

---

## Rule

Jamais :

### giant form

---

### too many fields

---

### complex UX

---

### unclear process

---

# 94.1 Merchant Onboarding Flow

Recommandation forte.

Architecture :

```txt id="t9m3pk"
Business Type
↓
Business Info
↓
Photos
↓
Hours
↓
Products/Services
↓
Preview
↓
Publish
```

---

# Step 1 — Business Type

Choix :

### Restaurant

---

### Beauté

---

### Boutique

---

## Rule

Type business :

change UX ensuite.

---

# Step 2 — Business Information

Toujours demander :

### name

---

### category

---

### phone

---

### WhatsApp

---

### location pin

---

### address

---

### short description

---

## Rule

Minimum friction.

---

# Step 3 — Upload Media

Très critique.

Merchant upload :

### logo

---

### cover

---

### gallery

---

## UX Rule

Toujours :

### preview image

---

### drag & drop desktop

---

### mobile upload friendly

---

### compression auto

---

# Step 4 — Business Hours

Très simple.

UX :

```txt id="f1m8tm"
Monday → Sunday
```

toggle.

---

Quick presets :

### same everyday

---

### weekdays/weekend

---

## Rule

Fast setup.

---

# Step 5 — Products/Services

Restaurant :

### menu

---

Beauty :

### services

---

Boutique :

### products

---

## Rule

Permettre :

> publish même incomplet.

---

# Step 6 — Preview

Très recommandé.

Merchant voit :

> comment business apparaîtra.

---

# Step 7 — Publish

Success state :

```txt id="g5m1tm"
Votre établissement est en cours de validation.
```

---

# 95. Merchant Products UX

Très critique.

Gestion produits :

simple.

---

## Product Table

Toujours montrer :

### image

---

### title

---

### stock

---

### price

---

### status

---

### edit

---

### delete

---

## Rule

Fast management.

---

# 96. Orders UX

Ultra critique.

Merchant doit voir :

### new orders

---

### pending

---

### preparing

---

### completed

---

## Order Card

Toujours :

### customer

---

### items

---

### amount

---

### payment status

---

### action buttons

---

## Actions

### confirm

---

### preparing

---

### ready

---

### complete

---

# 97. Booking UX

Très critique.

Merchant doit voir :

### upcoming bookings

---

### pending

---

### cancelled

---

### completed

---

## Booking Card

Toujours :

### client

---

### service

---

### time

---

### quick actions

---

## Actions

### confirm

---

### cancel

---

### reschedule future

---

# 98. Reviews UX

Très critique.

Merchant doit voir :

### recent reviews

---

### rating average

---

### customer feedback

---

### response future

---

## Goal

Créer :

> amélioration business.

---

# 99. Merchant Analytics UX

V0.5 :

simple.

---

## Show

### views

---

### orders

---

### bookings

---

### favorites

---

### reviews

---

### conversion future

---

## Rule

Simple charts only.

---

# 100. Merchant Empty States

Très critique.

No products :

```txt id="n8k4pk"
Ajoutez vos premiers produits.
```

---

No bookings :

```txt id="v2k7tm"
Aucune réservation pour le moment.
```

---

No reviews :

```txt id="p2k9tm"
Les avis apparaîtront ici.
```

---

# 101. Admin UX Philosophy

Très critique.

Admin :

outil d’opération.

Pas :

outil marketing.

---

## Goals

### moderation fast

---

### merchant control

---

### payment visibility

---

### fraud prevention

---

### support management

---

# 102. Admin Dashboard Architecture

Recommended :

```txt id="z4m8pk"
Overview
↓
Businesses
↓
Merchants
↓
Orders
↓
Bookings
↓
Reviews
↓
Moderation
↓
Analytics
↓
Settings
```

---

# 103. Admin Overview Screen

Toujours montrer :

### active merchants

---

### pending approvals

---

### total orders

---

### booking activity

---

### payment activity

---

### platform alerts

---

## Goal

Voir santé plateforme rapidement.

---

# 104. Merchant Approval UX

Très critique.

Admin doit voir :

### business details

---

### uploaded photos

---

### category

---

### WhatsApp

---

### location

---

### quality score future

---

## Actions

### approve

---

### reject

---

### request edits

---

# 105. Moderation UX

Très critique.

Review moderation :

simple.

---

## Show

### reported reviews

---

### suspicious reviews

---

### merchant disputes future

---

## Actions

### approve

---

### remove

---

### flag

---

# 106. Role-based UX

Très critique.

Chaque rôle :

voit uniquement :

ce qui le concerne.

---

## Consumer

### discovery

---

### booking

---

### marketplace

---

## Merchant

### business management

---

### orders

---

### bookings

---

### analytics

---

## Admin

### operations

---

### moderation

---

### payments

---

### system visibility

---

# 107. Merchant Retention UX

Très critique.

Merchant doit sentir :

> progression.

---

Toujours montrer :

### performance

---

### activity

---

### customer actions

---

### visibility gained

---

## Example

```txt id="r7m4pk"
+42 vues cette semaine
```

---

```txt id="m8k1tm"
3 nouvelles réservations
```

---

# 108. Dashboard Performance Rules

Très critique.

Toujours :

### lazy loading

---

### pagination

---

### lightweight charts

---

### cached analytics

---

### skeleton loading

---

## Rule

Dashboard :

```txt id="x4m7pk"
<2 sec
```

---

# 109. Merchant UX Mantra

LaPlasse :

```txt id="d1k8pk"
simple
fast
clear
revenue-focused
mobile-first
```

---

# Conclusion Partie 6

L’architecture UX/UI merchant & admin LaPlasse est désormais structurée :

### merchant onboarding

### merchant dashboard

### orders UX

### bookings UX

### analytics UX

### admin UX

### moderation UX

### role-based experience

La prochaine étape sera :

# Tome 13 — Partie 7

### Design Component Library

### Full UI Components System

### Mobile Components

### Reusable Patterns

### Interaction Design System

### Motion & Micro-interactions
# LaPlasse — Architecture & Product Master Document

# Tome 13 — UX/UI System & Design Architecture

## Partie 7 — Design Component Library, Reusable UI Patterns, Mobile Components, Motion System & Interaction Design

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 110. Component System Philosophy

Très critique.

Le plus grand problème UI marketplace :

> **des composants incohérents.**

Résultat :

### UX cassée

---

### design inconsistant

---

### dette frontend

---

### développement lent

---

### bugs UI

---

Pour LaPlasse :

philosophie officielle :

> **build once, reuse everywhere**

Principe :

```txt id="x8m2pk"
consistency
↓
speed
↓
trust
↓
scale
```

---

# 110.1 Component Goals

Le design component system doit permettre :

### cohérence

---

### rapidité développement

---

### réutilisation

---

### mobile-first

---

### UX premium

---

### scaling rapide

---

# 111. Official Component Architecture

Très critique.

Structure recommandée :

```txt id="m7v9tm"
ui/
│
├── primitives/
│
├── business/
│
├── marketplace/
│
├── merchant/
│
├── admin/
│
├── navigation/
│
├── feedback/
│
└── layouts/
```

---

# 112. Primitive Components

Très critique.

Base UI.

Toujours réutilisable.

---

## Include

```txt id="k4m8pk"
Button

Input

Textarea

Select

Modal

BottomSheet

Card

Badge

Avatar

Tooltip

Tabs

Accordion

Toast

Skeleton
```

---

## Rule

Aucune feature :

ne doit recréer :

> son propre button.

---

# 113. Business Components

Très critique.

Cœur discovery.

---

## Recommended Components

```txt id="r2m7pk"
BusinessCard

BusinessGallery

BusinessHeader

BusinessInfo

BusinessStatus

BusinessHours

BusinessCTA

BusinessReviews

BusinessMap

BusinessRecommendations
```

---

## Goal

Composable architecture.

---

## Example

Business page :

```txt id="f8m3tm"
BusinessGallery
↓
BusinessHeader
↓
BusinessInfo
↓
BusinessCTA
↓
BusinessReviews
```

---

# 114. Marketplace Components

Très critique.

---

## Components

```txt id="w5m9pk"
ProductCard

ProductGallery

ProductInfo

ProductPrice

ProductReview

CartDrawer

CartSummary

CheckoutCard

PaymentSelector

OrderTimeline
```

---

## Rule

Ecommerce :

> réutilisable partout.

---

# 115. Merchant Components

Très critique.

---

## Components

```txt id="t9m3pk"
MerchantOverviewCard

OrderCard

BookingCard

ReviewCard

MerchantStatsCard

MerchantSidebar

MerchantQuickActions

MerchantAnalyticsCard
```

---

# 116. Admin Components

Très critique.

---

## Components

```txt id="f1m8tm"
ModerationTable

MerchantApprovalCard

AdminStatsCard

AlertCard

FraudFlag

ReviewModerationCard
```

---

# 117. Navigation Components

Très critique.

---

## Include

```txt id="g5m1tm"
BottomNavigation

TopNavbar

StickySearchBar

Sidebar

Breadcrumb

TabNavigation
```

---

## Mobile Rule

Bottom nav :

toujours :

### thumb reachable

---

### max 5 tabs

---

# 118. Feedback Components

Très critique.

---

## Include

```txt id="n8k4pk"
EmptyState

ErrorState

SuccessState

LoadingState

Toast

ConfirmationModal
```

---

## Rule

Toujours :

> human UX.

---

# 119. Layout Components

Très critique.

---

## Include

```txt id="v2k7tm"
PageContainer

Section

StickyFooter

ContentGrid

SplitLayout

DashboardLayout
```

---

## Rule

Layout cohérent partout.

---

# 120. Button System

Très critique.

---

## Primary Button

Usage :

CTA principal.

Ex :

### réserver

---

### acheter

---

### checkout

---

### publier

---

## Secondary Button

Actions secondaires.

---

## Ghost Button

Actions légères.

---

## Danger Button

Delete.

---

## Floating CTA

Mobile conversion.

---

## Rule

Toujours :

### minimum 44px touch target

---

# 121. Modal System

Très critique.

---

## Modal Usage

Desktop.

---

## Mobile Rule

Préférer :

```txt id="p2k9tm"
BottomSheet
```

Pourquoi ?

UX mobile meilleure.

---

## Use Cases

### filters

---

### booking

---

### checkout steps

---

### quick edit

---

# 122. Form Components System

Très critique.

Forms :

doivent réduire friction.

---

## Inputs Must Have

### label

---

### validation

---

### helper text

---

### clear error

---

### mobile keyboard support

---

## Example

Phone :

ouvrir :

```txt id="z4m8pk"
numeric keypad
```

---

Email :

ouvrir :

email keyboard.

---

# 123. Card System

Ultra critique.

LaPlasse :

card-driven UI.

---

## Card Types

### BusinessCard

---

### ProductCard

---

### ReviewCard

---

### MerchantCard

---

### OrderCard

---

### BookingCard

---

## Rule

Toutes cartes :

même logique visuelle.

---

# 124. Mobile Components

Très critique.

---

## Mobile-first Components

### Sticky CTA

---

### Swipe Gallery

---

### Bottom Sheet

---

### Horizontal Carousel

---

### Floating Search

---

### Quick Actions FAB future

---

## Rule

Toujours :

> one-thumb usable.

---

# 125. Empty State Component System

Très critique.

Toujours inclure :

### icon/illustration

---

### helpful text

---

### CTA

---

## Example

```txt id="r7m4pk"
NoFavoritesState
```

---

```txt id="m8k1tm"
NoOrdersState
```

---

```txt id="x4m7pk"
NoReviewsState
```

---

# 126. Loading Component System

Très critique.

Toujours :

### skeleton loading

---

Pas :

```txt id="d1k8pk"
spinner only
```

---

## Components

```txt id="g2m9pk"
BusinessCardSkeleton

ProductSkeleton

DashboardSkeleton

CheckoutSkeleton
```

---

## Rule

No layout shift.

---

# 127. Interaction Design Philosophy

Très critique.

Interaction :

doit sembler :

> vivante mais subtile.

---

## Rule

Jamais :

```txt id="r2m7pk"
over-animated UI
```

---

Toujours :

### subtle

---

### fast

---

### meaningful

---

# 128. Motion System

Très critique.

---

## Timing Recommendation

Micro interactions :

```txt id="q5k1tm"
150–250ms
```

---

Modal :

```txt id="q2m8tm"
250–350ms
```

---

Page transition :

```txt id="f6m1pk"
200–300ms
```

---

## Rule

Animation :

ne doit jamais ralentir.

---

# 129. Micro-interactions

Très critique.

Toujours ajouter :

### button feedback

---

### add-to-cart confirmation

---

### success animation subtle

---

### booking confirmation

---

### loading shimmer

---

## Example

Add to cart :

```txt id="y2m9pk"
mini confirmation
```

---

Booking success :

```txt id="x4m2pk"
success check
```

---

# 130. Haptic Strategy Future

Mobile app future.

---

## Use Cases

### payment success

---

### booking confirmation

---

### favorite added

---

### order update

---

# 131. Responsive Component Rules

Très critique.

Chaque composant :

doit gérer :

### mobile

---

### tablet

---

### desktop

---

## Rule

Pas :

```txt id="b1m8pk"
desktop-only component
```

---

# 132. Accessibility Component Rules

Toujours :

### focus states

---

### keyboard support

---

### semantic HTML

---

### contrast readable

---

### aria labels basics

---

# 133. Design QA Checklist

Avant validation composant :

Checklist :

```txt id="x6m4pk"
responsive
mobile-first
loading state
error state
empty state
accessible basics
consistent spacing
same radius
same shadow
```

---

# 134. Component Naming Convention

Très critique.

Toujours :

```txt id="p2k9tm"
PascalCase
```

---

## Example

Bon :

```txt id="z4m8pk"
BusinessCard.tsx
```

---

Mauvais :

```txt id="r7m4pk"
business_card.tsx
```

---

# 135. UI System Mantra

LaPlasse :

```txt id="m8k1tm"
build once
reuse forever
stay consistent
```

---

# Conclusion Partie 7

Le Design Component System LaPlasse est désormais structuré :

### reusable components

### mobile components

### motion system

### interaction design

### cards system

### loading system

### feedback components

### accessibility basics

La prochaine étape sera :

# Tome 13 — Partie 8

### Full Design Pages Blueprint

### All Screens Architecture

### Screen-by-screen UX/UI Mapping

### Wireframe Logic

### Navigation Flows

### Complete Page Inventory
# LaPlasse — Architecture & Product Master Document

# Tome 13 — UX/UI System & Design Architecture

## Partie 8 — Full Design Pages Blueprint, Screen-by-screen UX/UI Mapping, Wireframe Logic & Navigation Flows

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 136. Screen Architecture Philosophy

Très critique.

Erreur marketplace classique :

> écrans improvisés.

Résultat :

### UX incohérente

---

### navigation confuse

---

### conversion faible

---

### dette design

---

Pour LaPlasse :

chaque écran :

> **a un objectif business clair.**

Principe :

```txt id="x8m2pk"
screen
↓
goal
↓
action
↓
conversion
```

---

# 136.1 Screen Objectives Framework

Chaque écran doit répondre :

### pourquoi cet écran existe ?

---

### quelle action principale ?

---

### quel KPI ?

---

### quel next step ?

---

## Rule

Jamais :

```txt id="m7v9tm"
pretty screen only
```

---

# 137. Full Screen Inventory

Très critique.

Architecture V0.5 :

---

# Public App

```txt id="k4m8pk"
Homepage

Search

Search Results

Business Details

Restaurant Details

Beauty Details

Boutique Details

Product Details

Categories

Favorites

Profile

Orders

Bookings

Notifications

Checkout

Cart

Auth
```

---

# Merchant App

```txt id="r2m7pk"
Merchant Dashboard

Orders

Bookings

Products

Services

Reviews

Analytics

Business Settings

Profile
```

---

# Admin App

```txt id="f8m3tm"
Admin Dashboard

Merchant Moderation

Reviews Moderation

Orders

Bookings

Payments

Users

Categories

Settings
```

---

# 138. Homepage Blueprint

Très critique.

---

## Goal

Découverte.

---

## Primary Action

Search.

---

## KPI

```txt id="w5m9pk"
Business View Rate
```

---

## Structure

```txt id="t9m3pk"
Header
↓
Search Hero
↓
Quick Categories
↓
Trending Businesses
↓
Nearby
↓
Featured Collections
↓
Marketplace Highlights
↓
Footer
```

---

## Wireframe Logic

```txt id="f1m8tm"
Search first
↓
Discovery
↓
Trust
↓
Commerce
```

---

# 139. Search Screen Blueprint

Ultra critique.

---

## Goal

Trouver rapidement.

---

## Primary Action

Open business.

---

## Structure

```txt id="g5m1tm"
Search Input
↓
Suggestions
↓
Recent Searches
↓
Trending Searches
↓
Categories
```

---

## Future

### voice search

---

### smart recommendations

---

# 140. Search Results Blueprint

Très critique.

---

## Goal

Choisir rapidement.

---

## Structure

```txt id="n8k4pk"
Sticky Search
↓
Filters
↓
Result Count
↓
Business Grid
↓
Pagination
```

---

## Mobile

Filters :

Bottom Sheet.

---

## KPI

```txt id="v2k7tm"
Search → Business Click
```

---

# 141. Restaurant Detail Blueprint

Très critique.

---

## Goal

Réserver / commander.

---

## Structure

```txt id="p2k9tm"
Gallery
↓
Business Info
↓
Rating
↓
Sticky CTA
↓
Menu
↓
Popular Dishes
↓
Reviews
↓
Map
↓
Similar Places
```

---

## Primary CTA

```txt id="z4m8pk"
Book Table
```

*

WhatsApp.

---

## KPI

```txt id="r7m4pk"
Business View
↓
Booking
```

---

# 142. Beauty Detail Blueprint

Très critique.

---

## Goal

Réserver.

---

## Structure

```txt id="m8k1tm"
Gallery
↓
Info
↓
Services
↓
Pricing
↓
Availability
↓
Reviews
↓
CTA
```

---

## Primary CTA

```txt id="x4m7pk"
Book Appointment
```

---

# 143. Boutique Detail Blueprint

Très critique.

---

## Goal

Acheter.

---

## Structure

```txt id="d1k8pk"
Hero
↓
Products
↓
Categories
↓
Reviews
↓
Merchant Info
↓
Recommendations
```

---

## KPI

```txt id="g2m9pk"
Product Click Rate
```

---

# 144. Product Detail Blueprint

Ultra critique.

---

## Goal

Add To Cart.

---

## Structure

```txt id="r2m7pk"
Gallery
↓
Product Info
↓
Price
↓
Merchant
↓
Sticky CTA
↓
Description
↓
Reviews
↓
Related Products
```

---

## CTA

```txt id="q5k1tm"
Add To Cart
```

---

## KPI

```txt id="q2m8tm"
View → Add To Cart
```

---

# 145. Cart Blueprint

Très critique.

---

## Goal

Checkout.

---

## Structure

```txt id="f6m1pk"
Cart Items
↓
Quantity Controls
↓
Merchant Info
↓
Summary
↓
Checkout CTA
```

---

## KPI

```txt id="y2m9pk"
Cart → Checkout
```

---

# 146. Checkout Blueprint

Ultra critique.

---

## Goal

Paiement.

---

## Structure

```txt id="x4m2pk"
Order Summary
↓
Delivery/Pickup
↓
Payment Method
↓
Phone Confirmation
↓
Pay CTA
```

---

## KPI

```txt id="b1m8pk"
Checkout Completion Rate
```

---

# 147. Profile Blueprint

Très critique.

---

## Goal

Retention.

---

## Structure

```txt id="x6m4pk"
Profile Header
↓
Favorites
↓
Orders
↓
Bookings
↓
Settings
```

---

# 148. Favorites Blueprint

Très critique.

---

## Goal

Retention.

---

## Structure

```txt id="p2k9tm"
Saved Businesses
↓
Saved Products future
```

---

## Empty State

Toujours :

exploration CTA.

---

# 149. Merchant Dashboard Blueprint

Ultra critique.

---

## Goal

Action rapide.

---

## Structure

```txt id="z4m8pk"
Overview Cards
↓
Today's Orders
↓
Bookings
↓
Reviews
↓
Quick Actions
```

---

## KPI

```txt id="r7m4pk"
Merchant Retention
```

---

# 150. Merchant Orders Screen

Très critique.

---

## Goal

Fulfillment.

---

## Structure

```txt id="m8k1tm"
Status Tabs
↓
Orders List
↓
Order Details
↓
Quick Actions
```

---

## Actions

### confirm

---

### preparing

---

### completed

---

# 151. Merchant Booking Screen

Très critique.

---

## Goal

Gestion rapide.

---

## Structure

```txt id="x4m7pk"
Upcoming
↓
Pending
↓
Completed
↓
Cancelled
```

---

# 152. Merchant Product Management

Très critique.

---

## Goal

Inventory simple.

---

## Structure

```txt id="d1k8pk"
Search
↓
Products Table
↓
Quick Edit
↓
Add Product CTA
```

---

# 153. Merchant Analytics Blueprint

V0.5 :

simple.

---

## Structure

```txt id="g2m9pk"
Views
↓
Orders
↓
Bookings
↓
Reviews
↓
Performance
```

---

# 154. Admin Dashboard Blueprint

Très critique.

---

## Goal

Plateforme health.

---

## Structure

```txt id="r2m7pk"
Overview Metrics
↓
Pending Approvals
↓
Recent Activity
↓
Alerts
↓
Moderation Queue
```

---

# 155. Merchant Moderation Blueprint

Très critique.

---

## Goal

Approve quickly.

---

## Structure

```txt id="q5k1tm"
Merchant Card
↓
Business Details
↓
Media
↓
Actions
```

---

## Actions

### approve

---

### reject

---

### request changes

---

# 156. Review Moderation Blueprint

Très critique.

---

## Structure

```txt id="q2m8tm"
Reported Reviews
↓
Suspicious Reviews
↓
Moderation Actions
```

---

# 157. Navigation Flow Architecture

Très critique.

Flow principal :

```txt id="f6m1pk"
Homepage
↓
Search
↓
Business
↓
Booking/Product
↓
Checkout
↓
Order Confirmation
```

---

## Rule

Jamais :

```txt id="y2m9pk"
dead end screen
```

---

# 158. Screen Naming Convention

Très critique.

Toujours :

```txt id="x4m2pk"
feature-screen.tsx
```

---

## Example

```txt id="b1m8pk"
homepage-screen.tsx

business-detail-screen.tsx

merchant-dashboard-screen.tsx
```

---

# 159. Page Performance Rules

Chaque écran :

```txt id="x6m4pk"
<2 seconds
```

---

Toujours :

### skeleton loading

---

### lazy load

---

### optimized images

---

### cache smart

---

# 160. UX Blueprint Mantra

LaPlasse :

```txt id="p2k9tm"
every screen
must guide action
```

---

# Conclusion Partie 8

Le blueprint complet des écrans LaPlasse est désormais structuré :

### all screens inventory

### wireframe logic

### UX mapping

### merchant flows

### admin flows

### checkout flow

### discovery flow

### navigation architecture

La prochaine étape sera :

# Tome 14 — Growth Engine & Marketplace Liquidity System

### Merchant Acquisition Strategy

### User Growth Loops

### Marketplace Liquidity

### Referral System

### Viral Loops

### Local Expansion Framework
