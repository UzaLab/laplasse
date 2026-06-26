# LaPlasse — Design System (Web)

Document de référence pour l’interface de **apps/web** : pages publiques, profil client, marchand, livreur, logistique et admin.

Dernière mise à jour : juin 2026.

---

## 1. Principes

| Principe | Application |
|----------|-------------|
| **Clarté** | Une action principale par zone ; libellés en français, impératifs ou verbes d’action. |
| **Cohérence** | Même forme de bouton, même échelle typographique, mêmes rayons sur les surfaces (cartes ≠ boutons). |
| **Confiance** | Palette sobre (slate), accent ambre brand sur le public, couleurs contextuelles en back-office. |
| **Mobile-first** | Touch targets ≥ 36 px ; actions critiques accessibles au pouce. |

---

## 2. Typographie

**Police unique : [Outfit](https://fonts.google.com/specimen/Outfit)** (Google Fonts), chargée dans `app/layout.tsx` via `--font-outfit`.

```css
font-family: var(--font-outfit, "Outfit", system-ui, sans-serif);
```

| Usage | Classes Tailwind | Exemple |
|-------|------------------|---------|
| Titre page | `text-2xl sm:text-3xl font-extrabold text-slate-900` | « Menu & carte » |
| Titre section | `text-lg font-extrabold text-slate-900` | Nom de section |
| Corps | `text-sm text-slate-600` | Descriptions |
| Label champ | `text-xs font-bold uppercase tracking-wider text-slate-500` | « Nom du plat » |
| Meta / compteur | `text-xs text-slate-400 tabular-nums` | Stats, pagination |
| Prix | `text-sm font-extrabold tabular-nums` + couleur contextuelle | Orange marchand, brand public |

**Toasts (Sonner)** : même police via `AppToaster` → `fontFamily: var(--font-outfit)`.

---

## 3. Couleurs

### Brand (public / CTA principal)

Définies dans `globals.css` (`@theme`).

| Token | Hex | Usage |
|-------|-----|--------|
| `brand-500` | `#f59e0b` | Accent, icônes, focus ring |
| `brand-600` | `#d97706` | **Bouton primary** public |
| `brand-700` | `#b45309` | Hover primary |

### Neutrals

| Token | Usage |
|-------|--------|
| `slate-50` → `slate-900` | Fonds, textes, bordures |
| Fond app | `#FAFAFA` (`body`) |

### Couleurs contextuelles (back-office)

Utiliser la couleur du **domaine**, pas du brand public :

| Interface | Couleur dominante | Exemple |
|-----------|-------------------|---------|
| Marchand / menu / restauration | `orange-600` | Ajouter un plat |
| Admin | `violet-600` | Actions modération |
| Succès / visible | `emerald-600` | Activer, approuver |
| Danger | `red-600` | Supprimer, suspendre |
| Neutre fort | `slate-900` | Enregistrer, créer |

---

## 4. Boutons

### Règle fondamentale : **pill (full rounded)**

Tous les boutons de l’application sont **entièrement arrondis** (`border-radius: 9999px` / `rounded-full`).

- Appliqué via classes `.btn` / `.btn-*`, liens `a[data-btn="true"]`, ou `rounded-full` explicite sur les CTA.
- Les `<button>` UI (vignettes, variantes, onglets) gardent leur `rounded-xl` / `rounded-lg` Tailwind.
- Les liens stylés bouton doivent inclure `rounded-full` ou la classe `.btn`.
- **Exception** : ajouter `btn-shape-keep` ou `data-btn-shape="keep"` pour conserver une forme custom (rare).

### Composant React (recommandé)

`@/components/ui/Button`

```tsx
import { Button, ButtonLink } from '@/components/ui/Button'

<Button variant="primary" size="md">Continuer</Button>
<Button variant="dark" size="sm" loading={saving}>Enregistrer</Button>
<Button variant="ghost" size="icon" aria-label="Fermer"><X size={16} /></Button>
<ButtonLink href="/merchant/menu" variant="accent">Gérer le menu</ButtonLink>
```

### Variantes

| Variant | Classe / usage | Contexte |
|---------|----------------|----------|
| `primary` | `bg-brand-600` | CTA public (accueil, checkout) |
| `secondary` | bordure slate | Actions secondaires |
| `dark` | `bg-slate-900` | Créer, valider (merchant, logistics) |
| `accent` | `bg-orange-600` | Restauration, menu, food |
| `admin` | `bg-violet-600` | Panneau admin |
| `ghost` | transparent | Toolbar, annuler discret |
| `danger` | `bg-red-600` | Suppression confirmée |
| `dangerOutline` | bordure rouge | Supprimer secondaire |
| `success` | `bg-emerald-600` | Approuver, activer |

### Tailles

| Size | Hauteur | Usage |
|------|---------|--------|
| `xs` | 32 px | Chips denses |
| `sm` | 36 px | Listes, tables |
| `md` | 40 px | **Défaut** |
| `lg` | 44 px | Formulaires, modales |
| `xl` | 48 px | Hero CTA mobile |
| `icon` / `iconSm` / `iconLg` | carré → **cercle** | Actions icône seule |

### Classes utilitaires CSS

Disponibles dans `globals.css` :

```html
<button class="btn-primary btn-md">Publier</button>
<button class="btn-secondary btn-sm">Annuler</button>
<button class="btn-icon btn-ghost">…</button>
<a href="…" class="btn btn-dark btn-lg">Commencer</a>
```

### États

- **Hover** : assombrir le fond (`*-700`) ou `bg-slate-50` pour secondary.
- **Disabled** : `opacity-50 pointer-events-none`.
- **Loading** : prop `loading` sur `<Button>` ou spinner `Loader2` centré ; désactiver le clic.
- **Focus** : `focus-visible:ring-2 focus-visible:ring-brand-500/30 ring-offset-2`.

### Bonnes pratiques

- Un seul bouton **primary/accent/dark** fort par bloc.
- Libellés **verbe + objet** : « Ajouter le plat », pas « OK ».
- Boutons icône : toujours `aria-label` ou `title`.
- Ne pas utiliser `rounded-xl` sur les `<button>` — utiliser `rounded-full` ou le composant `Button`.

---

## 5. Surfaces & rayons (non-boutons)

Les **cartes, inputs, modales** gardent des coins adoucis **sans** être pill :

| Élément | Rayon | Classe |
|---------|-------|--------|
| Carte / panel | 16 px | `rounded-2xl` |
| Input / select | 12 px | `rounded-xl` |
| Badge / tag | pill | `rounded-full` |
| Modale | 16–24 px | `rounded-2xl` |
| Vignette image | 12 px | `rounded-xl` |

Distinction visuelle : **boutons = pill**, **conteneurs = rounded-2xl**.

---

## 6. Formulaires

```tsx
const INPUT =
  'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10'

const LABEL =
  'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'
```

- Bordure par défaut `slate-200`, focus **brand** (public) ou **orange** (merchant food).
- Select : même rayon que input (`rounded-xl`), pas pill.
- Erreur : texte `text-red-600 text-sm` sous le champ.

---

## 7. Layout par interface

| Shell | Largeur contenu | Navigation |
|-------|-----------------|------------|
| Public | `max-w-6xl` / full bleed hero | Navbar + bottom nav mobile |
| Merchant | Sidebar + `max-w-6xl` main | `MerchantShell` |
| Admin | Full width | `AdminShell`, groupes repliables |
| Profile | Sidebar client | `ProfileShell` |
| Courier / Logistics | Sidebar métier | Shell dédié |

---

## 8. Composants récurrents

| Composant | Chemin |
|-----------|--------|
| Button | `components/ui/Button.tsx` |
| Toaster | `components/ui/AppToaster.tsx` |
| Page header public | `components/layout/PublicPageHeader.tsx` |
| Admin container | `features/admin/components/AdminPageContainer.tsx` |
| Médiathèque | `features/merchant/components/MediathequeModal.tsx` |
| Drawer menu item | `features/merchant/components/menu/MenuItemDrawer.tsx` |

---

## 9. Icônes

**Lucide React** (`lucide-react`), taille standard **16 px** inline, **18–22 px** titres.

Couleur : hériter du texte ou accent contextuel (`text-orange-500`, `text-violet-600`).

---

## 10. Feedback & notifications

| Type | Mécanisme |
|------|-----------|
| Succès / erreur rapide | `notify.success()` / `notify.error()` (Sonner) |
| Confirmation destructive | `confirm()` natif ou modale dédiée |
| Chargement liste | `Loader2` centré, `animate-spin text-slate-300` |
| État vide | Icône slate-200 + titre + CTA pill |

---

## 11. Accessibilité

- Contraste texte ≥ WCAG AA sur boutons filled.
- Focus visible sur tous les contrôles interactifs.
- `aria-label` sur boutons icône.
- Touch target minimum **36 × 36 px** (`size="sm"` ou plus).

---

## 12. Migration & maintenance

### Harmonisation boutons (juin 2026)

1. Règle globale CSS dans `app/globals.css` (pill forcé sur boutons natifs).
2. Script `scripts/harmonize-button-radius.py` — remplace `rounded-xl|lg|…` → `rounded-full` sur les tags bouton/lien-bouton dans `apps/web/src/**/*.tsx`.
3. Nouveau code : **prioriser `<Button>`** plutôt que `<button className="…">` inline.

### Checklist PR UI

- [ ] Boutons en `rounded-full` ou via `<Button>`
- [ ] Police Outfit (pas de font custom ad hoc)
- [ ] CTA contextualisé (brand public / orange food / violet admin)
- [ ] États hover, disabled, loading gérés
- [ ] Cartes/inputs restent `rounded-xl` / `rounded-2xl`

---

## 13. Références code

| Fichier | Rôle |
|---------|------|
| `apps/web/src/app/globals.css` | Tokens `@theme`, classes `.btn-*`, règle pill |
| `apps/web/src/app/layout.tsx` | Font Outfit, `AppToaster` |
| `apps/web/src/components/ui/Button.tsx` | Composant bouton canonique |
| `apps/web/scripts/harmonize-button-radius.py` | Migration rayon boutons |

---

*Ce document vit avec le code : en cas de divergence, le composant `Button` et `globals.css` font foi.*
