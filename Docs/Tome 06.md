# LaPlasse — Architecture & Product Master Document

# Tome 6 — Backend Architecture & System Design

## Partie 1 — Backend Philosophy, NestJS Architecture, Modular Monolith Design & System Communication

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 1. Introduction

L’architecture backend de LaPlasse doit répondre à une contrainte majeure :

> **supporter un MVP rapide sans sacrifier la scalabilité long terme.**

Le risque principal des plateformes marketplace complexes est :

### overengineering trop tôt

ou

### dette technique massive trop vite.

La stratégie retenue :

> **Modular Monolith → Microservices Ready Architecture**

Autrement dit :

```txt id="f7m2pk"
Simple au début
↓
Scalable ensuite
```

---

# 2. Backend Philosophy

Le backend LaPlasse doit être :

### scalable

---

### maintainable

---

### domain-oriented

---

### observable

---

### testable

---

### secure

---

### queue-ready

---

### async-ready

---

### country-ready

---

## 2.1 Core Principle

Une règle fondamentale :

> **complexité progressive.**

Nous ne construisons pas :

> Netflix architecture day one.

Nous construisons :

> **enterprise-ready MVP architecture.**

---

# 3. Why NestJS

Le framework officiel retenu :

NestJS

Pourquoi ?

---

## 3.1 Enterprise-grade Structure

NestJS impose :

### architecture modulaire

---

### dependency injection

---

### separation of concerns

---

### testing

---

### maintainability

---

Très adapté à :

> marketplace complexe.

---

## 3.2 TypeScript First

LaPlasse adopte :

> **100% TypeScript architecture**

Avantages :

### type safety

---

### fewer runtime errors

---

### better refactoring

---

### Cursor AI compatibility

---

### maintainability

---

## 3.3 DDD Compatibility

NestJS s’adapte naturellement à :

> Domain Driven Design.

Exemple :

```txt id="t8w4pk"
business/

marketplace/

booking/

payments/

crm/
```

---

## 3.4 Microservices-ready

Même sans microservices immédiats :

NestJS facilite migration future.

---

# 4. Global Backend Architecture

Architecture retenue :

> **Modular Monolith**

Vue système :

```txt id="x7v2tm"
API Gateway Layer
↓
Application Layer
↓
Domain Modules
↓
Infrastructure Layer
↓
Database + Redis + Storage
```

---

## 4.1 High-level Request Flow

Exemple :

Commande restaurant.

```txt id="g2k9xm"
Request
↓
Controller
↓
Service
↓
Domain Logic
↓
Repository
↓
Database
↓
Event Emitted
↓
Notification
```

---

# 5. Modular Monolith Architecture

Le système est :

> un seul backend.

Mais :

> fortement isolé par domaines.

---

## 5.1 Domain Modules

Modules principaux :

```txt id="v4m8pk"
identity

business

discovery

marketplace

booking

payment

review

communication

crm

analytics

admin

country

notification

audit
```

---

## 5.2 Module Philosophy

Chaque module possède :

### controllers

---

### services

---

### repositories

---

### DTOs

---

### entities

---

### guards

---

### policies

---

### tests

---

## Exemple :

Business module :

```txt id="k8t1pm"
business/

controllers/

services/

repositories/

dto/

entities/

guards/

policies/

events/

tests/
```

---

## 5.3 Strict Module Boundaries

Jamais :

```txt id="z1w4tm"
business module
↓
direct DB access
↓
payment module tables
```

Communication :

> service interfaces

ou

> domain events.

---

# 6. Layered Backend Architecture

Chaque module suit :

> clean architecture simplifiée.

---

## 6.1 Controller Layer

Responsable :

### request handling

---

### validation

---

### auth checks

---

### serialization

---

Jamais :

> logique métier complexe.

---

## 6.2 Service Layer

Responsable :

### business logic

---

### workflows

---

### orchestration

---

Ex :

OrderService :

```txt id="d7m9pk"
validate cart
↓
calculate total
↓
create payment
↓
create order
↓
emit events
```

---

## 6.3 Repository Layer

Responsable :

### database access

---

### Prisma abstraction

---

Objectif :

> isoler Prisma.

---

## 6.4 Event Layer

Responsable :

### async communication

---

### loose coupling

---

### background triggers

---

# 7. API Architecture

LaPlasse adopte :

> **API-first architecture**

---

## 7.1 API Philosophy

Le backend doit servir :

### web

---

### mobile future

---

### admin

---

### partner APIs future

---

### integrations

---

Une seule logique centrale.

---

## 7.2 REST First

Choix V1 :

> REST API.

Pourquoi ?

### simple

---

### scalable

---

### predictable

---

### Cursor-friendly

---

### mobile-ready

---

GraphQL :

> futur éventuel.

---

## 7.3 API Versioning Strategy

Convention :

```txt id="n4x7pk"
api/v1/
```

Future :

```txt id="m9k2tw"
api/v2/
```

Jamais breaking changes directes.

---

## 7.4 Route Structure

Exemple :

Business :

```txt id="x2m8pv"
/api/v1/businesses
```

Marketplace :

```txt id="t5k9xn"
/api/v1/products
```

Booking :

```txt id="p7w3tm"
/api/v1/bookings
```

---

## 7.5 DTO Strategy

Tous inputs :

> DTO mandatory.

Validation :

class-validator

Jamais :

```txt id="v1m4pk"
raw request body
```

---

## 7.6 API Response Standard

Convention :

Success :

```txt id="z3t8wm"
success
data
meta
```

Erreur :

```txt id="r8k2pn"
success
errorCode
message
details
```

---

# 8. Authentication & Authorization Architecture

Auth officielle :

> JWT + Refresh Tokens.

---

## 8.1 Authentication Flow

```txt id="f6m9pk"
login
↓
access token
↓
refresh token
↓
session renewal
```

---

## 8.2 RBAC

Permissions :

### consumer

---

### merchant

---

### branch manager

---

### cashier

---

### delivery

---

### moderator

---

### admin

---

### super admin

---

## 8.3 Guard Strategy

NestJS guards :

### AuthGuard

---

### RoleGuard

---

### PermissionGuard

---

### BusinessOwnershipGuard

---

# 9. Backend Communication Strategy

Communication inter-modules :

### sync

ou

### async.

---

## Sync Communication

Pour :

### payment verification

---

### booking validation

---

### auth checks

---

## Async Communication

Pour :

### notifications

---

### analytics

---

### CRM updates

---

### loyalty

---

### indexing

---

### emails

---

# 10. Error Handling Architecture

Le backend doit être :

> fault tolerant.

---

## Global Exception Layer

NestJS :

### exception filters

---

### logging

---

### standard errors

---

## Error Categories

### validation error

---

### auth error

---

### business rule error

---

### payment error

---

### external provider error

---

# 11. Logging Strategy

Logs structurés.

Jamais :

```txt id="w3m8pk"
console.log
```

Toujours :

structured logger.

Catégories :

### request logs

---

### error logs

---

### payment logs

---

### security logs

---

### audit logs

---

# Conclusion Partie 1

L’architecture backend LaPlasse est désormais :

> **enterprise-grade tout en restant MVP-friendly.**

Le système repose sur :

### NestJS

### modular monolith

### DDD

### REST-first APIs

### strict module isolation

### JWT auth

### async-ready communication

La prochaine partie documentera :

### Redis Architecture

### Queue System

### Background Jobs

### Event Processing

### File Storage Strategy

### Search Engine Architecture
# LaPlasse — Architecture & Product Master Document

# Tome 6 — Backend Architecture & System Design

## Partie 2 — Redis Architecture, Queue System, Background Jobs, File Storage & Search Engine Architecture

---

# 12. Redis Architecture

LaPlasse adopte :

> **Redis comme couche de performance stratégique.**

Redis ne remplace pas :

> PostgreSQL.

Redis complète :

> PostgreSQL.

Objectif :

> réduire latence, charge DB et améliorer UX.

---

# 12.1 Redis Philosophy

Redis sera utilisé uniquement pour :

### temporary state

---

### hot data

---

### caching

---

### queue processing

---

### sessions

---

### throttling

---

Jamais :

> source of truth business.

La vérité reste :

> PostgreSQL.

---

## 12.2 Redis Core Use Cases

### Authentication

---

### Search Cache

---

### Trending System

---

### Rate Limiting

---

### OTP Storage

---

### Notification Queue

---

### Background Jobs

---

### Session Store Future

---

## 12.3 Redis Key Strategy

Convention stricte :

```txt id="t9k2pm"
domain:resource:identifier
```

Exemples :

Search :

```txt id="x5m7tw"
search:restaurants:cocody
```

OTP :

```txt id="v2r8pk"
otp:userId
```

Trending :

```txt id="m4w9tx"
trending:abidjan:restaurants
```

---

## 12.4 Cache TTL Strategy

Très critique.

Tous les caches expirent.

Exemple :

### Search Results

```txt id="f8k3pn"
5 min
```

---

### Trending Businesses

```txt id="r1v7tm"
15 min
```

---

### Country Config

```txt id="h2m9pk"
24h
```

---

### Homepage Feed

```txt id="q4w1tx"
10 min
```

---

## 12.5 Cache Invalidation Rules

Principe :

> stale data acceptable
>
> wrong data unacceptable.

Exemple :

Business update :

```txt id="n6k2pm"
business updated
↓
invalidate cache
↓
rebuild
```

---

# 13. Queue System Architecture

Marketplace scale nécessite :

> traitement asynchrone.

Le moteur retenu :

BullMQ

Pourquoi ?

### Redis-native

---

### scalable

---

### retries support

---

### delayed jobs

---

### monitoring support

---

### NestJS integration

---

# 13.1 Queue Philosophy

Jamais bloquer :

> requête utilisateur

pour tâches lourdes.

Exemple mauvais :

```txt id="z3m7pk"
create order
↓
send email
↓
send WhatsApp
↓
update CRM
↓
update analytics
↓
response
```

Lent.

---

## Bon modèle

```txt id="v5r1tm"
create order
↓
response user
↓
queue jobs
```

---

# 13.2 Queue Types

Queues principales :

### Notification Queue

---

### Email Queue

---

### WhatsApp Queue

---

### Analytics Queue

---

### Search Index Queue

---

### Recommendation Queue Future

---

### Media Processing Queue

---

### Fraud Detection Queue

---

## 13.3 Retry Strategy

Gestion erreurs.

Exemple :

Notification échoue :

```txt id="x2k9pm"
retry
↓
retry
↓
dead letter queue
```

Jamais boucle infinie.

---

## 13.4 Delayed Jobs

Exemples :

Booking reminder :

```txt id="q8v3tk"
2h avant réservation
```

Review request :

```txt id="p4m1xn"
24h après commande
```

Loyalty reward :

```txt id="d9k7tw"
after completion
```

---

# 14. Background Job Architecture

Les tâches lourdes deviennent :

> workers indépendants.

---

## 14.1 Worker Philosophy

Le backend API :

> répond vite.

Les workers :

> travaillent en arrière-plan.

---

## 14.2 Core Workers

### Notification Worker

---

### Search Index Worker

---

### Analytics Worker

---

### Payment Reconciliation Worker

---

### Loyalty Worker

---

### Review Reminder Worker

---

### Fraud Detection Worker

---

### Media Optimization Worker

---

## 14.3 Example Workflow

Nouvelle commande :

```txt id="m7p2tk"
order.created
↓
notification job
↓
analytics job
↓
CRM job
↓
loyalty job
↓
review reminder job
```

Architecture découplée.

---

# 15. Event Processing Architecture

Événements :

> moteur caché du système.

---

## 15.1 Event Bus Philosophy

Chaque domaine :

émet événements.

Autres domaines :

réagissent.

---

## Example

```txt id="h4w9pk"
payment.completed
↓
order.confirmed
↓
merchant notification
↓
analytics
↓
CRM
↓
loyalty
```

---

## 15.2 Critical vs Non-critical Events

### Critical

Sync.

Ex :

### payment verification

---

### booking validation

---

### fraud checks

---

### permission checks

---

### Non-critical

Async.

Ex :

### emails

---

### analytics

---

### recommendations

---

### marketing automation

---

# 16. File Storage Strategy

LaPlasse dépend fortement des médias.

Images business.

Produits.

Menus.

Galeries.

Documents.

---

# 16.1 Storage Philosophy

Le backend :

> ne stocke jamais fichiers localement.

Toujours :

> object storage.

---

## 16.2 File Categories

### Business Media

logos, covers.

---

### Product Media

catalogues.

---

### User Uploads

reviews images.

---

### Verification Documents

KYC future.

---

### Marketing Assets

campaigns.

---

## 16.3 Storage Architecture

Architecture :

```txt id="t1v8pm"
upload
↓
validation
↓
optimization
↓
storage
↓
CDN delivery
```

---

## 16.4 Image Optimization Pipeline

Automatique.

Support :

### resize

---

### compression

---

### thumbnails

---

### WebP conversion

---

### responsive formats

---

## 16.5 Media Security

Documents sensibles :

### signed URLs

---

### access restriction

---

### private buckets

---

## 16.6 Media Naming Convention

Jamais :

```txt id="g4m2tx"
image1.jpg
```

Toujours :

UUID.

---

# 17. CDN Strategy

Objectif :

> performance pays multi-régions.

CDN pour :

### business images

---

### products

---

### banners

---

### static assets

---

## Benefits

### lower latency

---

### faster loading

---

### lower server load

---

### better mobile experience

---

# 18. Search Engine Architecture

Le moteur recherche constitue :

> un système critique.

Choix retenu :

Meilisearch

Pourquoi ?

### fast

---

### typo tolerance

---

### relevance

---

### geo-ready

---

### NestJS friendly

---

### affordable

---

# 18.1 Search Philosophy

Recherche :

> instantanée.

Objectif UX :

< 100ms perçu.

---

## 18.2 Search Sources

Support :

### business search

---

### product search

---

### category search

---

### location search

---

### autocomplete

---

### recommendations

---

## 18.3 Search Ranking

Facteurs :

### relevance

---

### location

---

### rating

---

### verified status

---

### popularity

---

### response speed

---

### sponsored boost

---

## 18.4 Search Index Strategy

Indexes séparés :

### businesses

---

### products

---

### categories

---

### trending

---

### suggestions

---

## 18.5 Search Sync Architecture

Workflow :

```txt id="b8k4tm"
business updated
↓
event emitted
↓
search indexing queue
↓
meilisearch update
```

Async.

Jamais bloquer API.

---

# 19. Rate Limiting Strategy

Protection critique.

---

## Protected Endpoints

### login

---

### OTP

---

### reviews

---

### search abuse

---

### booking spam

---

### messaging spam

---

## Strategy

Par :

### IP

---

### user

---

### device future

---

### country future

---

# 20. API Performance Strategy

Objectif :

> fast-by-default backend.

---

## Performance Rules

### pagination obligatoire

---

### caching

---

### lazy loading

---

### queue heavy jobs

---

### optimized selects

---

### indexes mandatory

---

## API SLA Goals

### search < 200ms

---

### business page < 300ms

---

### checkout < 500ms

---

### booking < 300ms

---

# Conclusion Partie 2

Le backend LaPlasse est désormais :

> **high-performance & scalable ready**

Grâce à :

### Redis

### BullMQ

### background workers

### async events

### optimized storage

### CDN

### Meilisearch

### performance-first APIs

La prochaine partie documentera :

### Security Infrastructure

### External Integrations Architecture

### Payment Provider Abstraction

### WhatsApp Infrastructure

### Monitoring & Observability

### DevOps Readiness
# LaPlasse — Architecture & Product Master Document

# Tome 6 — Backend Architecture & System Design

## Partie 3 — Security Infrastructure, External Integrations, Payment Abstraction, WhatsApp Infrastructure, Monitoring & DevOps Readiness

---

# 21. Security Infrastructure

La sécurité backend LaPlasse doit être :

> **multi-layered by design**

et non :

> feature-by-feature.

L’objectif :

> limiter le blast radius d’une faille.

---

# 21.1 Security Philosophy

Principe :

> **Zero Trust Backend**

Toujours considérer :

```txt id="x7m2pk"
request
=
untrusted
```

Validation obligatoire.

---

## 21.2 Security Layers

Architecture sécurité :

```txt id="m3v9tk"
Network Security
↓
API Security
↓
Authentication
↓
Authorization
↓
Business Rules
↓
Audit Logging
↓
Fraud Monitoring
```

---

## 21.3 API Security

Toutes les routes protégées utilisent :

### JWT validation

---

### role checks

---

### permission checks

---

### ownership checks

---

### throttling

---

### request validation

---

## 21.4 Request Validation

Jamais confiance frontend.

Validation obligatoire via :

class-validator

et :

class-transformer

---

## 21.5 Sensitive Endpoints Protection

Protection renforcée :

### payout endpoints

---

### payment webhooks

---

### admin actions

---

### ownership transfer

---

### moderation override

---

### subscription changes

---

## 21.6 Secrets Management

Jamais :

```txt id="t6p8xm"
secret in repo
```

Toujours :

```txt id="d9k4tv"
.env
secret manager future
```

---

## 21.7 Encryption Strategy

### Passwords

Toujours hashés.

Avec :

Argon2

---

### Sensitive fields

Chiffrés.

Ex :

### business verification docs

---

### legal identity future

---

### payout information

---

## 21.8 Abuse Prevention

Détection :

### fake accounts

---

### OTP abuse

---

### review spam

---

### booking spam

---

### checkout abuse

---

### payment fraud

---

# 22. External Integrations Architecture

LaPlasse doit être :

> **integration-first**

Sans couplage fort.

---

# 22.1 Integration Philosophy

Jamais :

> provider-specific logic partout.

Toujours :

> abstraction layer.

---

## 22.2 Integration Categories

### payments

---

### WhatsApp

---

### SMS

---

### maps

---

### emails

---

### analytics future

---

### logistics future

---

### ads future

---

## 22.3 Adapter Pattern

Architecture :

```txt id="h8w1pk"
Provider Interface
↓
Provider Adapter
↓
Business Logic
```

Exemple paiement :

```txt id="k4v9tm"
PaymentService
↓
ProviderAdapter
↓
Wave
Orange
CinetPay
Hub2
```

Backend découplé.

---

# 23. Payment Provider Abstraction

Le système paiement doit supporter :

> changement provider sans refactor.

---

## 23.1 Payment Gateway Philosophy

Jamais :

```txt id="r1k8pm"
hardcoded provider
```

Toujours :

```txt id="f9v2tx"
payment abstraction
```

---

## 23.2 Supported Providers (V1)

Pour la Côte d'Ivoire :

### Wave

---

### Orange Money

---

### MTN MoMo

---

### cartes bancaires

---

### CinetPay

---

### Hub2

---

## 23.3 Payment Interface

Convention :

```txt id="m7p3tw"
initializePayment()

verifyPayment()

refundPayment()

getStatus()
```

Tous providers implémentent.

---

## 23.4 Webhook Architecture

Paiements :

> webhook mandatory.

Workflow :

```txt id="p2v8kn"
provider callback
↓
signature validation
↓
payment verification
↓
order confirmation
↓
event emitted
```

---

## 23.5 Idempotency Strategy

Éviter :

> double paiement.

Support :

### idempotency key

---

### duplicate transaction detection

---

### replay protection

---

# 24. WhatsApp Infrastructure

Pour l’Afrique :

> **WhatsApp est un canal primaire.**

---

# 24.1 WhatsApp Philosophy

WhatsApp doit fonctionner comme :

> extension naturelle du produit.

Jamais :

> remplacement du produit.

---

## 24.2 WhatsApp Use Cases

### reservation confirmation

---

### booking reminders

---

### order updates

---

### support

---

### merchant contact

---

### promotions future

---

### abandoned cart future

---

## 24.3 WhatsApp Architecture

Architecture :

```txt id="w4k9tm"
trigger
↓
notification service
↓
message template
↓
provider
↓
delivery tracking
```

---

## 24.4 Template System

Templates :

### booking confirmation

---

### order confirmation

---

### reminder

---

### payment success

---

### review request

---

## 24.5 Provider Abstraction

Jamais couplé à un provider.

Support futur :

### Meta WhatsApp API

---

### Twilio future

---

### local providers future

---

# 25. Email Infrastructure

Email :

> secondaire mais important.

---

## Use Cases

### welcome email

---

### password reset

---

### merchant onboarding

---

### receipts

---

### admin alerts

---

## Architecture

Queue obligatoire.

Jamais sync.

---

# 26. SMS Infrastructure

SMS réservé :

> événements critiques.

---

## SMS Use Cases

### OTP

---

### payment critical

---

### booking urgent reminder

---

### security alerts

---

# 27. Maps Infrastructure

La géolocalisation est :

> centrale.

---

## 27.1 Maps Strategy

Provider configurable.

Support :

### Google Maps

---

### OpenStreetMap future

---

### Mapbox future

---

## 27.2 Location Features

### nearby search

---

### directions

---

### geocoding

---

### reverse geocoding

---

### map pin placement

---

### landmarks support

---

## 27.3 Africa-first Address Logic

Support :

### descriptive location

---

### custom landmarks

---

### manual pin placement

---

### WhatsApp location future

---

# 28. Monitoring & Observability

Un backend scalable :

> doit être observable.

---

# 28.1 Observability Philosophy

Question critique :

> que se passe-t-il réellement ?

---

## 28.2 Monitoring Categories

### API latency

---

### DB performance

---

### Redis health

---

### queue failures

---

### payment success rate

---

### booking failures

---

### notification delivery

---

### provider downtime

---

## 28.3 Error Tracking

Centralisé.

Objectif :

### fast debugging

---

### issue tracing

---

### production visibility

---

## 28.4 Business-critical Alerts

Alertes :

### payment failures spike

---

### search downtime

---

### notification failures

---

### webhook failures

---

### DB slowdown

---

### queue stuck

---

# 29. Logging Architecture

Logs structurés.

---

## Log Categories

### request logs

---

### payment logs

---

### security logs

---

### provider logs

---

### queue logs

---

### moderation logs

---

### admin logs

---

## Correlation IDs

Chaque requête :

> traceable end-to-end.

Ex :

```txt id="z1p7tk"
requestId
```

---

# 30. DevOps Readiness

LaPlasse doit être :

> deployment-ready.

---

## 30.1 Environment Strategy

Environnements :

```txt id="x5m3pv"
local
↓
development
↓
staging
↓
production
```

Isolation stricte.

---

## 30.2 Configuration Management

Jamais hardcoded.

Toujours :

```txt id="w7k9tm"
environment variables
```

---

## 30.3 CI/CD Philosophy

Objectif :

> safe deployments.

Pipeline :

```txt id="c4v2pk"
test
↓
lint
↓
build
↓
migration validation
↓
deploy
```

---

## 30.4 Rollback Strategy

Chaque déploiement :

> reversible.

---

## 30.5 Infrastructure Scalability

Architecture prête pour :

### containers

---

### kubernetes future

---

### autoscaling future

---

### regional deployment future

---

# 31. Backend Technical Stack Recommendation

Stack officielle recommandée :

### Backend

NestJS

---

### Database

PostgreSQL

---

### ORM

Prisma

---

### Cache

Redis

---

### Queue

BullMQ

---

### Search

Meilisearch

---

### Storage

S3-compatible storage.

---

### Monitoring Future

Sentry

---

### Containerization

Docker

---

# Conclusion Partie 3

L’architecture backend LaPlasse est désormais :

> **enterprise-grade, scalable et production-ready.**

Elle supporte :

### marketplace complexe

### multi-country

### bookings

### ecommerce

### WhatsApp-first interactions

### analytics

### high scalability

tout en restant :

> **MVP-friendly pour un lancement rapide.**

La prochaine étape sera :

# Tome 7 — Frontend Architecture, UX System & Design Engineering

avec :

### architecture Next.js

### App Router

### frontend modular architecture

### state management

### React Query

### mobile-first UX

### component system

### design tokens

### multi-device strategy
