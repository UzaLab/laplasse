# Setup Expo — App mobile LaPlasse

Checklist côté développeur pour connecter Expo, EAS et le MCP Cursor.

## 1. Compte Expo

1. Créer un compte sur [expo.dev](https://expo.dev).
2. Installer EAS CLI et se connecter :

```bash
npm install -g eas-cli
eas login
```

## 2. MCP Expo dans Cursor

**Settings → MCP → Add server**

| Champ | Valeur |
|-------|--------|
| Type | HTTP / Remote |
| URL | `https://mcp.expo.dev/mcp` |
| Auth | OAuth (suivre le flux au premier usage) |

**Reconnecter le MCP** (toggle off/on) après chaque start/stop du serveur Expo local.

**Plan EAS payant** (On-demand ou Production) : requis pour `search_documentation` sur le MCP. Les outils `learn`, `add_library` et `generate_agents_md` fonctionnent sans plan payant.

## 3. Lier le projet EAS (après scaffold)

```bash
cd apps/mobile
eas init
```

Cela ajoute `extra.eas.projectId` dans `app.config.ts`. Communiquez le **slug Expo** à l'équipe.

## 4. Lancer l'app en dev

```bash
# Depuis la racine du monorepo
pnpm mobile:dev        # API locale
pnpm mobile:staging    # API staging (https://api.laplasse.tech)

# Avec MCP local (SDK 54+)
cd apps/mobile
EXPO_UNSTABLE_MCP_SERVER=1 pnpm expo start
```

## 5. Tests sur appareil (WSL2)

`localhost` ne fonctionne pas depuis un téléphone physique. Utiliser l'**IP LAN** de la machine WSL :

```bash
# IP Windows (depuis PowerShell)
ipconfig

# Ou IP WSL
hostname -I | awk '{print $1}'
```

Dans `apps/mobile/.env.development` :

```env
EXPO_PUBLIC_API_URL=http://<VOTRE_IP_LAN>:3001/api
```

- **Android emulator** : `http://10.0.2.2:3001/api`
- **iOS simulator** : `http://localhost:3001/api`
- **Téléphone physique** : IP LAN + port 3001 ouvert sur le firewall

L'API écoute déjà sur `0.0.0.0:3001` ([main.ts](../apps/api/src/main.ts)).

## 6. Builds preview

```bash
cd apps/mobile
eas build --profile development --platform android
eas build --profile preview --platform all
```

## 7. Confirmation pour l'agent

État actuel (configuré) :

- [x] MCP Expo connecté dans Cursor (compte **uza.lab** / uzazi.lab@gmail.com)
- [x] Projet EAS lié : **@uza.lab/laplasse** (`95dff08d-bcca-43bb-9b70-0ef8db630b32`)
- [ ] Plan EAS payant : oui / non (requis pour `search_documentation`)
- [x] URL staging API : `https://api.laplasse.tech/api`
- [x] Slug Expo : `laplasse`

Après chaque start/stop du serveur Expo, **reconnecter le MCP** (toggle off/on) pour activer les outils locaux (screenshots, logs, sitemap).
