# Build APK Android local (EAS) — guide validé

Guide reproductible pour générer un **APK Android en local** avec **EAS Build** (`eas build --local`), sans file d’attente cloud. Procédure **validée avec succès** sur l’environnement LaPlasse (WSL2, août 2026).

Ce document est conçu pour être **copié et adapté à un autre projet Expo**.

---

## Résumé

| Élément | Valeur (LaPlasse) |
|---------|-------------------|
| Stack | Expo SDK 57, React Native 0.86, pnpm monorepo |
| Commande | `BUILD_LOW_RESOURCE=1 pnpm mobile:build:preview` |
| Durée 1er build | ~15 min |
| Durée builds suivants | ~5–10 min (cache Gradle) |
| Sortie | `apps/mobile/dist/laplasse-preview-YYYYMMDD-HHMM.apk` (~110 Mo) |
| Profil | `preview` → APK interne, API preprod |
| OS | WSL2 (Ubuntu) sous Windows |

---

## Architecture du pipeline

```
pnpm mobile:build:preview
        │
        ▼
apps/mobile/scripts/build-local.sh
        │
        ├── Vérifie Java 17+, Android SDK, Docker, eas login
        ├── Redirige TMPDIR + GRADLE_USER_HOME hors /tmp (WSL)
        ├── Option BUILD_LOW_RESOURCE=1 (RAM limitée)
        │
        ▼
eas build --profile preview --platform android --local --output dist/….apk
        │
        ├── PREBUILD (expo prebuild → dossier android/)
        ├── EAGER_BUNDLE (Metro → bundle JS)
        └── RUN_GRADLEW (:app:assembleRelease)
                │
                ▼
           APK signé dans dist/
```

**Pourquoi EAS local et pas `expo run:android --variant release` ?**

- Reproduit le même pipeline que le cloud EAS (prebuild, env vars du profil, credentials).
- Fonctionne bien en **monorepo pnpm** (EAS gère l’archive du workspace).
- Un seul script documenté pour preview / production / dev.

---

## Prérequis (checklist)

### Obligatoires

| Outil | Version testée | Vérification |
|-------|----------------|--------------|
| **Node.js** | 20.x | `node -v` |
| **pnpm** | 10.x | `pnpm -v` |
| **Java (JDK)** | 17+ | `java -version` |
| **Android SDK** | platform + build-tools | `echo $ANDROID_HOME` |
| **Docker** | Desktop + intégration WSL | `docker info` |
| **eas-cli** | ≥ 16 (21.x utilisé) | `eas --version` |
| **Compte Expo** | connecté | `eas whoami` |

### Environnement validé LaPlasse

```text
OS        : linux 6.x (WSL2)
Java      : openjdk 17.0.14 — JAVA_HOME=/home/<user>/.local/java/jdk-17
Android   : ANDROID_HOME=/home/<user>/.local/android/sdk
Docker    : /usr/bin/docker (Docker Desktop, WSL integration activée)
Cache     : ~/.cache/laplasse-eas-build/{tmp,gradle}
```

---

## Installation one-shot (nouvelle machine / autre projet)

### 1. Java 17

```bash
# Option A — apt (Ubuntu/WSL)
sudo apt update && sudo apt install -y openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# Option B — installation utilisateur (comme LaPlasse)
# JDK extrait dans ~/.local/java/jdk-17
export JAVA_HOME="$HOME/.local/java/jdk-17"
export PATH="$JAVA_HOME/bin:$PATH"
```

### 2. Android SDK (sans Android Studio)

```bash
mkdir -p ~/.local/android/sdk/cmdline-tools
# Télécharger commandlinetools-linux depuis developer.android.com
# Extraire dans cmdline-tools/latest/

export ANDROID_HOME="$HOME/.local/android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"
```

Alternative : installer **Android Studio** sous Windows et pointer `ANDROID_HOME` vers  
`/mnt/c/Users/<vous>/AppData/Local/Android/Sdk`.

### 3. Docker (WSL2)

1. Installer **Docker Desktop** sur Windows.
2. **Settings → Resources → WSL Integration** → activer votre distro Ubuntu.
3. Vérifier : `docker info`.

### 4. EAS CLI + login

```bash
npm install -g eas-cli
eas login
eas whoami   # doit afficher votre compte Expo
```

### 5. Lier le projet Expo (autre repo)

```bash
cd apps/mobile   # ou la racine de votre app Expo
eas init         # crée le projectId dans app.config
```

---

## Fichiers à porter dans un autre projet

### 1. `eas.json` — profils de build

Exemple minimal pour un APK preview :

```json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_APP_ENV": "preprod",
        "EXPO_PUBLIC_API_URL": "https://api.example.com/api"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_APP_ENV": "production",
        "EXPO_PUBLIC_API_URL": "https://api.example.com/api"
      }
    }
  }
}
```

Points importants :

- **`buildType: "apk"`** sur le profil preview → fichier `.apk` installable directement (`adb install`).
- Sans cette clé, EAS produit un **AAB** (Play Store).
- Les variables `EXPO_PUBLIC_*` sont injectées au moment du build.

### 2. `app.config.js` — identité app + EAS projectId

```javascript
extra: {
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'preprod',
  eas: {
    projectId: process.env.EAS_PROJECT_ID ?? '<uuid-expo>',
  },
},
```

Adapter : `name`, `slug`, `android.package`, `ios.bundleIdentifier`, plugins.

### 3. `scripts/build-local.sh`

Copier depuis `apps/mobile/scripts/build-local.sh` et adapter :

| Variable / chemin | À personnaliser |
|-------------------|-----------------|
| `BUILD_CACHE_DIR` | ex. `$HOME/.cache/monprojet-eas-build` |
| Noms des APK | ex. `monapp-preview-${TIMESTAMP}.apk` |
| Messages d’aide | optionnel |

Le script encapsule toute la logique WSL (Java, SDK, Docker, cache disque).

### 4. Scripts `package.json`

**Racine monorepo** (`package.json`) :

```json
{
  "scripts": {
    "mobile:build:preview": "pnpm --filter mobile build:local:preview",
    "mobile:build:preview:lite": "pnpm --filter mobile build:local:preview:lite"
  }
}
```

**App mobile** (`apps/mobile/package.json`) :

```json
{
  "scripts": {
    "build:local:preview": "bash scripts/build-local.sh preview android",
    "build:local:preview:lite": "BUILD_LOW_RESOURCE=1 bash scripts/build-local.sh preview android",
    "build:local:production": "bash scripts/build-local.sh production android"
  }
}
```

Pour un **projet Expo standalone** (pas monorepo), remplacer par :

```json
"build:preview": "bash scripts/build-local.sh preview android"
```

---

## Lancer le build

### Commande recommandée (WSL / RAM limitée)

```bash
# Depuis la racine du monorepo
BUILD_LOW_RESOURCE=1 pnpm mobile:build:preview
```

Équivalent direct :

```bash
cd apps/mobile
BUILD_LOW_RESOURCE=1 pnpm build:local:preview
```

### Profils disponibles

| Profil | Sortie | Usage |
|--------|--------|-------|
| `preview` | `.apk` | Tests internes, preprod |
| `production` | `.aab` (LaPlasse) | Play Store |
| `development` | `.apk` | Dev client Expo |

### Installer l’APK sur un appareil

```bash
adb devices
adb install -r "apps/mobile/dist/laplasse-preview-YYYYMMDD-HHMM.apk"
```

---

## Optimisations WSL (critiques)

Ces réglages sont **inclus dans `build-local.sh`** et expliquent pourquoi le build passe chez nous :

### 1. Cache hors `/tmp`

WSL monte souvent `/tmp` en tmpfs (~8 Go). Gradle + node_modules dépassent facilement cette limite.

```bash
BUILD_CACHE_DIR="$HOME/.cache/laplasse-eas-build"
export TMPDIR="$BUILD_CACHE_DIR/tmp"
export GRADLE_USER_HOME="$BUILD_CACHE_DIR/gradle"
```

**Ne pas définir `EAS_LOCAL_BUILD_WORKINGDIR`** : conflit avec l’archive `project.tar.gz` d’EAS.

### 2. Mode low-resource

```bash
BUILD_LOW_RESOURCE=1
```

Active :

- Gradle : 1 worker, heap 1,5 Go
- Node : `--max-old-space-size=2048`

Indispensable sur laptop / WSL avec 8–16 Go RAM.

### 3. Désactiver expo-doctor (optionnel)

```bash
export EAS_BUILD_DISABLE_EXPO_DOCTOR_STEP=1
```

Évite les échecs sur warnings de versions (ex. RN 0.86.2 vs 0.86.0 recommandé).

---

## Credentials Android

En build local, EAS injecte la config de signature :

```text
[PREPARE_CREDENTIALS] Writing secrets to the project's directory
[PREPARE_CREDENTIALS] Injecting signing config into build.gradle
```

- Première fois : EAS peut générer un keystore remote (compte Expo requis).
- Pas besoin de commiter de keystore dans le repo.
- Vérifier avec `eas credentials` si besoin de regénérer.

---

## Monorepo pnpm — points d’attention

LaPlasse est un workspace pnpm (`apps/mobile` + packages `@laplasse/*`).

EAS local :

1. Archive tout le monorepo.
2. Lance `pnpm install --no-frozen-lockfile` à la racine.
3. Prebuild dans `apps/mobile`.

Pour un **autre monorepo** :

- Garder `pnpm-lock.yaml` à la racine à jour.
- S’assurer que le filtre `--filter mobile` pointe vers le bon package.
- Si un package workspace manque au build, vérifier les dépendances `workspace:*` dans `apps/mobile/package.json`.

---

## Dépannage

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| `Java introuvable` | JDK non installé / JAVA_HOME | Installer JDK 17, exporter JAVA_HOME |
| `Android SDK introuvable` | ANDROID_HOME vide | sdkmanager + export ANDROID_HOME |
| `Docker n'est pas démarré` | Docker Desktop arrêté ou WSL non intégré | Démarrer Docker, activer WSL integration |
| `Non connecté à EAS` / `Forbidden` | Session expirée | `eas login` |
| Build échoue sur `/tmp` (no space) | tmpfs WSL plein | Utiliser le script avec BUILD_CACHE_DIR sur disque |
| OOM / Gradle killed | RAM insuffisante | `BUILD_LOW_RESOURCE=1` |
| `Hard link ... failed. Doing a slower copy` | Normal WSL/cross-filesystem | Ignorer (copie lente, pas bloquant) |
| expo-doctor bloque le build | Versions Expo/RN | `EAS_BUILD_DISABLE_EXPO_DOCTOR_STEP=1` |

---

## Référence — build LaPlasse réussi

**Date :** 2026-08-16  
**Commande :**

```bash
cd /home/kadso05/projets/laplasse
BUILD_LOW_RESOURCE=1 pnpm mobile:build:preview
```

**Résultat :**

```text
→ Java      : openjdk version "17.0.14" 2025-01-21
→ JAVA_HOME : /home/kadso05/.local/java/jdk-17
→ ANDROID_HOME : /home/kadso05/.local/android/sdk
→ Build cache: /home/kadso05/.cache/laplasse-eas-build
→ Mode low-resource : Gradle 1 worker, heap 1.5 Go, Node 2 Go
→ Profil    : preview
→ Sortie    : apps/mobile/dist/laplasse-preview-20260816-0131.apk
→ Durée     : ~15 min (exit code 0)
→ Taille    : ~110 Mo
```

**Env injecté (profil preview) :**

- `EXPO_PUBLIC_APP_ENV=preprod`
- `EXPO_PUBLIC_API_URL=https://api-preprod.laplasse.tech/api`

---

## Adapter à un nouveau projet — checklist rapide

1. [ ] Créer le projet Expo (`npx create-expo-app` ou copier `apps/mobile`).
2. [ ] `eas init` → récupérer `projectId`.
3. [ ] Copier `eas.json` + adapter profils / env / `buildType: apk`.
4. [ ] Copier `scripts/build-local.sh` + renommer cache / APK.
5. [ ] Ajouter scripts npm (`build:local:preview`, etc.).
6. [ ] Installer Java 17, Android SDK, Docker, `eas-cli`.
7. [ ] `eas login`.
8. [ ] `BUILD_LOW_RESOURCE=1 pnpm build:local:preview` (ou équivalent).
9. [ ] `adb install -r dist/*.apk` pour valider sur device.

---

## Documentation associée

| Document | Contenu |
|----------|---------|
| [MOBILE_EXPO_SETUP.md](./MOBILE_EXPO_SETUP.md) | Compte Expo, MCP, dev local |
| [MOBILE_EVOLUTION.md](./MOBILE_EVOLUTION.md) | Parité PWA, roadmap mobile |
| Script source | [`apps/mobile/scripts/build-local.sh`](../apps/mobile/scripts/build-local.sh) |
| Config EAS | [`apps/mobile/eas.json`](../apps/mobile/eas.json) |

---

*Document créé après build local réussi — août 2026. À mettre à jour si la stack Expo, les profils EAS ou le script de build évoluent.*
