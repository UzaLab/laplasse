# Google Maps — configuration LaPlasse

> **Stratégie** : Google Maps en principal sur web/PWA, apps mobile et livreur.  
> **Backup** : OpenStreetMap (Leaflet / WebView / Nominatim) si clé absente, quota dépassé ou erreur API.

---

## Clés fournies (à configurer en variables d'environnement — ne jamais committer)

| Usage | Variable d'environnement | API GCP activée |
|-------|-------------------------|-----------------|
| Web / PWA (carte JS) | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps JavaScript API |
| Android (mobile + livreur) | `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps SDK for Android |
| iOS (mobile + livreur) | `EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY` | Maps SDK for iOS |
| Serveur — recherche lieux | `GOOGLE_MAPS_PLACES_API_KEY` | Places API |
| Serveur — géocodage | `GOOGLE_MAPS_GEOCODING_API_KEY` | Geocoding API |
| Serveur — itinéraires | `GOOGLE_MAPS_DIRECTIONS_API_KEY` | Directions API |
| Serveur — optimisations (matrix, routes…) | `GOOGLE_MAPS_SERVER_API_KEY` | Distance Matrix, Routes API, etc. |

Si une clé serveur spécifique est absente, l'API retombe sur `GOOGLE_MAPS_SERVER_API_KEY`.

---

## Restrictions GCP recommandées

### Web (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- Type : **Referrers HTTP**
- `https://laplasse.tech/*`, `https://www.laplasse.tech/*`, `https://preprod.laplasse.tech/*`
- `https://ci.laplasse.tech/*`, `https://bf.laplasse.tech/*`, `https://sn.laplasse.tech/*`
- `http://localhost:3000/*`

### Android (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`)
- Type : **Applications Android**
- `tech.laplasse.app` + SHA-1 debug/release
- `tech.laplasse.livraison` + SHA-1 debug/release

### iOS (`EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY`)
- Type : **Applications iOS**
- `tech.laplasse.app`, `tech.laplasse.livraison`

### Serveur (clés Places / Geocoding / Directions / Server)
- Type : **Adresses IP**
- IP publique du VPS Coolify (+ IP dev si tests locaux)

---

## Où c'est utilisé dans le code

| Surface | Composant | Provider |
|---------|-----------|----------|
| Checkout / adresses | `AddressLocationPicker` → Google JS / OSM picker | Google JS → OSM |
| Recherche mobile web | `SearchMobileMap` | Google JS → OSM |
| Suivi livraison client | `DeliveryTrackClient` | Google JS + `/geo/directions` |
| Zones livreur web | `CourierZonesEditor` | Google JS → OSM |
| Dispatch logistique | `LogisticsDispatchMap` | Google JS → OSM |
| Retrait checkout | `PickupLocationPanel` | Carte + lien Google Maps |
| Restauration | `RestaurationHubPage` | Tri par géoloc utilisateur |
| Carte statique marchand | `StaticLocationMap` | Google JS → OSM |
| App mobile recherche | `SearchNativeMap` | `react-native-maps` Google → WebView OSM |
| App livreur missions | `MissionMap` | `react-native-maps` Google → WebView OSM |
| API recherche adresse | `GET /geo/places/search` | Places → Nominatim |
| API itinéraire | `GET /geo/directions` | Directions → ligne droite |
| ETA livraison | `DeliveryEtaService` | Distance Matrix → Haversine |

---

## Déploiement Coolify

### API (runtime)
```
GOOGLE_MAPS_PLACES_API_KEY=...
GOOGLE_MAPS_GEOCODING_API_KEY=...
GOOGLE_MAPS_DIRECTIONS_API_KEY=...
GOOGLE_MAPS_SERVER_API_KEY=...
```

### Web (build-time **et** runtime pour Next)
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```
Ajouter aussi comme `ARG` dans le Dockerfile web (build).

### Apps Expo (EAS / build local)
```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY=...
```
- Injectées au build via `app.config.js` (`extra.googleMapsApiKey`, `ios.config.googleMapsApiKey`).
- **EAS** : définir les secrets dans le dashboard Expo (Environment variables) ou `eas env:create` pour les profils `preview` / `production`.
- Rebuild APK/IPA obligatoire après changement de clé Android/iOS.
- Le MCP Expo (`user-expo`) ne gère pas les secrets — configuration manuelle EAS ou `.env` local au build.

---

## Clé « optimisation » (`GOOGLE_MAPS_SERVER_API_KEY`)

Regroupe Address Validation, Distance Matrix, Routes API, Route Optimization, etc.  
Utilisée pour :
- **Distance Matrix** : ETA livreur → client (remplace Haversine quand disponible)
- **Directions** : fallback si clé Directions dédiée absente
- Futures optimisations flotte / tournées partenaire logistique

APIs activées mais non câblées en v1 : Pollen, Weather, Navigation SDK, Places UI Kit — réservées évolutions produit.

---

## Correspondance des clés fournies (mapping GCP → env)

| Clé GCP reçue | Variable à renseigner |
|---------------|----------------------|
| Maps JavaScript API | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Maps SDK for Android | `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Maps SDK for iOS | `EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY` |
| Places API | `GOOGLE_MAPS_PLACES_API_KEY` |
| Geocoding API | `GOOGLE_MAPS_GEOCODING_API_KEY` |
| Directions API | `GOOGLE_MAPS_DIRECTIONS_API_KEY` |
| Clé multi-API (optimisations) | `GOOGLE_MAPS_SERVER_API_KEY` |

La clé multi-API sert de **fallback serveur** pour Distance Matrix, Directions (si clé dédiée absente), et futures Routes / Route Optimization.

---

## Sécurité

- Les clés partagées dans le chat doivent être **restreintes** côté GCP et idéalement **régénérées** si exposées publiquement.
- Ne jamais committer de clés dans le dépôt Git.
- `NEXT_PUBLIC_*` et `EXPO_PUBLIC_*` sont visibles côté client — restrictions referrer/bundle obligatoires.

---

## Backup OSM

Automatique lorsque :
- variable de clé Google absente ou trop courte (`< 10` caractères)
- erreur HTTP Google (quota, réseau)
- échec chargement script Maps JS (web)

Tuiles OSM : `https://tile.openstreetmap.org/{z}/{x}/{y}.png`  
Géocodage backup : Nominatim (`nominatim.openstreetmap.org`)
