/**
 * Menus restaurant — sections, plats locaux, images Unsplash.
 * Liés au Merchant (vertical food), sans produit boutique.
 */

export type MenuItemSeed = {
  name: string
  price: number
  desc?: string
  image: keyof typeof FOOD_IMAGES
}

export type MenuSectionSeed = {
  name: string
  items: MenuItemSeed[]
}

export type MerchantMenuSeed = {
  sections: MenuSectionSeed[]
}

/** Banque d'images food (Unsplash, format crop 600px) */
export const FOOD_IMAGES = {
  accra: 'https://images.unsplash.com/photo-1608039829572-7854e1937b9e?auto=format&fit=crop&q=80&w=600',
  salade: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600',
  poulet_dg: 'https://images.unsplash.com/photo-1626082927389-6dd0976856c7?auto=format&fit=crop&q=80&w=600',
  poisson_braise: 'https://images.unsplash.com/photo-1544943910-04c54e739fe7?auto=format&fit=crop&q=80&w=600',
  attieke: 'https://images.unsplash.com/photo-1585937421612-70a008296fbe?auto=format&fit=crop&q=80&w=600',
  foutou: 'https://images.unsplash.com/photo-1598103441407-ef22bdf34c4e?auto=format&fit=crop&q=80&w=600',
  kedjenou: 'https://images.unsplash.com/photo-1603133872878-684fc385d683?auto=format&fit=crop&q=80&w=600',
  alloco: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600',
  brochette: 'https://images.unsplash.com/photo-1529042410799-b9637034c0c3?auto=format&fit=crop&q=80&w=600',
  riz_gras: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=600',
  thieb: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600',
  yassa: 'https://images.unsplash.com/photo-1604908176997-4313178c4f4e?auto=format&fit=crop&q=80&w=600',
  mafe: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&q=80&w=600',
  bissap: 'https://images.unsplash.com/photo-1556679343-d0288e69ae23?auto=format&fit=crop&q=80&w=600',
  cocktail: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d4c?auto=format&fit=crop&q=80&w=600',
  biere: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=600',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
  frites: 'https://images.unsplash.com/photo-1573080496219-bb0800634a41?auto=format&fit=crop&q=80&w=600',
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600',
  pasta: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=600',
  croissant: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=600',
  baguette: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600',
  patisserie: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=600',
  brunch: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a886ca?auto=format&fit=crop&q=80&w=600',
  cafe: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=600',
  smoothie: 'https://images.unsplash.com/photo-1638437447450-609c2f3a5f9a?auto=format&fit=crop&q=80&w=600',
  sushi: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&q=80&w=600',
  nouilles: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=600',
  kebab: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&q=80&w=600',
  falafel: 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?auto=format&fit=crop&q=80&w=600',
  gastronomie: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=600',
  dessert: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=600',
  hotel_petit_dej: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=600',
  hotel_room_service: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=600',
  sauce_graine: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7440?auto=format&fit=crop&q=80&w=600',
  garba: 'https://images.unsplash.com/photo-1563379091339-03246963d29a?auto=format&fit=crop&q=80&w=600',
} as const

export function menuImage(key: keyof typeof FOOD_IMAGES): string {
  return FOOD_IMAGES[key]
}

export const FOOD_MENUS: Record<string, MerchantMenuSeed> = {
  'le-bushman-cafe': {
    sections: [
      {
        name: 'Entrées & tapas',
        items: [
          { name: 'Accra de morue', price: 3500, desc: 'Beignets croustillants, sauce pimentée', image: 'accra' },
          { name: 'Salade tropical', price: 4500, desc: 'Mangue, avocat, crevettes grillées', image: 'salade' },
          { name: 'Alloco frit', price: 2500, desc: 'Banane plantain dorée, sauce claire', image: 'alloco' },
        ],
      },
      {
        name: 'Plats signatures',
        items: [
          { name: 'Poulet DG', price: 8500, desc: 'Spécialité maison, plantain & légumes wok', image: 'poulet_dg' },
          { name: 'Poisson braisé attiéké', price: 7500, desc: 'Capitaine du jour, attiéké garni', image: 'poisson_braise' },
          { name: 'Kedjenou de poulet', price: 7000, desc: 'Mijoté aux légumes, servi en canari', image: 'kedjenou' },
          { name: 'Foutou sauce graine', price: 6500, desc: 'Igname pilée, sauce graine onctueuse', image: 'foutou' },
        ],
      },
      {
        name: 'Grillades',
        items: [
          { name: 'Brochettes de bœuf', price: 5500, desc: 'Marinade épicée, oignons confits', image: 'brochette' },
          { name: 'Côtelettes d\'agneau', price: 9500, desc: 'Grillades au feu de bois', image: 'brochette' },
        ],
      },
      {
        name: 'Boissons & cocktails',
        items: [
          { name: 'Bissap maison', price: 1500, desc: 'Frais, menthe & gingembre', image: 'bissap' },
          { name: 'Cocktail Bushman', price: 5500, desc: 'Rhum local, fruits tropicaux', image: 'cocktail' },
          { name: 'Gnamakoudji', price: 2000, desc: 'Jus de gingembre piquant', image: 'bissap' },
        ],
      },
      {
        name: 'Desserts',
        items: [
          { name: 'Banane flambée', price: 3500, desc: 'Rhum & vanille de Madagascar', image: 'dessert' },
          { name: 'Mousse chocolat noir', price: 3000, image: 'dessert' },
        ],
      },
    ],
  },

  'restaurant-le-baobab': {
    sections: [
      {
        name: 'Entrées ivoiriennes',
        items: [
          { name: 'Alloco sauce claire', price: 2000, desc: 'Banane plantain, oignons & piment', image: 'alloco' },
          { name: 'Accra niébé', price: 1500, desc: 'Beignets de haricots, croustillants', image: 'accra' },
        ],
      },
      {
        name: 'Plats du terroir',
        items: [
          { name: 'Attiéké poisson grillé', price: 5500, desc: 'Capitaine entier, attiéké maison', image: 'attieke' },
          { name: 'Foutou sauce graine', price: 5000, desc: 'Recette traditionnelle du centre', image: 'foutou' },
          { name: 'Kedjenou de poulet', price: 4500, desc: 'Poulet fermier, légumes du marché', image: 'kedjenou' },
          { name: 'Garba thon', price: 3500, desc: 'Attiéké, thon frit, piment & oignons', image: 'garba' },
          { name: 'Riz gras au poulet', price: 4000, desc: 'Riz parfumé, légumes & épices', image: 'riz_gras' },
        ],
      },
      {
        name: 'Grillades du jardin',
        items: [
          { name: 'Poisson braisé (capitaine)', price: 6000, desc: 'Marinade citron & ail', image: 'poisson_braise' },
          { name: 'Brochettes mixtes', price: 4500, desc: 'Bœuf & poulet, sauce arachide', image: 'brochette' },
        ],
      },
      {
        name: 'Boissons fraîches',
        items: [
          { name: 'Bissap', price: 1000, image: 'bissap' },
          { name: 'Gnamakoudji', price: 1000, image: 'bissap' },
          { name: 'Jus de tamarin', price: 1200, image: 'bissap' },
        ],
      },
    ],
  },

  'maquis-chez-tantie': {
    sections: [
      {
        name: 'Grillades & braisés',
        items: [
          { name: 'Poisson braisé entier', price: 4500, desc: 'Capitaine ou carpe, attiéké en option', image: 'poisson_braise' },
          { name: 'Poulet braisé', price: 3500, desc: 'Marinade maquis, frites ou alloco', image: 'poulet_dg' },
          { name: 'Brochettes de viande', price: 2500, desc: '3 pièces, oignons grillés', image: 'brochette' },
        ],
      },
      {
        name: 'Plats du jour',
        items: [
          { name: 'Riz gras sauce feuille', price: 2500, image: 'riz_gras' },
          { name: 'Attiéké sauce claire', price: 2000, desc: 'Portion généreuse', image: 'attieke' },
          { name: 'Garba thon', price: 1500, desc: 'Le classique du soir', image: 'garba' },
          { name: 'Alloco + œuf', price: 1500, image: 'alloco' },
        ],
      },
      {
        name: 'Accompagnements',
        items: [
          { name: 'Alloco (portion)', price: 800, image: 'alloco' },
          { name: 'Foutou (portion)', price: 1000, image: 'foutou' },
        ],
      },
      {
        name: 'Boissons',
        items: [
          { name: 'Bissap frais', price: 500, image: 'bissap' },
          { name: 'Flag (33 cl)', price: 800, image: 'biere' },
          { name: 'Coca / Fanta', price: 600, image: 'bissap' },
        ],
      },
    ],
  },

  'noom-rooftop': {
    sections: [
      {
        name: 'Cocktails signature',
        items: [
          { name: 'Lagoon Breeze', price: 7000, desc: 'Vodka, passion, citron vert', image: 'cocktail' },
          { name: 'Old Fashioned', price: 8000, desc: 'Whisky, bitter, zeste d\'orange', image: 'cocktail' },
          { name: 'Noom Sunset', price: 7500, desc: 'Tequila, mangue, sirop hibiscus', image: 'cocktail' },
        ],
      },
      {
        name: 'Tapas & bouchées',
        items: [
          { name: 'Mini brochettes yakitori', price: 4500, image: 'brochette' },
          { name: 'Crevettes tempura', price: 5500, image: 'salade' },
          { name: 'Plateau fromages & charcuterie', price: 9000, image: 'gastronomie' },
        ],
      },
      {
        name: 'Plats à partager',
        items: [
          { name: 'Burger wagyu rooftop', price: 9500, image: 'burger' },
          { name: 'Pizza truffe & mozzarella', price: 8500, image: 'pizza' },
        ],
      },
    ],
  },

  'lounge-black-gold': {
    sections: [
      {
        name: 'Cocktails premium',
        items: [
          { name: 'Black Gold Old Fashioned', price: 9000, desc: 'Bourbon, sirop or, fumée', image: 'cocktail' },
          { name: 'Lagune Negroni', price: 8500, image: 'cocktail' },
          { name: 'Mojito premium', price: 7000, image: 'cocktail' },
        ],
      },
      {
        name: 'Spiritueux & cigares',
        items: [
          { name: 'Whisky single malt (4 cl)', price: 8000, image: 'cocktail' },
          { name: 'Rhum agricole vieux (4 cl)', price: 6000, image: 'cocktail' },
        ],
      },
      {
        name: 'Bouchées',
        items: [
          { name: 'Plateau amuse-bouche', price: 12000, image: 'gastronomie' },
          { name: 'Brochettes de bœuf', price: 6500, image: 'brochette' },
        ],
      },
    ],
  },

  'cafe-brooklyn-2-plateaux': {
    sections: [
      {
        name: 'Brunch',
        items: [
          { name: 'Pancakes maple & beurre', price: 4500, image: 'brunch' },
          { name: 'Avocado toast', price: 4000, desc: 'Pain sourdough, œuf poché', image: 'brunch' },
          { name: 'French toast brioche', price: 4200, image: 'brunch' },
          { name: 'Brooklyn Bowl', price: 5000, desc: 'Granola, fruits, yaourt grec', image: 'smoothie' },
        ],
      },
      {
        name: 'Salades & bowls',
        items: [
          { name: 'Salade César poulet', price: 5500, image: 'salade' },
          { name: 'Bowl quinoa saumon', price: 6000, image: 'salade' },
        ],
      },
      {
        name: 'Boissons chaudes',
        items: [
          { name: 'Espresso', price: 1500, image: 'cafe' },
          { name: 'Cappuccino', price: 2000, image: 'cafe' },
          { name: 'Cold brew', price: 2500, image: 'cafe' },
        ],
      },
    ],
  },

  'cafe-terrasse-plateau': {
    sections: [
      {
        name: 'Petit-déjeuner',
        items: [
          { name: 'Formule express', price: 2500, desc: 'Café + croissant', image: 'croissant' },
          { name: 'Formule complet', price: 4500, desc: 'Jus, café, viennoiserie, œuf', image: 'brunch' },
        ],
      },
      {
        name: 'Viennoiseries',
        items: [
          { name: 'Croissant', price: 800, image: 'croissant' },
          { name: 'Pain au chocolat', price: 900, image: 'patisserie' },
        ],
      },
      {
        name: 'Cafés & thés',
        items: [
          { name: 'Espresso', price: 1200, image: 'cafe' },
          { name: 'Latte', price: 1800, image: 'cafe' },
          { name: 'Thé menthe', price: 1500, image: 'cafe' },
        ],
      },
    ],
  },

  'boulangerie-patisserie-paris': {
    sections: [
      {
        name: 'Viennoiseries',
        items: [
          { name: 'Croissant pur beurre', price: 800, image: 'croissant' },
          { name: 'Pain au chocolat', price: 900, image: 'patisserie' },
          { name: 'Chausson aux pommes', price: 950, image: 'patisserie' },
          { name: 'Pain aux raisins', price: 1000, image: 'patisserie' },
        ],
      },
      {
        name: 'Pains',
        items: [
          { name: 'Baguette tradition', price: 600, image: 'baguette' },
          { name: 'Pain de campagne', price: 1200, image: 'baguette' },
          { name: 'Ficelle', price: 400, image: 'baguette' },
        ],
      },
      {
        name: 'Pâtisseries',
        items: [
          { name: 'Tarte au citron', price: 2500, image: 'patisserie' },
          { name: 'Éclair au chocolat', price: 1800, image: 'patisserie' },
          { name: 'Paris-Brest', price: 3200, image: 'patisserie' },
          { name: 'Mille-feuille', price: 2800, image: 'patisserie' },
        ],
      },
      {
        name: 'Sandwichs & quiches',
        items: [
          { name: 'Sandwich jambon-beurre', price: 2200, image: 'baguette' },
          { name: 'Quiche lorraine', price: 2800, image: 'gastronomie' },
        ],
      },
    ],
  },

  'burger-republic-2-plateaux': {
    sections: [
      {
        name: 'Burgers',
        items: [
          { name: 'Classic Wagyu', price: 6500, desc: '180 g, cheddar, sauce maison', image: 'burger' },
          { name: 'Double Smash', price: 8500, desc: 'Double steak, bacon croustillant', image: 'burger' },
          { name: 'Chicken crispy', price: 5500, image: 'burger' },
          { name: 'Veggie Beyond', price: 6000, image: 'burger' },
        ],
      },
      {
        name: 'Accompagnements',
        items: [
          { name: 'Frites maison', price: 2000, image: 'frites' },
          { name: 'Onion rings', price: 2500, image: 'frites' },
          { name: 'Coleslaw', price: 1500, image: 'salade' },
        ],
      },
      {
        name: 'Menus',
        items: [
          { name: 'Menu Classic + frites + boisson', price: 8500, image: 'burger' },
          { name: 'Menu Double + frites + boisson', price: 10500, image: 'burger' },
        ],
      },
    ],
  },

  'pizzeria-naples-cocody': {
    sections: [
      {
        name: 'Pizzas classiques',
        items: [
          { name: 'Margherita', price: 6000, desc: 'Tomate, mozzarella, basilic', image: 'pizza' },
          { name: 'Diavola', price: 7500, desc: 'Salami piquant', image: 'pizza' },
          { name: 'Quattro formaggi', price: 8000, image: 'pizza' },
        ],
      },
      {
        name: 'Pizzas signature',
        items: [
          { name: 'Napoli speciale', price: 8500, desc: 'Anchois, câpres, olives', image: 'pizza' },
          { name: 'Pizza bushman', price: 9000, desc: 'Poulet épicé, poivrons', image: 'pizza' },
        ],
      },
      {
        name: 'Pâtes & antipasti',
        items: [
          { name: 'Spaghetti carbonara', price: 5500, image: 'pasta' },
          { name: 'Bruschetta tomate', price: 3500, image: 'salade' },
        ],
      },
    ],
  },

  'kebab-istanbul-adjame': {
    sections: [
      {
        name: 'Kebabs',
        items: [
          { name: 'Döner poulet', price: 2500, image: 'kebab' },
          { name: 'Döner mixte', price: 3000, image: 'kebab' },
          { name: 'Shawarma bœuf', price: 2800, image: 'kebab' },
        ],
      },
      {
        name: 'Assiettes',
        items: [
          { name: 'Assiette mixte', price: 4500, desc: 'Viande, frites, salade', image: 'kebab' },
          { name: 'Assiette falafel', price: 3500, image: 'falafel' },
        ],
      },
      {
        name: 'Desserts',
        items: [
          { name: 'Baklava (3 pièces)', price: 1500, image: 'dessert' },
        ],
      },
    ],
  },

  'restaurant-chez-wou': {
    sections: [
      {
        name: 'Entrées',
        items: [
          { name: 'Rouleaux de printemps', price: 3500, image: 'salade' },
          { name: 'Dim sum mix (6 pièces)', price: 4500, image: 'nouilles' },
          { name: 'Soupe wonton', price: 3000, image: 'nouilles' },
        ],
      },
      {
        name: 'Plats wok',
        items: [
          { name: 'Poulet Kung Pao', price: 6500, image: 'nouilles' },
          { name: 'Bœuf aux oignons', price: 7000, image: 'nouilles' },
          { name: 'Pad thaï crevettes', price: 7500, image: 'nouilles' },
        ],
      },
      {
        name: 'Sushis & sashimis',
        items: [
          { name: 'Assortiment 12 pièces', price: 8500, image: 'sushi' },
          { name: 'Sashimi saumon', price: 9000, image: 'sushi' },
          { name: 'California roll', price: 5500, image: 'sushi' },
        ],
      },
    ],
  },

  'restaurant-saveurs-du-monde': {
    sections: [
      {
        name: 'Entrées',
        items: [
          { name: 'Velouté de patate douce', price: 4500, image: 'gastronomie' },
          { name: 'Tartare de thon', price: 6500, image: 'salade' },
        ],
      },
      {
        name: 'Plats',
        items: [
          { name: 'Filet de bœuf sauce poivre', price: 14500, image: 'gastronomie' },
          { name: 'Lotte rôtie beurre citron', price: 12000, image: 'poisson_braise' },
          { name: 'Risotto aux cèpes', price: 9500, image: 'pasta' },
          { name: 'Magret de canard', price: 11000, image: 'gastronomie' },
        ],
      },
      {
        name: 'Desserts',
        items: [
          { name: 'Fondant chocolat', price: 4000, image: 'dessert' },
          { name: 'Tarte tatin', price: 3800, image: 'dessert' },
        ],
      },
    ],
  },

  'smoothie-bar-riviera': {
    sections: [
      {
        name: 'Bowls',
        items: [
          { name: 'Açaï bowl tropical', price: 4500, image: 'smoothie' },
          { name: 'Green power bowl', price: 4000, desc: 'Épinards, avocat, quinoa', image: 'smoothie' },
          { name: 'Mango passion bowl', price: 4200, image: 'smoothie' },
        ],
      },
      {
        name: 'Smoothies',
        items: [
          { name: 'Detox vert', price: 3000, image: 'smoothie' },
          { name: 'Banane-cacahuète', price: 2800, image: 'smoothie' },
          { name: 'Fruits rouges', price: 3200, image: 'smoothie' },
        ],
      },
    ],
  },

  'hotel-ivoire-abidjan': {
    sections: [
      {
        name: 'Petit-déjeuner',
        items: [
          { name: 'Buffet continental', price: 18000, desc: 'Accès buffet complet', image: 'hotel_petit_dej' },
          { name: 'Formule express chambre', price: 8500, image: 'hotel_petit_dej' },
        ],
      },
      {
        name: 'Room service',
        items: [
          { name: 'Club sandwich', price: 7500, image: 'hotel_room_service' },
          { name: 'Salade César', price: 6500, image: 'salade' },
          { name: 'Steak frites', price: 12000, image: 'gastronomie' },
        ],
      },
      {
        name: 'Boissons',
        items: [
          { name: 'Café / thé', price: 2500, image: 'cafe' },
          { name: 'Jus frais', price: 3500, image: 'bissap' },
        ],
      },
    ],
  },

  'hotel-golf-abidjan': {
    sections: [
      {
        name: 'Restaurant Le Green',
        items: [
          { name: 'Poisson du jour grillé', price: 9500, image: 'poisson_braise' },
          { name: 'Salade du golf', price: 5500, image: 'salade' },
          { name: 'Burger clubhouse', price: 6500, image: 'burger' },
        ],
      },
      {
        name: 'Petit-déjeuner',
        items: [
          { name: 'Buffet petit-déjeuner', price: 12000, image: 'hotel_petit_dej' },
          { name: 'Continental en chambre', price: 7000, image: 'hotel_petit_dej' },
        ],
      },
    ],
  },

  // ─── Burkina Faso ───────────────────────────────────────────────────────────

  'maquis-ouaga-centre': {
    sections: [
      {
        name: 'Plats du Faso',
        items: [
          { name: 'Riz gras au poulet', price: 2500, image: 'riz_gras' },
          { name: 'Tô sauce gombo', price: 2000, image: 'foutou' },
          { name: 'Ragout d\'igname', price: 2200, image: 'foutou' },
        ],
      },
      {
        name: 'Grillades',
        items: [
          { name: 'Poisson braisé', price: 3000, image: 'poisson_braise' },
          { name: 'Brochettes de mouton', price: 2500, image: 'brochette' },
          { name: 'Poulet braisé', price: 2800, image: 'poulet_dg' },
        ],
      },
      {
        name: 'Accompagnements',
        items: [
          { name: 'Alloco', price: 500, image: 'alloco' },
          { name: 'Attiéké', price: 500, image: 'attieke' },
        ],
      },
      {
        name: 'Boissons',
        items: [
          { name: 'Bissap', price: 500, image: 'bissap' },
          { name: 'Dolo (sorgho)', price: 800, image: 'bissap' },
          { name: 'Flag', price: 700, image: 'biere' },
        ],
      },
    ],
  },

  // ─── Sénégal ────────────────────────────────────────────────────────────────

  'restaurant-thieb-dakar': {
    sections: [
      {
        name: 'Spécialités sénégalaises',
        items: [
          { name: 'Thiéboudienne poisson', price: 3500, desc: 'Riz au poisson, légumes', image: 'thieb' },
          { name: 'Yassa poulet', price: 3000, desc: 'Marinade oignon-citron', image: 'yassa' },
          { name: 'Mafé bœuf', price: 3200, desc: 'Sauce arachide onctueuse', image: 'mafe' },
          { name: 'Pastels au thon', price: 1500, desc: 'Beignets croustillants', image: 'accra' },
        ],
      },
      {
        name: 'Grillades',
        items: [
          { name: 'Brochette d\'yassa', price: 2500, image: 'brochette' },
          { name: 'Poisson braisé', price: 4000, image: 'poisson_braise' },
        ],
      },
      {
        name: 'Boissons',
        items: [
          { name: 'Bissap', price: 500, image: 'bissap' },
          { name: 'Gingembre', price: 500, image: 'bissap' },
          { name: 'Bouye', price: 700, image: 'bissap' },
        ],
      },
    ],
  },

  'burger-fast-dakar': {
    sections: [
      {
        name: 'Burgers',
        items: [
          { name: 'Teranga Burger', price: 4500, desc: 'Bœuf local, sauce yassa', image: 'burger' },
          { name: 'Cheese Dakar', price: 5000, image: 'burger' },
          { name: 'Chicken crispy', price: 4000, image: 'burger' },
        ],
      },
      {
        name: 'Accompagnements',
        items: [
          { name: 'Frites maison', price: 1500, image: 'frites' },
          { name: 'Onion rings', price: 2000, image: 'frites' },
        ],
      },
      {
        name: 'Milkshakes',
        items: [
          { name: 'Vanille', price: 2000, image: 'dessert' },
          { name: 'Chocolat', price: 2000, image: 'dessert' },
        ],
      },
    ],
  },

  'cafe-almadies': {
    sections: [
      {
        name: 'Brunch océan',
        items: [
          { name: 'Eggs Benedict', price: 4500, image: 'brunch' },
          { name: 'Pancakes miel', price: 3500, image: 'brunch' },
          { name: 'Avocado toast', price: 4000, image: 'brunch' },
        ],
      },
      {
        name: 'Cafés',
        items: [
          { name: 'Espresso', price: 1500, image: 'cafe' },
          { name: 'Flat white', price: 2200, image: 'cafe' },
          { name: 'Latte glacé', price: 2500, image: 'cafe' },
        ],
      },
      {
        name: 'Jus & smoothies',
        items: [
          { name: 'Jus bissap', price: 1500, image: 'bissap' },
          { name: 'Smoothie mangue', price: 2500, image: 'smoothie' },
        ],
      },
    ],
  },
}
