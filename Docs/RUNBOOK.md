# LaPlasse — Runbook opérationnel

> **Public :** équipe technique et fondateur  
> **Version :** 1.0 — Juin 2026  
> Ce document répond à une question simple : **que faire quand quelque chose ne va pas ?**

---

## 1. Démarrer l'environnement

```bash
# Depuis la racine du monorepo
docker compose up -d            # PostgreSQL :5433, Redis :6379, Meilisearch :7700
pnpm dev                        # API :3001 + Web :3000

# Vérifier les services
docker compose ps
curl http://localhost:3001/api/health
```

### Variables d'environnement critiques

| Variable | Fichier | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `apps/api/.env` | PostgreSQL connexion string |
| `JWT_SECRET` | `apps/api/.env` | Secret JWT (> 64 chars en prod) |
| `MEILI_MASTER_KEY` | `apps/api/.env` | Clé Meilisearch |
| `NEXT_PUBLIC_API_URL` | `apps/web/.env.local` | URL API depuis le navigateur |

Voir aussi [`Docs/PREPROD_POWER_MANAGEMENT.md`](./PREPROD_POWER_MANAGEMENT.md) pour arrêter/démarrer la preprod à la demande (économie RAM VPS).

---

## 2. Redémarrer les services

### API NestJS

```bash
# En dev (pnpm dev) — tuer et relancer
fuser -k 3001/tcp 2>/dev/null; pnpm --filter api dev

# En production (PM2)
pm2 restart laplasse-api
pm2 logs laplasse-api --lines 50
```

### Web Next.js

```bash
# En dev
fuser -k 3000/tcp 2>/dev/null; pnpm --filter web dev

# En production (Vercel)
vercel --prod    # ou déclenchement automatique via GitHub Actions
```

### Docker (base de données + services)

```bash
docker compose restart          # Redémarre tous les services
docker compose restart postgres # Redémarre uniquement PostgreSQL
docker compose logs --tail=50 postgres
```

---

## 3. Backup PostgreSQL

### Lancer un backup manuel

```bash
./scripts/backup.sh
# Crée : backups/laplasse_YYYYMMDD_HHMMSS.sql.gz
```

### Automatisation (cron quotidien à 3h)

```bash
crontab -e
# Ajouter :
0 3 * * * /chemin/vers/laplasse/scripts/backup.sh >> /var/log/laplasse-backup.log 2>&1
```

### Lister les backups disponibles

```bash
ls -lh backups/
```

### Restaurer un backup

```bash
./scripts/backup.sh restore backups/laplasse_20260605_030000.sql.gz
```

> ⚠️ La restauration **écrase** la base existante. Faire un backup avant toute restauration.

### Vérifier qu'un backup est valide

```bash
# Décompresser et compter les lignes SQL
gunzip -c backups/laplasse_YYYYMMDD.sql.gz | wc -l
# Résultat attendu : > 1000 lignes pour une base peuplée
```

---

## 4. Ajouter un compte admin

```bash
# Option 1 — via seed (recommandé, écrase le mot de passe)
pnpm --filter api db:seed

# Option 2 — via psql (si le seed ne convient pas)
docker exec -it laplasse_postgres psql -U laplasse -d laplasse_db
UPDATE "User" SET role='ADMIN', password_hash='$2b$12$...' WHERE email='nouvel-admin@laplasse.ci';
\q

# Option 3 — appel API direct
curl -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin2@laplasse.ci","password":"Admin2026!","full_name":"Admin 2"}'
# Puis manuellement en DB : UPDATE "User" SET role='ADMIN' WHERE email='admin2@laplasse.ci';
```

**Comptes de démo seed :**

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | `admin@laplasse.ci` | `Admin2026!` |

---

## 5. Ré-indexer Meilisearch

```bash
# Si la recherche retourne des résultats incohérents
curl -X DELETE http://localhost:7700/indexes/merchants \
  -H 'Authorization: Bearer laplasse_meili_dev_key'

# Puis déclencher la ré-indexation depuis l'API
curl -X POST http://localhost:3001/api/search/reindex \
  -H 'Authorization: Bearer <ADMIN_TOKEN>'
```

---

## 6. Logs

### Logs en développement (console colorée)

```bash
pnpm dev  # Les logs s'affichent dans le terminal
```

### Logs en production (fichiers rotatifs)

```bash
tail -f apps/api/logs/app-$(date +%Y-%m-%d).log    # Toutes infos
tail -f apps/api/logs/error-$(date +%Y-%m-%d).log  # Erreurs uniquement
```

### Événements importants à surveiller

| Event | Niveau | Signification |
|-------|--------|---------------|
| `auth.failure` | WARN | Tentative connexion échouée |
| `auth.forbidden` | WARN | Accès refusé (mauvais rôle) |
| `moderation` | INFO | Action admin (validation, rejet) |
| `slow_query` | WARN | Requête > 500ms |
| `suspicious` | WARN | Comportement suspect (rate limit) |
| `api_error` | ERROR | Erreur 5xx serveur |

---

## 7. Diagnostics courants

### API ne répond plus

```bash
# 1. Vérifier le processus
lsof -i :3001

# 2. Vérifier la DB
docker compose ps postgres

# 3. Relancer
fuser -k 3001/tcp && pnpm --filter api dev
```

### Base de données inaccessible

```bash
docker compose ps       # Est-ce que postgres est "Up" ?
docker compose restart postgres
docker compose logs --tail=20 postgres
```

### Meilisearch ne répond pas

```bash
curl http://localhost:7700/health
docker compose restart meilisearch
```

### Erreur 401 sur les routes admin

```bash
# Vérifier que le token est valide
curl -X GET http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer <TOKEN>"
# Si 401 → token expiré, se reconnecter sur /login
```

### Trop de signalements / spam

```bash
# Voir les tentatives de rate limiting dans les logs
grep 'suspicious\|ThrottlerException' apps/api/logs/app-$(date +%Y-%m-%d).log
```

---

## 8. Checklist avant une mise en production

- [ ] Variables d'environnement production configurées (pas de valeurs dev)
- [ ] `JWT_SECRET` fort (> 64 chars aléatoires)
- [ ] HTTPS configuré (reverse proxy Nginx / Caddy)
- [ ] `NODE_ENV=production` sur l'API
- [ ] Backup testé (créer + restaurer)
- [ ] Cron backup quotidien activé
- [ ] Monitoring uptime configuré (UptimeRobot)
- [ ] Sentry configuré (erreurs runtime)
- [ ] Tests de charge passés (`pnpm run load-test`)
- [ ] Seed admin créé avec un mot de passe fort

---

## 9. Déploiement Coolify (VPS limité)

Les builds Docker sont optimisés pour un VPS modeste (`.dockerignore`, cache pnpm, `next build --webpack`, 1 worker Next.js, heap Node 640 Mo, deps prod seules en runtime).

**Règle d'or : ne jamais lancer 4 builds en parallèle.** Sur Coolify → Settings → désactiver le déploiement auto simultané si possible, ou utiliser le script séquentiel :

**504 Gateway Timeout pendant un déploiement :** normal sur ce VPS — le build Docker (surtout Next.js) consomme toute la RAM et les conteneurs en ligne ne répondent plus temporairement. **Ne pas relancer** un autre build tant que le précédent n'est pas terminé.

**Remettre le site en ligne sans rebuild** (après redémarrage Coolify) :

```bash
export COOLIFY_TOKEN="votre-token"
./scripts/coolify-deploy.sh recover-prod
```

**Déployer du nouveau code — une seule app à la fois :**

```bash
export COOLIFY_TOKEN="votre-token"
./scripts/coolify-deploy.sh api-prod          # ~6 min, peu d'impact
# Attendre ✓ finished + site OK, puis :
FORCE=true ./scripts/coolify-deploy.sh web-prod   # ~30-45 min, 504 attendus
```

```bash
# Préprod (develop) puis prod (main), une app à la fois
./scripts/coolify-deploy.sh preprod
./scripts/coolify-deploy.sh prod

# Rebuild complet (plus lent)
FORCE=true ./scripts/coolify-deploy.sh api-preprod
```

**API alternative (curl) :**

```bash
curl -X POST "http://178.105.113.184:8000/api/v1/deploy" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"<APP_UUID>","force":false}'
```

UUIDs : `laplasse-api-preprod` → `z145ag9pnpqb0y864cwodsfk`, `laplasse-api-prod` → `iaai1jhevil8prxsusoptfin`, `laplasse-web-preprod` → `i5nviaj74152319gctpeyq27`, `laplasse-web-prod` → `pn73rp4w4dk0wyxfazyk0se0`.

**Après déploiement API** (cookies httpOnly) :

```bash
jar=/tmp/laplasse.cookies
curl -c "$jar" -X POST "https://api.../api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@laplasse.ci","password":"..."}'
curl -b "$jar" -X POST "https://api.../api/admin/seed-marketplace"
curl -b "$jar" -X POST "https://api.../api/admin/sync-search"
```

---

*Document à maintenir à jour après chaque release majeure.*
