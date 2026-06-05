Brief Senior — Architecture data CuisineFacile
RAC'IN SARL — Mai 2026 • Page 1 / 11
RAC'IN AFRICA
BRIEF DE MISSION
Architecture data CuisineFacile - Phase 1
Destinataire : Kader SOUARY, Consultant développeur senior
Émetteur : Tima Koné, RAC'IN SARL
Durée estimée : 15 à 20 jours sur X semaines
Date : Mai 2026
Brief Senior — Architecture data CuisineFacile
RAC'IN SARL — Mai 2026 • Page 2 / 11
Contexte stratégique
RAC'IN SARL est une société ivoirienne immatriculée à Abidjan en 2021. Elle développe à
partir de sa marque CuisineFacile une marketplace de produits alimentaires transformés par
des coopératives féminines ivoiriennes. Le projet a vocation à évoluer en 18 à 36 mois vers une
activité d'inclusion financière (microfinance) en partenariat avec une banque ivoirienne, puis
vers un agrément SFD (Système Financier Décentralisé) à horizon 5 ans.
La base de données productrices construite en Phase 1 constituera l'actif de scoring de la future
activité financière. Sa conception doit donc respecter dès maintenant des standards qui
dépassent ceux d'une simple marketplace : traçabilité complète, audit log, robustesse,
conformité aux normes BCEAO à venir.
Le fondateur, Tima Koné, a un profil marketing/créatif/commercial. Un développeur junior,
Hindoune est salarié de RAC'IN et travaille sur la couche visible du site CuisineFacile. Le
consultant senior intervient sur l'architecture technique structurante et sur le mentorat du
junior.
Mission du consultant
La mission du consultant senior s'articule sur quatre dimensions complémentaires.
Conception et déploiement de l'infrastructure data. Concevoir une base de données
relationnelle propriétaire, la déployer sur un hébergement maîtrisé, et la maintenir
opérationnelle pour 12 semaines minimum.
Construction d'une API REST documentée. Cette API sert d'interface entre la base de
données et toutes les surfaces utilisateurs (site CuisineFacile, panneau d'administration
interne, intégrations tierces futures).
Développement d'un panneau d'administration. Permettre à Tima Koné et à son
équipe non-technique de gérer les données opérationnelles (coopératives, productrices,
produits, commandes) sans intervention de développeur.
Mentorat technique du développeur junior. Le développeur junior, salarié RAC'IN,
travaille sur la couche visible. Le senior l'accompagne sur les choix techniques, l'intégration
avec l'API, et sa montée en compétence.
Brief Senior — Architecture data CuisineFacile
RAC'IN SARL — Mai 2026 • Page 3 / 11
Architecture cible
Les recommandations techniques qui suivent sont des propositions documentées. Le
consultant senior peut proposer des alternatives, à condition de les justifier par écrit avant
exécution.
3.1 Stack technique recommandé
Base de données : PostgreSQL version 15 ou supérieure. Justification : moteur relationnel
mature, transactions ACID, support JSONB pour la flexibilité, conformité régulateurs ouestafricains, écosystème extensions riche (PostGIS pour géolocalisation, pg_audit pour audit
log).
Backend API : Node.js avec Express ou NestJS, ou Python avec FastAPI. Au choix du
consultant selon ses compétences. Documentation OpenAPI/Swagger obligatoire.
Panneau d'administration : React/Next.js avec une bibliothèque UI mature (Material-UI, Ant
Design ou Tailwind UI). Alternative possible : un outil d'administration générique type Retool,
Forest Admin, ou AdminJS si gain de temps significatif.
Hébergement : serveur dédié ou VPS chez OVH Cloud (datacenter européen) ou Hetzner.
Budget mensuel cible 35 000 à 55 000 FCFA. Justification : conformité RGPD utilisable dans
la migration future BCEAO, fiabilité éprouvée, coût raisonnable. AWS et GCP sont à éviter en
Phase 1 (complexité de facturation, surcoût).
Gestion de code : dépôt GitHub privé au nom de RAC'IN, avec Tima Koné en owner et le
consultant en collaborateur. CI/CD via GitHub Actions ou équivalent. Aucun code en dehors
du dépôt RAC'IN.
3.2 Schéma de base de données prévu
La base comprendra une douzaine de tables principales, conçues pour servir aussi bien la
marketplace en Phase 1 que le scoring de crédit en Phase 2. Le détail définitif sera arrêté lors
des semaines 1-2 de conception.
Table Rôle fonctionnel
cooperatives Identité et localisation des coopératives partenaires
productrices Identité des femmes productrices au sein des coopératives
produits Catalogue produits (référence, prix, stocks, descriptifs)
commandes Commandes clients reçues sur le site
commande_lignes Détail des produits par commande
livraisons Suivi des livraisons (adresse, créneau, statut)
Brief Senior — Architecture data CuisineFacile
RAC'IN SARL — Mai 2026 • Page 4 / 11
Table Rôle fonctionnel
clients Identité et historique des clients finaux
mouvements_stock Toute entrée/sortie de stock tracée (audit)
approvisionnements Achats effectués auprès des coopératives
flux_financiers Tous les flux entrants et sortants (CRITIQUE Phase 2)
retours_qualite Notes qualité par lot et coopérative
audit_log Trace complète de toutes les modifications (CRITIQUE
Phase 2)
3.3 API REST
API REST exposant des endpoints CRUD sur toutes les ressources métier. Authentification
par JWT avec refresh tokens. Permissions par rôle (admin, gestionnaire, consultation). Rate
limiting pour prévenir les abus. Documentation OpenAPI/Swagger générée automatiquement
et hébergée à une URL dédiée. Logs structurés en JSON pour faciliter la supervision future.
Temps de réponse cible : 95e percentile inférieur à 200ms en charge nominale (50 requêtes
par seconde). Tests de charge à effectuer en semaine 11.
3.4 Panneau d'administration
Interface web sécurisée permettant à Tima Koné et son équipe de gérer les données sans
recourir au développeur. Fonctionnalités minimales : authentification multi-utilisateur avec
rôles, gestion CRUD coopératives et productrices avec upload de photos, gestion du catalogue
produits avec liaison aux coopératives sources, consultation des commandes et statuts
livraisons, exports CSV/Excel des données utiles (commandes du mois, stocks, paiements
coopératives), tableau de bord simple avec indicateurs clés.
Brief Senior — Architecture data CuisineFacile
RAC'IN SARL — Mai 2026 • Page 5 / 11
Livrables précis sur 12 semaines max
Sem. Phase Livrables
S1-S2 Audit et
conception
Document d'architecture (15-25 pages), schéma de base
validé, choix techniques validés par écrit, plan de
déploiement détaillé
S3-S4 Infrastructure
base
Hébergement déployé, PostgreSQL installé et configuré,
migrations initiales appliquées, dépôt GitHub initialisé
avec README, CI/CD opérationnel
S5-S6 API v1 Endpoints CRUD sur 6 tables principales,
authentification JWT, documentation Swagger,
premiers tests automatisés
S7-S8 Admin v1 Panneau d'administration avec authentification, gestion
coopératives + productrices + produits, upload photos,
exports basiques
S9-S10 Intégration site API étendue (commandes, livraisons), intégration avec
le site CuisineFacile en lien avec le junior, premier flux
de bout en bout fonctionnel
S11 Admin v2 +
tests
Panneau admin avec rapports, tableau de bord, gestion
commandes, tests de charge effectués, optimisations
S12 Documentation
finale
Documentation technique complète, runbook
opérationnel, formation Tima et junior (2 sessions de
2h), recettage et mise en production validée
Brief Senior — Architecture data CuisineFacile
RAC'IN SARL — Mai 2026 • Page 6 / 11
Critères de qualité non négociables
5.1 Sécurité
HTTPS obligatoire partout. Chiffrement au repos des données sensibles (téléphones,
identifiants). Authentification robuste avec hashage Argon2id ou bcrypt. Protection contre
injections SQL via ORM ou requêtes paramétrées systématiques. Protection contre XSS et
CSRF. Headers de sécurité (CSP, HSTS, X-Frame-Options). Audit de sécurité simple effectué
en semaine 11.
5.2 Performance
Temps de réponse API au 95e percentile inférieur à 200ms en charge nominale. Index
PostgreSQL appropriés sur toutes les colonnes filtrées ou jointes. Pas de requêtes N+1. Cache
applicatif si nécessaire pour les données peu changeantes.
5.3 Documentation
Documentation est un livrable au même titre que le code. Minimum : README à la racine du
dépôt avec setup local, document d'architecture maintenu à jour, documentation API Swagger
générée et hébergée, runbook opérationnel (comment redémarrer, comment restaurer un
backup, comment ajouter un utilisateur admin), guide utilisateur du panneau
d'administration pour Tima.
5.4 Tests
Couverture minimum 60% sur les endpoints critiques (authentification, opérations
financières, opérations sur commandes). Tests unitaires sur la logique métier. Tests
d'intégration sur les flux complets (création produit, passage de commande, traitement). Tests
de charge avant mise en production.
5.5 Backups et résilience
Backups automatiques quotidiens de la base de données. Rétention 30 jours minimum.
Procédure de restauration testée au moins une fois pendant la mission. Documentation de la
procédure dans le runbook.
Brief Senior — Architecture data CuisineFacile
RAC'IN SARL — Mai 2026 • Page 7 / 11
Articulation avec le développeur junior
Le développeur junior salarié RAC'IN travaille en parallèle sur la couche visible du site
CuisineFacile (refonte boutique, page coopératives, refonte de la page d'accueil, intégration
des passerelles de paiement existantes). Sa zone technique est le front-end et l'interfaçage avec
le CMS existant.
6.1 Interface technique entre les deux zones
Le junior consomme l'API REST construite par le senior. Il ne touche jamais directement à la
base de données. Toutes ses interactions avec les données passent par les endpoints API
publics. C'est cette règle qui rend possible la collaboration entre deux niveaux différents : le
junior n'a pas besoin de comprendre la base de données, il appelle des endpoints documentés.
6.2 Engagement de mentorat du senior
Le consultant senior accepte les engagements suivants envers le junior. Premièrement, lui
transmettre la documentation des endpoints API au fur et à mesure qu'ils sont disponibles,
avec exemples de requêtes et de réponses. Deuxièmement, lui consacrer une heure à une heure
trente par semaine pour répondre à ses questions techniques (canal Slack ou WhatsApp).
Troisièmement, valider par écrit les choix d'architecture côté site qui ont un impact sur l'API.
Quatrièmement, faire une revue de code de ses pull requests sur les parties d'intégration avec
l'API (une demi-journée par mois).
6.3 Ce qui n'est pas demandé au senior
Le senior n'est pas responsable du code front-end produit par le junior. Il n'est pas son chef
hiérarchique. Il n'est pas tenu de corriger les bugs du junior, mais de l'accompagner pour qu'il
les corrige lui-même. Il n'a pas d'objectif de formation chiffré (le junior progressera à son
rythme).
Brief Senior — Architecture data CuisineFacile
RAC'IN SARL — Mai 2026 • Page 8 / 11
Calendrier et disponibilité attendue
Volume total estimé : 15 à 20 jours répartis sur 12 semaines, soit en moyenne 1,5 à 2 jours par
semaine. La répartition n'est pas uniforme : plus dense sur les semaines 1-2 (conception), 3-4
(infrastructure) et 7-8 (admin), plus légère en milieu de mission.
Présence physique attendue : une demi-journée par semaine minimum chez RAC'IN, le jour
convenu en début de mission. Cette présence est cruciale pour le mentorat du junior et pour
le suivi avec Tima Koné. Le reste du travail peut être effectué en remote.
Réunion hebdomadaire fixe avec Tima Koné, 45 minutes, créneau convenu en semaine 1.
Format : démonstration des avancées, blocages, planification de la semaine suivante.
Disponibilité asynchrone : Slack ou WhatsApp pour le junior pendant les heures de bureau
(réponse sous 24h sauf urgence).
Modalités contractuelles
8.1 Propriété intellectuelle
Tout le code, la documentation, les schémas et les artefacts produits dans le cadre de cette
mission appartiennent en pleine propriété à RAC'IN SARL. Le consultant cède l'intégralité de
ses droits patrimoniaux à RAC'IN. Aucune réutilisation pour d'autres clients sans accord écrit
préalable. Cette clause sera formalisée dans le contrat de prestation.
8.2 Accès et comptes
Tous les comptes créés dans le cadre de la mission (hébergeur, GitHub, services tiers) sont au
nom de RAC'IN, avec Tima Koné comme administratrice principale. Le consultant est ajouté
comme collaborateur avec les droits nécessaires à son travail, et ses accès sont révoqués à la
fin de la mission.
8.3 Tarification et facturation
Tarif journalier à négocier et à formaliser dans le contrat. À titre indicatif, le marché ivoirien
2026 pour un senior généraliste solide se situe entre 100 000 et 200 000 FCFA par jour.
Facturation mensuelle sur la base des jours effectivement passés, validation par Tima Koné.
Plafond mensuel à fixer pour éviter les dépassements (suggestion : 8 jours par mois maximum
sauf accord spécifique).
8.4 Confidentialité
Engagement de confidentialité sur tous les éléments stratégiques du projet, incluant la
trajectoire Phase 2 (microfinance) et Phase 3 (SFD), pour une durée de 5 ans après la fin de la
mission. Clause de non-concurrence limitée : pas de mission similaire pour un concurrent
direct identifié de RAC'IN pendant 24 mois.
Brief Senior — Architecture data CuisineFacile
RAC'IN SARL — Mai 2026 • Page 9 / 11
Brief Senior — Architecture data CuisineFacile
RAC'IN SARL — Mai 2026 • Page 10 / 11
Préparation de la Phase 2 (anticipation)
Le consultant senior doit avoir conscience que la base de données qu'il construit en Phase 1
sera étendue en Phase 2 pour servir un système de scoring de crédit en partenariat avec une
banque ivoirienne. Trois éléments doivent être anticipés dès maintenant.
Table flux_financiers riche. Conçue avec des champs assez complets pour servir au
scoring : type de flux (achat, avance, paiement, remboursement), montant, date, contrepartie
(cooperative_id), référence, statut, justificatif. Cette table sera l'actif data principal de la Phase

Audit log strict. Toute modification de toute table est tracée avec date, utilisateur, valeurs
avant/après. Ce niveau d'audit est exigé par les régulateurs BCEAO pour un SFD et doit exister
dès le jour 1 pour avoir 36 mois d'historique au moment du dépôt d'agrément.
Scalabilité 10x. L'architecture doit pouvoir absorber une multiplication par 10 du volume
de données sans refonte structurelle (passage de 50 productrices et 200 produits à 500
productrices et 2000 produits, et de 200 à 2000 commandes mensuelles). Pas d'optimisation
prématurée, mais pas de choix structurellement bloquant non plus.
Le détail de la Phase 2 sera communiqué au consultant en temps voulu, sous accord de
confidentialité renforcé. À ce stade, il suffit d'avoir ces trois orientations en tête lors des
décisions de conception.
10. Points de vigilance
Cinq principes de discipline pour cette mission.
Premier — Pas de fonctionnalité hors brief. Aucune fonctionnalité non listée dans ce
document ne sera développée sans accord écrit préalable de Tima Koné. La discipline de scope
est ce qui permet de livrer dans les temps.
Deuxième — Documentation au fil de l'eau. La documentation est produite en parallèle
du code, pas en fin de mission. Toute fonctionnalité non documentée est considérée comme
non livrée.
Troisième — Réutilisation des bonnes pratiques. On ne réinvente pas la roue.
Frameworks éprouvés, bibliothèques maintenues, patterns connus. Le projet n'est pas un
terrain d'expérimentation technologique.
Quatrième — Tests automatisés systématiques. Tout endpoint critique a au moins un
test. Toute correction de bug est accompagnée d'un test qui empêche la régression.
Cinquième — Communication transparente. Tout retard, blocage ou doute est signalé
immédiatement par écrit, pas tu et révélé en réunion. La confiance se construit sur la
transparence.
Brief Senior — Architecture data CuisineFacile
RAC'IN SARL — Mai 2026 • Page 11 / 11
—
Brief de mission — Architecture data CuisineFacile
Document confidentiel RAC'IN SARL