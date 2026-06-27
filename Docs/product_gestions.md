LaPlasse — Règles de gestion : Fiche Produit & Catalogue
> **Contexte** : Marketplace pure (vendeurs tiers uniquement) — Lancement Côte d'Ivoire — Devise XOF — Site web
> **Version** : 1.0 — 2026
---
Sommaire
Principes fondamentaux
Structure de la fiche produit
Gestion des variantes
Caractéristiques et attributs
Gestion des prix
Gestion des stocks
Médias
SEO et métadonnées
Statuts et cycle de vie
Informations légales — Droit ivoirien
Responsabilités vendeur vs LaPlasse
Checklist de publication
---
1. Principes fondamentaux
La fiche produit est la vitrine numérique du vendeur sur LaPlasse. Elle doit permettre à un acheteur ivoirien — souvent sur mobile, parfois avec une connexion limitée — de comprendre ce qu'il achète, à quel prix, et comment il sera livré, sans ambiguïté.
Les trois impératifs de LaPlasse :
Clarté : le produit doit être compréhensible sans que le client ait besoin de poser de question
Fiabilité : le stock, le prix et les délais affichés doivent être réels et à jour
Confiance : les photos et descriptions doivent correspondre exactement à ce qui sera livré
> ⚠️ Toute fiche trompeuse (photos retouchées, description inexacte, prix incorrect) entraîne la désactivation du produit et peut mener à la suspension du compte vendeur.
---
2. Structure de la fiche produit
2.1 Identifiants du produit
Chaque produit sur LaPlasse possède deux niveaux d'identifiants : ceux générés par la plateforme, et ceux fournis par le vendeur.
Champ	Géré par	Format	Obligatoire
ID LaPlasse	Plateforme (auto)	LP-XXXXXXXX (8 chiffres)	Oui — immuable
SKU vendeur	Vendeur	Libre, alphanumérique, sans espace	Recommandé
Slug URL	Plateforme (auto depuis le nom)	nom-du-produit-ville-vendeur	Oui
> Le SKU vendeur est son propre référentiel interne. LaPlasse ne l'impose pas mais l'encourage fortement pour que le vendeur puisse gérer ses stocks et ses commandes.
2.2 Informations de base
Champ	Règles	Obligatoire
Nom du produit	5 à 100 caractères. Clair, sans majuscules excessives, sans emoji dans le titre. Inclure le type de produit en premier. Ex : Pagne wax 6 yards — motif bogolan	Oui
Vendeur	Lié au compte vendeur vérifié. Non modifiable par le vendeur sur la fiche.	Oui (auto)
Catégorie principale	Choisie parmi l'arborescence LaPlasse. Une seule catégorie principale.	Oui
Sous-catégorie	Niveau 2 ou 3 de l'arborescence. Affine le filtrage.	Recommandé
Localisation du vendeur	Ville et commune de stockage / retrait. Impacte le calcul de livraison. Ex : Abidjan — Cocody	Oui
Tags	Mots-clés libres séparés par des virgules. Max 10 tags. Ex : wax, tissu, bogolan, ankara	Recommandé
Condition	Neuf / Occasion bon état / Occasion acceptable / Reconditionné	Oui
Règles de nommage à respecter :
Commencer par le type de produit (ce que c'est), pas par la marque
Pas de majuscules sur chaque mot ("Chaussure En Cuir" → "Chaussure en cuir")
Pas de superlatifs non vérifiables ("le meilleur", "qualité supérieure")
Pas de numéros de téléphone ou de contacts dans le nom
2.3 Descriptions
Description courte (accroche)
2 à 3 phrases maximum
Répondre aux questions : Qu'est-ce que c'est ? Pour qui ? Quel bénéfice principal ?
Affichée dans les listings et les résultats de recherche
300 caractères maximum
Pas de HTML — texte brut uniquement
Exemple bon : Pagne wax 100% coton, motif bogolan traditionnel, 6 yards. Idéal pour confection de tenues de cérémonie. Tissu épais, couleurs garanties lavage après lavage.
Exemple mauvais : PAGNE DE QUALITÉ SUPERIEURE!!! Contactez-nous au 07 XX XX XX XX pour commander. Livraison partout en CI !!!
Description longue (détaillée)
100 à 1500 mots selon la complexité du produit
Structurer avec des paragraphes courts (3-5 lignes max) — les utilisateurs lisent sur mobile
HTML basique autorisé : `<p>`, `<ul>`, `<li>`, `<strong>`, `<em>`
Interdit : liens externes, numéros de téléphone, adresses, `<script>`, publicité pour d'autres plateformes
Inclure systématiquement : matières / composition, dimensions ou tailles, conseils d'utilisation ou d'entretien, informations de fabrication si pertinentes (fait main, local, importé...)
> 💡 **Conseil pour les vendeurs** : Une description qui répond aux questions fréquentes réduit les messages entrants et augmente les conversions. Pensez à répondre à : "Quelle est la taille exacte ?", "D'où vient le produit ?", "Comment l'entretenir ?"
---
3. Gestion des variantes
3.1 Principe
Un produit avec variantes est composé d'une fiche parent (la vitrine) et de fiches enfants (les déclinaisons). Le client voit la fiche parent et choisit ses options.
```
Exemple :
Fiche parent : Robe wax imprimé floral
  └── Variante 1 : Taille S — Bleu (stock : 3)
  └── Variante 2 : Taille M — Bleu (stock : 0)
  └── Variante 3 : Taille M — Rouge (stock : 5)
  └── Variante 4 : Taille L — Rouge (stock : 2)
```
3.2 Axes de variantes disponibles sur LaPlasse
Axe	Exemples de valeurs	Notes
Taille (vêtement)	XS, S, M, L, XL, XXL, XXXL	Ajouter un guide des tailles si possible
Taille (chaussure)	36, 37, 38, 39, 40, 41, 42, 43, 44, 45	Préciser si pointure EU ou locale
Couleur	Valeur texte + code couleur hex optionnel	Obligatoire une photo par couleur
Matière / Tissu	Wax, bazin, soie, coton, synthétique...	Utile pour le filtrage
Volume / Contenance	250ml, 500ml, 1L, 5L	Inclure l'unité
Conditionnement	Unité, lot de 3, carton de 12...	Préciser le prix unitaire si lot
Parfum / Saveur	Pour cosmétiques, alimentaire	Description distincte si nécessaire
Maximum 3 axes combinés par produit. Au-delà, créer des produits parents distincts.
3.3 Règles des variantes
Chaque variante a son propre stock indépendant
Chaque variante peut avoir un prix différent du parent (ex : taille XXXL à 500 XOF de plus)
Une variante en rupture peut rester visible avec la mention Rupture de stock ou être masquée — le vendeur choisit dans ses paramètres
La variante affichée par défaut est la première disponible (stock > 0)
Maximum 100 variantes par produit parent
Ne jamais supprimer une variante qui a eu des commandes — la passer en statut Désactivée
---
4. Caractéristiques et attributs
4.1 Attributs obligatoires (tous produits)
Attribut	Format	Pourquoi
Condition	Neuf / Occasion / Reconditionné	Information légale et confiance
Poids	En grammes ou kilogrammes	Calcul frais de livraison
Dimensions	Longueur × largeur × hauteur en cm	Calcul volumétrique livraison
Origine	Local CI / Importé (pays) / Fait main	Attente forte des acheteurs ivoiriens
Délai de préparation	En jours ouvrables. Ex : Prêt en 24h, Sur commande 3-5 jours	Affiché sur la fiche, engage le vendeur
4.2 Attributs par grande catégorie
Mode & Textile
Composition en % (ex : 100% coton wax, 65% polyester 35% coton)
Instructions d'entretien (lavage main, machine, température)
Taille du mannequin sur les photos (si applicable)
Origine du tissu (made in CI, tissu hollandais, bazin Guinée...)
Électronique & High-Tech
Marque et modèle exact
Garantie (durée, type : vendeur, constructeur, aucune)
État de la batterie si occasion (%)
Compatibilité réseau (MTN CI, Orange CI, Moov Africa...)
Tension/fréquence (220V/50Hz standard Côte d'Ivoire)
Alimentation & Produits frais
Date limite de consommation ou DLUO
Composition / ingrédients
Allergènes
Conditions de conservation
Poids net
Zone de production si local (ex : Ignames — Région de Yamoussoukro)
Cosmétiques & Beauté
Liste complète des ingrédients
Date de péremption
Volume en ml
Type de peau / cheveux recommandé
Présence ou absence de composants sensibles (parabènes, sulfates...)
Maison & Artisanat
Matériaux utilisés
Dimensions précises (H × L × P)
Fait main / industriel
Artisan ou région d'origine si local
Véhicules & Pièces auto
Marque et modèle de véhicule compatible
Année(s) de compatibilité
Référence pièce OEM si applicable
Neuf / Occasion / Compatible aftermarket
4.3 Attributs de filtrage (navigation)
Ces valeurs doivent correspondre au référentiel LaPlasse — ne pas inventer de valeurs libres pour ces champs :
Catégorie / sous-catégorie
Condition
Tranche de prix (calculée automatiquement)
Localisation vendeur (commune d'Abidjan ou autre ville CI)
Note vendeur
Disponibilité (en stock / rupture / sur commande)
Origine (local CI / importé)
---
5. Gestion des prix
5.1 Devise et affichage
Devise unique au lancement : XOF (Franc CFA)
Tous les prix sont affichés TTC (toutes taxes comprises) — obligation légale et attente client
Format d'affichage : `12 500 XOF` ou `12 500 FCFA` (espace comme séparateur de milliers, pas de virgule décimale)
Pas de centimes : arrondir au franc CFA le plus proche
5.2 Structure de prix
Champ	Description	Visible client
Prix de vente	Prix normal affiché. TTC. Saisi par le vendeur.	Oui
Prix barré	Prix de référence avant promotion. Doit avoir été le prix réel pendant au moins 7 jours.	Oui (si promo active)
Prix de revient	Coût interne du vendeur. Non transmis à LaPlasse.	Non
Commission LaPlasse	Calculée automatiquement par la plateforme selon la catégorie. Déduite au moment du paiement.	Non (visible dans l'espace vendeur)
5.3 Règles sur les prix
Prix minimum :
Pas de prix fixé à 1 XOF pour contourner le système de paiement
Le prix doit couvrir a minima les frais de livraison si ceux-ci sont inclus dans le prix affiché
LaPlasse se réserve le droit de désactiver des fiches avec des prix manifestement anormaux (prix cassé pour générer du trafic puis refus de vendre)
Promotions :
Réduction en pourcentage (ex : -15%)
Réduction en montant fixe (ex : -2 000 XOF)
Le prix barré doit être le vrai prix précédent — pas un prix gonflé artificiellement
Durée maximale d'une promotion sans renouvellement explicite : 30 jours
Les promotions sont visibles dans les listings avec un badge Promo
Frais de livraison :
Le vendeur choisit entre : livraison incluse dans le prix / frais calculés selon la zone / retrait uniquement
Si "livraison incluse" : le prix affiché est le prix final, livraison Abidjan comprise
Si "frais variables" : afficher une estimation sur la fiche, prix final calculé au checkout
Pas de surprise de livraison au moment du paiement — pratique sanctionnée
5.4 Grille de commissions LaPlasse (exemple)
> *À renseigner selon la grille commerciale définie — les valeurs ci-dessous sont indicatives*
Catégorie	Commission indicative
Mode & Textile	10%
Électronique	8%
Alimentation	7%
Maison & Déco	10%
Beauté & Cosmétiques	12%
Artisanat local	5% (taux préférentiel)
Autres	10%
---
6. Gestion des stocks
6.1 Niveaux de stock
Niveau	Description
Stock disponible	Quantité que le vendeur peut expédier immédiatement
Stock réservé	Quantité bloquée pour des commandes payées en cours de préparation
Stock affiché	Stock disponible − Stock réservé. C'est ce que voit le client.
Sur commande	Produit fabriqué ou sourcé à la demande. Délai indiqué obligatoirement.
6.2 Règles d'affichage
Stock affiché	Message client	Règle
> 10	En stock	Ne pas afficher le chiffre exact
1 à 10	Plus que X disponibles	Afficher le chiffre — crée une urgence légitime
0	Rupture de stock	Proposer l'alerte retour en stock
Sur commande	Disponible sur commande — délai : X jours	Le délai est contractuel pour le vendeur
6.3 Obligations du vendeur
Mettre à jour son stock dans les 24h après chaque vente hors plateforme (vente physique, autre canal)
En cas de rupture non signalée entraînant une commande non honorée, le vendeur est pénalisé (voir CGV vendeur)
Tolérance rupture : 2 incidents de rupture non signalée par trimestre. Au-delà, avertissement puis suspension temporaire
Le vendeur peut activer le mode Pause boutique (vacances, réapprovisionnement) sans pénalité pour une durée maximale de 30 jours consécutifs
6.4 Spécificités marché local
Produits saisonniers (ignames nouvelles, mangues, etc.) : le vendeur doit impérativement fermer la fiche en dehors de la saison — une commande non livrable pour raison saisonnière est considérée comme un incident
Produits uniques / artisanat : activer le mode Quantité : 1 — Pièce unique. La fiche se désactive automatiquement dès la vente.
Stock physique en boutique : si le vendeur vend aussi en boutique physique, configurer un stock "en ligne" inférieur au stock réel pour absorber les décalages de mise à jour
---
7. Médias
7.1 Images — Règles obligatoires
Critère	Règle
Format	JPG ou PNG. WebP accepté. Pas de GIF.
Résolution minimale	800 × 800 px. Recommandé : 1200 × 1200 px.
Taille fichier	Max 5 Mo par image. La plateforme génère les vignettes automatiquement.
Ratio	Carré (1:1) fortement recommandé pour la cohérence du catalogue.
Fond	Image principale : fond neutre clair (blanc, gris clair, beige). Pas de fond chargé ou multicolore sur la première image.
Nombre	Minimum 1 image. Maximum 10 images par fiche. Recommandé : 3 à 5.
Alt text	Obligatoire. Format : [Nom produit] — [vue ou détail]
7.2 Ce qui est interdit dans les images
Numéro de téléphone, watermark avec contact, logo de concurrent
Images volées sur Internet — LaPlasse peut exiger la preuve de propriété des visuels
Montages trompeurs (ex : accessoires non inclus présentés comme inclus)
Images d'un autre produit que celui vendu
Texte promotionnel surchargé (prix en grand, "SOLDÉ", flèches...) sur la première image
7.3 Bonnes pratiques photos pour vendeurs locaux
> La qualité photo est le premier facteur de conversion sur une marketplace. Un produit bien photographié avec un smartphone peut surpasser un produit mal photographié avec un appareil pro.
Avec un smartphone :
Photographier en plein jour, lumière naturelle indirecte (pas de soleil direct)
Fond : tissu blanc ou mur blanc propre — pas de fond coloré
Nettoyer l'objectif du téléphone avant de prendre la photo
Mode portrait désactivé pour les produits (il floute l'arrière-plan de façon artificielle)
Prendre plusieurs angles : face, dos, détail, contexte d'utilisation
Nombre d'images recommandé par type de produit :
Vêtement / mode : 4 minimum (face, dos, détail tissu, porté ou mise en situation)
Chaussure : 3 minimum (face, profil, semelle)
Électronique : 3 minimum (produit seul, contenu de la boîte, détail connectique)
Alimentation : 2 minimum (emballage complet, étiquette lisible)
Artisanat : 3 minimum (produit seul, détail, mise en situation)
7.4 Vidéos (optionnel mais très recommandé)
Formats acceptés : MP4
Durée : 15 à 60 secondes
La vidéo produit augmente fortement la conversion — particulièrement pour les produits de mode et les produits techniques
Pas de musique sous droits — utiliser de la musique libre de droits ou pas de musique
Le vendeur peut aussi partager un lien YouTube ou TikTok (sera intégré en embed)
---
8. SEO et métadonnées
8.1 Champs SEO
Champ	Règles	Caractères
Balise titre (title tag)	Format : [Nom produit] — LaPlasse. Généré automatiquement depuis le nom produit. Modifiable.	50-60 car.
Meta description	Générée depuis la description courte. Modifiable. Inclure le nom du produit et un avantage clé.	140-160 car.
URL (slug)	Générée automatiquement depuis le nom produit. Minuscules, tirets, sans accents.	Max 80 car.
8.2 Règles SEO spécifiques LaPlasse
L'URL canonique est toujours la fiche parent. Les variantes n'ont pas d'URL propre.
Les fiches désactivées retournent un code HTTP 404 après 7 jours (pas de redirection permanente — le vendeur n'est pas responsable du SEO des fiches désactivées)
Utiliser des mots-clés locaux dans les descriptions : noms de quartiers, termes locaux, appellations courantes en Côte d'Ivoire (ex : "attiéké", "gboman", "kpoclolo")
Le moteur de recherche interne LaPlasse indexe : nom, description courte, tags, catégorie, localisation
8.3 Données structurées (Schema.org)
LaPlasse gère les données structurées Schema.org automatiquement pour toutes les fiches publiées. Le vendeur n'a pas à s'en occuper. La plateforme génère les champs `Product`, `Offer`, `AggregateRating` et `Seller` pour chaque fiche active.
---
9. Statuts et cycle de vie
9.1 Statuts possibles
Statut	Visible client	Description
Brouillon	Non	Fiche en cours de création par le vendeur. Aucune contrainte de complétude.
En attente de modération	Non	Soumis à LaPlasse pour validation. Délai : 24-72h ouvrables.
Publié	Oui	Fiche validée, visible dans le catalogue et la recherche.
Désactivé (vendeur)	Non	Masqué par le vendeur (rupture, pause, modification en cours). Réactivable.
Suspendu (LaPlasse)	Non	Désactivé par LaPlasse suite à une infraction. Nécessite une correction et re-soumission.
Archivé	Non	Produit en fin de vie. Conservation des données 3 ans minimum pour les litiges éventuels.
9.2 Processus de modération LaPlasse
Toute nouvelle fiche ou toute modification significative déclenche une modération avant publication.
Contrôles effectués par la modération :
Les photos correspondent bien à un produit réel (pas de logo de concurrent, pas de photo volée manifeste)
Le nom et la description ne contiennent pas de contact direct (téléphone, email, WhatsApp, réseaux sociaux)
Le prix est cohérent avec la catégorie (pas de prix manifestement erroné ou aberrant)
La catégorie choisie correspond au produit
Le produit n'est pas interdit à la vente sur LaPlasse (voir liste des produits interdits)
La condition déclarée (neuf/occasion) est cohérente avec les photos
Délais de modération :
Première soumission d'un vendeur nouveau : jusqu'à 72h
Vendeur établi (> 10 fiches publiées, note > 4/5) : modération allégée, délai 24h
Modification mineure (prix, stock) : pas de re-modération
9.3 Critères minimaux de publication
Une fiche ne peut pas être soumise à modération si les champs suivants sont manquants :
[ ] Nom du produit (min. 5 caractères)
[ ] Au moins 1 photo
[ ] Prix de vente > 0 XOF
[ ] Catégorie principale sélectionnée
[ ] Condition renseignée (neuf / occasion / reconditionné)
[ ] Localisation vendeur renseignée
[ ] Délai de préparation renseigné
---
10. Informations légales — Droit ivoirien
> ⚠️ LaPlasse opère sous le droit ivoirien. Les obligations européennes (Directive Omnibus, RGPD) **ne s'appliquent pas** directement. Les référentiels applicables sont ceux de la Côte d'Ivoire et de l'espace UEMOA/CEDEAO.
10.1 Cadre juridique applicable
Domaine	Texte de référence
Commerce électronique	Loi n°2013-546 du 30 juillet 2013 relative aux transactions électroniques (Côte d'Ivoire)
Protection du consommateur	Loi n°2016-412 du 15 juin 2016 relative à la consommation
Données personnelles	Loi n°2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel — ARTCI
Fiscalité	Code général des impôts — DGI Côte d'Ivoire
Publicité mensongère	Loi n°2016-412 Art. 18 à 24
10.2 Obligations d'information par secteur
Alimentation / Produits frais
Dénomination exacte du produit
Liste des ingrédients (si transformé)
Allergènes
Poids net
Date limite de consommation ou DLUO
Conditions de conservation
Origine géographique (village, région) — fortement valorisée et attendue
Cosmétiques / Hygiène
Liste des ingrédients (liste INCI recommandée)
Date de péremption
Conditions d'utilisation et précautions
Coordonnées du fabricant ou importateur
Électronique / Électroménager
Garantie commerciale (durée et conditions)
Compatibilité réseau et tension (220V/50Hz Côte d'Ivoire)
Origine (importé de quel pays)
Médicaments et produits de santé
Interdits à la vente sur LaPlasse sans agrément DPML (Direction de la Pharmacie et du Médicament de Côte d'Ivoire)
Alcools
Vente réservée aux vendeurs disposant de la licence appropriée
Mention obligatoire : "La consommation d'alcool est déconseillée aux mineurs"
LaPlasse peut imposer des restrictions supplémentaires à cette catégorie
10.3 Produits interdits sur LaPlasse
Médicaments, drogues, substances contrôlées
Armes, munitions, explosifs
Animaux vivants protégés (CITES)
Produits contrefaits ou copies non autorisées
Produits alimentaires périmés
Contenus à caractère pornographique, haineux ou illégal
Produits dont la vente nécessite un agrément non présenté à LaPlasse
---
11. Responsabilités vendeur vs LaPlasse
La distinction des responsabilités est fondamentale dans le modèle pure marketplace.
Responsabilité	Vendeur	LaPlasse
Exactitude de la description	✅	❌
Conformité du produit livré	✅	❌
Mise à jour du stock	✅	❌
Qualité des photos	✅	❌
Respect des obligations légales sectorielles	✅	❌
Garantie et SAV produit	✅	❌ (médiation possible)
Modération des fiches	❌	✅
Sécurité du paiement	❌	✅
Données personnelles des acheteurs	❌	✅
Disponibilité de la plateforme	❌	✅
Litiges non résolus entre vendeur et acheteur	Première ligne	Médiation LaPlasse
> **Principe clé** : LaPlasse est hébergeur de l'offre, pas vendeur. En cas de litige sur la qualité du produit, la responsabilité première est celle du vendeur. LaPlasse intervient en médiation et peut sanctionner le vendeur si sa responsabilité est avérée.
---
12. Checklist de publication
À utiliser avant chaque soumission à la modération.
Identification & classification
[ ] Nom du produit clair et descriptif (5-100 caractères, sans contact)
[ ] Catégorie principale correctement sélectionnée
[ ] Condition renseignée (neuf / occasion / reconditionné)
[ ] Localisation vendeur renseignée (commune)
Contenu texte
[ ] Description courte (2-3 phrases, max 300 caractères, pas de HTML)
[ ] Description longue (si produit > 5 000 XOF : fortement recommandée)
[ ] Pas de numéro de téléphone ou de contact dans le contenu
[ ] Pas de liens vers des sites externes ou des concurrents
Médias
[ ] Au moins 1 photo avec fond neutre clair
[ ] Photo principale représentant bien le produit vendu
[ ] Pas de watermark avec contact vendeur sur les photos
Prix & stock
[ ] Prix en, cohérent avec la catégorie
[ ] Stock ou mode "sur commande" configuré
[ ] Délai de préparation renseigné
[ ] livraisons configurés (dans la feature livraison) 
Attributs
[ ] Attributs obligatoires de la catégorie complétés
Légal
[ ] Aucun produit interdit dans la fiche
[ ] Mentions spécifiques au secteur respectées (alimentaire, cosmétique, etc.)
[ ] Si occasion : état réel conforme aux photos
---
Document interne LaPlasse — v1.0 — 2026
À mettre à jour lors de l'extension à d'autres pays de l'espace CEDEAO