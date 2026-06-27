# LaPlasse — Règles de gestion : Fiche Produit & Catalogue

> **Contexte** : Marketplace pure (vendeurs tiers uniquement) — Lancement Côte d'Ivoire — Devise XOF — Site web  
> **Version document** : 2.4 — 27 juin 2026  
> **Statut** : Document de référence produit — aligné sur la plateforme en place + cible d'harmonisation  
> **Intégration** : Phases 1, 2, 3, 4, 5, 6, 7 complètes — SEO auto, filtres marketplace, score trust vendeur, re-modération critique

---

## Comment lire ce document

Chaque section distingue trois niveaux :

| Badge | Signification |
|---|---|
| **✅ En place** | Comportement implémenté et exploitable aujourd'hui |
| **🟡 Partiel** | Existe mais incomplet, contourné ou incohérent avec la cible |
| **⬜ À implémenter** | Décrit dans la cible produit, absent du code |

> Ce document est la **base unique** pour consolider la feature produits.  
> Fichiers techniques associés : `apps/api/prisma/schema.prisma` (modèles `Product*`), `marketplace.service.ts`, `MerchantProductForm.tsx`, `seed-product-categories.ts`.

---

## Sommaire

0. [Synthèse plateforme vs cible](#0-synthèse-plateforme-vs-cible)
1. [Principes fondamentaux](#1-principes-fondamentaux)
2. [Modèle de données & parcours](#2-modèle-de-données--parcours)
3. [Structure de la fiche produit](#3-structure-de-la-fiche-produit)
4. [Gestion des variantes](#4-gestion-des-variantes)
5. [Caractéristiques et attributs](#5-caractéristiques-et-attributs)
6. [Gestion des prix & promotions](#6-gestion-des-prix--promotions)
7. [Gestion des stocks](#7-gestion-des-stocks)
8. [Médias](#8-médias)
9. [SEO et métadonnées](#9-seo-et-métadonnées)
10. [Statuts et cycle de vie](#10-statuts-et-cycle-de-vie)
11. [Informations légales — Droit ivoirien](#11-informations-légales--droit-ivoirien)
12. [Responsabilités vendeur vs LaPlasse](#12-responsabilités-vendeur-vs-laplasse)
13. [Checklist de publication](#13-checklist-de-publication)
14. [Roadmap d'harmonisation produit](#14-roadmap-dharmonisation-produit)

---

## 0. Synthèse plateforme vs cible

### Architecture actuelle (résumé)

| Couche | Implémentation |
|---|---|
| **Entité** | `Product` rattaché à une `Shop` (boutique standalone ou liée à un établissement) |
| **Taxonomie** | Arbre global `ProductCategory` ; la boutique active un sous-ensemble via `ShopProductCategory` |
| **Variantes** | Liste plate `ProductVariant` (types `TEXT` ou `COLOR`), pas d'axes combinés |
| **Médias** | Galerie `ProductImage` (max 10) + `image_url` principale dénormalisée |
| **Attributs libres** | `specifications` JSON `{ label, value }[]` + champ `composition` |
| **Publication** | Clic « Publier » → statut `PENDING_REVIEW` → validation admin → `ACTIVE` |
| **Catalogue public** | `/marketplace`, vitrine boutique `/m/{shopSlug}/boutique`, fiche `/m/{shopSlug}/p/{productSlug}` |
| **Gestion vendeur** | `/shop/manage/products/*` (standalone) et `/merchant/shop/products/*` (boutique liée) — même formulaire |
| **Recherche** | Meilisearch (nom, description…) + filtres catégorie / prix / pays |

### Tableau de maturité

| Domaine | En place | Partiel | À implémenter |
|---|---|---|---|
| CRUD produit + modération | ✅ | | |
| Catégories globales + activation boutique | ✅ | | |
| Variantes TEXT / COLOR | ✅ | 🟡 pas multi-axes | ⬜ axes combinés |
| Galerie images (10 max) | ✅ | 🟡 pas de contrainte résolution côté serveur | |
| Prix XOF + promos | ✅ | | ⬜ prix barré réglementé |
| Stock auto `OUT_OF_STOCK` | ✅ | 🟡 pas de stock réservé affiché | ✅ sur commande (`is_made_to_order`) |
| Avis clients (`ProductReview`) | ✅ | 🟡 modération avis | |
| Collections boutique | ✅ | | |
| Condition (neuf/occasion) | ✅ | | |
| Description courte dédiée | ✅ `short_description` | | |
| Tags produit | ✅ `tags[]` | | |
| Poids / dimensions / origine | ✅ `weight_grams`, `dimensions`, `origin` | | |
| Délai de préparation produit | ✅ `preparation_delay_days` | | |
| SKU produit parent | ✅ champ `sku` sur `Product` | | |
| Référence affichée LP-XXXXXXXX | ✅ affichée PDP publique + layout | | |
| Validation publish (prix, image, nom) | ✅ `assertPublishRequirements` | | |
| Anti-spam (tel. dans nom, prix < 100 XOF) | ✅ validation publish | | |
| Sanitization HTML API | ✅ `sanitizeHtml()` à create/update | | |
| Toast UX « en attente validation » | ✅ | | |
| Badge statut coloré liste produits | ✅ | | |
| Alerte stock bas vendeur (≤ 5 unités) | ✅ UI badge + filtre `ShopProductsPanel` | | |
| Limite 100 variantes | ✅ API + UI | | |
| Variante `is_disabled` | ✅ DB + exclusion public | | |
| Mode « sur commande » | ✅ `is_made_to_order` PDP + formulaire | | |
| Message stock bas PDP (1-10 unités) | ✅ PDP publique | | |
| Schema.org enrichi (condition, poids, images) | ✅ | | |
| Mots-clés SEO auto (tags + catégorie) | ✅ | | |
| SEO auto (seo_title, seo_description en DB, générés auto) | ✅ DB champs + generateMetadata auto | | |
| 404 archivé avec redirection boutique | ✅ | | |
| Blocs légaux par catégorie | ✅ `legal_notice` sur `ProductCategory` + PDP | | |
| CategoryAttribute + formulaire dynamique | ✅ seed 8 familles + formulaire adaptatif | | |
| Attributs dynamiques PDP publique | ✅ onglet Composition | | |
| Axes structurés variantes (multi-axes) | ✅ assistant combinaisons UI (`VariantAxisAssistant`) | | ⬜ modèle DB axes natifs (cible v3) |
| Score trust vendeur (ruptures) | ✅ endpoint + badge boutique (90j, ≥3 commandes) | | |
| Alertes retour en stock par email | | | ⬜ nécessite pipeline email/notif |
| Résolution min 800×800 px images | 🟡 avertissement frontend (non bloquant) | | ⬜ validation serveur (pipeline image) |
| Re-modération sur changements critiques | ✅ titre/catégorie/photos → PENDING_REVIEW si ACTIVE | | |
| Filtres condition/origine marketplace | ✅ UI + API query params | | |
| Vidéos produit | | | ⬜ nouvelle feature |

---

## 1. Principes fondamentaux

La fiche produit est la vitrine numérique du vendeur sur LaPlasse. Elle doit permettre à un acheteur ivoirien — souvent sur mobile, parfois avec une connexion limitée — de comprendre ce qu'il achète, à quel prix, et comment il sera livré, sans ambiguïté.

**Les trois impératifs de LaPlasse :**

- **Clarté** : le produit doit être compréhensible sans que le client ait besoin de poser de question
- **Fiabilité** : le stock, le prix et les délais affichés doivent être réels et à jour
- **Confiance** : les photos et descriptions doivent correspondre exactement à ce qui sera livré

> ⚠️ Toute fiche trompeuse (photos retouchées, description inexacte, prix incorrect) entraîne la désactivation du produit et peut mener à la suspension du compte vendeur.

**✅ En place** : modération admin avant publication, signalement litiges commande, avis modérés.  
**⬜ À implémenter** : règles automatiques anti-contenu (téléphone dans titre), score confiance vendeur.

---

## 2. Modèle de données & parcours

### 2.1 Schéma produit (plateforme)

```
Shop
 └── Product (status, price, stock_quantity, category_id, …)
      ├── ProductVariant[] (name, kind TEXT|COLOR, price, stock, sku?, color_hex?, image_url?)
      ├── ProductImage[] (url, sort_order) — max 10
      ├── ProductReview[]
      └── ProductCollection[] → ShopCollection
```

**Champs `Product` — v2.1 (schéma enrichi) :**

| Champ | Type | Rôle | Statut |
|---|---|---|---|
| `id` | cuid | Identifiant interne immuable | ✅ |
| `shop_id` | FK | Boutique propriétaire | ✅ |
| `category_id` | FK? | Une catégorie du référentiel | ✅ |
| `name` | string | Titre (5–100 car. validés à la publication) | ✅ |
| `slug` | string | URL unique par boutique | ✅ |
| `short_description` | text? | Accroche courte max 300 car. | ✅ |
| `description` | text? | Description longue HTML | ✅ |
| `composition` | text? | Matières / ingrédients HTML | ✅ |
| `specifications` | JSON? | Paires `{ label, value }` libres | ✅ |
| `condition` | enum? | `NEW`, `USED_GOOD`, `USED_FAIR`, `REFURBISHED` | ✅ |
| `origin` | enum? | `LOCAL_CI`, `IMPORTED`, `HANDMADE` | ✅ |
| `tags` | string[] | Mots-clés SEO / recherche | ✅ |
| `weight_grams` | int? | Poids en grammes | ✅ |
| `dimensions` | string? | Dimensions L×l×H texte libre | ✅ |
| `preparation_delay_days` | int? | Délai de préparation en jours ouvrés | ✅ |
| `price` | int | Prix XOF ; si variantes = min des prix variantes | ✅ |
| `stock_quantity` | int | Stock parent ; si variantes = somme des stocks | ✅ |
| `image_url` | string? | Vignette principale (1ʳᵉ image galerie) | ✅ |
| `allow_pickup` / `allow_delivery` | bool | Modes fulfillment autorisés | ✅ |
| `status` | enum | Voir §10 | ✅ |
| `currency` | string | `XOF` par défaut | ✅ |

> **Référence affichée** : `LP-{id.slice(0,8).toUpperCase()}` — calculé à la volée (pas de champ dédié).  
> **Validation publish** : `name ≥ 5 car.`, `price > 0`, `≥1 image`. Côté API (`assertPublishRequirements`) et DTO (`@IsIn` inclut `PENDING_REVIEW` dans les statuts autorisés).

### 2.2 Parcours vendeur

1. **Activer les catégories** — `/shop/manage/products/categories` ou équivalent merchant : cocher les catégories du catalogue LaPlasse utilisées par la boutique.
2. **Créer un produit** — formulaire `MerchantProductForm` : infos, specs, médias, prix/stock, catégorie, modes livraison/retrait.
3. **Brouillon** — enregistre en `DRAFT` (validation minimale).
4. **Publier** — le vendeur envoie `ACTIVE` ; l'API bascule en `PENDING_REVIEW` + notification admin.
5. **Validation admin** — `/admin/products` : approuver → `ACTIVE`, refuser → `DRAFT`.

### 2.3 Parcours acheteur

| Étape | Règle d'affichage |
|---|---|
| Listing marketplace / boutique | `ACTIVE` + stock > 0 (parent ou variante) |
| Fiche produit directe | `ACTIVE` **ou** `OUT_OF_STOCK` (message rupture, pas d'ajout panier) |
| Panier | Variante obligatoire si plusieurs déclinaisons en stock ; stock vérifié au checkout |

---

## 3. Structure de la fiche produit

### 3.1 Identifiants

| Champ | Cible métier | Plateforme actuelle | Statut |
|---|---|---|---|
| **ID LaPlasse** | `LP-XXXXXXXX` lisible | `LP-{id.slice(0,8)}` affiché sur PDP publique + onglet Composition | ✅ |
| **SKU vendeur** | Recommandé, niveau produit | `sku` sur **variante** uniquement | 🟡 |
| **Slug URL** | `nom-du-produit`, max 80 car. | Auto depuis `name`, unique `[shop_id, slug]` | ✅ |
| **URL publique** | Canonique fiche parent | `/m/{shopSlug}/p/{productSlug}` | ✅ |

> **Référence** : `LP-{id.slice(0,8).toUpperCase()}` calculé côté frontend (PDP, onglet composition). Un SKU au niveau produit parent est prévu dans une prochaine évolution.

### 3.2 Informations de base

| Champ | Règle cible | Plateforme | Statut |
|---|---|---|---|
| **Nom** | 5–100 car., type de produit en premier, pas de contact | API : 5–100 car. validés à la publication (`assertPublishRequirements`) | ✅ |
| **Accroche courte** | 300 car. max, texte brut | Champ `short_description` (DTO + service + formulaire) | ✅ |
| **Vendeur / boutique** | Auto, non modifiable sur la fiche | Via `shop_id` | ✅ |
| **Catégorie** | Une catégorie principale ; sous-catégorie recommandée | Un seul `category_id` ; obligatoire à la publication si ≥1 catégorie activée | ✅ |
| **Condition** | Neuf / Occasion bon état / Occasion acceptable / Reconditionné | Enum `ProductCondition` (NEW, USED_GOOD, USED_FAIR, REFURBISHED) | ✅ |
| **Origine** | Local CI / Importé / Fait main | Enum `ProductOrigin` (LOCAL_CI, IMPORTED, HANDMADE) | ✅ |
| **Tags** | Max ~10 mots-clés | Champ `tags string[]` — indexé pour SEO keywords | ✅ |
| **Localisation stock** | Commune de stockage | Portée par la **boutique** (`city`, `commune`) — pas par produit | 🟡 |

**Règle catégorie (comportement actuel)** : le vendeur sélectionne une entrée dans l'arbre activé pour sa boutique. Choisir une sous-catégorie suffit ; pas de double sélection parent + enfant.

**Arborescence LaPlasse (racines seedées)** — voir `seed-product-categories.ts` :

1. Informatique & High-tech  
2. Téléphones & Accessoires  
3. Électroménager  
4. Maison & Déco  
5. Mode & Accessoires  
6. Beauté & Santé  
7. Sport & Loisirs  
8. Alimentation & Boissons  
9. Auto & Moto  
10. Enfants & Bébé  
11. Artisanat & Art local  
12. Photo, Vidéo & Gaming  

Chaque racine a des sous-catégories (ex. Mode → Vêtements, Chaussures…). Filtrage pays via `ProductCategoryCountry` (défaut CI).

**Règles de nommage (cible — à faire respecter progressivement)** :

- Commencer par le type de produit, pas la marque
- Pas de majuscules sur chaque mot
- Pas de superlatifs non vérifiables
- Pas de numéros de téléphone ou contacts dans le nom

### 3.3 Descriptions

| Champ | Cible | Plateforme | Statut |
|---|---|---|---|
| **Description courte** | 300 car. max, texte brut, listings | Champ `short_description` (DB + DTO + formulaire + PDP publique) | ✅ |
| **Description longue** | 100–1500 mots, HTML limité | Champ `description` (éditeur riche, max 15 000 car. API) | ✅ |
| **Composition** | Matières / ingrédients | Champ `composition` dédié (onglet public) | ✅ |

**HTML autorisé** : `<p>`, `<ul>`, `<li>`, `<strong>`, `<em>`.  
**Interdit** : liens externes, téléphone, adresses, scripts, pub concurrente.  
**🟡 Partiel** : sanitization côté client uniquement — renforcement serveur à planifier.

**Exemple bon (description courte cible)** :  
*Pagne wax 100% coton, motif bogolan traditionnel, 6 yards. Idéal pour confection de tenues de cérémonie.*

---

## 4. Gestion des variantes

### 4.1 Principe

**Cible métier** : fiche parent + déclinaisons multi-axes (taille × couleur × …), max 3 axes, max 100 combinaisons.

**Plateforme actuelle** : liste plate de variantes sur une fiche — chaque ligne = une combinaison nommée librement.

```
Exemple actuel (valide) :
Fiche parent : Robe wax imprimé floral
  └── Variante « Taille S — Bleu » (TEXT, stock 3, prix 25 000)
  └── Variante « Taille M — Rouge » (COLOR + #hex, stock 5, prix 26 000)
```

| Capacité | Cible | Plateforme | Statut |
|---|---|---|---|
| Stock indépendant par variante | ✅ | ✅ | ✅ |
| Prix différent par variante | ✅ | ✅ | ✅ |
| Types visuels (pastilles couleur) | ✅ | `ProductVariantKind.COLOR` + `color_hex` | ✅ |
| Photo par couleur | Recommandé | `image_url` par variante | ✅ |
| Variante par défaut | 1ʳᵉ en stock | 1ʳᵉ variante en stock sur PDP | ✅ |
| Rupture visible / masquée | Choix vendeur | Variantes à stock 0 grisées sur PDP ; `is_disabled` exclut sans supprimer | ✅ |
| Max 100 variantes | ✅ | Validé API service + compteur UI | ✅ |
| Désactiver variante commandée | Ne pas supprimer | Champ `is_disabled` sur `ProductVariant` — exclu du listing public et checkout | ✅ |
| Axes structurés (Taille, Volume…) | ✅ | Nom libre uniquement — axes structurés prévus Phase 4 | ⬜ |

**Panier** : si plusieurs variantes en stock, l'acheteur doit en choisir une ; une seule variante en stock peut être auto-sélectionnée.

---

## 5. Caractéristiques et attributs

### 5.1 Attributs transverses

| Attribut | Cible | Plateforme | Statut |
|---|---|---|---|
| Condition | Enum (`NEW`, `USED_GOOD`, `USED_FAIR`, `REFURBISHED`) | Champ `condition` DB + DTO + formulaire + PDP | ✅ |
| Origine | Local CI / Importé / Fait main | Enum `ProductOrigin` DB + DTO + formulaire + PDP | ✅ |
| Poids | grammes (livraison) | Champ `weight_grams int?` DB + DTO + formulaire + PDP | ✅ |
| Dimensions | L × l × H texte libre | Champ `dimensions string?` DB + DTO + formulaire + PDP | ✅ |
| Délai de préparation | Par produit | `preparation_delay_days int?` DB + DTO + formulaire + PDP | ✅ |
| Mode sur commande | Flag produit | `is_made_to_order boolean` DB + DTO + badge PDP + formulaire | ✅ |

**✅ En place** : `specifications[]` libres (label 1–80 car., value 1–200 car.) + tous les attributs structurés ci-dessus.  
**⬜ Cible** : modèle `CategoryAttribute` (attributs obligatoires / recommandés **par catégorie**) — Phase 3.

### 5.2 Attributs recommandés par grande catégorie LaPlasse

À mapper sur le référentiel §3.2 lors de l'implémentation du schéma par catégorie :

| Catégorie LaPlasse | Attributs recommandés |
|---|---|
| **Mode & Accessoires** | Composition %, entretien, origine tissu, guide tailles |
| **Informatique & High-tech / Téléphones** | Marque, modèle, garantie, état batterie (occasion), 220V/50Hz |
| **Beauté & Santé** | Ingrédients, péremption, volume ml, type peau/cheveux |
| **Maison & Déco / Artisanat** | Matériaux, dimensions H×L×P, fait main, région d'origine |
| **Alimentation & Boissons** | DLC/DLUO, ingrédients, allergènes, poids net, conservation |
| **Auto & Moto** | Marque/modèle véhicule, années compatibles, réf. OEM, neuf/occasion |

### 5.3 Filtres catalogue (navigation)

| Filtre | Plateforme | Statut |
|---|---|---|
| Catégorie | ✅ arbre + slug | ✅ |
| Prix (min/max) | ✅ marketplace | ✅ |
| Pays | ✅ | ✅ |
| Recherche texte | ✅ Meilisearch | ✅ |
| Condition | ✅ Filtre UI + API exposé dans `/marketplace` | ✅ |
| Disponibilité (stock / rupture) | Implicite (produits sans stock exclus des listes) | 🟡 |
| Note vendeur / avis produit | Avis produit modérés | 🟡 |
| Origine | ✅ Filtre UI + API exposé dans `/marketplace` | ✅ |
| Commune vendeur | Via boutique, pas filtre produit dédié | 🟡 hors scope actuel |

---

## 6. Gestion des prix & promotions

### 6.1 Devise et affichage

**✅ En place** : XOF uniquement ; affichage `formatPrice()` (espaces milliers, pas de décimales).

### 6.2 Structure de prix

| Champ | Cible | Plateforme | Statut |
|---|---|---|---|
| Prix de vente | TTC, saisi vendeur | `price` (parent) ou `variant.price` | ✅ |
| Prix barré | Promo honnête | Via modèle `Promotion` (liens produit/catégorie) | ✅ 🟡 |
| Prix de revient | Interne vendeur | — | ⬜ |
| Commission LaPlasse | Auto selon plan/catégorie | Plans boutique (`plan-limits`) | 🟡 |

### 6.3 Règles sur les prix (cible — enforcement progressif)

- Pas de prix à 1 XOF pour contourner le paiement → **⬜ validation publish**
- Prix cohérent avec la catégorie → **🟡 modération manuelle admin**
- Promo : prix barré = vrai ancien prix (min. 7 jours) → **⬜**
- Durée promo max 30 jours sans renouvellement → **🟡** selon config promo

### 6.4 Livraison et prix

**✅ En place** : tarifs par zones (`ShopDeliveryZone`), modes `allow_pickup` / `allow_delivery` par produit ; devis au checkout.  
**Cible** : pas de surprise livraison au paiement — déjà aligné avec le calcul explicite au checkout.

---

## 7. Gestion des stocks

### 7.1 Niveaux

| Niveau | Cible | Plateforme | Statut |
|---|---|---|---|
| Stock disponible | ✅ | `stock_quantity` / variante | ✅ |
| Stock réservé | Commandes payées en préparation | Décrément au checkout ; pas de colonne « réservé » | 🟡 |
| Sur commande | Délai contractuel | `is_made_to_order` + `preparation_delay_days` sur Product | ✅ |

### 7.2 Affichage client (cible vs actuel)

| Situation | Message cible | Comportement actuel |
|---|---|---|
| Stock > 10 | « En stock » (sans chiffre) | Bouton ajout panier actif, pas de message quantité |
| Stock 1–10 | « Plus que X disponibles » | ✅ — message « Plus que {n} en stock ! » affiché sur PDP |
| Stock 0 | « Rupture » + alerte | Fiche accessible si `OUT_OF_STOCK` ; listes masquées ; badge rupture |
| Sur commande | « Fabriqué sur commande » + délai | ✅ — badge PDP + délai affiché dans onglet Composition |

**✅ En place** : passage auto `ACTIVE` → `OUT_OF_STOCK` quand stock = 0 ; retour `OUT_OF_STOCK` → `ACTIVE` au réassort (sans re-modération).  
**Espace vendeur** : alerte stock bas (seuil ≤ 5) dans `ShopProductsPanel`.

### 7.3 Obligations vendeur (cible)

- Mise à jour stock sous 24 h après vente hors plateforme → **⬜** score trust
- 2 ruptures non signalées / trimestre → avertissement → **⬜**
- Pause boutique 30 j max → statut boutique `SUSPENDED` / draft produits → **🟡** partiel côté shop

---

## 8. Médias

### 8.1 Images

| Critère | Cible doc v1 | Plateforme | Harmonisation retenue |
|---|---|---|---|
| Formats | JPG, PNG, WebP | Upload storage (images servies en WebP/optimisé selon pipeline) | ✅ |
| Résolution min | 800×800 px | **⬜** non vérifié serveur | À ajouter à la modération |
| Taille fichier | 2 Mo (v1) / 5 Mo (brouillon interne) | Limite upload storage | 🟡 aligner doc sur limite réelle infra |
| Nombre | 1 min, 5 max (v1) / 10 max (interne) | **Max 10** `ProductImage` | **Cible : 10 max**, 3–5 recommandées |
| Ratio | 1:1 recommandé | Non contraint | Recommandation UI |
| Fond neutre (1ʳᵉ image) | Obligatoire cible | Guideline vendeur | 🟡 modération visuelle |
| Alt text | Obligatoire | **⬜** | ⬜ dériver de `name` + index |

**✅ En place** : galerie ordonnée, 1ʳᵉ image = `image_url` ; placeholder si absent.

### 8.2 Interdits (modération)

Photos volées, contacts sur image, montages trompeurs, produit différent — **🟡** contrôle manuel admin.

### 8.3 Vidéos

**⬜ À implémenter** (cible v2) : MP4 court ou embed YouTube/TikTok.

---

## 9. SEO et métadonnées

| Élément | Cible | Plateforme | Statut |
|---|---|---|---|
| Title tag | `{Nom} — {boutique} — LaPlasse`, 50–60 car. | Généré depuis `product.name` + `shop.name` | ✅ |
| Meta description | Depuis description courte | `short_description` prioritaire, fallback troncature `description` | ✅ |
| Keywords | Tags + catégorie | Générés depuis `product.tags` + `category.name` | ✅ |
| Slug | Auto, minuscules, tirets | Auto à la création ; non rééditable vendeur | 🟡 slug éditable prévu |
| URL canonique | Fiche parent | `/m/{shopSlug}/p/{productSlug}` | ✅ |
| Variantes sans URL propre | ✅ | ✅ | ✅ |
| Fiche archivée → message dédié | Redirection boutique | API code `ARCHIVED` → frontend message + lien boutique (pas de 404 générique) | ✅ |
| Index recherche interne | nom, tags, catégorie… | Meilisearch : nom, description, catégorie | ✅ |
| Schema.org Product/Offer | Enrichi | `itemCondition`, `weight`, `availability`, `sku LP-…`, `seller`, `images[]` | ✅ |

---

## 10. Statuts et cycle de vie

### 10.1 Correspondance statuts

| Statut plateforme (`ProductStatus`) | Label UI | Visible client | Équivalent doc v1 |
|---|---|---|---|
| `DRAFT` | Brouillon | Non | Brouillon |
| `PENDING_REVIEW` | En validation | Non | En attente de modération |
| `ACTIVE` | Actif | Oui (si stock) | Publié |
| `OUT_OF_STOCK` | Rupture | Fiche oui / listes non | Désactivé temporaire (stock) |
| `ARCHIVED` | Archivé | Non | Archivé |

**⬜ Non modélisé** : « Suspendu LaPlasse » (distinct de `ARCHIVED`) — aujourd'hui via refus modération → `DRAFT` ou retrait admin.

### 10.2 Modération

**✅ Flux actuel**

1. Vendeur clique **Publier** → API force `PENDING_REVIEW` (même si payload `ACTIVE`).
2. Notification admin.
3. Admin approuve → `ACTIVE` ; refuse → `DRAFT`.

**🟡 Écarts UX**

- Toast vendeur « Produit publié » alors que statut = `PENDING_REVIEW`.
- Pas de badge « En validation » persistant sur la fiche après enregistrement.

**Sans re-modération (✅)** : mise à jour prix, stock ; réassort depuis `OUT_OF_STOCK`.

**✅ Implémenté** : re-modération si changement photos, catégorie, ou titre sur un produit `ACTIVE` → status passe en `PENDING_REVIEW`.

### 10.3 Critères minimaux de publication

| Critère | Cible | Enforcement actuel |
|---|---|---|
| Nom ≥ 5 car. | ✅ | ✅ `assertPublishRequirements` min 5 car. |
| ≥ 1 photo | ✅ | ✅ `assertPublishRequirements` bloquant serveur |
| Prix > 0 | ✅ | ✅ `assertPublishRequirements` bloquant serveur |
| Catégorie | ✅ | Oui si boutique a des catégories activées |
| Condition | Recommandé | 🟡 champ disponible, non obligatoire à la publication |
| Localisation | Via boutique | 🟡 adresse boutique |
| Délai préparation | Recommandé | 🟡 champ disponible, non obligatoire à la publication |
| Mode livraison/retrait | — | ✅ au moins un des deux si non-draft |

### 10.4 Limites plan boutique

**✅ En place** : quota produits selon plan (ex. FREE = 5 produits actifs/brouillon).

---

## 11. Informations légales — Droit ivoirien

> LaPlasse opère sous le droit ivoirien (pas RGPD EU direct ; Loi 2013-450 ARTCI pour données perso).

### 11.1 Cadre (inchangé — référence compliance)

| Domaine | Texte |
|---|---|
| E-commerce | Loi n°2013-546 |
| Consommation | Loi n°2013-412 |
| Données perso | Loi n°2013-450 — ARTCI |
| Publicité mensongère | Loi n°2016-412 art. 18–24 |

### 11.2 Obligations sectorielles (à porter dans fiche produit)

Les mentions ci-dessous restent **cibles** ; aujourd'hui le vendeur peut les saisir dans `composition` / `specifications` :

- **Alimentation** : ingrédients, allergènes, DLC, conservation, origine
- **Cosmétiques** : INCI, péremption, précautions
- **Électronique** : garantie, 220V/50Hz, origine import
- **Santé / médicaments** : **interdit** sans agrément DPML
- **Alcools** : licence + mention mineurs

### 11.3 Produits interdits (modération)

Médicaments, armes, contrefaçons, contenus illégaux, agréments manquants — **✅** liste modération admin (à formaliser dans checklist admin).

---

## 12. Responsabilités vendeur vs LaPlasse

| Responsabilité | Vendeur | LaPlasse |
|---|---|---|
| Exactitude description | ✅ | ❌ |
| Conformité produit livré | ✅ | ❌ |
| Mise à jour stock | ✅ | ❌ |
| Qualité photos | ✅ | ❌ |
| Obligations légales sectorielles | ✅ | ❌ |
| Modération fiches | ❌ | ✅ |
| Paiement sécurisé | ❌ | ✅ |
| Médiation litiges | 1ʳᵉ ligne | ✅ |

> LaPlasse est hébergeur de l'offre, pas vendeur.

---

## 13. Checklist de publication

### 13.1 Checklist vendeur (v2.1 — validée API publication)

**Identification**
- [x] Nom clair (min. 5 car. — **validé API**)
- [ ] Catégorie sélectionnée (si catégories activées pour la boutique)
- [x] Au moins un mode : livraison et/ou retrait

**Contenu**
- [x] Accroche courte optionnelle (`short_description` ≤ 300 car.)
- [ ] Description ou composition renseignée (fortement recommandé)
- [ ] Spécifications clés (via champs libres)
- [ ] Pas de téléphone / WhatsApp dans le texte
- [x] État du produit `condition` (Neuf / Occasion / Reconditionné) — champ disponible dans le formulaire
- [x] Origine `origin` (local CI / importé / fait main) — champ disponible dans le formulaire
- [x] Tags mots-clés — champ disponible, utilisé pour le SEO

**Médias**
- [x] Au moins 1 image (**requis à la publication — validé API**)
- [ ] 3–5 images pour catégories mode / artisanat

**Prix & stock**
- [x] Prix > 0 XOF (**validé API**)
- [ ] Stock renseigné (ou variantes avec stock)
- [ ] SKU variante si gestion interne

**Logistique**
- [x] Poids `weight_grams` si livraison physique — champ disponible dans le formulaire
- [x] Délai de préparation `preparation_delay_days` — champ disponible
- [x] Mode « sur commande » `is_made_to_order` — toggle dans le formulaire
- [ ] Zones et tarifs configurés dans **Livraison** boutique si `allow_delivery`

### 13.2 Checklist cible (après Phase 3 — attributs par catégorie)

Contrôles bloquants restant à ajouter à la publication :

- [ ] ≥ 1 image validée (résolution min 800×800 px — contrôle serveur)
- [ ] Attributs obligatoires de la catégorie complétés (après Phase 3)
- [ ] Sanitization HTML description côté API (anti-liens, anti-contacts)

---

## 14. Roadmap d'harmonisation produit

Priorisation proposée pour aligner code, UX vendeur et ce document.

### ✅ Phase 1 — Corrections rapides (sans migration lourde) — TERMINÉ

1. ✅ **UX publication** : toast « En attente de validation » ; badge `PENDING_REVIEW` coloré dans liste produits.
2. ✅ **Validation publish API** : `assertPublishRequirements` (prix > 0, ≥ 1 image, nom min 5 car.) ; `@IsIn` statuts DTO incluant `PENDING_REVIEW`.
3. ✅ **Limite 100 variantes** : API service + boutons désactivés frontend avec compteur.

### ✅ Phase 2 — Champs structurants (migration Prisma) — TERMINÉ

4. ✅ `condition` (enum `ProductCondition`), `short_description`, `tags[]`, `weight_grams`, `dimensions`, `origin`, `preparation_delay_days` — migration `20260627120000_product_enriched_fields`.
5. ✅ Affichage référence `LP-{id.slice(0,8)}` sur la PDP publique.
6. ✅ Formulaire `MerchantProductForm` enrichi : section « Détails & logistique » avec tous les nouveaux champs.
7. ✅ PDP publique : `short_description` en priorité, message stock bas (1–10 unités), composition enrichie (état, origine, poids, dimensions, délai).
8. ✅ SEO amélioré : `keywords` auto depuis `tags` + `category.name` ; Schema.org complet avec `itemCondition`, `weight`, `images[]`, disponibilité stock.
9. ⬜ Sanitization HTML stricte à la publication (côté backend, à faire en Phase 2b-bis).

### ✅ Phase 3 — Catégories intelligentes — TERMINÉ

10. ✅ Schéma `CategoryAttribute` (label, key, type TEXT/NUMBER/ENUM/BOOLEAN, is_required, enum_options, unit, placeholder) + `ProductAttributeValue` — migration `20260627150000`.
11. ✅ Seed attributs pour 8 familles de catégories (Mode, Informatique, Téléphones, Beauté, Alimentation, Maison/Artisanat, Auto, Électroménager).
12. ✅ Endpoint `GET /marketplace/product-categories/:id/attributes` (avec héritage parent).
13. ✅ Section dynamique « Attributs de la catégorie » dans `MerchantProductForm` — chargée selon la catégorie sélectionnée.
14. ✅ Affichage attributs dans l'onglet Composition de la PDP publique.
15. ✅ Filtres marketplace par condition/origine : UI radio + API query params `condition`, `origin`.

### ✅ Phase 4 — Variantes v2 (partiel) — TERMINÉ en partie

13. ✅ Limite 100 variantes (API + UI avec compteur).
14. ✅ Statut `is_disabled` par variante (champ DB + DTO + exclusion du stock/checkout public).
15. ✅ `VariantAxisAssistant` — composant UX de génération de combinaisons multi-axes (jusqu'à 3 axes, aperçu temps réel, génération batch). Modèle DB axes natifs = cible v3.

### ✅ Phase 5 — Stock & confiance (partiel) — TERMINÉ en partie

16. ✅ Mode « sur commande » (`is_made_to_order` sur `Product`) — badge PDP + formulaire.
17. ✅ Messages stock bas 1–10 unités sur PDP.
18. ✅ Score trust vendeur — endpoint `GET /shops/:slug/trust`, calcul sur 90j, badge « Vendeur de confiance » / « Vendeur fiable » sur vitrine boutique.

### ✅ Phase 6 — SEO & légal — TERMINÉ

17. ✅ Schema.org enrichi : `itemCondition`, `weight`, `images[]`, disponibilité stock réelle, `seller`.
18. ✅ Keywords SEO auto depuis `tags` + `category.name` dans le layout PDP.
19. ✅ 404 archivé : message adapté + lien vers la boutique (côté frontend + API retourne `ARCHIVED`).
20. ✅ SEO entièrement automatique — `generateMetadata` génère title, description, keywords depuis `product.name`, `shop.name`, `product.tags`, `category.name`. Champs `seo_title`/`seo_description` maintenus en DB pour usage futur. Section formulaire SEO supprimée (données auto-générées).
21. 🟡 Slug modifiable avec redirection 301 — slug auto non rééditable (complexité architecture).
22. ✅ `legal_notice` sur `ProductCategory` — affiché dans onglet Composition de la PDP publique.

### ✅ Phase 2b-bis — Sanitization HTML API — TERMINÉ

23. ✅ `assertPublishRequirements` : strip balises interdites (`<script>`, `<iframe>`, `<a>` externes) sur `description` et `short_description` à la publication.
24. ✅ `sanitizeHtml()` : nettoyage appliqué à `createProduct` et `updateProduct`.
25. ✅ Anti-spam : rejet numéro de téléphone dans le nom du produit à la publication.
26. ✅ Prix minimum publication : 100 XOF.

### ✅ SKU produit parent — TERMINÉ

27. ✅ Champ `sku` sur `Product` (DB + DTO + `MerchantProductForm`) — distinct du SKU variante.

---

## Annexes

### A. Routes & composants clés

| Rôle | Chemin |
|---|---|
| Liste produits vendeur | `/shop/manage/products`, `/merchant/shop/products` |
| Formulaire | `MerchantProductForm.tsx` |
| Catégories boutique | `/shop/manage/products/categories` |
| Modération admin | `/admin/products` |
| PDP publique | `/m/[slug]/p/[productSlug]` |
| API CRUD | `POST/PATCH/DELETE /products?shopId=` |
| Catégories publiques | `GET /marketplace/product-categories?country=CI` |

### B. Différences avec `product_gestions.md`

Le fichier `product_gestions.md` est un export plat de la v1 du présent document. **Ce fichier (`LaPlasse_Regles_Fiche_Produit.md`) fait foi.** Ne pas maintenir deux versions divergentes.

---

*Document interne LaPlasse — v2.4 — 27 juin 2026*  
*Prochaine révision : alertes retour en stock par email, validation serveur résolution image, modèle DB axes variantes natifs*  
*Extension CEDEAO : adapter catégories pays et obligations légales par marché*
