# Gestion de la preprod — arrêt / démarrage à la demande

> **Objectif :** libérer RAM et CPU sur le VPS quand la preprod n'est pas utilisée, sans toucher à la production.

---

## Ressources preprod concernées

| Ressource | Nom Coolify | UUID | RAM estimée* |
|-----------|-------------|------|--------------|
| Web | `laplasse-web-preprod` | `i5nviaj74152319gctpeyq27` | ~200–400 Mo |
| API | `laplasse-api-preprod` | `z145ag9pnpqb0y864cwodsfk` | ~150–300 Mo |
| Meilisearch | `laplasse-meili-preprod` | `s9i9rhxxfy86s93yulpeouwu` | ~100–200 Mo |
| Redis | `laplasse-redis-preprod` | `xzjbs8fiim0unys2guc01k00` | ~20–50 Mo |
| PostgreSQL | `laplasse-db-preprod` | `zo2kc0vnvhqb1mtoba5cgsky` | ~100–300 Mo |
| Media proxy | `laplasse-media-preprod` | `b81wyf4n0rszw1blm8s6i5pi` | ~10 Mo |

\*Ordre de grandeur — varie selon la charge.

**Gain typique en arrêtant la preprod : ~500 Mo – 1 Go RAM** libérés pour la prod et les builds.

Les **volumes persistent** : arrêter PostgreSQL/Redis ne supprime pas les données. Au redémarrage, la base preprod est intacte.

---

## Méthode 1 — Script CLI (recommandé)

```bash
# Arrêter toute la preprod
COOLIFY_TOKEN=xxx ./scripts/coolify-preprod-power.sh stop

# Redémarrer (DB → Redis → Meili → API → Web)
COOLIFY_TOKEN=xxx ./scripts/coolify-preprod-power.sh start

# Vérifier si preprod répond
COOLIFY_TOKEN=xxx ./scripts/coolify-preprod-power.sh status
```

Le token API Coolify se génère dans **Settings → API tokens** (scope lecture + écriture).

### Ordre d'arrêt / démarrage

**Stop** (front → back) :
1. Web preprod
2. API preprod
3. Meilisearch preprod
4. Redis preprod
5. PostgreSQL preprod

**Start** (back → front) :
1. PostgreSQL preprod
2. Redis preprod
3. Meilisearch preprod
4. API preprod
5. Web preprod

Après un `start`, si l'API met du temps à migrer Prisma, attendre ~1 min ou lancer :

```bash
COOLIFY_TOKEN=xxx ./scripts/coolify-deploy.sh recover-preprod
```

---

## Méthode 2 — Interface Coolify

Projet **LaPlasse Preprod** → pour chaque ressource :

1. Cliquer sur la ressource
2. Bouton **Stop** (icône carré) en haut à droite
3. Pour redémarrer : **Start** puis vérifier le statut `running:healthy`

Respecter le même ordre stop/start que ci-dessus.

---

## Méthode 3 — API Coolify directe

```bash
COOLIFY_HOST=http://178.105.113.184:8000
TOKEN=xxx

# Exemple : arrêter le web preprod
curl -X POST "$COOLIFY_HOST/api/v1/applications/i5nviaj74152319gctpeyq27/stop" \
  -H "Authorization: Bearer $TOKEN"

# Exemple : démarrer la DB preprod
curl -X POST "$COOLIFY_HOST/api/v1/databases/zo2kc0vnvhqb1mtoba5cgsky/start" \
  -H "Authorization: Bearer $TOKEN"
```

Routes : `POST /api/v1/{applications|databases|services}/{uuid}/{start|stop|restart}`

---

## Ce qui n'est PAS arrêté

| Ressource | Projet | Pourquoi |
|-----------|--------|----------|
| `laplasse-api-prod` | LaPlasse | Production |
| `laplasse-web-prod` | LaPlasse | Production |
| `laplasse-db-prod` | LaPlasse | Production |
| CuisineFacile, Polla, etc. | Autres projets | Non concernés |

---

## Cas d'usage recommandés

| Situation | Action |
|-----------|--------|
| Pas de test preprod pendant plusieurs jours | `./scripts/coolify-preprod-power.sh stop` |
| Avant un gros build prod (libérer RAM) | Stop preprod |
| Session de dev / QA sur develop | `./scripts/coolify-preprod-power.sh start` |
| Build preprod nécessaire | Start preprod, puis `./scripts/coolify-deploy.sh preprod` |

---

## Limitations

- **Domaines preprod** (`preprod.laplasse.tech`, `api-preprod.laplasse.tech`) renverront 502/503 tant que la stack est arrêtée — normal.
- **Webhooks GitHub** sur la branche `develop` : le déploiement auto échouera si preprod est arrêtée ; relancer manuellement après `start`.
- **Ne pas arrêter la prod** avec ce script — il ne cible que les UUID preprod.

---

## Automatisation optionnelle (cron)

Arrêt automatique la nuit, démarrage le matin (exemple — à adapter) :

```bash
# crontab -e sur le VPS ou machine avec accès API Coolify
0 23 * * 1-5  COOLIFY_TOKEN=xxx /chemin/laplasse/scripts/coolify-preprod-power.sh stop
0 8  * * 1-5  COOLIFY_TOKEN=xxx /chemin/laplasse/scripts/coolify-preprod-power.sh start
```

---

## Voir aussi

- [`scripts/coolify-deploy.sh`](../scripts/coolify-deploy.sh) — déploiements preprod/prod
- [`Docs/RUNBOOK.md`](./RUNBOOK.md) — runbook opérationnel général
