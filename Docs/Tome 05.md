# LaPlasse — Architecture & Product Master Document

# Tome 5 — Enterprise Data Architecture & Domain Driven Design

## Partie 1 — Domain Driven Design (DDD), Bounded Contexts & Global Entity Architecture

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 1. Introduction

LaPlasse est une plateforme :

> **multi-sided + multi-country + marketplace + booking + business management platform**

Cette complexité implique :

> une architecture data pensée dès le départ pour scaler.

L’objectif de ce tome est d’éviter les erreurs classiques :

### monolithic database chaos

---

### tightly coupled domains

---

### schema rigidity

---

### poor scaling

---

### refactoring cost explosion

---

La stratégie retenue :

> **Domain Driven Design (DDD)**

associée à une architecture :

> **modular monolith → microservices ready**

---

# 2. Enterprise Data Philosophy

La donnée constitue :

> **l’infrastructure principale de LaPlasse.**

Chaque décision produit doit être pensée :

### scalable

---

### extensible

---

### auditable

---

### analytics-ready

---

### search-ready

---

### country-ready

---

### feature-flag compatible

---

## 2.1 Core Principles

L’architecture data suit :

### modularity

---

### bounded responsibility

---

### low coupling

---

### high cohesion

---

### event-driven readiness

---

### backward compatibility

---

### soft migration strategy

---

# 3. Why Domain Driven Design (DDD)

Une plateforme comme LaPlasse contient :

plusieurs sous-business très différents.

Exemple :

Restaurant :

```txt id="f9n2vk"
menu
orders
delivery
```

Salon :

```txt id="q3j8tm"
appointments
calendar
```

Hotel :

```txt id="z6m2rp"
rooms
availability
```

Sans séparation métier :

> le schéma devient incontrôlable.

DDD permet :

> d’organiser le produit par domaines métier.

---

# 4. Global Domain Architecture

LaPlasse sera découpé en :

> **Bounded Contexts**

Chaque contexte possède :

* ses entités ;
* ses règles métier ;
* ses services ;
* ses événements.

Vue globale :

```txt id="m7v4pk"
Identity Domain
↓
Business Domain
↓
Discovery Domain
↓
Marketplace Domain
↓
Booking Domain
↓
Payment Domain
↓
Review & Trust Domain
↓
CRM Domain
↓
Communication Domain
↓
Analytics Domain
↓
Admin Domain
↓
Country Configuration Domain
```

Chaque domaine reste indépendant.

Mais communique via :

> domain events.

---

# 5. Identity Domain

Le **Identity Domain** constitue :

> le socle utilisateur.

Responsable de :

### authentication

---

### authorization

---

### profile identity

---

### account lifecycle

---

## 5.1 Main Responsibilities

Gérer :

### user registration

---

### login

---

### sessions

---

### roles

---

### permissions

---

### account status

---

### KYC future

---

## 5.2 Core Entities

### User

Entité principale.

---

### UserProfile

Informations publiques.

---

### AuthProvider

Google, email, Apple futur.

---

### UserRole

RBAC.

---

### Session

Gestion connexions.

---

### UserPreference

Préférences utilisateur.

---

### Address

Adresses multiples.

---

### Device

Tracking sécurité futur.

---

## 5.3 Identity Philosophy

Un utilisateur :

> peut avoir plusieurs rôles.

Exemple :

```txt id="t7z9wd"
consumer
+
merchant
+
business owner
```

Architecture :

> multi-role native.

---

# 6. Business Domain

Le **Business Domain** est :

> le cœur de LaPlasse.

Responsable de :

### business identity

---

### branches

---

### ownership

---

### business settings

---

### claim management

---

## 6.1 Main Responsibilities

Gérer :

### business creation

---

### ownership

---

### business lifecycle

---

### staff management

---

### branches

---

### verification

---

## 6.2 Core Entities

### Business

Entité mère.

---

### BusinessBranch

Branches physiques.

---

### BusinessCategory

Catégorie.

---

### BusinessSubcategory

Sous-catégorie.

---

### BusinessOwner

Relation propriétaire.

---

### BusinessClaim

Claim ownership.

---

### BusinessVerification

Statut vérification.

---

### BusinessHours

Horaires.

---

### BusinessMedia

Photos, vidéos.

---

### BusinessFeature

Modules actifs.

---

### BusinessSubscription

Plan business.

---

### BusinessSettings

Configuration.

---

## 6.3 Business Lifecycle

```txt id="m1v9pk"
draft
↓
published
↓
claimed
↓
verified
↓
premium
↓
suspended
↓
archived
```

---

# 7. Discovery Domain

Le **Discovery Domain** pilote :

> la découvrabilité.

Responsable de :

### search

---

### ranking

---

### recommendation

---

### maps

---

### nearby

---

### SEO

---

## 7.1 Core Entities

### SearchIndex

---

### SearchQueryLog

---

### TrendingScore

---

### RecommendationProfile

---

### SavedPlace

---

### SearchFilterPreference

---

### FeaturedPlacement

---

## 7.2 Design Philosophy

Ce domaine doit être :

> query optimized.

Lecture prioritaire.

Pas transaction prioritaire.

---

# 8. Marketplace Domain

Le **Marketplace Domain** gère :

> tout le commerce.

---

## 8.1 Main Responsibilities

### products

---

### pricing

---

### inventory

---

### cart

---

### orders

---

### fulfillment

---

### commissions

---

## 8.2 Core Entities

### Product

---

### ProductVariant

---

### ProductCategory

---

### ProductInventory

---

### ProductMedia

---

### ProductPricing

---

### Cart

---

### CartItem

---

### Order

---

### OrderItem

---

### OrderStatusHistory

---

### Fulfillment

---

### Refund

---

### MerchantCommission

---

### Coupon

---

### Promotion

---

## 8.3 Order Lifecycle

```txt id="v4p9rm"
pending
↓
confirmed
↓
preparing
↓
ready
↓
shipping
↓
delivered
↓
completed
```

---

# 9. Booking Domain

Le **Booking Domain** gère :

> réservations universelles.

---

## 9.1 Responsibilities

### appointments

---

### reservations

---

### availability

---

### schedules

---

### reminders

---

## 9.2 Core Entities

### Booking

---

### BookingType

---

### BookingSlot

---

### AvailabilityRule

---

### BookingReminder

---

### BookingHistory

---

### Resource

Ex :

table.

coiffeur.

room.

---

## 9.3 Universal Booking Model

Architecture :

```txt id="j9r6pk"
resource
+
availability
+
booking
```

Applicable partout.

---

# 10. Payment Domain

Le **Payment Domain** reste :

> fortement isolé.

Pour sécurité.

---

## 10.1 Responsibilities

### payment processing

---

### verification

---

### payout

---

### reconciliation

---

### fraud monitoring

---

## 10.2 Core Entities

### Payment

---

### Transaction

---

### PaymentProvider

---

### Payout

---

### Wallet future

---

### Refund

---

### Settlement

---

### Invoice

---

## 10.3 Security Principle

Aucune logique paiement critique :

> hors domaine paiement.

Isolation stricte.

---

# 11. Review & Trust Domain

Le moteur confiance.

---

## Responsibilities

### reviews

---

### ratings

---

### trust scoring

---

### moderation signals

---

## Core Entities

### Review

---

### ReviewMedia

---

### Rating

---

### TrustScore

---

### Complaint

---

### ReviewModeration

---

### MerchantResponse

---

## Trust Philosophy

Un score confiance :

> composite.

Jamais basé uniquement sur reviews.

---

# 12. Communication Domain

Communication omnicanale.

---

## Responsibilities

### messaging

---

### notifications

---

### WhatsApp

---

### email

---

### SMS

---

## Core Entities

### Conversation

---

### Message

---

### Notification

---

### NotificationPreference

---

### MessageTemplate

---

### DeliveryStatus

---

# Conclusion Partie 1

LaPlasse dispose désormais :

> **d’une architecture DDD claire et scalable.**

Les domaines critiques sont isolés.

Cela réduit :

### dette technique

---

### couplage fort

---

### risque refactor massif

---

La prochaine partie documentera :

### CRM Domain

### Analytics Domain

### Admin Domain

### Country Configuration Domain

### Entity Relationship Strategy

### Global Data Relationships
# LaPlasse — Architecture & Product Master Document

# Tome 5 — Enterprise Data Architecture & Domain Driven Design

## Partie 2 — CRM Domain, Analytics Domain, Admin Domain, Country Configuration Domain & Global Data Relationships

---

# 13. CRM Domain

Le **CRM Domain** permet aux business :

> **de construire une relation durable avec leurs clients.**

Contrairement à un simple annuaire ou une marketplace classique :

LaPlasse doit aider les business à :

### retenir

---

### réactiver

---

### fidéliser

---

### personnaliser

---

les interactions.

---

## 13.1 Responsibilities

Le CRM Domain gère :

### customer history

---

### segmentation

---

### loyalty

---

### campaigns

---

### engagement tracking

---

### retention scoring future

---

## 13.2 Core Entities

### CustomerProfile

Vue business-specific client.

---

### CustomerSegment

Ex :

```txt id="q8m2tk"
VIP
inactive
frequent buyer
```

---

### LoyaltyAccount

---

### LoyaltyTransaction

---

### CustomerTag

---

### Campaign

---

### CampaignAudience

---

### CampaignMessage

---

### Reward

---

### Referral

---

## 13.3 CRM Philosophy

Un même utilisateur peut être :

> client de plusieurs business.

Le CRM est donc :

> **merchant scoped**

Architecture :

```txt id="z3r9pk"
Business A CRM
≠
Business B CRM
```

Isolation stricte.

---

## 13.4 Future AI CRM

Prévu architecture-ready.

Support futur :

### churn prediction

---

### best customer timing

---

### promotion recommendation

---

### customer value scoring

---

# 14. Analytics Domain

Le **Analytics Domain** transforme :

> données → décisions.

---

## 14.1 Responsibilities

### merchant analytics

---

### marketplace analytics

---

### behavioral analytics

---

### operational analytics

---

### executive dashboards

---

## 14.2 Core Entities

### AnalyticsEvent

Event central.

---

### BusinessMetric

---

### RevenueMetric

---

### UserBehaviorMetric

---

### ConversionMetric

---

### CampaignMetric

---

### SearchMetric

---

### MarketplaceMetric

---

### TrendSnapshot

---

## 14.3 Event-driven Analytics

Toutes actions importantes produisent :

> un event analytics.

Ex :

commande :

```txt id="x4k8tv"
order.created
order.confirmed
order.completed
```

Réservation :

```txt id="b7r1zw"
booking.created
booking.completed
```

---

## 14.4 Analytics Strategy

Deux types :

### real-time analytics

Dashboard live.

---

### historical analytics

Reporting.

---

## 14.5 Data Philosophy

Les analytics doivent être :

> append-only.

Jamais modifiés.

Historique permanent.

---

# 15. Admin Domain

Le **Admin Domain** gère :

> la gouvernance plateforme.

---

## 15.1 Responsibilities

### moderation

---

### dispute management

---

### fraud monitoring

---

### support

---

### monetization management

---

### country operations

---

### feature management

---

## 15.2 Core Entities

### AdminUser

---

### AdminRole

---

### ModerationCase

---

### FraudAlert

---

### Dispute

---

### MerchantFlag

---

### SystemSetting

---

### AdminActionLog

---

### SupportTicket

---

### EscalationCase

---

## 15.3 Auditability Principle

Toute action admin :

> doit être traçable.

Ex :

```txt id="t7p9xq"
who
what
when
before
after
```

Audit obligatoire.

---

# 16. Country Configuration Domain

Le **Country Configuration Domain** rend LaPlasse :

> **multi-country native.**

---

## 16.1 Responsibilities

### countries

---

### currencies

---

### localization

---

### payment methods

---

### taxes future

---

### pricing rules

---

### feature availability

---

## 16.2 Core Entities

### Country

---

### Currency

---

### CountryLanguage

---

### PaymentConfiguration

---

### TaxConfiguration future

---

### DeliveryConfiguration

---

### CountryFeatureFlag

---

### MonetizationConfiguration

---

### LegalPolicy

---

## 16.3 Country Isolation Principle

Chaque pays doit pouvoir :

### activer modules

---

### désactiver modules

---

### adapter paiements

---

### adapter règles business

---

Sans changer code.

---

## 16.4 Example Country Logic

Côte d’Ivoire :

```txt id="k8m3tv"
XOF
Wave
Orange Money
French
```

Ghana :

```txt id="y4n1zk"
GHS
MTN
English
```

---

# 17. Audit Domain

Une plateforme enterprise doit être :

> audit-friendly.

---

## 17.1 Responsibilities

### change history

---

### business edits

---

### payments tracking

---

### moderation actions

---

### permissions history

---

## 17.2 Core Entities

### AuditLog

---

### EntityVersion

---

### ChangeEvent

---

### SecurityEvent

---

### LoginHistory

---

## 17.3 Audit Philosophy

Jamais supprimer l’historique critique.

Même soft delete.

---

# 18. Global Entity Relationship Strategy

La relation entre entités doit être :

> cohérente et scalable.

---

## 18.1 Relationship Types

### One-to-One

Ex :

```txt id="f8v4pq"
User
↔
UserProfile
```

---

### One-to-Many

Ex :

```txt id="r6m1xt"
Business
↓
Products
```

---

### Many-to-Many

Ex :

```txt id="j2z9kn"
Users
↔
Businesses
```

via :

```txt id="c7w1tp"
BusinessOwner
```

---

## 18.2 Domain Ownership Principle

Chaque entité :

> appartient à un domaine.

Ex :

```txt id="h5p8yr"
Order
=
Marketplace Domain
```

Même si utilisée ailleurs.

---

## 18.3 Cross-domain Communication

Jamais accès direct anarchique.

Communication :

> domain events.

Ex :

Commande créée :

```txt id="p1n7xm"
order.completed
↓
CRM update
↓
Analytics event
↓
Loyalty points
↓
Notification
```

---

# 19. Event-driven Architecture Readiness

LaPlasse sera :

> microservices-ready.

Sans microservices immédiats.

Architecture :

> modular monolith.

---

## 19.1 Domain Events

Exemples :

### business.claimed

---

### order.created

---

### order.completed

---

### booking.confirmed

---

### review.created

---

### payment.completed

---

### merchant.verified

---

## 19.2 Event Bus Future

Préparation architecture :

### queues

---

### async jobs

---

### notifications

---

### indexing

---

### analytics pipelines

---

# 20. Naming Convention Strategy

Très critique.

---

## Entity Naming

Toujours :

> singulier.

Ex :

```txt id="w6m3zt"
User
Business
Order
Review
```

---

## ID Strategy

UUID obligatoire.

Jamais auto increment.

Pourquoi ?

### sécurité

---

### multi-country

---

### distributed systems ready

---

## Timestamp Convention

Toujours :

```txt id="r2k8pv"
createdAt
updatedAt
deletedAt
```

UTC only.

---

# 21. Soft Delete Strategy

LaPlasse adopte :

> **soft delete by default**

Pourquoi ?

Marketplace = historique critique.

---

## Example

Business supprimé :

```txt id="y3m9tv"
deletedAt
```

mais données conservées.

---

## Hard Delete Rules

Uniquement :

### compliance

---

### fraud cleanup

---

### legal obligation future

---

# Conclusion Partie 2

L’architecture data devient maintenant :

> **enterprise-grade et scalable long terme.**

Les domaines :

### CRM

### Analytics

### Admin

### Country Configuration

### Audit

sont désormais isolés proprement.

La prochaine partie documentera :

### PostgreSQL Enterprise Strategy

### Prisma Architecture

### Read/Write Optimization

### Indexing Strategy

### Caching Strategy

### Database Scaling Long-term
# LaPlasse — Architecture & Product Master Document

# Tome 5 — Enterprise Data Architecture & Domain Driven Design

## Partie 3 — PostgreSQL Enterprise Strategy, Prisma Architecture, Read/Write Optimization, Indexing & Database Scaling

---

# 22. PostgreSQL Enterprise Strategy

LaPlasse adopte :

> **PostgreSQL comme base de données principale.**

Ce choix est motivé par :

### robustesse

---

### maturité

---

### performance transactionnelle

---

### support JSON avancé

---

### extensibilité

---

### compatibilité Prisma

---

### scalabilité long terme

---

## 22.1 Database Philosophy

La base de données doit être :

### source of truth

---

### normalized where necessary

---

### denormalized where strategic

---

### analytics-friendly

---

### multi-country ready

---

### read optimized

---

### audit-ready

---

## 22.2 Architectural Principle

LaPlasse adopte :

> **Single PostgreSQL Cluster + Domain Separation**

Pas :

> une base par module.

Mais :

> séparation logique forte.

Architecture :

```txt id="p4x7nm"
Identity Domain
Business Domain
Marketplace Domain
Booking Domain
Payment Domain
CRM Domain
Analytics Domain
Admin Domain
```

Même cluster.

Tables isolées.

Relations claires.

---

## 22.3 Why Not Microservices DB Early

Refus architecture prématurément complexe.

Pourquoi ?

### overhead élevé

---

### coût ops

---

### duplication données

---

### faible vélocité MVP

---

Stratégie retenue :

```txt id="x9m4kt"
Modular Monolith
↓
Domain Isolation
↓
Microservices-ready
```

---

# 23. Database Schema Philosophy

Le schéma doit :

> survivre à 5–10 ans d’évolution.

Éviter :

### rigid schema

---

### spaghetti relationships

---

### excessive joins

---

### duplicated business logic

---

## 23.1 Table Design Principles

Chaque table doit :

### avoir une responsabilité claire

---

### être audit-friendly

---

### être extensible

---

### supporter soft delete

---

### supporter timestamps

---

Convention standard :

```txt id="q7t3zn"
id UUID
createdAt
updatedAt
deletedAt
```

---

## 23.2 Naming Convention

Tables :

> singulier PascalCase logique Prisma.

Ex :

```txt id="h2m8vk"
User
Business
Order
Product
Booking
```

Colonnes :

camelCase.

Ex :

```txt id="n8p5xt"
businessName
createdAt
phoneNumber
```

---

## 23.3 Enum Strategy

Enums uniquement pour :

> valeurs stables.

Ex :

### booking status

---

### payment status

---

### user role

---

### order status

---

Jamais pour :

### catégories business dynamiques

Mieux :

table relationnelle.

---

# 24. Prisma Enterprise Architecture

Prisma sera :

> **data access layer officielle**

---

## 24.1 Prisma Philosophy

Prisma doit rester :

### maintainable

---

### readable

---

### scalable

---

### domain-organized

---

## 24.2 Schema Structure

Recommandation :

> modular schema architecture.

Structure :

```txt id="v6x2pm"
prisma/

schema/

identity.prisma

business.prisma

marketplace.prisma

booking.prisma

payment.prisma

crm.prisma

analytics.prisma

admin.prisma

country.prisma
```

Puis :

```txt id="c8k4zn"
schema.prisma
```

agrégateur.

---

## 24.3 Model Design Philosophy

Chaque modèle :

> doit rester simple.

Éviter :

> God Models.

Mauvais :

```txt id="k2r9tw"
Business {
300 fields
}
```

Bon :

```txt id="b7v1mq"
Business
BusinessMedia
BusinessHours
BusinessSettings
```

---

## 24.4 Prisma Output Strategy

Structure recommandée :

```txt id="n1w7pk"
src/generated/prisma
```

Compatible avec ta logique Eventis.

---

## 24.5 Prisma Query Rules

Toujours :

### select minimal fields

---

### avoid overfetching

---

### pagination required

---

### relation loading controlled

---

Mauvais :

```txt id="z4p2mk"
include everything
```

---

Bon :

```txt id="d9w3xn"
select precise fields
```

---

# 25. Read/Write Optimization Strategy

Marketplace =

> beaucoup plus de lecture que d’écriture.

Exemple :

```txt id="q4v7pk"
1000 reads
↓
1 purchase
```

Architecture :

> read optimized.

---

## 25.1 Read-heavy Tables

Tables critiques lecture :

### Business

---

### Product

---

### Review

---

### BusinessMedia

---

### SearchIndex

---

### BusinessCategory

---

Optimisation agressive.

---

## 25.2 Write-heavy Tables

Tables critiques écriture :

### AnalyticsEvent

---

### Notification

---

### Message

---

### OrderStatusHistory

---

### AuditLog

---

Stratégie :

> append-only.

---

## 25.3 CQRS Readiness

Préparation architecture :

> CQRS-compatible.

Sans complexité immédiate.

Future :

```txt id="j5k2tw"
Write DB
↓
Read replicas
```

---

# 26. Indexing Strategy

L’indexation sera :

> critique.

---

## 26.1 Core Indexing Rules

Index obligatoire sur :

### foreign keys

---

### search fields

---

### location queries

---

### timestamps

---

### filtering fields

---

### sorting fields

---

## 26.2 Business Search Indexes

Exemple :

```txt id="r4x9kp"
city
category
verified
rating
isOpen
countryId
```

---

## 26.3 Product Indexes

Index :

```txt id="w8n4zt"
businessId
categoryId
price
visibility
stock
```

---

## 26.4 Booking Indexes

Index :

```txt id="m2v8rx"
businessId
date
status
resourceId
```

---

## 26.5 Review Indexes

Index :

```txt id="g5q1tw"
businessId
rating
createdAt
verified
```

---

## 26.6 Analytics Indexes

Très important.

Partition future.

Index :

```txt id="p9w3xm"
eventType
businessId
createdAt
countryId
```

---

# 27. Geospatial Strategy

LaPlasse dépend fortement :

> localisation.

---

## 27.1 PostGIS Ready

Préparation :

> PostGIS future.

Support :

### nearby search

---

### geo filtering

---

### distance ranking

---

### delivery radius

---

### map clustering

---

## 27.2 Coordinates Convention

Toujours :

```txt id="x7k2pm"
latitude
longitude
```

WGS84 standard.

---

## 27.3 Fallback Africa Logic

Support :

### landmarks

---

### manual location hints

---

### descriptive address

---

# 28. Caching Strategy

Performance-first.

---

## 28.1 Redis Layer

Utilisation :

### sessions

---

### hot queries

---

### search results

---

### trending places

---

### rate limiting

---

### OTP storage

---

### notifications queue

---

## 28.2 Cache Philosophy

Ne jamais cacher :

> données critiques transactionnelles.

Ex :

### payments

---

### payouts

---

### financial balances

---

## 28.3 Recommended Cache TTL

Exemple :

Search :

```txt id="r1p9zk"
5 min
```

Trending :

```txt id="h6k3tw"
15 min
```

Country config :

```txt id="n5w7px"
24h
```

---

# 29. Database Scaling Strategy

Architecture pensée :

> 10M+ utilisateurs future-ready.

---

## 29.1 Phase 1 — MVP

```txt id="x9q4tm"
single postgres instance
```

---

## 29.2 Phase 2 — Growth

```txt id="c4p8vk"
primary DB
+
read replicas
```

---

## 29.3 Phase 3 — Regional Scale

```txt id="y3t7xn"
regional replication
```

---

## 29.4 Partitioning Future

Tables concernées :

### AnalyticsEvent

---

### Notification

---

### AuditLog

---

### SearchQueryLog

---

### OrderHistory

---

Partition :

```txt id="t6m2wr"
monthly
```

---

# 30. Data Consistency Strategy

LaPlasse adopte :

> **strong consistency for money**

Ex :

### payments

---

### payouts

---

### orders

---

Et :

> **eventual consistency acceptable**

pour :

### analytics

---

### recommendations

---

### trending

---

### search ranking

---

# 31. Backup & Recovery Strategy

Très critique.

---

## Backup Policy

### daily snapshots

---

### hourly incremental future

---

### geo redundancy future

---

### disaster recovery plan

---

## Recovery Objectives

Objectifs :

### low RPO

---

### low RTO

---

# Conclusion Partie 3

L’architecture data LaPlasse est désormais :

> **enterprise-grade, scalable et production-ready.**

Elle est pensée pour :

### MVP rapide

tout en restant :

### microservices-ready

### multi-country ready

### analytics ready

### marketplace ready

### high scale ready

La prochaine partie documentera :

### Soft Delete Enterprise Strategy

### Event-driven Architecture

### Audit Logging System

### Versioning Strategy

### Data Governance

### Security & Privacy Architecture
# LaPlasse — Architecture & Product Master Document

# Tome 5 — Enterprise Data Architecture & Domain Driven Design

## Partie 4 — Soft Delete Strategy, Event-driven Architecture, Audit Logging, Versioning, Data Governance & Security Architecture

---

# 32. Soft Delete Enterprise Strategy

LaPlasse adopte une stratégie :

> **Soft Delete by Default**

Pourquoi ?

Une marketplace contient :

### historique financier

---

### historique commandes

---

### historique réservations

---

### historique confiance

---

### historique réputation

---

Supprimer physiquement des données :

> casserait cohérence business.

---

## 32.1 Soft Delete Philosophy

Suppression logique.

Exemple :

Business supprimé :

```txt id="k2v8pr"
deletedAt = timestamp
```

mais :

> donnée toujours existante.

Invisible utilisateur.

---

## 32.2 Universal Soft Delete Convention

Toutes entités critiques doivent supporter :

```txt id="x6m4tw"
deletedAt
deletedBy
deleteReason
```

---

## 32.3 Soft-delete Eligible Entities

### User

---

### Business

---

### Product

---

### Booking

---

### Review

---

### Message

---

### Coupon

---

### Campaign

---

### Staff Account

---

### Branch

---

## 32.4 Hard Delete Exceptions

Autorisé uniquement :

### compliance legal request

---

### GDPR-style deletion future

---

### fraud cleanup

---

### severe abuse

---

### test data cleanup

---

## 32.5 Recovery System

Admin peut :

### restore entity

---

### restore relationships

---

### restore permissions

---

Workflow :

```txt id="n5r9xk"
deleted
↓
recovery request
↓
admin review
↓
restored
```

---

# 33. Event-driven Architecture

LaPlasse est conçu :

> **event-driven ready dès le MVP.**

Même en modular monolith.

---

## 33.1 Event Philosophy

Un événement représente :

> quelque chose d’important qui s’est produit.

Exemple :

commande créée.

Ce n’est pas :

> une fonction.

C’est :

> un fait métier.

---

## 33.2 Domain Events Structure

Convention :

```txt id="z4t8pm"
domain.action
```

Exemples :

### business.claimed

---

### order.created

---

### order.completed

---

### booking.confirmed

---

### payment.completed

---

### review.created

---

### merchant.verified

---

### loyalty.pointsEarned

---

### campaign.launched

---

## 33.3 Event Payload Philosophy

Toujours minimal.

Bon :

```txt id="m8w3pk"
entityId
timestamp
context
```

Mauvais :

> envoyer tout l’objet complet.

---

## 33.4 Example Event Flow

Commande créée :

```txt id="d7k2tx"
order.completed
↓
analytics event
↓
CRM update
↓
loyalty points
↓
notification send
↓
review eligibility
```

Architecture découplée.

---

## 33.5 Async Processing Future

Événements non critiques :

> async.

Ex :

### analytics

---

### emails

---

### recommendations

---

### indexing

---

### review prompts

---

# 34. Audit Logging System

Toute plateforme enterprise :

> doit être audit-friendly.

---

# 34.1 Audit Philosophy

Question fondamentale :

> qui a fait quoi, quand et pourquoi ?

---

## 34.2 Audit Scope

Traçabilité obligatoire :

### admin actions

---

### business edits

---

### payment changes

---

### permissions updates

---

### subscription changes

---

### moderation actions

---

### refund actions

---

### payouts

---

### security events

---

## 34.3 Audit Event Structure

Minimum :

```txt id="c4w8pk"
actor
action
entity
entityId
before
after
timestamp
ip future
device future
```

---

## 34.4 Immutable Audit Rule

Audit logs :

> append-only.

Jamais modifiés.

Jamais supprimés.

---

## 34.5 High-risk Events

Logging renforcé :

### payout change

---

### role escalation

---

### ownership transfer

---

### moderation override

---

### refund approval

---

### payment override

---

# 35. Entity Versioning Strategy

Marketplace complexe :

> données changent souvent.

Ex :

menu restaurant.

prix.

horaires.

---

## 35.1 Versioning Philosophy

Objectif :

### rollback

---

### historical tracking

---

### analytics integrity

---

## 35.2 Versioned Entities

### BusinessSettings

---

### ProductPricing

---

### BusinessHours

---

### SubscriptionPlan

---

### Promotions

---

### CountryConfiguration

---

## 35.3 Version Pattern

Structure :

```txt id="r8m1tx"
currentVersion
versionHistory
effectiveFrom
effectiveUntil
```

---

## 35.4 Example

Prix produit :

```txt id="p7v4nk"
10 000 XOF
↓
12 000 XOF
```

Historique conservé.

---

# 36. Data Governance Strategy

La donnée devient :

> un actif business.

---

## 36.1 Governance Goals

Garantir :

### qualité

---

### cohérence

---

### sécurité

---

### conformité

---

### observabilité

---

## 36.2 Data Ownership

Chaque domaine :

> possède ses données.

Ex :

Marketplace :

> propriétaire de Order.

Même si :

CRM consomme.

Analytics consomme.

---

## 36.3 Source of Truth Principle

Une seule vérité.

Ex :

Prix produit :

Toujours :

```txt id="n3w9pk"
ProductPricing
```

Jamais dupliqué partout.

---

## 36.4 Data Validation Rules

Validation :

### backend mandatory

---

### frontend assistive only

---

### database constraints

---

### schema validation

---

## 36.5 Data Lifecycle

Cycle :

```txt id="w7m4zr"
create
↓
active
↓
updated
↓
inactive
↓
deleted
↓
archived
```

---

# 37. Security Architecture

La sécurité est :

> architecture-level.

Pas feature-level.

---

# 37.1 Security Philosophy

Assumer :

> breach can happen.

Architecture :

> minimize blast radius.

---

## 37.2 Core Security Layers

### auth security

---

### authorization

---

### rate limiting

---

### fraud monitoring

---

### auditability

---

### encryption

---

### abuse detection

---

## 37.3 Authentication Security

Support :

### email OTP future

---

### password auth

---

### social login

---

### MFA future

---

### device trust future

---

## 37.4 Authorization Security

RBAC strict.

Jamais :

> trust frontend.

Toujours :

> backend validation.

---

## 37.5 Sensitive Data Protection

Champs sensibles :

### phone

---

### email

---

### payment data

---

### identity docs future

---

Protection :

### encryption at rest

---

### masked display

---

### restricted access

---

## 37.6 Secrets Management

Jamais :

```txt id="x5r2tm"
API keys in code
```

Toujours :

```txt id="h1m8pk"
environment secrets
```

---

## 37.7 Rate Limiting

Protection :

### login abuse

---

### OTP spam

---

### fake review spam

---

### search abuse

---

### API abuse

---

## 37.8 Fraud Prevention

Détection :

### fake merchants

---

### fake orders

---

### refund abuse

---

### review manipulation

---

### payout fraud

---

# 38. Privacy Architecture

Confiance utilisateur critique.

---

## 38.1 Privacy Principle

Collecter :

> uniquement nécessaire.

---

## 38.2 Data Visibility Rules

Consumer ne voit jamais :

### merchant internal analytics

---

### merchant customer list

---

Merchant ne voit jamais :

### unrelated users

---

### platform-wide data

---

## 38.3 Consent Future

Support :

### marketing consent

---

### tracking consent

---

### notifications consent

---

# 39. Observability Strategy

Pour scaler :

> il faut observer.

---

## Monitoring

### database health

---

### slow queries

---

### payment failures

---

### notification failures

---

### booking failures

---

### search latency

---

### API performance

---

# Conclusion Partie 4

L’architecture data LaPlasse est désormais :

> **production-grade, secure et enterprise-ready.**

Les fondations sont posées pour :

### sécurité

### auditabilité

### gouvernance

### event-driven scaling

### long-term maintainability

La prochaine partie documentera :

### Prisma Enterprise Schema Blueprint

### Table-by-table Strategy

### Domain Database Mapping

### Performance Optimization Rules

### Query Architecture

### Production Data Scaling Strategy
# LaPlasse — Architecture & Product Master Document

# Tome 5 — Enterprise Data Architecture & Domain Driven Design

## Partie 5 — Prisma Enterprise Schema Blueprint, Domain Database Mapping, Query Architecture & Production Scaling

---

# 40. Prisma Enterprise Schema Blueprint

Le schéma Prisma constitue :

> **la représentation officielle du modèle de données LaPlasse.**

Il doit être pensé :

### lisible

---

### modulaire

---

### maintenable

---

### scalable

---

### Cursor-friendly

---

### enterprise-ready

---

# 40.1 Schema Philosophy

Le schéma ne doit jamais devenir :

> un monstre de 10 000 lignes ingérable.

Approche retenue :

> **Domain-oriented Prisma Architecture**

---

## Structure recommandée

```txt id="p8v4tm"
prisma/

schema/

identity.prisma

business.prisma

marketplace.prisma

booking.prisma

payment.prisma

review.prisma

crm.prisma

analytics.prisma

communication.prisma

admin.prisma

country.prisma

audit.prisma

shared.prisma

schema.prisma
```

---

## Aggregation Strategy

Le fichier principal :

```txt id="m3x7pk"
schema.prisma
```

sert uniquement :

### datasource

---

### generator

---

### imports modularisés

---

## 40.2 Shared Base Fields

Convention universelle.

Toutes tables critiques :

```txt id="r2w8nk"
id UUID

createdAt

updatedAt

deletedAt
```

Optionnel :

```txt id="h7k1tv"
createdBy
updatedBy
deletedBy
```

---

# 41. Domain Database Mapping

Chaque domaine possède :

> ses tables officielles.

---

# 41.1 Identity Domain Tables

Tables principales :

```txt id="q4p9xm"
User

UserProfile

UserRole

AuthProvider

Session

UserPreference

Address

DeviceFuture
```

---

## Example Ownership

```txt id="d7n2pk"
User
↓
UserProfile
↓
Addresses
```

Un utilisateur :

### plusieurs adresses

---

### plusieurs rôles

---

### plusieurs businesses

---

# 41.2 Business Domain Tables

Tables :

```txt id="x8m4tk"
Business

BusinessBranch

BusinessCategory

BusinessSubcategory

BusinessOwner

BusinessStaff

BusinessClaim

BusinessVerification

BusinessHours

BusinessMedia

BusinessFeature

BusinessSettings

BusinessSubscription
```

---

## Relationship Blueprint

```txt id="p3t8wm"
Business
↓
Products
↓
Bookings
↓
Reviews
↓
Orders
```

---

## Multi-location Structure

```txt id="z6v2pk"
Business Group
↓
Branch A
Branch B
Branch C
```

---

# 41.3 Marketplace Domain Tables

Tables :

```txt id="w9k1xm"
Product

ProductVariant

ProductMedia

ProductInventory

ProductCategory

Cart

CartItem

Order

OrderItem

OrderStatusHistory

Coupon

Promotion

Refund

MerchantCommission
```

---

## Order Relationship

```txt id="b4t7zk"
Order
↓
OrderItems
↓
Products
↓
Business
```

---

## Split Order Support

Un checkout :

```txt id="g8m2pv"
multiple merchants
```

génère :

### plusieurs sous-commandes.

---

# 41.4 Booking Domain Tables

Tables :

```txt id="k2p9tw"
Booking

BookingSlot

BookingType

AvailabilityRule

BookingReminder

BookingHistory

Resource
```

---

## Resource Model

Permet :

Restaurant :

```txt id="n1w7xm"
table
```

Salon :

```txt id="m8t3vk"
stylist
```

Hotel :

```txt id="v3k9tp"
room
```

---

# 41.5 Payment Domain Tables

Tables :

```txt id="p7v1mk"
Payment

Transaction

PaymentProvider

Payout

Settlement

Invoice

Refund

WalletFuture
```

---

## Isolation Rule

Aucune table métier :

> ne manipule directement argent.

Toujours :

```txt id="x2r8pn"
Payment Domain
```

---

# 41.6 Review Domain Tables

Tables :

```txt id="h5v4tm"
Review

ReviewMedia

MerchantResponse

TrustScore

Complaint

ReviewModeration
```

---

# 41.7 Communication Domain Tables

Tables :

```txt id="d9k1tx"
Conversation

Message

Notification

NotificationPreference

MessageTemplate

DeliveryStatus
```

---

# 41.8 CRM Domain Tables

Tables :

```txt id="w2m7pk"
CustomerProfile

CustomerSegment

LoyaltyAccount

LoyaltyTransaction

Reward

Campaign

CampaignAudience

CampaignMessage
```

---

# 41.9 Analytics Domain Tables

Tables :

```txt id="z8t2pv"
AnalyticsEvent

BusinessMetric

RevenueMetric

ConversionMetric

MarketplaceMetric

TrendSnapshot
```

---

## Append-only Rule

Jamais update.

Toujours :

```txt id="f1p9tw"
insert only
```

---

# 41.10 Admin Domain Tables

Tables :

```txt id="r6k3xm"
AdminUser

AdminRole

ModerationCase

FraudAlert

SupportTicket

EscalationCase

AdminActionLog
```

---

# 42. Query Architecture Strategy

Marketplace scale :

> query optimization critique.

---

# 42.1 Query Philosophy

Toujours :

### minimal select

---

### pagination

---

### indexing

---

### caching

---

### avoid deep nesting

---

## Mauvais exemple

```txt id="n5v2pk"
Business
→ everything
→ all products
→ all reviews
→ all bookings
→ all analytics
```

---

## Bon exemple

```txt id="p4k9tm"
Business summary
+
lazy loading
```

---

# 42.2 Read Models

Optimisation lecture.

Créer :

> view models spécialisés.

Ex :

### BusinessCardView

Liste résultats.

---

### BusinessDetailView

Page business.

---

### ProductGridView

Marketplace.

---

### BookingDashboardView

Merchant.

---

## 42.3 Pagination Rules

Obligatoire.

Jamais :

```txt id="y1t8xm"
return all
```

Toujours :

```txt id="j7v2pk"
cursor pagination
```

Pourquoi ?

### performance

---

### consistency

---

### mobile optimization

---

# 43. Performance Optimization Rules

---

## Rule #1

Pas de :

> N+1 queries.

---

## Rule #2

Select explicite.

Jamais :

```txt id="w9k4tm"
select *
```

---

## Rule #3

Heavy joins limités.

Préférer :

### cached summaries

---

### materialized views future

---

## Rule #4

Analytics séparées.

Jamais :

dashboard live complexe sur DB primaire.

---

## Rule #5

Hot data cache.

Ex :

### trending

---

### nearby businesses

---

### categories

---

### homepage feeds

---

# 44. Production Database Scaling

Architecture progressive.

---

## Stage 1 — MVP

```txt id="r2m8pk"
single postgres
```

Support :

jusqu’à forte traction initiale.

---

## Stage 2 — Growth

```txt id="m4v1tx"
Primary DB
+
Read Replicas
+
Redis
```

---

## Stage 3 — Regional Expansion

```txt id="p8w7kn"
regional replicas
```

Pays prioritaires.

---

## Stage 4 — High Scale

```txt id="t1k9xm"
partitioning
+
event streaming
+
data warehouse future
```

---

# 45. Database Health Strategy

Monitoring critique :

### slow queries

---

### deadlocks

---

### failed migrations

---

### replication lag

---

### payment latency

---

### booking latency

---

### search latency

---

# 46. Migration Strategy

Prisma migrations :

> strict governance.

---

## Rules

### migration review required

---

### rollback plan mandatory

---

### staging validation

---

### backward compatible first

---

## Dangerous Change Rule

Jamais :

```txt id="g4m8pv"
breaking migration
```

en production sans plan.

---

# 47. Technical Debt Prevention

Objectif :

> éviter chaos à scale.

---

## Red Flags

### giant models

---

### duplicated fields

---

### business logic in DB

---

### inconsistent naming

---

### enum explosion

---

### missing indexes

---

# Conclusion Tome 5

L’architecture data LaPlasse est désormais :

> **enterprise-grade, scalable et production-ready.**

Elle supporte :

### multi-country

### marketplace

### booking

### analytics

### CRM

### trust

### payments

### high scalability

sans nécessiter :

> refonte majeure future.

La prochaine étape sera :

# Tome 6 — Backend Architecture & System Design

où nous documenterons :

### architecture NestJS

### modular monolith architecture

### APIs

### services

### queues

### Redis

### jobs

### background workers

### file storage

### search engine

### infrastructure communication
