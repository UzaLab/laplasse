# Notifications push — LaPlasse

Guide opérationnel pour activer et diagnostiquer les notifications sur **app client** (`apps/mobile`), **app livreur** (`apps/courier`), **PWA web** et **API**.

---

## Architecture

```
┌─────────────────┐     POST /notifications/push/expo      ┌──────────────┐
│  App mobile     │ ───────────────────────────────────► │  API         │
│  expo-notifications                                    │  NestJS      │
└────────┬────────┘                                      └──────┬───────┘
         │ Expo Push Token                                    │
         │                                                      │ expo-server-sdk
         ▼                                                      ▼
┌─────────────────┐                                      ┌──────────────┐
│  Expo Push      │ ── FCM (Android) / APNs (iOS) ────► │  Appareil    │
│  Service        │                                      │  (app fermée)│
└─────────────────┘                                      └──────────────┘
```

| Canal | Technologie | Apps |
|-------|-------------|------|
| Mobile native | **Expo Push** (`expo-notifications` + `expo-server-sdk`) | `apps/mobile`, `apps/courier` |
| PWA web | **Web Push** (VAPID) | `apps/web` |
| Legacy | FCM HTTP direct (`FCM_SERVER_KEY`) | Optionnel, non utilisé par les apps Expo actuelles |

**Firebase SDK n’est pas requis dans le monorepo.** Expo/EAS configure FCM et APNs dans le dashboard Expo.

---

## Prérequis API

Variables dans Coolify (preprod / prod) :

| Variable | Obligatoire | Rôle |
|----------|-------------|------|
| `REDIS_URL` | Recommandé | File BullMQ pour push async + rappels réservation |
| `VAPID_PUBLIC_KEY` | Web PWA | Push navigateur |
| `VAPID_PRIVATE_KEY` | Web PWA | Push navigateur |
| `VAPID_SUBJECT` | Web PWA | ex. `mailto:contact@laplasse.ci` |

Sans `REDIS_URL`, les push partent en **mode synchrone** (fonctionne, mais pas de planification différée).

Générer les clés VAPID :

```bash
npx web-push generate-vapid-keys
```

---

## App client — `apps/mobile`

### Projet EAS

- **Slug :** `laplasse`
- **Project ID :** `95dff08d-bcca-43bb-9b70-0ef8db630b32` (dans `app.config.js` → `extra.eas.projectId`)
- **Bundle :** `tech.laplasse.app`

### Variables build

| Variable | Usage |
|----------|--------|
| `EXPO_PUBLIC_API_URL` | URL API cible (preprod/prod) — le token push est enregistré ici |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Cartes (Android) |
| `EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY` | Cartes (iOS) |

### Credentials push (obligatoire pour livraison réelle)

1. [expo.dev](https://expo.dev) → compte `uza.lab` → projet **LaPlasse**
2. **Credentials** → Android : FCM (Google Service Account ou clé legacy via Expo)
3. **Credentials** → iOS : clé APNs (.p8) ou certificat
4. En local : `cd apps/mobile && eas credentials`

### Build & test

```bash
cd apps/mobile
eas build --profile preview --platform android   # ou ios
```

**Important :**

- Tester sur **appareil physique** (simulateur ignoré)
- Se **connecter** à l’app (enregistrement push après login)
- Accepter la permission **Notifications**
- En dev Metro seul, les push système ne reflètent pas toujours la prod

### Canal Android

Canal `default` — importance **HIGH**, son activé (`apps/mobile/src/lib/push.ts`).

---

## App livreur — `apps/courier`

### Projet EAS

- **Slug :** `laplasse-livraison`
- **Project ID :** `2202715b-f3ed-4547-9043-7a9dbe53ea0a`
- **Bundle :** `tech.laplasse.livraison`

Credentials push : **projet EAS séparé** (même procédure que client).

### Canal Android urgent

Canal `delivery` — importance **MAX**, vibration forte. Utilisé pour `delivery_job_offered` (nouvelle course, 30 s pour accepter).

### Types de push livreur

| Type | Déclencheur |
|------|-------------|
| `delivery_job_offered` | Offre séquentielle sur nouvelle mission |
| Autres | Mises à jour mission / dispatch partenaire |

---

## Flux métier — missions livreur

1. Commande **livraison** + mode **Réseau LaPlasse** (`PLATFORM_RIDER`)
2. Marchand marque **Prête** (`READY`) → **auto-dispatch** API (depuis commit auto-dispatch)
3. Création `DeliveryJob` + statut `OUT_FOR_DELIVERY`
4. `DeliveryOfferService` propose la course au livreur le mieux classé (zone, GPS, véhicule, en ligne)
5. Push **`delivery_job_offered`** + apparition dans **Missions → Disponibles**

Le livreur doit être :

- Profil **ACTIVE**
- **En ligne** (`is_online: true`)
- Zones couvrant la commune de livraison
- Véhicule compatible

---

## Diagnostic — « je ne reçois aucune push »

### 1. Token enregistré ?

Après login sur appareil réel, vérifier en base :

```sql
SELECT id, platform, LEFT(token, 40) AS token_prefix, created_at
FROM "DeviceToken"
WHERE user_id = '<uuid_utilisateur>'
ORDER BY created_at DESC;
```

Attendu : `platform = 'expo'`, token commençant par `ExponentPushToken[`.

### 2. Permission OS

Réglages téléphone → LaPlasse → Notifications **activées**.

### 3. Bon environnement API

Le token est POSTé vers `EXPO_PUBLIC_API_URL`. Un build preprod avec API prod (ou inverse) = token sur la mauvaise base.

### 4. Credentials Expo

Dashboard Expo → projet → Credentials. Sans FCM/APNs, Expo renvoie une erreur (logs API : `Expo Push échec`).

### 5. Logs API

Chercher :

- `Expo Push enregistré`
- `Expo Push [order_status]` / `[delivery_job_offered]`
- `Expo Push échec`

### 6. Mode dev

En `__DEV__`, l’app mobile logue `[push] register failed` ou `[push] permission denied` si échec silencieux.

### 7. In-app vs push OS

Certaines notifications sont **in-app seulement** (`NotificationsService.send`) : bienvenue, fidélité, etc.  
Les commandes / livraisons utilisent `NotificationQueueService.enqueuePush` → **push OS + in-app**.

---

## PWA web

1. Configurer VAPID sur l’API
2. `NEXT_PUBLIC_*` côté web si exposé
3. L’utilisateur accepte les notifications dans le navigateur
4. Endpoint enregistré via `POST /notifications/push/subscribe`

---

## Checklist mise en prod

- [ ] API déployée avec `REDIS_URL` (recommandé)
- [ ] VAPID configuré (web)
- [ ] Credentials FCM + APNs sur projet EAS **client**
- [ ] Credentials FCM + APNs sur projet EAS **livreur**
- [ ] Build EAS preview/production installé sur appareils test
- [ ] `EXPO_PUBLIC_API_URL` pointe vers la bonne API
- [ ] Test : commande → push client `order_status`
- [ ] Test : commande prête Réseau LaPlasse → push livreur `delivery_job_offered`
- [ ] Vérifier `DeviceToken` en base après login

---

## Fichiers de référence

| Fichier | Rôle |
|---------|------|
| `apps/mobile/src/lib/push.ts` | Enregistrement token client |
| `apps/courier/src/lib/push.ts` | Enregistrement token livreur |
| `apps/api/src/push/expo-push.service.ts` | Envoi Expo |
| `apps/api/src/queue/notification-queue.service.ts` | File + worker |
| `apps/api/src/delivery/delivery-offer.service.ts` | Push nouvelle course |
| `apps/api/src/marketplace/marketplace.service.ts` | Auto-dispatch READY + push statut commande |

---

## FAQ

**Faut-il intégrer Firebase dans l’app ?**  
Non. Expo Push suffit ; FCM est géré côté Expo pour Android.

**Les push arrivent-elles app fermée ?**  
Oui, si token + credentials Expo + permission OS sont OK.

**Expo Go ?**  
Push limitées en Expo Go ; préférer un build EAS pour valider en conditions réelles.
