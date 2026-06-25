# Stockage médias — Hetzner Object Storage (LaPlasse)

Architecture cible pour preprod et prod : **upload via API → optimisation WebP (sharp) → bucket Hetzner → reverse proxy nginx → CDN Cloudflare**.

## Pourquoi cette stack

| Problème | Solution |
|----------|----------|
| Egress Hetzner facturé au Go | WebP + redimensionnement à l'upload, `Cache-Control: immutable` 1 an |
| Pas de domaine custom sur bucket | Reverse proxy nginx sur le VPS Coolify (`media-*.laplasse.tech`) |
| Uploads non sécurisés | Tous les uploads passent par l'API NestJS (auth + validation), pas d'upload direct navigateur → S3 |
| Fichiers trop lourds | Presets sharp par usage (logo 512px, produit 1600px, preuve livraison 1200px) |

## Buckets recommandés

| Env | Bucket | Domaine public | Région |
|-----|--------|----------------|--------|
| Preprod | `laplasse-preprod` | `https://media-preprod.laplasse.tech` | `fsn1` |
| Prod | `laplasse-prod` | `https://media.laplasse.tech` | `fsn1` |

Configurer le bucket en **lecture publique** (policy ou ACL selon console Hetzner).

## Préfixes dans le bucket

```
merchants/{merchantId}/          — médiathèque établissement
logistics-logo/{partnerId}/      — logos partenaires logistique
logistics-kyc/{partnerId}/       — documents KYC (PDF ou image)
delivery-proof/{courierId}/      — photos preuve livraison
```

Les URLs stockées en base ressemblent à :

```
https://media-preprod.laplasse.tech/merchants/clxyz…/a1b2c3.webp
```

## Variables Coolify

### API (`laplasse-api-preprod` / `laplasse-api-prod`)

| Variable | Exemple preprod | Build | Runtime |
|----------|-----------------|:-----:|:-------:|
| `STORAGE_PROVIDER` | `s3` | — | ✅ |
| `R2_ENDPOINT` | `https://fsn1.your-objectstorage.com` | — | ✅ |
| `R2_REGION` | `fsn1` | — | ✅ |
| `R2_BUCKET_NAME` | `laplasse-preprod` | — | ✅ |
| `R2_PUBLIC_URL` | `https://media-preprod.laplasse.tech` | — | ✅ |
| `S3_ACCESS_KEY_ID` | clé Hetzner | — | ✅ **Runtime only** + **Is Literal** |
| `S3_SECRET_ACCESS_KEY` | secret Hetzner | — | ✅ **Runtime only** + **Is Literal** |

> **Important Coolify** : ne pas utiliser `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` (valeurs vides après bascule Build/Runtime). Alternative acceptée : `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.

### Web (`laplasse-web-preprod` / `laplasse-web-prod`)

| Variable | Exemple | Build | Runtime |
|----------|---------|:-----:|:-------:|
| `NEXT_PUBLIC_MEDIA_URL` | `https://media-preprod.laplasse.tech` | ✅ | ✅ |

## Pipeline d'upload (code)

```
Client (FormData)
  → API NestJS (multer, auth, validation taille/type)
  → ImageProcessorService (sharp : rotate, resize, WebP, strip EXIF)
  → StorageService → PutObject S3
  → URL publique retournée et stockée en PostgreSQL
```

Presets d'optimisation (`apps/api/src/storage/image-processor.service.ts`) :

| Preset | Usage | Max | Qualité WebP |
|--------|-------|-----|--------------|
| `general` | Médiathèque marchand | 1920px | 82 |
| `product` | Images catalogue | 1600px | 85 |
| `logo` | Logos logistique | 512px | 88 |
| `proof` | Preuves livraison | 1200px | 78 |

Dev local sans variables S3 : fallback disque `uploads/` servi par l'API (`http://localhost:3001/uploads/...`).

## CORS bucket (optionnel)

Les uploads actuels passent par l'API — **CORS bucket non requis** pour le flux standard.

Si vous ajoutez des uploads directs (presigned URLs) plus tard :

```bash
aws s3api put-bucket-cors \
  --bucket laplasse-preprod \
  --endpoint-url https://fsn1.your-objectstorage.com \
  --region fsn1 \
  --cors-configuration file://infra/media-proxy/cors-laplasse-preprod.json
```

Fichier : `infra/media-proxy/cors-laplasse-preprod.json`

## Reverse proxy `media-*.laplasse.tech`

Hetzner ne supporte pas un CNAME direct vers le bucket. Un **nginx** sur le VPS Coolify sert le bucket avec un domaine propre + cache navigateur.

### Infrastructure Coolify

| Ressource | UUID | FQDN | Statut |
|-----------|------|------|--------|
| App proxy preprod | `b81wyf4n0rszw1blm8s6i5pi` | `https://media-preprod.laplasse.tech` | Créée — nginx monté, **deploy + DNS requis** |
| App proxy prod | `mdgzdgfso4hykfv5v0fxghvx` | `https://media.laplasse.tech` | Créée — **nginx + deploy + DNS requis** |
| Serveur | VPS Coolify | `178.105.113.184` | |

### DNS (Cloudflare) — à configurer si pas déjà fait

| Type | Nom | Valeur | Proxy CF |
|------|-----|--------|----------|
| A | `media-preprod` | `178.105.113.184` | ✅ (cache + réduction egress) |
| A | `media` | `178.105.113.184` | ✅ |

Si Let's Encrypt échoue avec proxy CF actif : passer temporairement en **DNS only**, obtenir le certificat, réactiver le proxy.

### Finaliser le proxy prod (Coolify UI)

Sur l'app `laplasse-media-prod` (`mdgzdgfso4hykfv5v0fxghvx`) :

1. **Storages** → Add Storage → type **File**
2. Mount path : `/etc/nginx/conf.d/default.conf`
3. Contenu : copier `infra/media-proxy/nginx-prod.conf`
4. **Deploy**

Le preprod a déjà le fichier nginx monté — il suffit de **Deploy** l'app `laplasse-media-preprod`.

### Vérification

```bash
curl -sI https://media-preprod.laplasse.tech/merchants/test.webp
# HTTP/2 200, cache-control: public, max-age=31536000, immutable
```

## Réduction egress — checklist

1. **WebP à l'upload** — implémenté (sharp)
2. **Cache longue durée** — `Cache-Control: public, max-age=31536000, immutable`
3. **Cloudflare proxy** sur `media-*` — cache edge gratuit
4. **Pas de re-fetch API** — URLs immuables (UUID dans le nom de fichier)
5. **Upload via API uniquement** — pas de PUT direct depuis le navigateur
6. **Éviter de servir les médias via l'API NestJS en prod** — utiliser le domaine `media-*`

## Déploiement pas à pas

### 1. Créer le bucket Hetzner

Console Hetzner → Object Storage → bucket `laplasse-preprod` (fsn1) → clés S3.

### 2. Finaliser les proxies nginx sur Coolify

**Preprod** (`laplasse-media-preprod`, UUID `b81wyf4n0rszw1blm8s6i5pi`) : nginx déjà monté → **Deploy** dans Coolify.

**Prod** (`laplasse-media-prod`, UUID `mdgzdgfso4hykfv5v0fxghvx`) : monter `infra/media-proxy/nginx-prod.conf` → `/etc/nginx/conf.d/default.conf` → **Deploy**.

Configurer les enregistrements DNS (voir tableau ci-dessus).

### 3. Configurer les variables API + Web

Quand les tokens Hetzner sont prêts :

```bash
# Variables sans secrets (endpoint, bucket, URLs publiques)
COOLIFY_TOKEN=xxx ./scripts/coolify-storage-env.sh preprod-dry

# Avec clés S3
COOLIFY_TOKEN=xxx \
  S3_ACCESS_KEY_ID=... \
  S3_SECRET_ACCESS_KEY=... \
  ./scripts/coolify-storage-env.sh preprod
```

Ou manuellement dans Coolify — voir tableau variables ci-dessus.
Les clés `S3_*` : **Runtime only** + cocher **Is Literal**.

### 4. Redéployer API puis Web

```bash
COOLIFY_TOKEN=xxx ./scripts/coolify-deploy.sh api-preprod
COOLIFY_TOKEN=xxx ./scripts/coolify-deploy.sh web-preprod
```

### 5. Tester un upload

Depuis l'interface marchand → médiathèque → upload image. Vérifier que l'URL retournée commence par `https://media-preprod.laplasse.tech/` et que le fichier est en `.webp`.

## Dev local avec Hetzner (optionnel)

Dans `apps/api/.env` :

```env
STORAGE_PROVIDER=s3
R2_ENDPOINT=https://fsn1.your-objectstorage.com
R2_REGION=fsn1
R2_BUCKET_NAME=laplasse-preprod
R2_PUBLIC_URL=https://media-preprod.laplasse.tech
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

Sans ces variables : stockage local automatique.

## Migration URLs existantes

Si des images pointent encore vers `http://localhost:3001/uploads/` ou un ancien stockage :

1. Copier les fichiers vers le bucket (script `aws s3 sync` ou outil rclone)
2. Mettre à jour les URLs en PostgreSQL (`merchants.media`, `products.image_url`, `ProductImage.url`, etc.)

Pas de migration Supabase dans ce projet — les seeds utilisent des URLs Unsplash.

## Référence code

| Fichier | Rôle |
|---------|------|
| `apps/api/src/storage/storage.config.ts` | Résolution env Hetzner / R2 / local |
| `apps/api/src/storage/storage.service.ts` | Upload S3 + fallback local |
| `apps/api/src/storage/image-processor.service.ts` | Optimisation sharp |
| `apps/web/src/lib/mediaUrl.ts` | Helper URL média côté web |
| `infra/media-proxy/` | Configs nginx + CORS |
