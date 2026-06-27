# LaPlasse Food — Règles de gestion complètes
## Module commande de menus & livraison de repas

> **Contexte** : Module intégré à la marketplace LaPlasse — Multi-pays Afrique de l'Ouest (CI, SN, + extensions) — Devise XOF — Modèle de livraison tripartite (livreurs LaPlasse indépendants / flottes internes restaurants / prestataires logistiques)  
> **Interfaces** : Application mobile (iOS & Android) pour les clients et les restaurants — Interface web dédiée pour les livreurs (indépendants et internes restaurant) et les prestataires logistiques  
> **Version document** : 1.7 — 27 juin 2026  
> **Statut** : Document de référence Food — v1.7 inclut Phases 4, 5, 6 complètes + menus composés + tags diététiques + alcool + §12 BF  
> **Intégration** : Hub `/restauration`, fiche menu `/restauration/{slug}`, moteur menu existant, checkout `/commande`

---

## Comment lire ce document

Chaque section distingue trois niveaux :

| Badge | Signification |
|---|---|
| **✅ En place** | Comportement implémenté et exploitable aujourd'hui |
| **🟡 Partiel** | Existe mais incomplet, contourné ou incohérent avec la cible |
| **⬜ À implémenter** | Décrit dans la cible produit, absent du code |

> Fichiers techniques associés : `shop-menu.service.ts`, `FoodMenuOrderPanel.tsx`, `marketplace.service.ts` (commandes menu), `apps/web/src/app/restauration/*`, `apps/web/src/lib/foodHub.ts`.

---

## 0. Synthèse plateforme vs cible

### Architecture actuelle (résumé)

| Couche | Implémentation |
|---|---|
| **Vertical Food** | Catégories établissement `restaurants`, `fast-food`, `cafes`, `bars-lounges` (`merchantVertical.ts`) |
| **Hub découverte (mobile/tablette)** | `/restauration` — liste unifiée, recherche Meilisearch plats, chips catégorie, filtres rapides |
| **Hub desktop** | `/restauration` → redirect vers `/categories/{cat}` ; catégories food conservent le parcours desktop classique |
| **Fiche commande mobile** | `/restauration/{slug}` — hero établissement + `FoodMenuOrderPanel` (variant restauration) |
| **Fiche complète desktop** | `/m/{slug}?tab=menu` — profil + menu inline (`FoodMenuOrderPanel` variant default) |
| **Deep-link plat** | `?plat={menuItemId}` sur `/restauration/{slug}` (recherche hub → fiche) |
| **Catalogue menu** | Sections + articles + modificateurs obligatoires/optionnels (`ShopMenu*`, API `/shop-menu`) |
| **Panier & checkout** | Panier marketplace unifié → `/commande` (livraison / retrait, adresse, paiement) |
| **Préparation** | `Merchant.food_prep_minutes` + `MenuItem.prep_minutes` exposés API + affichés hub / fiche |
| **Commande minimum** | `Merchant.food_min_order_amount` — back-office menu, fiche, panier, validation checkout API |
| **Back-office resto** | `/merchant/shop/menu` — gestion sections, plats, options, paramètres (prep + minimum) |

### Tableau de maturité (extrait)

| Domaine | En place | Partiel | À implémenter |
|---|---|---|---|
| Hub Restauration unifié (mobile) | ✅ `/restauration` | | ⬜ app native dédiée |
| Parcours desktop vs mobile | ✅ séparation `< lg` | | |
| Redirection catégories food (mobile) | ✅ chips → hub | | |
| Recherche plats Meilisearch + images | ✅ index `menu_items` | | |
| Deep-link plat depuis recherche | ✅ `?plat=` | | |
| Fiche menu dédiée (hero + carte) | ✅ `/restauration/{slug}` | 🟡 partage / promos hub | |
| Sections menu + modificateurs | ✅ | | |
| ETA préparation (`food_prep_minutes`) | ✅ ETA dynamique distance (prep + buffer livraison) | | |
| Filtres hub (rapide, top, promos) | ✅ client-side + promos réelles `has_active_promo` | | |
| Notation restaurant | ✅ `avg_rating` hub cards + fiche | | |
| Commande minimum | ✅ `food_min_order_amount` | | |
| Pause / fermeture restaurant | ✅ pause + fermeture manuelle + auto après 3 non-réponses | | |
| Badge statut disponibilité (hub + fiche) | ✅ | | |
| Allergènes par plat | ✅ `MenuItem.allergens[]` — back-office + cartes menu client | | |
| Tags diététiques (halal, vegan, épicé…) | ✅ `MenuItem.item_tags[]` — back-office + badges client | | |
| Mention "Contient de l'alcool" | ✅ `MenuItem.contains_alcohol` — back-office + badge rouge client | | |
| Tags cuisines proposées | ✅ sélecteur multi-tags back-office | | |
| Livraison tripartite & dispatch | ✅ scoring GPS + charge + note + expérience | | |
| Tracking livreur temps réel | ✅ carte live + route OSRM dessinée + position GPS | | |
| App mobile restaurant | ⬜ | | ⬜ |
| Paiement cash à la livraison | ✅ COD par restaurant + plafond + multi-pays | | |

### Parcours client recommandé

**Mobile / tablette (< 1024px)**

```
Accueil → /restauration → filtre catégorie → /restauration/{slug}
  → panier (dock) → /commande → confirmation / suivi livraison
```

**Desktop (≥ 1024px)**

```
Accueil → /categories/restaurants (ou fast-food, cafés…) → /m/{slug}?tab=menu
  → panier → /commande → confirmation / suivi livraison
```

Sur mobile, les URLs `/categories/{slug-food}` peuvent rediriger vers le hub avec le filtre correspondant. Sur desktop, les catégories food conservent la liste classique d'établissements.

---


## Sommaire

0. [Synthèse plateforme vs cible](#0-synthèse-plateforme-vs-cible)
1. [Vision & principes fondamentaux](#1-vision--principes-fondamentaux)
2. [Acteurs du système](#2-acteurs-du-système)
3. [Onboarding & gestion des restaurants](#3-onboarding--gestion-des-restaurants)
4. [Catalogue & gestion des menus](#4-catalogue--gestion-des-menus)
5. [Parcours client — commande](#5-parcours-client--commande)
6. [Gestion des prix & commissions](#6-gestion-des-prix--commissions)
7. [Module livraison tripartite & dispatch](#7-module-livraison-tripartite)
8. [Gestion des commandes (cycle de vie)](#8-gestion-des-commandes-cycle-vie)
9. [Paiement & reversement](#9-paiement--reversement)
10. [Notation & avis](#10-notation--avis)
11. [Gestion des incidents & litiges](#11-gestion-des-incidents--litiges)
12. [Multi-pays — spécificités par marché](#12-multi-pays--spécificités-par-marché)
13. [Conformité légale & hygiène alimentaire](#13-conformité-légale--hygiène-alimentaire)
14. [Tableaux de bord & KPIs](#14-tableaux-de-bord--kpis)
15. [Règles de modération & sanctions](#15-règles-de-modération--sanctions)
16. [Checklist onboarding restaurant](#16-checklist-onboarding-restaurant)
17. [Roadmap d'harmonisation Food](#17-roadmap-dharmonisation-food)

---

## 1. Vision & principes fondamentaux

LaPlasse Food est le module de commande et de livraison de repas intégré à la marketplace LaPlasse. Il permet à tout type d'établissement de restauration — du grand restaurant aux maquis de quartier, dark kitchens, traiteurs et vendeurs structurés — de vendre leurs plats en ligne avec une expérience unifiée pour le client.

### 1.1 Positionnement

LaPlasse Food n'est pas une copie d'Uber Eats ou Glovo. Il est conçu pour les réalités ouest-africaines :

- **Adresses non standardisées** : beaucoup de clients ne peuvent pas donner une adresse précise — le système doit gérer la localisation GPS, les points de repère locaux ("après la pharmacie Hayat", "face à l'école primaire"), et les zones sans adresse formelle
- **Paiements cash dominants** : la majorité des transactions passent par le cash à la livraison ou le Mobile Money (Wave, Orange Money, MTN MoMo). La carte bancaire est secondaire.
- **Connexion instable** : le parcours client doit fonctionner avec une connexion 3G faible, voire hors ligne pour certaines étapes
- **Confiance communautaire** : la notation et la réputation du restaurant sont des vecteurs de conversion plus forts que les photos

### 1.2 Principes non négociables

- **Transparence totale des prix** : le client voit le prix final (plat + frais de livraison + frais de service) avant de confirmer sa commande — zéro surprise
- **Temps réel** : le statut de la commande et la position du livreur doivent être visibles en temps réel par le client
- **Fiabilité > Vitesse** : mieux vaut un délai annoncé réaliste que un délai optimiste non tenu
- **LaPlasse arbitre** : en cas de conflit entre restaurant, livreur et client, LaPlasse a le dernier mot et sa décision s'impose à toutes les parties

---

## 2. Acteurs du système

### 2.1 Les cinq acteurs

```
CLIENT ──── commande ────► RESTAURANT ──── prépare ────► LIVREUR ──── livre ────► CLIENT
    │                           │                            │
    └──── paye ────► LAPLASSE ──┴──── reverse ────────────►─┘
                        │
                   PRESTATAIRE LOGISTIQUE (si dispatch externe)
```

| Acteur | Rôle | Interface |
|---|---|---|
| **Client** | Passe commande, paye, reçoit, note | **Application mobile LaPlasse** (iOS & Android) |
| **Restaurant** | Gère son menu, accepte/refuse les commandes, prépare | **Application mobile LaPlasse** — espace partenaire restaurant |
| **Livreur LaPlasse** | Indépendant référencé LaPlasse, dispatché par l'algorithme | **Interface web dédiée livreur** (optimisée mobile browser) |
| **Livreur interne restaurant** | Salarié ou prestataire du restaurant | **Interface web dédiée livreur** (accès restreint au périmètre du restaurant) |
| **Prestataire logistique** | Entreprise de livraison partenaire (B2B), dispatche ses livreurs sur les bons reçus | **Interface web dédiée prestataire** + API LaPlasse |

### 2.2 Rôles LaPlasse

LaPlasse assure les fonctions suivantes sur ce module :

- **Plateforme technique** : catalogue, commande, paiement, tracking
- **Dispatching** : algorithme d'attribution des livraisons
- **Modération** : validation des restaurants, contrôle qualité
- **Service client** : médiation entre toutes les parties
- **Reversements financiers** : collecte et redistribution des flux

---

## 3. Onboarding & gestion des restaurants

### 3.1 Catégories d'établissements acceptés

LaPlasse définit la liste des catégories autorisées. Par défaut, sont acceptés :

| Catégorie | Exemples | Exigences spécifiques |
|---|---|---|
| **Restaurant classique** | Restaurant avec salle, carte structurée | Numéro d'enregistrement commerce |
| **Maquis / Cabaret** | Restauration populaire, plats locaux | Autorisation d'exploitation |
| **Fast-food local** | Braiseuse, vendeur de brochettes structuré | Autorisation d'exploitation |
| **Boulangerie / Pâtisserie** | Pain, viennoiseries, gâteaux | Autorisation d'exploitation |
| **Dark Kitchen** | Cuisine uniquement pour livraison, sans salle | Autorisation + inspection hygiène |
| **Traiteur** | Cuisine événementielle, commandes à l'avance | Autorisation + délai minimum commande |
| **Café / Salon de thé** | Boissons chaudes, snacks | Autorisation d'exploitation |
| **Glacier / Jus de fruits** | Boissons fraîches, glaces artisanales | Autorisation d'exploitation |

> LaPlasse peut à tout moment **restreindre ou étendre** les catégories acceptées par pays, par ville, ou globalement. La décision est souveraine et notifiée avec un préavis de 15 jours aux établissements concernés, sauf manquement grave à l'hygiène.

**Ne sont pas acceptés sans dérogation explicite de LaPlasse :**
- Vendeurs ambulants non domiciliés
- Revendeurs de plats cuisinés par des tiers sans transparence sur l'origine
- Établissements faisant l'objet d'une fermeture administrative en cours

### 3.2 Processus d'onboarding restaurant

#### Étape 1 — Pré-inscription (restaurant)
Le restaurant soumet via le portail partenaire :
- Nom commercial et enseigne
- Type d'établissement (catégorie)
- Adresse complète ou coordonnées GPS
- Raison sociale et numéro d'enregistrement au registre du commerce (RCCM en CI, NINEA au SN...)
- Numéro de téléphone du gérant (sera le contact principal)
- Mode(s) de livraison souhaité(s) (livreurs LaPlasse / livreurs internes / les deux)
- Photo de façade de l'établissement
- Pièce d'identité du gérant

#### Étape 2 — Instruction du dossier (LaPlasse — 48 à 72h)
- Vérification de l'identité du gérant
- Vérification de l'existence légale de l'établissement (registre du commerce)
- Appel de bienvenue / vérification téléphonique
- Validation ou demande de complément

#### Étape 3 — Signature des CGU partenaire restaurant
Le gérant signe électroniquement les conditions générales d'utilisation partenaire restaurant LaPlasse Food, qui incluent :
- Les taux de commission applicables
- Les règles d'hygiène et de qualité
- Le processus de gestion des litiges
- Les conditions de suspension et résiliation

#### Étape 4 — Configuration du compte
- Création de l'espace restaurant dans le back-office LaPlasse
- Configuration des horaires d'ouverture
- Configuration des zones de livraison
- Configuration du ou des modes de livraison
- Configuration du moyen de reversement (Mobile Money, virement)

#### Étape 5 — Formation & publication
- Formation sur l'app Restaurant (en présentiel si Abidjan/Dakar, en visio sinon)
- Saisie du menu (aidée par l'équipe LaPlasse si demande)
- Commande test réalisée avant ouverture
- Publication sur la plateforme

### 3.3 Informations du profil restaurant

| Champ | Règles | Obligatoire |
|---|---|---|
| **Nom de l'établissement** | Tel qu'affiché sur la façade. Max 80 caractères. | Oui |
| **Slogan / accroche** | Max 150 caractères. Optionnel. Ex : *La meilleure braise d'Adjamé* | Non |
| **Description** | 50 à 500 mots. Histoire, spécialités, ambiance. | Recommandé |
| **Photo de couverture** | 1200 × 400 px minimum. Photo réelle de l'établissement ou des plats. | Oui |
| **Logo** | 400 × 400 px minimum. Fond transparent PNG recommandé. | Recommandé |
| **Adresse / localisation** | Coordonnées GPS obligatoires. Adresse textuelle + point de repère. | Oui |
| **Téléphone affiché** | Numéro public visible par les clients. Peut être différent du contact gérant. | Oui |
| **Catégorie culinaire** | Choisie dans le référentiel LaPlasse (voir section 4.1). Max 3 catégories. | Oui |
| **Cuisines proposées** | Tags : ivoirienne, sénégalaise, libanaise, chinoise, fast-food... | Recommandé |
| **Horaires d'ouverture** | Par jour de la semaine. Peut varier selon le service (déjeuner / dîner). | Oui |
| **Délai de préparation moyen** | En minutes. Ex : 20-30 min. Doit être réaliste — engage le restaurant. | Oui |
| **Commande minimum** | Montant minimum de panier. 0 XOF si pas de minimum. | Oui |
| **Zone de livraison** | Périmètre géographique desservi (rayon en km ou zones nommées). | Oui |

### 3.4 Horaires et disponibilité

- Le restaurant peut configurer des **horaires différenciés** par jour (ex : lun-ven 11h-15h / 18h-22h, sam-dim 10h-23h)
- Le restaurant peut passer en **mode "Fermé"** manuellement à tout moment (afflux, rupture, incident)
- Le mode **"Pause momentanée"** (15-30-45-60 min) permet de suspendre temporairement les commandes sans fermer
- Si le restaurant ne répond pas à 3 commandes consécutives en moins de 10 minutes, le système bascule automatiquement en mode "Fermé temporaire" et alerte le gérant
- Les **jours fériés** par pays sont préconfigurés dans le système — le restaurant peut choisir d'ouvrir ou non

---

## 4. Catalogue & gestion des menus

### 4.1 Catégories culinaires LaPlasse Food

Référentiel commun à tous les pays, avec des sous-catégories locales :

**Cuisines africaines locales**
- Cuisine ivoirienne (attiéké, kedjenou, foutou, aloco...)
- Cuisine sénégalaise (thiéboudienne, yassa, mafé, thiof...)
- Cuisine malienne, burkinabè, guinéenne, togolaise, béninoise...
- Braise & grillades (poulet braisé, poisson braisé, brochettes)
- Maquis populaire (plats du jour, riz sauce)

**Cuisines internationales**
- Cuisine libanaise / orientale
- Cuisine chinoise / asiatique
- Cuisine française / européenne
- Fast-food (burgers, sandwichs, wraps)
- Pizzas

**Boissons & autres**
- Jus naturels & smoothies
- Café & boissons chaudes
- Pâtisserie & desserts
- Glaces & sorbets
- Épicerie fine / produits à emporter

### 4.2 Structure du menu

Le menu est organisé en trois niveaux :

```
MENU
├── Catégorie (ex : "Entrées", "Plats chauds", "Grillades", "Boissons")
│   ├── Article (ex : "Poulet braisé")
│   │   ├── Description
│   │   ├── Prix
│   │   ├── Photo
│   │   ├── Allergènes
│   │   └── Options / Suppléments
│   │       ├── Option obligatoire (ex : "Accompagnement : attiéké / riz / frites")
│   │       └── Supplément optionnel (ex : "Extra sauce pimentée +200 XOF")
│   └── Article 2...
└── Catégorie 2...
```

### 4.3 Règles de création des catégories de menu

- Nombre de catégories : 1 minimum, 20 maximum
- Une catégorie peut être désactivée temporairement (ex : "Plats du soir" désactivé le midi)
- L'ordre des catégories est configurable par le restaurant (drag & drop dans l'app)
- Nom de catégorie : 2 à 40 caractères, pas de majuscules excessives

### 4.4 Règles de création des articles

| Champ | Règles | Obligatoire |
|---|---|---|
| **Nom de l'article** | 3 à 80 caractères. Clair et exact. Ex : *Poulet braisé entier* | Oui |
| **Description** | 20 à 300 caractères. Ingrédients principaux, goût, particularité. | Recommandé |
| **Prix** | En XOF. Entier. > 0. Prix incluant les accompagnements de base. | Oui |
| **Photo** | Min 600 × 400 px. Photo réelle du plat tel que servi. Fond neutre. | Fortement recommandé |
| **Catégorie de menu** | Rattaché à une catégorie existante du menu. | Oui |
| **Disponibilité** | Toujours disponible / Disponible certains jours / Sur commande | Oui |
| **Allergènes** | Multi-sélection dans le référentiel (gluten, lactose, arachides, fruits de mer...) | Recommandé |
| **Tags** | Végétarien, vegan, épicé, halal, sans gluten... | Recommandé |
| **Article mis en avant** | Badge "Populaire" ou "Recommandé" — max 3 par restaurant | Non |
| **Temps de préparation spécifique** | Si différent du temps moyen du restaurant (ex : braisé = 45 min) | Recommandé |

**Ce qui est interdit dans les articles :**
- Photos prises sur Internet ou issues de banques d'images (le plat photo doit correspondre au plat servi)
- Prix à 0 XOF sauf si c'est un article offert clairement marqué "Offert"
- Descriptions trompeuses (ex : "100% bœuf" si c'est un mélange)
- Numéros de téléphone ou contacts dans les descriptions

### 4.5 Gestion des options et suppléments

#### Options obligatoires (le client DOIT choisir)
Utilisées pour les accompagnements ou les variations incontournables.

```
Exemple : "Riz braisé avec..."
  ○ Attiéké        (+0 XOF)
  ○ Riz blanc      (+0 XOF)
  ○ Frites         (+500 XOF)
  → Le client choit 1 option avant d'ajouter au panier
```

Règles :
- 1 à 5 groupes d'options obligatoires par article
- Chaque groupe : 2 à 10 choix possibles
- Indiquer clairement si une option est payante
- Le groupe doit avoir un nom explicite : "Choisir votre accompagnement", "Taille de portion"

#### Suppléments optionnels (le client PEUT ajouter)
Utilisés pour les extras, les sauces, les boissons additionnelles.

```
Exemple : "Ajouter à votre commande"
  ☐ Sauce pimentée extra    +200 XOF
  ☐ Eau minérale 50cl       +300 XOF
  ☐ Sachet plastique        +50 XOF
```

Règles :
- 1 à 5 groupes de suppléments par article
- Chaque groupe : 1 à 15 suppléments
- La quantité de chaque supplément est sélectionnable (x1, x2, x3...)
- Prix clairement affiché à côté de chaque supplément

### 4.6 Menus composés & formules

Un menu composé est une formule à prix fixe combinant plusieurs articles.

```
Exemple :
Menu Midi Complet — 3 500 XOF
  Entrée : Salade de légumes
  Plat : 1 choix parmi [Poulet yassa / Poisson braisé / Riz sauce arachide]
  Boisson : 1 choix parmi [Eau / Jus bissap / Jus gingembre]
```

Règles :
- Nommer clairement le menu : "Formule", "Menu", "Pack", "Combo"
- Le prix du menu doit être inférieur à la somme des articles séparés (sinon inutile)
- Disponibilité horaire configurable indépendamment (ex : Menu midi uniquement 11h-15h)
- Les composants du menu peuvent changer sans changer le nom ou le prix du menu

### 4.7 Disponibilité et ruptures

**Rupture d'article**
- Le restaurant peut désactiver un article en temps réel depuis l'app (toggle on/off)
- Si un article est commandé mais en rupture non signalée, le restaurant doit contacter le client dans les 5 minutes et proposer un substitut ou le remboursement de l'article
- 3 incidents de rupture non signalée = avertissement LaPlasse

**Disponibilité horaire**
- Chaque article ou catégorie peut être restreint à des plages horaires
- Exemples : "Petit-déjeuner" disponible uniquement de 7h à 11h ; "Plat du jour" de 12h à 15h
- Le système masque automatiquement les articles hors plage horaire

**Article saisonnier**
- Configurer une date de début et de fin de disponibilité
- Le système active/désactive automatiquement

---

## 5. Parcours client — commande

### 5.1 Vue d'ensemble du parcours

```
[1] Découverte
     └── Recherche / Catégorie / Géolocalisation / Bannière promo
          ↓
[2] Sélection du restaurant
     └── Page restaurant : infos, délai, frais livraison, note
          ↓
[3] Constitution du panier
     └── Sélection des articles + options + suppléments
          ↓
[4] Validation du panier
     └── Récapitulatif + adresse de livraison + instructions spéciales
          ↓
[5] Paiement
     └── Mobile Money / Cash à la livraison / Carte
          ↓
[6] Confirmation & suivi
     └── Confirmation restaurant → Préparation → Livreur dispatché → En route → Livré
          ↓
[7] Post-livraison
     └── Notation restaurant + livreur + option réclamation
```

### 5.2 Étape 1 — Découverte

**Modes d'entrée dans LaPlasse Food :**
- Onglet "Food" ou "Commander à manger" dans la navbar principale
- Recherche globale LaPlasse avec filtre "Restaurants"
- Notification push (promotions, restaurants favoris qui ouvrent)
- Lien direct partagé (restaurant ou plat)

**Page d'accueil Food — éléments affichés :**
- Bannière(s) promotionnelle(s) configurées par LaPlasse
- Restaurants ouverts EN CE MOMENT triés par pertinence (voir algorithme)
- Section "Rapide" : restaurants avec délai < 30 min
- Section "Populaires dans ta zone"
- Section "Nouveaux restaurants"
- Section "Tes habitudes" (si client récurrent — basé sur l'historique)
- Filtre par cuisine, par délai, par tranche de prix, par note

**Algorithme de tri des restaurants (ordre de priorité) :**

1. Ouvert en ce moment (les fermés apparaissent en bas, grisés)
2. Dans la zone de livraison du client (géolocalisation)
3. Score de pertinence composite :
   - Note moyenne pondérée (40%)
   - Nombre de commandes récentes — 30 derniers jours (25%)
   - Délai de préparation annoncé (15%)
   - Taux d'acceptation des commandes — derniers 7 jours (10%)
   - Présence de photo sur les articles (10%)
4. Boost payant (restaurant peut payer pour apparaître en "Sponsorisé" — labellisé)

### 5.3 Étape 2 — Page restaurant

**Informations obligatoirement affichées :**
- Nom, photo de couverture, note moyenne + nombre d'avis
- Catégories culinaires
- Délai estimé (préparation + livraison) — affiché comme une fourchette : *30-45 min*
- Frais de livraison estimés (calculés selon l'adresse du client si connue)
- Montant minimum de commande
- Horaires d'ouverture
- Statut : Ouvert / Fermé / Ferme dans X min

**Règle délai affiché :**
Le délai affiché = délai de préparation déclaré par le restaurant + délai de livraison estimé selon la distance. C'est une estimation — le délai réel peut varier de ±15 minutes sans déclencher d'incident. Au-delà de 15 minutes de retard, le client est automatiquement notifié.

### 5.4 Étape 3 — Constitution du panier

**Règles du panier :**
- Un panier = un seul restaurant (pas de commande multi-restaurants en une fois — à confirmer pour une future version)
- Si le client ajoute un article d'un autre restaurant, le système demande s'il veut vider son panier ou annuler
- Le panier est conservé 2 heures en cas d'interruption (connexion perdue, sortie de l'app)
- Le panier est bloqué si le restaurant ferme pendant la constitution (message d'alerte)
- Les options obligatoires non remplies bloquent l'ajout au panier

**Affichage du panier :**
- Nom + options de chaque article
- Quantité modifiable directement
- Sous-total articles
- Frais de livraison (calculés dynamiquement selon l'adresse)
- Frais de service LaPlasse (affichés séparément et clairement)
- **Total TTC final** — c'est ce que le client paye, aucun montant supplémentaire ne peut s'ajouter après

**Seuil minimum de commande :**
- Si le panier est inférieur au minimum du restaurant, le bouton de validation est grisé avec le message : *"Encore X XOF pour atteindre le minimum de commande"*
- Le minimum de commande s'applique hors frais de livraison

### 5.5 Étape 4 — Validation de la commande

**Adresse de livraison :**
- Géolocalisation automatique (permission GPS demandée)
- Saisie manuelle : quartier / commune + point de repère (champ libre, 200 caractères max)
- Adresses sauvegardées : "Maison", "Bureau", "Autre" (max 5 adresses enregistrées)
- La zone de livraison est vérifiée : si l'adresse est hors zone du restaurant, le client en est informé avant paiement

**Instructions spéciales :**
- Champ libre pour le livreur : "Sonner au portail bleu", "Appeler à l'arrivée", "Laisser chez le gardien"
- Champ libre pour le restaurant : "Pas d'oignons", "Sauce à part", "Bien cuit"
- Max 300 caractères chacun

**Mode de récupération :**
- Livraison à l'adresse (mode par défaut)
- Click & Collect / Retrait en restaurant (si activé par le restaurant)

### 5.6 Étape 5 — Paiement

**Modes de paiement disponibles :**

| Mode | Description | Disponibilité |
|---|---|---|
| **Wave** | Paiement mobile Wave (CI, SN, ML...) | Selon pays |
| **Orange Money** | Paiement mobile Orange (CI, SN, BF...) | Selon pays |
| **MTN Mobile Money** | Paiement mobile MTN (CI, GH, BF...) | Selon pays |
| **Moov Money** | Paiement mobile Moov (CI, BF, TG...) | Selon pays |
| **Cash à la livraison** | Paiement en espèces au livreur | Tous pays — option à activer par restaurant |
| **Carte bancaire** | Visa/Mastercard — via passerelle locale | Si disponible selon pays |
| **Solde LaPlasse** | Wallet interne LaPlasse (crédité via promo, remboursement) | Tous pays |

**Règles spécifiques au cash à la livraison :**
- Le restaurant peut désactiver cette option (risque d'annulation au moment de la livraison)
- LaPlasse peut limiter le cash à la livraison aux clients avec un bon historique (0 annulation dans les 30 derniers jours)
- Le livreur est responsable de la collecte du cash et de son reversement au restaurant si le restaurant n'a pas de livreur interne (voir section 7)
- Montant maximum cash à la livraison configurable par pays (ex : max 50 000 XOF)

**Confirmation de paiement :**
- Paiement Mobile Money : le client reçoit une demande de confirmation sur son téléphone. La commande n'est transmise au restaurant qu'après confirmation effective du paiement.
- Cash : la commande est transmise immédiatement, le paiement est collecté à la livraison.

### 5.7 Étape 6 — Suivi de commande

**États visibles par le client (en temps réel) :**

```
[⏳] Commande reçue — En attente de confirmation du restaurant
[✅] Commande confirmée — Le restaurant prépare votre commande
[👨‍🍳] En préparation — Temps estimé : X min
[🛵] Livreur dispatché — [Nom du livreur] arrive dans X min
[📍] En route — Suivi GPS du livreur (si disponible)
[✅] Livré — Bon appétit !
```

**Notifications push à chaque changement d'état.**

**En cas de retard :**
- Retard > 15 min : notification automatique au client + mise à jour du délai estimé
- Retard > 30 min : notification + option de contacter le support LaPlasse
- Retard > 45 min : notification + option d'annulation gratuite proposée au client

---

## 6. Gestion des prix & commissions

### 6.1 Structure de prix visible par le client

```
Sous-total articles          X XOF
Frais de livraison           X XOF
Frais de service LaPlasse    X XOF
────────────────────────────────────
TOTAL À PAYER                X XOF
```

Aucun autre frais ne peut s'ajouter à ce total. C'est le montant exact débité.

### 6.2 Frais de livraison

Les frais de livraison sont calculés dynamiquement selon :
- Distance entre le restaurant et l'adresse de livraison
- Mode de livraison (livreur LaPlasse / livreur interne / prestataire)
- Heure de la journée (tarif de pointe possible — heures de déjeuner, soirée)
- Pays et ville

**Structure de calcul (exemple) :**

| Distance | Frais de base (Abidjan) | Majoration heure de pointe |
|---|---|---|
| 0 - 2 km | 500 XOF | +200 XOF |
| 2 - 5 km | 800 XOF | +300 XOF |
| 5 - 8 km | 1 200 XOF | +400 XOF |
| > 8 km | 1 500 XOF + X/km | +500 XOF |

> *Les tarifs exacts sont à définir par LaPlasse pour chaque ville/pays. Le tableau ci-dessus est indicatif.*

**Livraison gratuite :**
- Le restaurant peut offrir la livraison (à partir d'un certain montant de panier ou toujours)
- LaPlasse peut offrir la livraison dans le cadre de campagnes promotionnelles (le coût est absorbé par LaPlasse)
- Les deux peuvent se cumuler (restaurant offre partiellement, LaPlasse complète)

### 6.3 Frais de service LaPlasse

Frais perçus par LaPlasse sur chaque transaction client :
- Montant fixe ou pourcentage du sous-total articles — à définir par LaPlasse
- Affiché clairement et séparément avant paiement
- Ne fait pas partie du reversement au restaurant

### 6.4 Commissions restaurant

Commission prélevée par LaPlasse sur le montant articles hors livraison :

| Type d'établissement | Commission indicative |
|---|---|
| Restaurant classique | 15-20% |
| Maquis / restauration populaire | 10-15% |
| Dark Kitchen | 15-20% |
| Boulangerie / Pâtisserie | 10-15% |
| Traiteur | 12-18% |
| Partenaire stratégique (négocié) | Selon accord |

> Les taux exacts sont définis commercialement et peuvent varier par pays, par volume de commandes mensuel, par ancienneté sur la plateforme.

**La commission est calculée sur :**
- Le prix des articles commandés
- Les suppléments et options payants
- **Hors** frais de livraison
- **Hors** frais de service LaPlasse

### 6.5 Rémunération des livreurs LaPlasse

| Composante | Description |
|---|---|
| **Tarif de base par course** | Montant fixe par livraison effectuée — variable selon ville et distance |
| **Bonus distance** | Supplément au-delà d'un seuil kilométrique |
| **Bonus heure de pointe** | Supplément pendant les pics (déjeuner, soirée) |
| **Bonus performance** | Bonus mensuel si taux d'acceptation > 90% et note > 4.5 |
| **Pénalité annulation** | Déduction si annulation non justifiée en cours de course |

Le livreur perçoit sa rémunération via Mobile Money selon une fréquence configurable (quotidienne, hebdomadaire).

---

## 7. Module livraison tripartite

### 7.1 Vue d'ensemble des interfaces par acteur

LaPlasse adopte une stratégie d'interfaces différenciée selon les usages et les contraintes de chaque acteur :

| Acteur | Interface | Justification |
|---|---|---|
| **Client** | Application mobile uniquement | Expérience d'achat fluide, notifications push, géolocalisation native |
| **Restaurant** | Application mobile uniquement | Confirmation rapide des commandes en cuisine, notifications push critiques, utilisation sur tablette ou téléphone posé en cuisine |
| **Livreur LaPlasse (indépendant)** | Interface web (mobile browser) | Pas d'app à installer/mettre à jour — le livreur accède via son navigateur mobile. Fonctionne sur tous les smartphones, même entrée de gamme. |
| **Livreur interne restaurant** | Interface web (mobile browser) | Même interface que le livreur LaPlasse, périmètre restreint au restaurant employeur |
| **Prestataire logistique** | Interface web (desktop/mobile) + API | Le prestataire gère plusieurs livreurs depuis un dashboard centralisé sur desktop ; ses livreurs utilisent l'interface web mobile |

> **Principe important** : les livreurs n'ont **pas** d'application mobile dédiée à installer. Ils accèdent à leur interface via un **navigateur mobile** (Chrome, Firefox). Cela élimine les contraintes de déploiement d'app, les mises à jour forcées et les problèmes de compatibilité avec des smartphones Android d'entrée de gamme très répandus en Afrique de l'Ouest.

---

### 7.2 Interface web livreur — fonctionnalités

L'interface web livreur est une Progressive Web App (PWA) optimisée pour mobile, accessible sur `livreur.laplasse.com` (ou sous-domaine dédié).

#### 7.2.1 Connexion et authentification

- Connexion par numéro de téléphone + code OTP (SMS) — pas de mot de passe à retenir
- Session maintenue 12h — le livreur se reconnecte chaque début de journée
- Déconnexion automatique si inactif > 30 min (sécurité)
- Si la session expire pendant une course active : reconnexion automatique transparente si le numéro est reconnu

#### 7.2.2 Mise en disponibilité

Le livreur doit **activer manuellement sa disponibilité** avant de recevoir des courses :

```
[HORS LIGNE] ──── bouton "Je suis disponible" ────► [EN LIGNE — Disponible]
                                                           │
                                               ┌───────────┴───────────┐
                                               ▼                       ▼
                                        [Course proposée]      [En pause — 15/30/60 min]
                                               │
                                        Accepte / Refuse
                                               │
                                        [En course]
                                               │
                                        Livraison effectuée
                                               │
                                        [En ligne — Disponible]
```

- La géolocalisation est activée dès que le livreur passe en "Disponible"
- Le livreur peut passer en "Pause" sans se déconnecter (n'affecte pas son taux d'acceptation)
- La géolocalisation est transmise au serveur toutes les **30 secondes** quand le livreur est en ligne
- Si la géolocalisation est refusée par le navigateur : le livreur ne peut pas passer en "Disponible" — message d'alerte explicite

#### 7.2.3 Réception et gestion des courses

**Notification de course proposée :**
- Alerte sonore + vibration + affichage plein écran de la proposition
- Informations affichées : nom du restaurant, adresse de retrait, adresse de livraison, distance estimée, rémunération de la course
- Le livreur a **3 minutes** pour accepter ou refuser
- Sans réponse dans les 3 minutes : la course est automatiquement refusée (compte dans le taux de refus)

**Pendant la course :**

```
Étape 1 : Aller au restaurant
  → Carte avec itinéraire vers le restaurant
  → Nom + adresse + éventuel code d'accès
  → Bouton "Je suis arrivé au restaurant"

Étape 2 : Récupération de la commande
  → Affichage du numéro de commande et du nom client (pour identification)
  → Vérification de la commande (nombre de sacs/articles)
  → Bouton "Commande récupérée"

Étape 3 : Livraison
  → Carte avec itinéraire vers le client
  → Adresse + point de repère + instructions du client
  → Bouton de contact client (appel ou chat intégré uniquement)
  → Bouton "J'arrive" (notification push envoyée au client)
  → Bouton "Commande livrée"
  → Si cash : saisie du montant collecté + confirmation

Étape 4 : Confirmation
  → Photo de livraison si client absent (obligatoire)
  → Récapitulatif de la course + rémunération
  → Retour en statut "Disponible"
```

#### 7.2.4 Tableau de bord livreur (interface web)

- **Aujourd'hui** : courses effectuées, distance parcourue, gains du jour
- **Cette semaine** : courses, gains, note moyenne, taux d'acceptation
- **Historique** : toutes les courses avec détail (date, restaurant, montant, note reçue)
- **Mes gains** : solde disponible, historique des versements, prochain versement estimé
- **Mon profil** : informations personnelles, documents (statut de validité), véhicule

---

### 7.3 Interface web prestataire logistique — fonctionnalités

Accessible sur `partenaires.laplasse.com`, cette interface est conçue pour une utilisation **desktop** par le gestionnaire du prestataire, avec une vue mobile pour ses propres livreurs.

#### 7.3.1 Dashboard prestataire (desktop)

- **Vue temps réel** : carte de la ville avec position de tous ses livreurs actifs, commandes en cours affectées à chacun
- **File d'attente** : bons de livraison reçus de LaPlasse, en attente d'affectation à un livreur
- **Gestion de la flotte** : liste des livreurs (actifs, en pause, hors ligne), possibilité d'affecter manuellement une course
- **Performance** : taux de livraison dans les délais, note moyenne de la flotte, incidents du jour
- **Facturation** : relevé des courses effectuées pour le compte de LaPlasse, montants dus, historique des règlements

#### 7.3.2 Modes de réception des bons de livraison

Le prestataire peut recevoir les bons selon deux modalités, configurées à l'onboarding :

| Mode | Description | Recommandé pour |
|---|---|---|
| **Dashboard manuel** | Les bons arrivent dans l'interface web. Un opérateur les affecte manuellement à un livreur disponible. | Petites structures (< 10 livreurs) |
| **API automatisée** | LaPlasse envoie les bons via webhook REST. Le système du prestataire affecte automatiquement. | Grandes structures avec leur propre TMS |

**Délai d'acceptation du bon par le prestataire : 5 minutes.** Au-delà, LaPlasse reprend la main et re-dispatche vers un autre mode.

#### 7.3.3 Livreurs du prestataire — interface web mobile

Les livreurs employés par le prestataire utilisent la **même interface web mobile** que les livreurs LaPlasse indépendants, avec les différences suivantes :

- L'accès est créé par le prestataire (pas d'inscription individuelle sur LaPlasse)
- Les courses affichées sont uniquement celles affectées par le prestataire (pas de dispatch direct LaPlasse)
- La rémunération est gérée entre le livreur et le prestataire — LaPlasse ne reverse pas directement au livreur du prestataire
- Le livreur voit le logo et le nom du prestataire dans son interface (marque blanche partielle)

---

### 7.4 Les trois modes de livraison

#### Mode 1 — Livreurs LaPlasse indépendants
- Référencés et vérifiés individuellement par LaPlasse
- Accèdent via l'**interface web livreur** (mobile browser)
- Géolocalisés en temps réel via le navigateur
- Dispatché directement par l'algorithme LaPlasse
- Rémunéré par LaPlasse — versement Mobile Money

#### Mode 2 — Livreurs internes du restaurant
- Salariés ou prestataires directs du restaurant
- Accèdent via l'**interface web livreur** avec un profil lié au compte du restaurant
- Les courses disponibles sont uniquement les commandes du restaurant employeur
- Le restaurant les affecte manuellement ou valide l'auto-affectation depuis son app mobile
- La livraison est trackée via LaPlasse — le client voit le suivi en temps réel
- Les frais de livraison collectés peuvent être conservés par le restaurant selon la configuration

#### Mode 3 — Prestataires logistiques partenaires
- Entreprises de livraison (coursiers, startups logistiques locales...)
- Gèrent leur flotte depuis le **dashboard web prestataire** (desktop)
- Leurs livreurs utilisent l'**interface web livreur** (même interface, accès prestataire)
- Reçoivent les bons via le dashboard ou via API
- Facturent LaPlasse selon un accord tarifaire B2B négocié
- La performance de leurs livreurs est trackée et impacte le score du prestataire

---

### 7.5 Configuration par restaurant

Chaque restaurant configure ses préférences de livraison depuis son application mobile :

| Option | Description | Impact dispatch |
|---|---|---|
| **LaPlasse uniquement** | Toutes les livraisons via livreurs LaPlasse indépendants | Dispatch direct algorithme LaPlasse |
| **Interne uniquement** | Le restaurant assure toutes ses livraisons avec sa propre flotte | Notification push livreurs internes — pas de dispatch LaPlasse |
| **Hybride préférence interne** | Livreurs internes en priorité, LaPlasse en débordement si aucun disponible sous 5 min | Dispatch interne d'abord, escalade automatique |
| **Hybride préférence LaPlasse** | Livreurs LaPlasse en priorité, interne en complément | Dispatch LaPlasse d'abord, interne en backup |
| **Prestataire dédié** | Contrat avec un prestataire logistique spécifique référencé LaPlasse | Bon envoyé directement au prestataire |

---

### 7.6 Algorithme de dispatch — description complète

L'algorithme de dispatch s'exécute **à la milliseconde** dès que la commande passe en statut `PRÊTE` (ou à l'heure estimée de fin de préparation si celle-ci est prévisible).

#### Phase 0 — Pré-calcul (dès confirmation restaurant)

Dès que le restaurant confirme la commande, le système anticipe :
- Calcul de l'heure estimée de disponibilité de la commande (heure confirmation + délai préparation déclaré)
- Pré-identification des livreurs disponibles dans la zone (rayon initial 3 km du restaurant)
- Si mode prestataire : pré-notification du prestataire pour qu'il prépare une ressource

```
T+0  : Restaurant confirme → délai préparation = 25 min
T+0  : Dispatcher calcule → commande prête estimée à T+25
T+20 : Dispatcher commence à surveiller activement les livreurs disponibles (5 min avant)
T+25 : Dispatch effectif
```

#### Phase 1 — Sélection du pool de livreurs

Selon la configuration du restaurant (section 7.5), le dispatcher constitue le **pool de candidats** :

```
SI mode "Interne uniquement" ou "Hybride préférence interne" :
  pool_prioritaire = livreurs internes du restaurant [disponibles sur interface web]
  pool_fallback    = livreurs LaPlasse dans rayon 3 km [si hybride]

SI mode "LaPlasse uniquement" ou "Hybride préférence LaPlasse" :
  pool_prioritaire = livreurs LaPlasse dans rayon 3 km [disponibles sur interface web]
  pool_fallback    = livreurs internes du restaurant [si hybride]

SI mode "Prestataire dédié" :
  pool_prioritaire = prestataire désigné [via dashboard ou API]
  pool_fallback    = livreurs LaPlasse [si prestataire ne répond pas dans 5 min]
```

**Critères de disponibilité d'un livreur (interface web) :**
- Statut = "En ligne — Disponible" (activé manuellement)
- Géolocalisation active et transmise dans les 2 dernières minutes
- Pas de course en cours
- Note moyenne ≥ 3.0 (en dessous : exclu du dispatch automatique)

#### Phase 2 — Scoring et classement des candidats

Pour chaque livreur dans le pool, un **score de dispatch** est calculé :

```
Score = (100 - distance_km × 10)      [proximité — poids 40%]
      + (note_moyenne × 10)            [qualité — poids 25%]
      + (taux_acceptation × 20)        [fiabilité — poids 20%]
      + bonus_performance               [bonus si > 4.5 note et > 90% acceptation : +15 pts]
      - malus_courses_jour              [si > 15 courses aujourd'hui : -5 pts — anti-fatigue]
```

Le livreur avec le **score le plus élevé** reçoit la proposition en premier.

#### Phase 3 — Proposition et délai de réponse

```
T+0  : Proposition envoyée au livreur #1 (notification sur interface web — alerte sonore)
T+3m : Si pas de réponse ou refus → proposition au livreur #2
T+6m : Si pas de réponse ou refus → proposition au livreur #3
T+9m : Si toujours pas de livreur dans le pool prioritaire :
         SI mode hybride → basculement sur pool_fallback
         SI mode LaPlasse uniquement → élargissement rayon à 5 km
         SI mode prestataire → escalade fallback
T+12m: Si toujours aucun livreur → alerte support LaPlasse + message client "Délai allongé"
T+20m: Si toujours aucun livreur → option annulation gratuite proposée au client
```

**Ce qui apparaît côté livreur (interface web) lors d'une proposition :**
- Alerte plein écran avec son
- Restaurant : nom + distance du livreur au restaurant
- Livraison : zone de destination (pas l'adresse exacte avant acceptation)
- Rémunération estimée de la course
- Bouton ACCEPTER (vert, large) / Bouton REFUSER (gris, plus petit)
- Compte à rebours visible : 3:00 → 0:00

#### Phase 4 — Assignation et notification

Dès qu'un livreur accepte :
```
1. Statut livreur → "En course" (disparaît du pool dispatch)
2. Statut commande → LIVREUR_ASSIGNÉ
3. Notification push → client (app mobile) : "Votre livreur [Prénom] est en route"
4. Notification push → restaurant (app mobile) : "Livreur assigné — arrive dans ~X min"
5. Interface web livreur → affiche itinéraire vers le restaurant
6. Partage de position du livreur activé vers le client (via app mobile client)
```

#### Phase 5 — Suivi et gestion des incidents en cours de course

| Événement | Déclencheur | Action automatique |
|---|---|---|
| Livreur n'arrive pas au restaurant | Dépassement délai estimé + 15 min | Alerte support + contact livreur |
| Livreur ne bouge plus (GPS figé > 10 min) | Détection côté serveur | Alerte support + contact livreur |
| Livreur annule la course | Action livreur sur interface web | Re-dispatch immédiat + avertissement livreur |
| Client introuvable | Action livreur sur interface web | Instructions affichées (attendre 10 min, appeler, contacter support) |
| Livreur déconnecté en cours de course | Perte de connexion interface web | Tentative reconnexion auto — si > 5 min : alerte support |

#### Phase 6 — Cas particulier : livreur interne sans interface web active

Si le restaurant a configuré des livreurs internes mais qu'aucun n'est connecté à l'interface web au moment du dispatch :

```
T+0  : Dispatch interne → aucun livreur interne connecté
T+0  : Notification push envoyée au restaurant (app mobile) :
        "Aucun livreur disponible — assignez un livreur ou activez le dispatch LaPlasse"
T+5m : Si pas d'action du restaurant :
         SI mode "Hybride" → basculement automatique sur livreurs LaPlasse
         SI mode "Interne uniquement" → alerte support + client notifié du retard
```

> **Règle clé** : le restaurant en mode "Interne uniquement" prend la responsabilité de la disponibilité de ses livreurs. Un défaut de livraison dû à l'absence de livreur interne est loggé comme incident restaurant.

---

### 7.7 Règles pour les livreurs LaPlasse (indépendants)

#### Conditions d'inscription

- Pièce d'identité valide (CNI ou passeport)
- Permis de conduire valide catégorie A (moto) ou B (voiture/tricycle)
- Attestation d'assurance du véhicule en cours de validité
- Casier judiciaire vierge (ou extrait de casier selon pays)
- Smartphone avec navigateur compatible (Chrome ≥ 80 recommandé)
- Formation LaPlasse complétée — disponible en ligne sur l'interface web livreur ou en présentiel

#### Règles opérationnelles

- Taux d'acceptation minimum : **70%** — en dessous, avertissement automatique
- Accès à l'interface web livreur uniquement depuis l'appareil enregistré (anti-fraude)
- Le livreur ne peut pas contacter le client en dehors du **chat intégré à l'interface web**
- Interdiction de demander un paiement additionnel au client
- Sac isotherme LaPlasse obligatoire pour les commandes chaudes — fourni à l'inscription
- Photo de preuve de livraison obligatoire si le client est absent (uploadée depuis l'interface web)
- En cas de commande cash : montant exact collecté, saisi et confirmé dans l'interface avant clôture de la course

#### Gestion de la connectivité sur l'interface web

L'interface web est conçue pour fonctionner avec une connectivité dégradée :
- Les données de la course en cours sont mises en cache local (fonctionnement offline partiel)
- Si la connexion est perdue pendant 30 secondes : bandeau d'alerte + tentative de reconnexion automatique toutes les 10 secondes
- La géolocalisation continue d'être enregistrée localement et synchronisée dès la reconnexion
- Si la connexion est perdue > 5 minutes pendant une course active : alerte envoyée au support LaPlasse

#### Sanctions livreurs

| Incident | Sanction |
|---|---|
| Commande non livrée sans motif | Suspension immédiate + enquête |
| 3 refus non justifiés en 24h | Avertissement |
| Taux d'acceptation < 70% sur 7 jours | Avertissement |
| 5 avertissements cumulés | Suspension 7 jours |
| Fraude (encaissement cash sans livraison) | Résiliation définitive + signalement autorités |
| Note moyenne < 3.5 sur 30 jours | Avertissement + suivi |
| Note moyenne < 3.0 sur 60 jours | Suspension jusqu'à amélioration constatée |
| Déconnexion répétée en cours de course (> 3 fois/semaine) | Avertissement + vérification matériel |

---

### 7.8 Gestion des zones et couverture

- **Zone de couverture** : définie par LaPlasse par ville, en expansion progressive selon la densité de livreurs disponibles
- **Zones non couvertes** : le client est informé dès la sélection du restaurant (avant de constituer son panier)
- **Extension de zone** : un restaurant peut demander une extension — LaPlasse évalue selon la disponibilité de livreurs ou de prestataires dans la zone cible
- **Heure de pointe** : si le nombre de livreurs disponibles dans une zone est insuffisant, le système peut temporairement limiter les nouvelles commandes dans cette zone avec un message client : *"Peu de livreurs disponibles dans votre zone — délai estimé allongé"*
- **Zones exclues** : certaines zones peuvent être exclues pour des raisons de sécurité (incidents récurrents, zones non accessibles) — décision LaPlasse, révisable

---

## 8. Gestion des commandes — cycle de vie

### 8.1 États d'une commande

```
CRÉÉE → EN_ATTENTE_PAIEMENT → PAYÉE → EN_ATTENTE_RESTAURANT
     → CONFIRMÉE → EN_PRÉPARATION → PRÊTE → LIVREUR_ASSIGNÉ
     → EN_COURS_LIVRAISON → LIVRÉE → COMPLÉTÉE

Branches d'erreur :
     → REFUSÉE (par le restaurant)
     → ANNULÉE (par le client avant confirmation)
     → ANNULÉE_TARDIVE (après confirmation — règles spécifiques)
     → INCIDENT (problème en cours de livraison)
     → REMBOURSÉE
```

### 8.2 Délais et actions par état

| État | Délai maximum | Action si dépassé |
|---|---|---|
| EN_ATTENTE_PAIEMENT | 10 minutes | Commande annulée automatiquement |
| EN_ATTENTE_RESTAURANT | 10 minutes | Rappel restaurant + escalade support |
| CONFIRMÉE → EN_PRÉPARATION | Délai déclaré + 15 min | Alerte client + support |
| PRÊTE → LIVREUR_ASSIGNÉ | 10 minutes | Re-dispatch |
| EN_COURS_LIVRAISON | Délai estimé + 30 min | Alerte client + enquête |

### 8.3 Confirmation par le restaurant

Le restaurant a **10 minutes** pour confirmer ou refuser une commande via l'app.

**Motifs de refus autorisés :**
- Rupture d'un article commandé (si substitution impossible)
- Fermeture imprévue (incident technique, cas de force majeure)
- Zone de livraison impossible

**Motifs non acceptés comme refus :**
- Prix jugé trop bas (le restaurant a accepté les CGU avec ses propres prix)
- Client inconnu ou commande jugée suspecte (contacter le support LaPlasse)
- Simple désaccord avec la commande

Un refus injustifié est loggé et compte dans le taux de refus du restaurant. **Taux de refus > 5% → avertissement.**

### 8.4 Annulations

#### Annulation par le client

| Moment de l'annulation | Remboursement client | Impact restaurant |
|---|---|---|
| Avant paiement confirmé | 100% — immédiat | Aucun |
| Après paiement, avant confirmation restaurant | 100% — sous 24h | Aucun |
| Après confirmation, avant début préparation | 100% — sous 24h | Avertissement si > 2/mois |
| Pendant la préparation | 50% (50% au restaurant pour couvrir les ingrédients) | À évaluer cas par cas |
| Livreur déjà en route | 0% (commande sera livrée) | — |
| Retard > 45 min constaté | 100% si client demande l'annulation | Incident restaurant |

#### Annulation par le restaurant
- Si annulation avant préparation : remboursement 100% client, avertissement restaurant
- Si annulation après début de préparation : cas exceptionnel — support LaPlasse arbitre
- Cumul de 3 annulations restaurant en 30 jours → suspension temporaire

#### Annulation par le livreur
- Le livreur LaPlasse ne peut pas annuler une livraison sans motif valide une fois assigné
- Si le livreur annule : re-dispatch immédiat, avertissement livreur

### 8.5 Gestion des commandes non récupérées (Click & Collect)

Si le client ne récupère pas sa commande dans les 30 minutes suivant la notification "Commande prête" :
- Rappel notification à 15 min et 30 min
- À 30 min : le restaurant peut proposer de conserver la commande (si possible) ou de la détruire
- Si détruite : pas de remboursement client (faute du client)
- Si conservée : commande gardée max 2h supplémentaires

---

## 9. Paiement & reversement

### 9.1 Flux financier global

```
CLIENT paye (Mobile Money / Carte / Cash)
      ↓
LAPLASSE collecte (compte de transit)
      ↓
Déduction : Commission LaPlasse + Frais de service + Rémunération livreur LaPlasse
      ↓
Reversement au RESTAURANT (montant net)
```

### 9.2 Reversements aux restaurants

| Paramètre | Règle |
|---|---|
| **Fréquence** | Hebdomadaire par défaut (chaque lundi pour les commandes de la semaine précédente) |
| **Délai post-livraison** | Minimum 48h après livraison confirmée (délai de réclamation client) |
| **Moyen de reversement** | Mobile Money (Wave, Orange Money, MTN MoMo) ou virement bancaire |
| **Seuil minimum de reversement** | 5 000 XOF (en dessous : report à la semaine suivante) |
| **Devises** | XOF uniquement au lancement |
| **Rapport de reversement** | Disponible dans l'espace restaurant avec le détail de chaque commande |

### 9.3 Retenues et ajustements

LaPlasse peut retenir ou ajuster les reversements dans les cas suivants :
- Remboursements clients en attente d'imputation
- Pénalités contractuelles (incidents répétés)
- Solde négatif dû à des remboursements excédentaires
- Enquête en cours sur une fraude présumée

Le restaurant est notifié par email et dans son espace de toute retenue avec le motif détaillé.

### 9.4 Gestion du cash à la livraison

Le cash collecté par les livreurs LaPlasse pour le compte des restaurants est géré ainsi :
- Le livreur dépose le cash collecté selon la fréquence définie (quotidienne recommandée)
- Dépôt sur un compte Wave/OM LaPlasse dédié OU remise physique à un point de collecte LaPlasse
- Le montant cash est déduit du reversement restaurant (le restaurant est crédité net)
- Le livreur dispose d'une avance maximale de cash collecté (limite de sécurité — ex : 50 000 XOF)

---

## 10. Notation & avis

### 10.1 Ce qui est noté

Après chaque commande livrée, le client est invité à noter **dans les 24h** :

| Objet noté | Critères | Optionnel / Obligatoire |
|---|---|---|
| **Restaurant** | Qualité du plat / Conformité à la description / Présentation | Note obligatoire (1-5 étoiles) + commentaire optionnel |
| **Livreur** | Ponctualité / Politesse / État de la commande à la livraison | Note obligatoire (1-5 étoiles) |
| **Expérience globale** | Note synthétique LaPlasse Food | Optionnel |

### 10.2 Règles d'affichage

- Note visible dès **5 avis** collectés (en dessous : "Nouveau restaurant" ou "Pas encore noté")
- La note affichée est une **moyenne pondérée** avec décroissance temporelle (les avis récents pèsent plus)
- Les commentaires sont affichés du plus récent au plus ancien
- Le restaurant peut **répondre publiquement** à chaque avis — délai de réponse : 7 jours
- Les avis sont vérifiés : seuls les clients ayant effectivement reçu la commande peuvent noter

### 10.3 Modération des avis

- Avis automatiquement rejeté si : insultes, données personnelles, lien externe, hors sujet manifeste
- Modération manuelle sur signalement du restaurant (délai : 48h)
- LaPlasse peut supprimer un avis avéré frauduleux (concurrence déloyale, acheteur fictif)
- **Interdiction absolue** pour le restaurant de solliciter la modification d'un avis négatif en dehors de la réponse publique

### 10.4 Impact sur le restaurant

| Note moyenne | Conséquence |
|---|---|
| ≥ 4.5 | Badge "Très bien noté" + boost algorithme |
| 4.0 - 4.4 | Affichage normal |
| 3.5 - 3.9 | Pas de conséquence immédiate — suivi |
| 3.0 - 3.4 | Avertissement LaPlasse + plan d'amélioration proposé |
| < 3.0 sur 60 jours | Suspension temporaire jusqu'à amélioration constatée |

---

## 11. Gestion des incidents & litiges

### 11.1 Types d'incidents

| Incident | Déclenché par | Délai de signalement |
|---|---|---|
| Commande jamais reçue | Client | Jusqu'à 24h après l'heure de livraison estimée |
| Commande incomplète (article manquant) | Client | Jusqu'à 2h après livraison |
| Article non conforme (pas ce qui a été commandé) | Client | Jusqu'à 2h après livraison |
| Mauvaise qualité / plat non comestible | Client | Jusqu'à 2h après livraison (photo requise) |
| Commande endommagée (renversée, froide...) | Client | Jusqu'à 2h après livraison (photo requise) |
| Livreur irrespectueux | Client | Jusqu'à 24h |
| Client introuvable / fausse adresse | Livreur | Pendant la course |
| Client refuse de payer (cash) | Livreur | Immédiat |

### 11.2 Processus de résolution

```
1. Client signale l'incident via l'app (formulaire + photo si applicable)
2. Notification automatique au restaurant ET au livreur concerné
3. Délai de réponse restaurant : 4h ouvrables
4. Si accord entre client et restaurant → résolution directe
5. Si désaccord ou pas de réponse restaurant → arbitrage LaPlasse (délai : 24h)
6. Décision LaPlasse :
   a. Remboursement total → crédit LaPlasse ou remboursement Mobile Money sous 72h
   b. Remboursement partiel → proportionnel au préjudice constaté
   c. Avoir pour prochaine commande → minimum 110% du préjudice
   d. Rejet de la réclamation → justification obligatoire
7. Notification des deux parties avec la décision et les voies de recours
```

### 11.3 Politique de remboursement

| Situation | Remboursement | Délai |
|---|---|---|
| Commande jamais reçue (confirmée) | 100% | 24-72h |
| Article manquant avéré | Prorata de l'article manquant | 24-72h |
| Non-conformité avérée | 50% à 100% selon gravité | 24-72h |
| Retard > 60 min | Compensation min. 500 XOF ou 10% | Avoir immédiat |
| Qualité insuffisante (subjectif) | Évalué cas par cas | 48-72h |
| Client absent (adresse erronée) | 0% | — |

---

## 12. Multi-pays — spécificités par marché

### 12.1 Côte d'Ivoire (marché de référence)

| Paramètre | Configuration CI |
|---|---|
| **Devise** | XOF |
| **Mobile Money principal** | Wave, Orange Money CI, MTN MoMo CI, Moov Money CI |
| **Langue** | Français |
| **Référentiel légal** | Loi ivoirienne (voir section 13) |
| **Villes couvertes (lancement)** | Abidjan (Cocody, Plateau, Adjamé, Yopougon, Marcory, Treichville, Abobo...) |
| **Heure fuseau** | UTC+0 (GMT) |
| **Jours fériés préconfigurés** | Calendrier CI officiel |
| **Spécificités culinaires prioritaires** | Cuisine ivoirienne, maquis, braisés, attiéké, plats locaux |

### 12.2 Sénégal

| Paramètre | Configuration SN |
|---|---|
| **Devise** | XOF |
| **Mobile Money principal** | Wave, Orange Money SN, Free Money |
| **Langue** | Français (wolof pour certains labels) |
| **Référentiel légal** | Droit sénégalais — CDIS (Code du numérique) |
| **Villes couvertes (lancement)** | Dakar (Plateau, Almadies, Mermoz, Ouakam, Grand-Dakar) |
| **Heure fuseau** | UTC+0 (GMT) |
| **Spécificités culinaires prioritaires** | Thiéboudienne, yassa, mafé, dibi, restauration sénégalaise |

### 12.3 Burkina Faso

| Paramètre | Configuration BF |
|---|---|
| **Devise** | XOF |
| **Mobile Money principal** | Orange Money BF, Moov Money BF, Coris Money |
| **Langue** | Français |
| **Référentiel légal** | Droit burkinabè — ARCE (Autorité de Régulation des Communications Électroniques) |
| **Villes couvertes (lancement)** | Ouagadougou (Koulouba, Zone du Bois, Pissy, Ouaga 2000) |
| **Heure fuseau** | UTC+0 (GMT) |
| **Frais de livraison fallback** | 1 000 XOF (inférieur à CI — pouvoir d'achat plus faible) |
| **Plafond COD** | 25 000 XOF |
| **Spécificités culinaires prioritaires** | Tô, riz gras, poulet bicyclette, brochettes, cuisine burkinabè |

### 12.4 Extensions futures (Guinée, Mali, Togo, Bénin...)

Pour chaque nouveau pays, configurer avant lancement :

- [ ] Devise locale ou confirmation XOF (zone UEMOA)
- [ ] Opérateurs Mobile Money locaux et intégration API
- [ ] Référentiel légal et obligations locales (commerce électronique, fiscalité)
- [ ] Villes de lancement et zones de couverture
- [ ] Partenaires logistiques locaux identifiés
- [ ] Équipe locale ou partenaire de modération
- [ ] Catégories culinaires locales à ajouter au référentiel
- [ ] Jours fériés locaux configurés
- [ ] Langue d'interface (français dans la plupart des cas, mais adapter les contenus)

### 12.5 Règles multi-pays communes

- Un restaurant ne peut opérer que dans le pays où il est enregistré (pas de livraison transfrontalière)
- Un client peut commander depuis n'importe quel pays vers un restaurant du même pays uniquement
- Les reversements sont toujours effectués dans la devise du pays du restaurant
- Les tableaux de bord LaPlasse consolidés sont disponibles en vue globale (tous pays) et vue par pays

---

## 13. Conformité légale & hygiène alimentaire

### 13.1 Obligations à l'onboarding

Tout restaurant doit fournir avant activation :

**En Côte d'Ivoire :**
- Extrait RCCM (Registre du Commerce et du Crédit Mobilier) de moins de 3 mois
- Autorisation d'exploitation délivrée par la mairie ou la préfecture
- Attestation de visite sanitaire (délivrée par la Direction de l'Hygiène Publique — DHP)
- Déclaration fiscale (immatriculation DGI)

**Au Sénégal :**
- NINEA (Numéro d'Identification Nationale des Entreprises et Associations)
- Autorisation d'exploitation
- Rapport d'inspection sanitaire (DIREL ou service régional)

### 13.2 Règles d'hygiène alimentaire applicables aux restaurants

LaPlasse impose contractuellement le respect des règles suivantes, qui peuvent être contrôlées via des inspections surprises ou sur signalement :

- Conservation des aliments à températures réglementaires (chaîne du froid respectée)
- Traçabilité des produits utilisés (factures fournisseurs conservées 1 an)
- Produits périmés non utilisés et non vendus
- Propreté des locaux de préparation
- Personnel de cuisine avec certificat de santé à jour
- Emballages alimentaires adaptés et non toxiques
- Pas de réutilisation d'emballages à usage unique

### 13.3 Responsabilité en cas d'intoxication alimentaire

- La responsabilité première est celle du restaurant
- LaPlasse facilite la mise en relation avec les autorités sanitaires locales en cas de signalement grave
- LaPlasse peut suspendre immédiatement et sans préavis un restaurant faisant l'objet d'un signalement sanitaire officiel
- Le restaurant doit informer LaPlasse dans les 2h de tout rappel de produit ou alerte sanitaire concernant ses ingrédients

### 13.4 Mentions obligatoires sur les fiches articles

- Présence d'allergènes majeurs (arachides, gluten, lactose, fruits de mer, œufs, soja...)
- Mention "Contient de l'alcool" si applicable
- Mention "Halal" uniquement si certification ou déclaration sur l'honneur signée
- Indication si le plat est préparé dans un environnement pouvant contenir des allergènes ("fabriqué dans un atelier utilisant des arachides")

---

## 14. Tableaux de bord & KPIs

### 14.1 KPIs restaurant (espace partenaire)

| Indicateur | Description | Fréquence |
|---|---|---|
| Commandes reçues | Total et évolution | Temps réel / Jour / Semaine / Mois |
| Taux de confirmation | % de commandes acceptées vs reçues | Quotidien |
| Taux d'annulation | % annulations toutes causes | Quotidien |
| Délai moyen de préparation | Réel vs déclaré | Quotidien |
| Note moyenne | Globale et évolution | Temps réel |
| CA brut | Total avant commission | Hebdo / Mensuel |
| CA net reversé | Après déduction commission | Hebdo / Mensuel |
| Articles les plus commandés | Top 10 | Hebdo / Mensuel |
| Plages horaires les plus actives | Heatmap commandes | Hebdo |
| Taux de réclamation | % commandes avec incident | Mensuel |

### 14.2 KPIs livreur (interface web)

| Indicateur | Description |
|---|---|
| Courses effectuées | Aujourd'hui / Semaine / Mois |
| Revenus | Aujourd'hui / Semaine / Mois |
| Taux d'acceptation | % courses acceptées vs reçues |
| Délai moyen de livraison | Réel vs estimé |
| Note moyenne | Sur les 30 derniers jours |
| Distance parcourue | Aujourd'hui / Semaine |

### 14.3 KPIs LaPlasse (back-office opérationnel)

| Indicateur | Objectif cible (à définir) |
|---|---|
| GMV (Gross Merchandise Value) | — |
| Nombre de commandes / jour | — |
| Ticket moyen | — |
| Délai moyen bout en bout (commande → livraison) | < 45 min |
| Taux de livraisons réussies | > 95% |
| Taux de réclamations | < 5% |
| Note moyenne plateforme | > 4.2 |
| Taux de rétention client (J+30) | — |
| Nombre de restaurants actifs (> 1 commande / semaine) | — |
| Taux d'utilisation livreurs (heures actives / heures connectées) | — |

---

## 15. Règles de modération & sanctions

### 15.1 Motifs de suspension temporaire d'un restaurant

- Taux de refus de commande > 5% sur 7 jours glissants
- Note moyenne < 3.0 sur 30 jours
- 3 incidents de rupture non signalée en 30 jours
- Non-réponse au support LaPlasse pendant plus de 48h sur un litige actif
- Signalement sanitaire en cours d'instruction
- Non-renouvellement des documents légaux expirés

**Durée de suspension temporaire : 7 jours.** Le restaurant peut contester via le support.

### 15.2 Motifs de résiliation définitive

- Fraude avérée (faux plats, détournement de paiements)
- Mise en danger de la santé des clients (intoxication avérée par faute grave)
- 3 suspensions temporaires en 12 mois glissants
- Harcèlement ou menaces envers des clients ou des livreurs
- Violation grave des CGU (revente de données, dérivation vers plateforme concurrente)
- Fausse identité ou documents falsifiés à l'onboarding

### 15.3 Droit d'appel

Tout restaurant ou livreur sanctionné dispose de **7 jours** pour contester la décision via le formulaire de recours dans son espace partenaire. La décision de LaPlasse après recours est définitive.

---

## 16. Checklist onboarding restaurant

### Documents & légal
- [ ] Extrait RCCM / NINEA / équivalent local valide (< 3 mois)
- [ ] Autorisation d'exploitation valide
- [ ] Attestation sanitaire valide
- [ ] Pièce d'identité gérant
- [ ] CGU partenaire signées électroniquement

### Profil restaurant
- [ ] Nom, adresse, coordonnées GPS renseignés
- [ ] Photo de couverture (1200 × 400 px min)
- [ ] Logo (400 × 400 px min)
- [ ] Description rédigée (50 mots minimum)
- [ ] Catégorie(s) culinaire(s) sélectionnée(s)
- [ ] Horaires d'ouverture renseignés pour chaque jour
- [ ] Délai de préparation moyen renseigné
- [ ] Commande minimum configurée (0 si pas de minimum)
- [ ] Zone de livraison configurée

### Menu
- [ ] Au moins 3 articles créés avec photo, description et prix
- [ ] Toutes les catégories de menu nommées
- [ ] Options obligatoires configurées pour les articles qui le nécessitent
- [ ] Allergènes renseignés pour les articles concernés
- [ ] Disponibilités horaires configurées si nécessaire

### Livraison
- [ ] Mode de livraison sélectionné (LaPlasse / Interne / Hybride)
- [ ] Si interne : au moins 1 livreur enregistré dans le compte restaurant
- [ ] Frais de livraison configurés (ou confirmation "gérés par LaPlasse")

### Paiement & reversement
- [ ] Numéro Mobile Money de reversement renseigné et vérifié
- [ ] Activation ou désactivation du cash à la livraison choisie

### Test & validation
- [ ] Commande test réalisée et reçue avec succès
- [ ] Notification de confirmation reçue sur l'app restaurant
- [ ] Formation app restaurant complétée
- [ ] Fiche restaurant validée par l'équipe LaPlasse

---

## 17. Roadmap d'harmonisation Food

Priorisation pour aligner code, UX client/restaurant et ce document. **Mettre à jour cette section à la fin de chaque phase.**

### ✅ Phase 1 — Commande minimum & parcours desktop/mobile — TERMINÉ

1. ✅ **`food_min_order_amount`** sur `Merchant` (migration `20260627180000`) — configurable dans `/merchant/shop/menu` → Paramètres.
2. ✅ **API publique** : champ exposé sur `GET /merchants/:slug`, menu public, réponse panier food.
3. ✅ **Affichage client** : hero `/restauration/{slug}`, dock panier menu, page `/commande` (bouton grisé + message §5.4).
4. ✅ **Validation checkout** : `checkoutFoodOrder` refuse si sous-total articles < minimum (hors frais livraison).
5. ✅ **Doc §0** : parcours desktop vs mobile, recherche Meilisearch plats, deep-link `?plat=`.

### ✅ Phase 2 — Disponibilité restaurant — TERMINÉ

6. ✅ Champs `food_is_paused` + `food_pause_until` sur `Merchant` (migration `20260627190000`).
7. ✅ Endpoint `PATCH /merchant-menu/availability` — modes `open`, `paused` (15/30/45/60 min), `closed`.
8. ✅ **Back-office Paramètres** : boutons pause + "Fermer jusqu'à réouverture" + statut en temps réel.
9. ✅ **Guard panier** : `addMenuItemToCart` refuse si restaurant en pause / fermé.
10. ✅ **Guard checkout** : `checkoutFoodOrder` vérifie disponibilité avant de valider.
11. ✅ **Badge hub** : overlay "En pause" / "Fermé" sur les cartes `RestaurationHubCard`, opacité réduite.
12. ✅ **Badge hero fiche** : `RestaurationDetailPage` affiche "En pause jusqu'à HH:MM" (badge ambré) ou "Fermé temporairement" (badge gris) avec `FoodMenuOrderPanel` bloqué + bandeau.
13. 🟡 Fermeture automatique après 3 commandes non traitées (§3.4) — nécessite un scheduler/cron, reporté Phase 2b.

### ✅ Phase 3 — Catalogue menu enrichi — TERMINÉ

14. ✅ **Allergènes** par plat — `MenuItem.allergens String[]` (migration `20260627200000`). Sélecteur 14 allergènes réglementaires dans le drawer back-office, badges affichés sur les cartes menu client.
15. ✅ Tags **cuisines proposées** sur profil restaurant (§3.3) — sélecteur multi-tags dans Paramètres du menu, endpoint `PATCH /merchants/me/tags`, 24 tags prédéfinis (max 5).
16. ✅ **Menus composés** / formules — modèles `ComposedMenu` + `ComposedMenuSlot` (migration `20260627230000`). API CRUD authenf. `GET|POST|PATCH|DELETE /merchant-menu/composed-menus`. Exposition publique via `GET /merchants/:slug/menu` → champ `composed_menus[]`. `ComposedMenuService` dans `ShopMenuModule`.
17. ✅ **Promos menu réelles sur hub** — `has_active_promo` calculé par batch depuis table `Promotion` dans `findAll` / `findFeatured`. Carrousel "Offres spéciales" prioritise les restaurants avec promo active (badge rouge "Offre en cours"). Fallback sponsorisés si <2 promos.

### ✅ Phase 3b — Disponibilité auto & promos — TERMINÉ

13. ✅ **Fermeture automatique** après 3 commandes FOOD non traitées (§3.4) — `FoodCronService` (`@Cron` toutes les 5 min) bascule en pause 30 min les restaurants avec ≥3 ordres `PENDING` depuis >10 min. Logs `WARN` dans console. Module `FoodModule` enregistré dans `AppModule` avec `ScheduleModule.forRoot()`.

### ✅ Phase 4 — Notation hub & ETA client — TERMINÉ

14. ✅ **Note moyenne + nb avis réels** sur cartes hub — `avg_rating Float?` sur `Merchant` (migration `20260627210000`). Rempli à la création + backfill SQL des avis existants. Mis à jour en tâche de fond (`refreshMerchantAvgRating`) lors de chaque modération de review (approve / reject / delete) dans `AdminController`. `merchantDisplayRating` retourne `{ score, count }` avec la vraie note (fallback `trust_score` si pas encore d'avis). `RestaurationHubCard` affiche étoile + score + compteur avis (compact & featured).
15. ✅ **ETA dynamique** selon distance — `formatFoodEtaFromDistance(prep, distanceKm?)` adapte le buffer livraison : <2 km → +15 min, 2–5 km → +20 min, >5 km → +30 min. Utilisé dans `RestaurationHubCard` et `RestaurationDetailPage`.
16. ✅ **Notification retard automatique >15 min** (§5.3) — `FoodCronService.notifyLateDeliveries()` (`@Cron` toutes les 5 min) détecte les jobs `IN_TRANSIT` depuis >15 min et déclenche `DeliveryEtaService.refreshOrderEta()` → notification push client via `NotificationQueue`. Flag `eta_delay_notified_at` prévient les doublons.

### ✅ Phase 5 — Dispatch amélioré & tracking route — TERMINÉ

17. ✅ **Algorithme dispatch plateforme optimisé** — `DeliveryOfferService.scorePlatformCourier()` : scoring composite distance GPS pickup (0.5) + charge active (0.3) + note (0.15) + expérience (0.05). Tri par score décroissant. Fix `shopName` food dans notifications d'offre.
18. ✅ **Tracking livreur carte live avec route OSRM** — `DeliveryTrackClient` fetche la route OSRM (`router.project-osrm.org`) entre position courante livreur et point de livraison. Route affichée en polyline verte sur `CourierOsmMap` via nouvelle prop `routePolyline`. Recalcul seulement si position change d'au moins ~44m.
19. ✅ **Interface web livreur — corrections majeures** : (a) Nom client ajouté dans `JOB_INCLUDE` → `serializeJob` → `CourierJobCard` (`User` icon + nom + téléphone + note). (b) Lien de suivi client retiré de la vue livreur. (c) Double `feeSplit.persistForJob` supprimé. (d) `advanceMutation.onError` ajouté. (e) Switch tab history après livraison corrigé.
20. ✅ **Fix OUT_FOR_DELIVERY prématuré** — `dispatchOrder` n'envoie plus "Un livreur a été assigné" tant que l'auto-dispatch n'a pas trouvé de livreur. Notification neutre "en cours de recherche" pour les offres en attente.

### ✅ Phase 6 — Paiement COD & conformité multi-pays — TERMINÉ

21. ✅ **Cash à la livraison (COD) par restaurant** — `Merchant.food_accepts_cash Boolean @default(false)` + `food_cash_max_amount Int?` (migration `20260627220000`). Toggle + plafond dans l'onglet Paramètres back-office (`MerchantMenuPanel`). Badge "Cash accepté" sur fiche restaurant + dans le panier commande. Validation dans `UpdateMenuSettingsDto`. Logique d'autorisation COD centralisée dans `countryFoodRules.ts` (`isCodAllowedForAmount`).
22. ✅ **Conformité frais de livraison multi-pays** — `FOOD_FALLBACK_FEE_BY_COUNTRY` dans `delivery-zones.service.ts` : CI 1500 FCFA, BF 1000 FCFA, SN 2000 FCFA. `DeliveryQuoteRequest.country` passé par le checkout. `countryFoodRules.ts` côté frontend : plafonds COD, délais ETA, téléphones support par pays.
23. ✅ **Tags diététiques + mention alcool obligatoire (§13.4)** — `MenuItem.item_tags String[]` + `MenuItem.contains_alcohol Boolean` (migration `20260627240000`). Sélecteur tags (`halal`, `vegetarien`, `vegan`, `epice`, `sans_gluten`, `populaire`, `recommande`) dans le drawer back-office `MenuItemDrawer`. Toggle "Contient de l'alcool" (mention légale §13.4). Badges affichés côté client sur les cartes menu dans `FoodMenuOrderPanel` (tags verts, alcool badge rouge). Exposition API : `CreateMenuItemDto`, `UpdateMenuItemDto`, `formatItem` dans `shop-menu.service.ts`.
24. ✅ **Spécificités marché Burkina Faso (§12.3)** — Section §12.3 ajoutée au document (devise XOF, opérateurs Orange/Moov/Coris, Ouagadougou, fallback 1 000 XOF, plafond COD 25 000 XOF, spécificités culinaires). Déjà intégré techniquement via `FOOD_FALLBACK_FEE_BY_COUNTRY.BF` et `countryFoodRules.ts`. Extensions futures (Guinée, Mali, Togo, Bénin) conservées en §12.4 avec la checklist d'onboarding pays.

---

*Document interne LaPlasse — Module Food — v1.7 — 27 juin 2026*
*Applicable à tous les marchés LaPlasse Food — spécificités par pays en section 12*
*À réviser lors de chaque extension pays majeure ou évolution du modèle de livraison*
