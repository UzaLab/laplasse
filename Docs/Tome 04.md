# LaPlasse — Architecture & Product Master Document

# Tome 4 — Business Type Systems & Vertical Architectures

## Partie 1 — Restaurant System, Boutique & Retail System, Beauty & Salon System

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 1. Introduction

Tous les business ne fonctionnent pas de la même manière.

Un restaurant n’a pas les mêmes besoins qu’un salon.

Un hôtel ne fonctionne pas comme une pharmacie.

Une boutique ecommerce n’opère pas comme un espace évènementiel.

Le principal risque produit serait :

> construire une plateforme rigide avec une logique uniforme.

LaPlasse adopte donc une architecture :

> **Verticalized Adaptive Business System**

Chaque catégorie business devient :

> **un mini-produit spécialisé**

reposant sur :

### un core commun

*

### des modules métier dédiés.

---

# 2. Vertical Architecture Philosophy

Architecture retenue :

```txt id="t2m9wr"
Core Business System
+
Business Type
+
Feature Modules
+
Analytics Layer
+
Vertical-specific UX
```

Cela permet :

### scalabilité

---

### modularité

---

### personnalisation

---

### maintenance simplifiée

---

### ajout rapide de nouveaux business types

---

# 3. Restaurant System

Le restaurant est :

> **la verticale wedge market #1 de LaPlasse.**

Pourquoi ?

* usage fréquent ;
* forte viralité ;
* marketplace naturelle ;
* réservation ;
* livraison ;
* fidélisation élevée.

---

# 3.1 Restaurant Categories

Sous-types supportés :

### restaurant classique

---

### maquis

---

### fast-food

---

### café

---

### pâtisserie

---

### glacier

---

### lounge

---

### rooftop

---

### fine dining

---

### street food future

---

## 3.2 Restaurant Profile Structure

Informations affichées.

### hero section

* cover premium
* note
* badges
* open now
* CTA rapide

---

### cuisine type

Ex :

```txt id="p7m1cz"
ivoirienne
libanaise
française
africaine
asiatique
```

---

### menu preview

---

### popular dishes

---

### reservation CTA

---

### delivery CTA

---

### opening hours

---

### photos

---

### ambiance tags

Ex :

```txt id="x5v0rk"
familial
romantique
business
terrasse
```

---

### reviews

---

## 3.3 Restaurant Menu Engine

Le menu devient :

> un catalogue ecommerce spécialisé.

Support :

### categories

Ex :

```txt id="m83qxw"
entrées
plats
desserts
boissons
```

---

### variants

Ex :

```txt id="h6d4tx"
petit
moyen
grand
```

---

### add-ons

Ex :

```txt id="p2z9lw"
fromage
sauce extra
supplément viande
```

---

### spicy level future

---

### allergens future

---

### dietary labels future

Ex :

```txt id="y2q7tv"
halal
vegan
sans gluten
```

---

## 3.4 Restaurant Order Flow

```txt id="w2z7pk"
menu
↓
add to cart
↓
delivery/pickup
↓
payment
↓
restaurant confirm
↓
preparation
↓
delivery
```

---

## 3.5 Restaurant Reservation Engine

Support :

### date

---

### heure

---

### nombre invités

---

### occasion spéciale

Ex :

```txt id="h1k5qt"
anniversaire
business dinner
```

---

### special request

---

## 3.6 Restaurant Analytics

KPIs :

### most ordered dishes

---

### peak hours

---

### booking conversion

---

### delivery performance

---

### repeat customers

---

### popular menu items

---

## 3.7 Restaurant Monetization

Monétisation prioritaire :

### subscription

---

### sponsored placement

---

### marketplace commission

---

### premium analytics

---

### featured dishes future

---

# 4. Boutique & Retail System

La boutique constitue :

> **la verticale wedge market #2**

Pourquoi ?

* ecommerce natif ;
* panier naturel ;
* forte récurrence.

---

# 4.1 Boutique Categories

### fashion

---

### electronics

---

### beauty products

---

### home

---

### supermarket

---

### accessories

---

### specialty stores

---

## 4.2 Boutique Profile Structure

Affichage :

### featured products

---

### categories

---

### promotions

---

### best sellers

---

### pickup available

---

### delivery options

---

### store trust indicators

---

## 4.3 Product Catalog System

Support :

### variants

---

### inventory

---

### SKU

---

### stock alerts

---

### discount pricing

---

### flash sales

---

### bundles future

---

## 4.4 Retail Checkout Flow

```txt id="r4j2zn"
browse
↓
product page
↓
cart
↓
checkout
↓
payment
↓
delivery/pickup
```

---

## 4.5 Boutique Delivery Logic

Modes :

### pickup

---

### local delivery

---

### national shipping future

---

### third-party courier

---

## 4.6 Boutique Analytics

KPIs :

### revenue

---

### conversion rate

---

### top products

---

### repeat customers

---

### abandoned carts future

---

### inventory turnover

---

## 4.7 Retail CRM

Support :

### customer segmentation

---

### promotions

---

### reorder campaigns

---

### loyalty

---

# 5. Beauty & Salon System

La verticale beauté est :

> **wedge market #3**

Très forte fidélisation.

Très forte récurrence.

---

# 5.1 Beauty Categories

### salon coiffure

---

### barber

---

### spa

---

### nails

---

### makeup

---

### skincare

---

### beauty institute

---

## 5.2 Salon Profile Structure

Affichage :

### stylist highlights

---

### services

---

### duration

---

### prices

---

### available slots

---

### before/after gallery future

---

### trusted stylist badge future

---

## 5.3 Services Catalog

Exemple :

```txt id="t8p9mf"
braids
haircut
wash
coloring
manicure
```

Chaque service contient :

### duration

---

### price

---

### category

---

### optional extras

---

## 5.4 Appointment Flow

```txt id="z9n4ph"
choose service
↓
choose date
↓
choose time
↓
booking confirmation
↓
reminder
↓
visit
```

---

## 5.5 Calendar Engine

Fonctions :

### staff availability

---

### booking conflicts prevention

---

### break management

---

### slot duration

---

### recurring booking future

---

## 5.6 Salon Analytics

KPIs :

### repeat customers

---

### utilization rate

---

### popular services

---

### no-show rate

---

### average spend

---

## 5.7 Beauty Loyalty

Très fort potentiel.

Ex :

```txt id="f4w2nb"
5 coiffures
=
1 réduction
```

---

# 6. Cross-Vertical Shared Systems

Tous les business types partagent :

### auth

---

### payments

---

### reviews

---

### messaging

---

### analytics

---

### CRM

---

### notifications

---

### moderation

---

### subscriptions

---

### ads

---

# Conclusion Partie 1

Les trois premières verticales prioritaires sont désormais définies :

### Restaurants

### Boutiques

### Beauty & Salons

Elles constituent :

> **le wedge market officiel V1 de LaPlasse**

La prochaine partie documentera :

### Hotel System

### Pharmacy & Health System

### Event Venue System

### Service Business System

### Multi-location Business Architecture
# LaPlasse — Architecture & Product Master Document

# Tome 4 — Business Type Systems & Vertical Architectures

## Partie 2 — Hotel System, Pharmacy & Health System, Event Venue System, Service Business System & Multi-location Architecture

---

# 7. Hotel System

Le système hôtelier constitue une verticale :

> **forte valeur transactionnelle + forte réservation.**

Contrairement aux restaurants :

le cœur business n’est pas :

> le produit

mais :

> **la disponibilité d’unités (chambres).**

L’architecture doit donc être pensée :

> inventory + booking first.

---

# 7.1 Hotel Categories

Sous-types supportés :

### hôtel standard

---

### hôtel premium

---

### résidence hôtelière

---

### guest house

---

### auberge

---

### appart’hôtel

---

### resort futur

---

## 7.2 Hotel Profile Structure

Affichage business :

### hero section

* photos premium
* note
* badges
* prix moyen

---

### room availability

---

### amenities

Ex :

```txt id="f9w1kp"
wifi
parking
pool
breakfast
gym
conference room
```

---

### room gallery

---

### policies

---

### reviews

---

### location & nearby places

---

## 7.3 Room Inventory Engine

Chaque chambre devient :

> une unité réservable.

Structure :

### room type

---

### capacity

---

### pricing

---

### availability

---

### amenities

---

### cancellation policy

---

Exemple :

```txt id="r3k1qt"
Single
Double
Suite
Family Room
```

---

## 7.4 Hotel Booking Flow

```txt id="w0k2tp"
choose dates
↓
available rooms
↓
select room
↓
guest information
↓
payment/deposit
↓
confirmation
```

---

## 7.5 Availability Engine

Très critique.

Support :

### blocked dates

---

### room availability

---

### maintenance blocking

---

### minimum nights future

---

### dynamic pricing future

---

## 7.6 Hotel Analytics

KPIs :

### occupancy rate

---

### average booking value

---

### booking source

---

### cancellation rate

---

### repeat guests

---

### room performance

---

## 7.7 Hotel Monetization

### booking commission

---

### premium listing

---

### sponsored placement

---

### subscription

---

# 8. Pharmacy & Health System

Le système santé nécessite :

> **forte confiance + conformité + restrictions.**

Cette verticale sera plus sensible.

---

# 8.1 Health Categories

### pharmacies

---

### clinics

---

### dental offices

---

### laboratories

---

### medical practices

---

### wellness centers

---

## 8.2 Pharmacy Profile Structure

Affichage :

### opening hours

---

### emergency availability

---

### medicines available future

---

### delivery available

---

### verified pharmacist badge

---

### contact fast access

---

## 8.3 Medicine Availability Inquiry

Important :

Dans plusieurs pays :

> vente médicament réglementée.

Approche V1 :

### disponibilité inquiry

Ex :

```txt id="h2r7xn"
Paracetamol disponible ?
```

sans achat direct obligatoire.

---

## 8.4 Reserve Order Flow

Flow :

```txt id="p5m9zy"
search medicine
↓
availability inquiry
↓
reserve
↓
pickup/delivery
```

---

## 8.5 Clinic Booking Engine

Support :

### consultation booking

---

### doctor availability future

---

### appointment reminders

---

### consultation category

---

## 8.6 Health Trust Features

Très critique.

Affichage :

### verified clinic

---

### verified practitioner

---

### response speed

---

### operating license future

---

## 8.7 Compliance Layer

Restrictions :

### prohibited product rules

---

### prescription-required future

---

### country-specific health compliance

---

# 9. Event Venue System

Les espaces événementiels constituent :

> une verticale à forte valeur transactionnelle.

---

# 9.1 Venue Categories

### wedding venue

---

### conference room

---

### reception hall

---

### rooftop venue

---

### private event space

---

### coworking/event hybrid future

---

## 9.2 Venue Profile Structure

Affichage :

### capacity

---

### pricing

---

### packages

---

### gallery

---

### amenities

---

### availability

---

### virtual tour future

---

## 9.3 Venue Inquiry Flow

Flow V1 :

```txt id="t6k8xp"
explore venue
↓
check availability
↓
request quotation
↓
venue response
↓
booking negotiation
```

---

## 9.4 Venue Booking Logic

Support :

### date blocking

---

### deposit future

---

### pricing tiers

---

### event type filtering

---

## 9.5 Venue Analytics

KPIs :

### inquiries

---

### booking conversion

---

### occupancy

---

### seasonal trends

---

# 10. Service Business System

Très vaste catégorie.

Ex :

* artisans
* consultants
* repair services
* photographers
* freelancers

---

# 10.1 Service Categories

### plumbing

---

### electrician

---

### photography

---

### consulting

---

### repair

---

### moving service

---

### tutoring future

---

## 10.2 Service Profile Structure

Affichage :

### portfolio

---

### service list

---

### pricing estimate

---

### availability

---

### certifications future

---

### reviews

---

## 10.3 Quote Request System

Flow :

```txt id="b3j9yt"
describe need
↓
merchant review
↓
quotation
↓
approval
↓
service execution
```

---

## 10.4 Booking Logic

Selon catégorie :

### instant booking

ou

### quote first

---

## 10.5 Service Analytics

KPIs :

### leads generated

---

### quote acceptance rate

---

### booking rate

---

### repeat customers

---

# 11. Multi-location Business Architecture

Très critique.

LaPlasse doit supporter :

> **chaînes et business multi-sites dès V1.**

---

# 11.1 Multi-location Philosophy

Un propriétaire peut gérer :

```txt id="n2k8ph"
Business Group
↓
Branch 1
Branch 2
Branch 3
```

---

## 11.2 Centralized Management

Le propriétaire peut :

### voir toutes branches

---

### comparer performance

---

### gérer permissions

---

### gérer campagnes

---

### consolider analytics

---

## 11.3 Branch-level Permissions

Chaque branche peut avoir :

### manager

---

### cashier

---

### marketing lead

---

### reservation staff

---

## 11.4 Shared Inventory Future

Pour retail :

inventaire mutualisé.

---

## 11.5 Group Analytics

KPIs consolidés :

### total revenue

---

### branch comparison

---

### top locations

---

### profitability future

---

## 11.6 Multi-location Ads

Campagnes :

### local branch targeting

---

### national campaign

---

### city-specific campaign

---

# 12. Vertical Scalability Strategy

Nouvelles verticales ajoutables sans refonte.

Architecture :

```txt id="d4v7nm"
Core System
+
Vertical Config
+
Features
+
Analytics
```

Exemple futur :

### car dealerships

---

### education

---

### real estate

---

### tourism

---

### coworking

---

# Conclusion Partie 2

Les verticales suivantes sont désormais définies :

### Hotels

### Health & Pharmacy

### Event Venues

### Service Businesses

### Multi-location Businesses

LaPlasse dispose désormais :

> **d’une architecture verticale complète, extensible et adaptive.**

La prochaine étape sera :

# Tome 5 — Enterprise Data Architecture & Domain Driven Design

où nous documenterons :

### toutes les entités métier

### architecture data complète

### relations

### bounded contexts

### stratégie PostgreSQL

### logique Prisma enterprise

### scalabilité data long terme
