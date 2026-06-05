# LaPlasse — Architecture & Product Master Document

# Tome 2 — Personas, User Ecosystem & Behavioral Model

**Version :** 1.0
**Statut :** Draft Fondatrice
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

# 1. Introduction

Le succès d’une plateforme multi-acteurs comme LaPlasse repose sur une compréhension fine de son écosystème utilisateur.

Contrairement à un produit classique orienté vers un seul utilisateur, LaPlasse fonctionne comme une plateforme multi-sided impliquant plusieurs groupes interdépendants :

* consommateurs ;
* commerçants ;
* employés des commerces ;
* livreurs ;
* équipes internes ;
* partenaires externes.

Chaque catégorie possède :

* des besoins différents ;
* des comportements différents ;
* des niveaux de maturité digitale différents ;
* des attentes différentes.

La compréhension de ces comportements est essentielle pour :

* concevoir les interfaces ;
* prioriser les fonctionnalités ;
* optimiser les conversions ;
* améliorer la rétention ;
* maximiser la monétisation.

---

# 2. User Ecosystem Architecture

LaPlasse fonctionne selon une architecture utilisateur multi-acteurs.

Chaque acteur influence indirectement les autres.

L’écosystème retenu est le suivant :

```txt id="1t7kx9"
Consumers
↓
Businesses
↓
Business Staff
↓
Delivery Partners
↓
Admins
↓
Partners & Integrations
```

---

## 2.1 Consumers (Consommateurs)

Les consommateurs représentent le moteur de demande.

Ils utilisent LaPlasse pour :

### découvrir

---

### comparer

---

### réserver

---

### commander

---

### payer

---

### contacter

---

### recommander

Leur satisfaction influence directement :

* les reviews ;
* la réputation des commerces ;
* la croissance organique.

---

## 2.2 Businesses (Commerçants)

Les commerçants constituent le moteur de l’offre.

Ils utilisent LaPlasse pour :

* être visibles ;
* acquérir des clients ;
* recevoir des réservations ;
* vendre ;
* fidéliser ;
* analyser leurs performances.

Leur engagement détermine :

* la qualité de l’offre ;
* la richesse catalogue ;
* la densité du marché.

---

## 2.3 Business Staff

Le propriétaire n’est pas toujours opérateur.

Exemples :

restaurant :

* manager ;
* caissier ;
* responsable réservation.

salon :

* réception ;
* coiffeur ;
* manager.

hôtel :

* réceptionniste ;
* manager.

LaPlasse doit supporter :

> **multi-user business management**

---

## 2.4 Delivery Partners

Pour le modèle hybride livraison.

Types :

### livreur commerçant

---

### livreur indépendant

---

### partenaire logistique tiers

---

## 2.5 Admin Ecosystem

Équipe interne LaPlasse.

Rôles :

### moderation

---

### support

---

### finance

---

### partnerships

---

### growth

---

### operations

---

### super admin

---

## 2.6 Partners

Futurs partenaires :

* paiement ;
* logistique ;
* API externes ;
* publicité ;
* CRM.

---

# 3. Persona Matrix

Les personas LaPlasse sont divisés en cinq familles :

### Consumer Personas

---

### Merchant Personas

---

### Staff Personas

---

### Delivery Personas

---

### Internal Admin Personas

---

# 4. Consumer Personas

Le comportement consommateur africain est :

> mobile-first, WhatsApp-heavy et confiance-driven.

Nous identifions cinq personas principaux.

---

# Persona 1 — The Explorer

## Profil

Utilisateur curieux.

Cherche :

* restaurants ;
* nouveaux lieux ;
* sorties.

Souvent :

18–35 ans.

Très mobile.

---

## Motivations

* découvrir ;
* essayer ;
* explorer.

---

## Frustrations

* mauvaise géolocalisation ;
* informations obsolètes ;
* faux avis.

---

## Comportement

Parcours :

```txt id="1hjk8w"
search
↓
photos
↓
reviews
↓
maps
↓
visit
```

---

## Déclencheurs conversion

* photos premium ;
* social proof ;
* popularité.

---

## Features prioritaires

* recherche avancée ;
* trending places ;
* recommandations.

---

# Persona 2 — The Convenience Consumer

## Profil

Cherche rapidité.

Objectif :

> résoudre un besoin immédiat.

Ex :

```txt id="wx6f6d"
restaurant proche
pharmacie ouverte
salon disponible
```

---

## Motivations

* rapidité ;
* proximité ;
* disponibilité.

---

## Frustrations

* lenteur ;
* faux horaires ;
* indisponibilité.

---

## Comportement

```txt id="y7fdrn"
search
↓
filter
↓
call/whatsapp
↓
transaction
```

---

## Features critiques

* open now ;
* nearby ;
* ETA ;
* instant booking.

---

# Persona 3 — The Social Consumer

## Profil

Décisions influencées par :

* avis ;
* tendances ;
* influence sociale.

---

## Motivations

Confiance.

---

## Frustrations

Faux avis.

---

## Déclencheurs

### Verified reviews

---

### photos réelles

---

### notes élevées

---

### recommandations

---

## Features critiques

* reviews system ;
* social proof ;
* trusted badges.

---

# Persona 4 — The Buyer

## Profil

Fort usage marketplace.

Commande régulièrement.

Ex :

* nourriture ;
* beauté ;
* retail.

---

## Motivations

Confort.

---

## Frustrations

* mauvais suivi ;
* retard livraison ;
* stock faux.

---

## Features critiques

* fast checkout ;
* order tracking ;
* reorder.

---

# Persona 5 — The Premium Consumer

## Profil

Pouvoir d’achat plus élevé.

Cherche :

### qualité

### exclusivité

### expérience premium

---

## Motivations

Confiance élevée.

---

## Déclencheurs

### premium badges

---

### verified business

---

### curated recommendations

---

## Opportunité business

Très forte monétisation.

---

# 5. Consumer Behavioral Model

Parcours moyen consommateur :

```txt id="zn2u0p"
Search
↓
Explore
↓
Compare
↓
Trust validation
↓
Action
↓
Purchase/Booking
↓
Review
↓
Retention
```

---

## 5.1 Search Stage

Entrées possibles :

### recherche texte

---

### catégorie

---

### map discovery

---

### recommandations

---

### publicité sponsorisée

---

## 5.2 Validation Stage

Avant conversion :

consommateur vérifie :

* photos ;
* avis ;
* localisation ;
* badge confiance ;
* prix.

---

## 5.3 Action Stage

Actions possibles :

### réserver

---

### appeler

---

### WhatsApp

---

### acheter

---

### demander itinéraire

---

## 5.4 Retention Stage

Retour utilisateur si :

* bonne expérience ;
* recommandation pertinente ;
* programme fidélité.

---

# 6. Merchant Personas

Les commerçants sont très hétérogènes.

Nous retenons quatre personas principaux.

---

# Persona Merchant 1 — Small Informal Merchant

## Exemple

Petit maquis.

Petit salon.

Boutique locale.

---

## Maturité digitale

Faible.

Souvent :

```txt id="66hpxv"
WhatsApp
Facebook
cash
```

---

## Objectifs

### plus de clients

---

### visibilité

---

### simplicité

---

## Peurs

* complexité technique ;
* coût ;
* manque de confiance.

---

## Onboarding requis

Ultra simple.

< 5 minutes.

---

# Persona Merchant 2 — Growing Business

## Exemple

Restaurant moyen.

Chaîne locale.

---

## Maturité digitale

Moyenne.

---

## Objectifs

* réservations ;
* analytics ;
* ventes.

---

## Déclencheur upgrade

ROI visible.

---

# Persona Merchant 3 — Premium Business

## Exemple

Hôtel premium.

Restaurant premium.

---

## Objectifs

* image de marque ;
* CRM ;
* réservation premium.

---

## Monétisation

Très forte.

---

# Persona Merchant 4 — Multi-location Business

## Exemple

Chaîne.

---

## Besoin

Dashboard multi-sites.

---

## Features critiques

### central management

---

### analytics consolidées

---

### permissions avancées
# LaPlasse — Architecture & Product Master Document

# Tome 2 — Personas, User Ecosystem & Behavioral Model (Suite)

---

# 7. Business Staff Personas

Dans de nombreux business africains, le propriétaire n’est pas l’opérateur quotidien.

La gestion opérationnelle est souvent déléguée.

LaPlasse doit donc intégrer dès V1 une logique :

> **multi-staff & role-based management**

Chaque rôle dispose :

* de permissions spécifiques ;
* d’un dashboard adapté ;
* de responsabilités limitées.

---

# Staff Persona 1 — Business Owner

## Profil

Propriétaire ou fondateur.

Peut gérer :

* un ou plusieurs établissements ;
* plusieurs employés ;
* plusieurs catégories business.

---

## Objectifs

### croissance business

---

### visibilité

---

### revenus

---

### analytics

---

### fidélisation client

---

## Frustrations

* faible visibilité ;
* manque de données ;
* faible conversion.

---

## Besoins produit

Dashboard global :

### revenus

---

### commandes

---

### réservation

---

### performance marketing

---

### réputation

---

### gestion employés

---

## Features critiques

### business analytics

---

### staff management

---

### multi-location management

---

### promotions

---

### ads management

---

# Staff Persona 2 — Branch Manager

## Profil

Responsable opérationnel d’un établissement.

Ex :

restaurant manager.

---

## Objectifs

### efficacité opérationnelle

---

### satisfaction client

---

### gestion commandes

---

### gestion réservations

---

## Permissions

Peut :

### voir activité établissement

---

### gérer commandes

---

### gérer agenda

---

### répondre reviews

---

Ne peut pas :

### modifier facturation

---

### gérer abonnements

---

## Dashboard recommandé

Vue simplifiée.

Temps réel.

---

# Staff Persona 3 — Reservation Manager

## Profil

Spécifique :

* restaurant ;
* salon ;
* hôtel.

---

## Objectifs

### réduire no-show

---

### optimiser planning

---

### maximiser occupation

---

## Features critiques

### calendar management

---

### availability slots

---

### booking status

---

### reminders WhatsApp

---

## Workflow

```txt id="pv0dhw"
booking request
↓
validation
↓
confirmation
↓
reminder
↓
visit
```

---

# Staff Persona 4 — Cashier / Sales Staff

## Profil

Personnel point de vente.

---

## Objectifs

### rapidité

---

### gestion commandes

---

### validation paiements

---

## Permissions limitées

Peut :

### confirmer commande

---

### voir stock

---

### enregistrer paiement

---

Ne peut pas :

### voir analytics avancées

---

### gérer business settings

---

## UX recommandée

Interface minimaliste.

Très rapide.

Mobile-first.

---

# Staff Persona 5 — Marketing Manager

## Profil

Souvent business premium.

---

## Objectifs

### visibilité

---

### acquisition

---

### engagement

---

## Features critiques

### campaigns

---

### sponsored listing

---

### coupons

---

### loyalty

---

### analytics marketing

---

# 8. Delivery Personas

Le modèle retenu pour LaPlasse est :

> **hybrid delivery architecture**

Cela implique plusieurs profils livreurs.

---

# Delivery Persona 1 — Merchant Delivery Rider

## Profil

Livreur interne business.

Ex :

restaurant.

---

## Objectifs

### livrer rapidement

---

### optimiser trajets

---

## Features critiques

### order assignment

---

### delivery tracking

---

### delivery proof

---

## Interface recommandée

Très simple.

Mobile.

Peu de texte.

---

# Delivery Persona 2 — Independent Rider

## Profil

Livreur freelance.

---

## Objectifs

### maximiser revenus

---

### réduire temps morts

---

## Features critiques

### task queue

---

### earnings dashboard

---

### GPS assistance

---

### payout tracking

---

# Delivery Persona 3 — Third-party Logistics Partner

## Profil

Entreprise partenaire.

---

## Besoin

API integration.

---

## Fonctionnement

```txt id="h3t6jq"
order
↓
partner assignment
↓
tracking
↓
delivery confirmation
```

---

# 9. Internal Admin Personas

LaPlasse nécessite une forte gouvernance interne.

Une marketplace non modérée échoue rapidement.

---

# Admin Persona 1 — Support Agent

## Objectifs

### résoudre tickets

---

### assister commerçants

---

### résoudre disputes

---

## Permissions

### support access

---

### limited user visibility

---

## Dashboard

* tickets ;
* conversations ;
* escalations.

---

# Admin Persona 2 — Moderation Team

## Objectifs

### éviter fraude

---

### vérifier business

---

### supprimer faux contenus

---

## Contrôle :

### fake reviews

---

### fake listings

---

### abusive content

---

## Features critiques

### moderation queue

---

### review validation

---

### fraud alerts

---

# Admin Persona 3 — Operations Manager

## Objectifs

### croissance supply

---

### activation business

---

### onboarding qualité

---

## KPIs

### claim conversion rate

---

### merchant activation

---

### verified businesses

---

# Admin Persona 4 — Finance Team

## Objectifs

### commissions

---

### payouts

---

### abonnements

---

### disputes paiement

---

## Features critiques

### financial reconciliation

---

### payout system

---

### invoice tracking

---

# Admin Persona 5 — Growth Team

## Objectifs

### acquisition

---

### engagement

---

### retention

---

## Features critiques

### campaign analytics

---

### segmentation

---

### experimentation

---

# Admin Persona 6 — Super Admin

## Profil

Contrôle total plateforme.

---

## Permissions

### full access

---

### configuration globale

---

### country settings

---

### monetization settings

---

### moderation override

---

### feature flags

---

# 10. Trust Psychology Model

Le facteur critique de conversion dans LaPlasse est :

> **la confiance.**

Sans confiance :

* pas de réservation ;
* pas de paiement ;
* pas de fidélité.

---

## 10.1 Trust Signals

Le système devra afficher des signaux visibles.

### verified business

---

### verified phone

---

### verified reviews

---

### response rate

---

### response speed

---

### order completion score

---

### business age

---

### real photos

---

## 10.2 Trust Pyramid

La confiance suit cette logique :

```txt id="6z2x9g"
Visual proof
↓
Reviews
↓
Business verification
↓
Successful interactions
↓
Brand trust
```

---

# 11. Retention Models

Une marketplace scalable doit créer :

> des habitudes.

---

## Consumer Retention Loop

```txt id="l1r3a5"
search
↓
good experience
↓
review
↓
favorite
↓
notification
↓
repeat purchase
```

---

## Merchant Retention Loop

```txt id="u5h9xk"
claim listing
↓
receive leads
↓
receive orders
↓
see ROI
↓
upgrade subscription
↓
deeper adoption
```

---

# 12. Friction Mapping

Pourquoi un utilisateur abandonne.

---

## Consumer Frictions

### mauvaise recherche

---

### faux horaires

---

### pas assez photos

---

### faible confiance

---

### checkout compliqué

---

### paiement échoué

---

## Merchant Frictions

### onboarding trop complexe

---

### ROI non visible

---

### mauvaise UX dashboard

---

### manque commandes

---

### setup long

---

# 13. Product Design Implications

Ces personas imposent des choix forts.

---

## Mobile-first obligatoire

---

## WhatsApp-first

---

## Lite mode Afrique

---

## Progressive onboarding

---

## Adaptive UI by business type

---

## Dashboard simplifié

---

## Fast checkout

---

## Trust-first UX

---

# Conclusion Tome 2

LaPlasse opère dans un environnement :

### multi-acteurs

### multi-comportements

### multi-niveaux de maturité digitale

Le produit doit donc être pensé :

> **adaptive, trust-driven et mobile-first.**

La compréhension des comportements utilisateurs constitue la base :

* des fonctionnalités ;
* des dashboards ;
* de la monétisation ;
* de la rétention ;
* des performances business.

Les tomes suivants utiliseront ces personas comme référence produit officielle.
