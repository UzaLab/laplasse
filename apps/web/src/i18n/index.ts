export type Locale = 'fr' | 'en'

export const LOCALE_COOKIE = 'lp_locale'
export const DEFAULT_LOCALE: Locale = 'fr'

export const messages = {
  fr: {
    nav: {
      discover: 'Découvrir',
      marketplace: 'Marketplace',
      search: 'Recherche',
      merchant: 'Mon établissement',
      courier: 'Devenir livreur',
      cart: 'Panier',
      myCart: 'Mon panier',
      profile: 'Profil',
      myProfile: 'Mon profil',
      myFavorites: 'Mes favoris',
      dashboard: 'Mon tableau de bord',
      admin: 'Admin',
      logout: 'Déconnexion',
      login: 'Connexion',
      openMenu: 'Ouvrir le menu',
      closeMenu: 'Fermer le menu',
      openCart: 'Ouvrir le panier',
      preferences: 'Langue & pays',
    },
    pwa: {
      installTitle: 'Installer LaPlasse',
      installBody: 'Accès rapide, mode hors ligne léger et expérience application.',
      iosBody: 'Appuyez sur Partager puis « Sur l\'écran d\'accueil » pour installer l\'app.',
      install: 'Installer',
      later: 'Plus tard',
    },
    booking: {
      paymentRequired: 'Paiement requis pour confirmer votre réservation.',
      payNow: 'Payer maintenant',
      paymentSuccess: 'Paiement confirmé — réservation validée.',
      deposit: 'Acompte',
      loginToPay: 'Connectez-vous pour payer votre réservation.',
    },
    discovery: {
      recommendations: 'Recommandé pour vous',
      recentlyViewed: 'Consultés récemment',
    },
    marketplace: {
      badge: 'Click & Collect ou Livraison',
      title: 'La Marketplace LaPlasse',
      spotlight: 'Boutiques à la une',
      filters: 'Filtres',
      clearFilters: 'Effacer',
      sortBy: 'Trier par :',
      sortNewest: 'Nouveautés',
      sortPriceAsc: 'Prix croissant',
      sortPriceDesc: 'Prix décroissant',
      searchLabel: 'Recherche',
      searchPlaceholder: 'Produit, marque…',
      categories: 'Catégories',
      allCategories: 'Toutes',
      shops: 'Boutiques',
      maxPrice: 'Prix max',
      emptyCatalogTitle: 'Catalogue en cours d\'enrichissement',
      emptyCatalogBody: 'Aucun produit disponible dans votre pays pour le moment. Explorez les établissements ou devenez vendeur.',
      exploreMerchants: 'Explorer les établissements',
      becomeSeller: 'Devenir vendeur',
      noFilterMatch: 'Aucun produit ne correspond à vos filtres.',
      resetFilters: 'Réinitialiser les filtres',
      prevProducts: 'Produits précédents',
      nextProducts: 'Produits suivants',
    },
    product: {
      outOfStock: 'Rupture de stock',
      unavailable: 'Ce produit est momentanément indisponible. Revenez bientôt ou parcourez les autres articles de la boutique.',
      taxesNote: 'Taxes incluses. Frais de livraison calculés à l\'étape suivante.',
      tabDescription: 'Description détaillée',
      tabComposition: 'Composition & Origine',
      tabReviews: 'Avis clients',
      addToCart: 'Ajouter au panier',
      buyNow: 'Acheter maintenant',
      add: 'Ajouter',
      buy: 'Acheter',
      quantity: 'Quantité',
      variant: 'Variante',
      reviewsCount: 'avis',
      sameShop: 'Dans la même boutique',
      viewShop: 'Voir la boutique',
    },
    checkout: {
      stepCart: 'Panier',
      stepDelivery: 'Livraison',
      stepPayment: 'Paiement',
      stepConfirmation: 'Confirmation',
      pickup: 'Retrait en boutique',
      delivery: 'Livraison à domicile',
      continue: 'Continuer',
      placeOrder: 'Valider la commande',
      phoneRequired: 'Numéro de téléphone requis',
    },
    geo: {
      country: 'Pays',
      suggestTitle: 'Vous semblez être au {country}',
      suggestBody: 'Afficher le contenu et les boutiques adaptés à votre pays ?',
      suggestSwitch: 'Oui, passer au {country}',
      suggestDismiss: 'Non merci',
    },
    common: {
      offline: 'Hors ligne',
      retry: 'Réessayer',
      language: 'Langue',
      loading: 'Chargement…',
      close: 'Fermer',
    },
  },
  en: {
    nav: {
      discover: 'Discover',
      marketplace: 'Marketplace',
      search: 'Search',
      merchant: 'My business',
      courier: 'Become a courier',
      cart: 'Cart',
      myCart: 'My cart',
      profile: 'Profile',
      myProfile: 'My profile',
      myFavorites: 'My favorites',
      dashboard: 'My dashboard',
      admin: 'Admin',
      logout: 'Sign out',
      login: 'Sign in',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      openCart: 'Open cart',
      preferences: 'Language & country',
    },
    pwa: {
      installTitle: 'Install LaPlasse',
      installBody: 'Quick access, lightweight offline mode, and app-like experience.',
      iosBody: 'Tap Share, then "Add to Home Screen" to install the app.',
      install: 'Install',
      later: 'Later',
    },
    booking: {
      paymentRequired: 'Payment is required to confirm your booking.',
      payNow: 'Pay now',
      paymentSuccess: 'Payment confirmed — booking validated.',
      deposit: 'Deposit',
      loginToPay: 'Sign in to pay for your booking.',
    },
    discovery: {
      recommendations: 'Recommended for you',
      recentlyViewed: 'Recently viewed',
    },
    marketplace: {
      badge: 'Click & Collect or Delivery',
      title: 'LaPlasse Marketplace',
      spotlight: 'Featured shops',
      filters: 'Filters',
      clearFilters: 'Clear',
      sortBy: 'Sort by:',
      sortNewest: 'Newest',
      sortPriceAsc: 'Price: low to high',
      sortPriceDesc: 'Price: high to low',
      searchLabel: 'Search',
      searchPlaceholder: 'Product, brand…',
      categories: 'Categories',
      allCategories: 'All',
      shops: 'Shops',
      maxPrice: 'Max price',
      emptyCatalogTitle: 'Catalog coming soon',
      emptyCatalogBody: 'No products available in your country yet. Explore merchants or become a seller.',
      exploreMerchants: 'Explore merchants',
      becomeSeller: 'Become a seller',
      noFilterMatch: 'No products match your filters.',
      resetFilters: 'Reset filters',
      prevProducts: 'Previous products',
      nextProducts: 'Next products',
    },
    product: {
      outOfStock: 'Out of stock',
      unavailable: 'This product is temporarily unavailable. Check back soon or browse other items from this shop.',
      taxesNote: 'Taxes included. Delivery fees calculated at checkout.',
      tabDescription: 'Full description',
      tabComposition: 'Composition & origin',
      tabReviews: 'Customer reviews',
      addToCart: 'Add to cart',
      buyNow: 'Buy now',
      add: 'Add',
      buy: 'Buy',
      quantity: 'Quantity',
      variant: 'Variant',
      reviewsCount: 'reviews',
      sameShop: 'More from this shop',
      viewShop: 'View shop',
    },
    checkout: {
      stepCart: 'Cart',
      stepDelivery: 'Delivery',
      stepPayment: 'Payment',
      stepConfirmation: 'Confirmation',
      pickup: 'Store pickup',
      delivery: 'Home delivery',
      continue: 'Continue',
      placeOrder: 'Place order',
      phoneRequired: 'Phone number required',
    },
    geo: {
      country: 'Country',
      suggestTitle: 'You seem to be in {country}',
      suggestBody: 'Show content and shops tailored to your country?',
      suggestSwitch: 'Yes, switch to {country}',
      suggestDismiss: 'No thanks',
    },
    common: {
      offline: 'Offline',
      retry: 'Retry',
      language: 'Language',
      loading: 'Loading…',
      close: 'Close',
    },
  },
} as const

export type MessageKey = keyof typeof messages.fr

function getByPath(obj: Record<string, unknown>, path: string): string {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
  return typeof value === 'string' ? value : path
}

export function translate(locale: Locale, key: string, vars?: Record<string, string>): string {
  const table = messages[locale] ?? messages.fr
  let text = getByPath(table as unknown as Record<string, unknown>, key)
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
    }
  }
  return text
}

export function detectLocaleFromCookie(cookieHeader?: string | null): Locale {
  if (!cookieHeader) return DEFAULT_LOCALE
  const match = cookieHeader.match(/(?:^|;\s*)lp_locale=(fr|en)(?:;|$)/)
  return match?.[1] === 'en' ? 'en' : DEFAULT_LOCALE
}
