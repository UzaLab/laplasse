import type { PrismaClient } from '../generated/prisma/client'

export type ProductCategorySeed = {
  name: string
  slug: string
  icon: string
  sort_order: number
  children?: Array<{ name: string; slug: string; icon: string; sort_order: number }>
}

/** Catalogue e-commerce LaPlasse — catégories racines et sous-catégories (idempotent par slug). */
export const PRODUCT_CATEGORY_CATALOG: ProductCategorySeed[] = [
  {
    name: 'Informatique & High-tech',
    slug: 'informatique',
    icon: 'Laptop',
    sort_order: 1,
    children: [
      { name: 'Ordinateurs portables', slug: 'informatique-portables', icon: 'Laptop', sort_order: 1 },
      { name: 'Ordinateurs de bureau', slug: 'informatique-bureau', icon: 'Monitor', sort_order: 2 },
      { name: 'Tablettes', slug: 'informatique-tablettes', icon: 'Tablet', sort_order: 3 },
      { name: 'Composants PC', slug: 'informatique-composants', icon: 'Cpu', sort_order: 4 },
      { name: 'Périphériques', slug: 'informatique-peripheriques', icon: 'Mouse', sort_order: 5 },
      { name: 'Stockage & mémoire', slug: 'informatique-stockage', icon: 'HardDrive', sort_order: 6 },
    ],
  },
  {
    name: 'Téléphones & Accessoires',
    slug: 'telephones',
    icon: 'Smartphone',
    sort_order: 2,
    children: [
      { name: 'Smartphones', slug: 'telephones-smartphones', icon: 'Smartphone', sort_order: 1 },
      { name: 'Coques & protections', slug: 'telephones-coques', icon: 'Shield', sort_order: 2 },
      { name: 'Chargeurs & câbles', slug: 'telephones-chargeurs', icon: 'Cable', sort_order: 3 },
      { name: 'Écouteurs & audio', slug: 'telephones-audio', icon: 'Headphones', sort_order: 4 },
      { name: 'Montres connectées', slug: 'telephones-montres', icon: 'Watch', sort_order: 5 },
    ],
  },
  {
    name: 'Électroménager',
    slug: 'electromenager',
    icon: 'Refrigerator',
    sort_order: 3,
    children: [
      { name: 'Gros électroménager', slug: 'electromenager-gros', icon: 'Refrigerator', sort_order: 1 },
      { name: 'Petit électroménager', slug: 'electromenager-petit', icon: 'Blender', sort_order: 2 },
      { name: 'Climatisation & ventilation', slug: 'electromenager-clim', icon: 'Wind', sort_order: 3 },
      { name: 'Entretien maison', slug: 'electromenager-entretien', icon: 'Sparkles', sort_order: 4 },
    ],
  },
  {
    name: 'Maison & Déco',
    slug: 'maison-deco',
    icon: 'Home',
    sort_order: 4,
    children: [
      { name: 'Meubles', slug: 'maison-meubles', icon: 'Sofa', sort_order: 1 },
      { name: 'Décoration', slug: 'maison-decoration', icon: 'Flower2', sort_order: 2 },
      { name: 'Literie & textile', slug: 'maison-literie', icon: 'BedDouble', sort_order: 3 },
      { name: 'Cuisine & arts de la table', slug: 'maison-cuisine', icon: 'UtensilsCrossed', sort_order: 4 },
      { name: 'Luminaires', slug: 'maison-luminaires', icon: 'Lamp', sort_order: 5 },
      { name: 'Rangement & organisation', slug: 'maison-rangement', icon: 'Archive', sort_order: 6 },
    ],
  },
  {
    name: 'Mode & Accessoires',
    slug: 'mode',
    icon: 'Shirt',
    sort_order: 5,
    children: [
      { name: 'Vêtements', slug: 'mode-vetements', icon: 'Shirt', sort_order: 1 },
      { name: 'Chaussures', slug: 'mode-chaussures', icon: 'Footprints', sort_order: 2 },
      { name: 'Sacs & maroquinerie', slug: 'mode-sacs', icon: 'ShoppingBag', sort_order: 3 },
      { name: 'Accessoires', slug: 'mode-accessoires', icon: 'Gem', sort_order: 4 },
      { name: 'Bijoux & montres', slug: 'mode-bijoux', icon: 'Watch', sort_order: 5 },
    ],
  },
  {
    name: 'Beauté & Santé',
    slug: 'beaute-sante',
    icon: 'Sparkles',
    sort_order: 6,
    children: [
      { name: 'Soins visage', slug: 'beaute-visage', icon: 'Sparkles', sort_order: 1 },
      { name: 'Soins corps & cheveux', slug: 'beaute-corps', icon: 'Droplets', sort_order: 2 },
      { name: 'Parfums', slug: 'beaute-parfums', icon: 'Flower2', sort_order: 3 },
      { name: 'Hygiène & bien-être', slug: 'beaute-hygiene', icon: 'Heart', sort_order: 4 },
      { name: 'Parapharmacie', slug: 'beaute-parapharmacie', icon: 'Pill', sort_order: 5 },
    ],
  },
  {
    name: 'Sport & Loisirs',
    slug: 'sport-loisirs',
    icon: 'Dumbbell',
    sort_order: 7,
    children: [
      { name: 'Fitness & musculation', slug: 'sport-fitness', icon: 'Dumbbell', sort_order: 1 },
      { name: 'Sports collectifs', slug: 'sport-collectifs', icon: 'Trophy', sort_order: 2 },
      { name: 'Vélos & trottinettes', slug: 'sport-velos', icon: 'Bike', sort_order: 3 },
      { name: 'Camping & outdoor', slug: 'sport-outdoor', icon: 'Tent', sort_order: 4 },
      { name: 'Jeux & jouets', slug: 'sport-jeux', icon: 'Gamepad2', sort_order: 5 },
    ],
  },
  {
    name: 'Alimentation & Boissons',
    slug: 'alimentation',
    icon: 'ShoppingCart',
    sort_order: 8,
    children: [
      { name: 'Épicerie', slug: 'alimentation-epicerie', icon: 'ShoppingCart', sort_order: 1 },
      { name: 'Boissons', slug: 'alimentation-boissons', icon: 'Coffee', sort_order: 2 },
      { name: 'Produits frais', slug: 'alimentation-frais', icon: 'Apple', sort_order: 3 },
      { name: 'Snacks & confiseries', slug: 'alimentation-snacks', icon: 'Cookie', sort_order: 4 },
    ],
  },
  {
    name: 'Auto & Moto',
    slug: 'auto-moto',
    icon: 'Car',
    sort_order: 9,
    children: [
      { name: 'Pièces & accessoires auto', slug: 'auto-pieces', icon: 'Car', sort_order: 1 },
      { name: 'Entretien & nettoyage', slug: 'auto-entretien', icon: 'Wrench', sort_order: 2 },
      { name: 'Moto & deux-roues', slug: 'auto-moto-accessoires', icon: 'Bike', sort_order: 3 },
      { name: 'GPS & électronique embarquée', slug: 'auto-gps', icon: 'Navigation', sort_order: 4 },
    ],
  },
  {
    name: 'Enfants & Bébé',
    slug: 'enfants-bebe',
    icon: 'Baby',
    sort_order: 10,
    children: [
      { name: 'Puériculture', slug: 'enfants-puericulture', icon: 'Baby', sort_order: 1 },
      { name: 'Vêtements enfant', slug: 'enfants-vetements', icon: 'Shirt', sort_order: 2 },
      { name: 'Jouets & éveil', slug: 'enfants-jouets', icon: 'Blocks', sort_order: 3 },
      { name: 'Fournitures scolaires', slug: 'enfants-scolaire', icon: 'BookOpen', sort_order: 4 },
    ],
  },
  {
    name: 'Artisanat & Art local',
    slug: 'artisanat',
    icon: 'Palette',
    sort_order: 11,
    children: [
      { name: 'Textile & wax', slug: 'artisanat-textile', icon: 'Shirt', sort_order: 1 },
      { name: 'Sculpture & bronze', slug: 'artisanat-sculpture', icon: 'Hammer', sort_order: 2 },
      { name: 'Céramique & poterie', slug: 'artisanat-ceramique', icon: 'Palette', sort_order: 3 },
      { name: 'Bijoux artisanaux', slug: 'artisanat-bijoux', icon: 'Gem', sort_order: 4 },
    ],
  },
  {
    name: 'Photo, Vidéo & Gaming',
    slug: 'photo-gaming',
    icon: 'Camera',
    sort_order: 12,
    children: [
      { name: 'Appareils photo', slug: 'photo-appareils', icon: 'Camera', sort_order: 1 },
      { name: 'Objectifs & accessoires', slug: 'photo-accessoires', icon: 'Aperture', sort_order: 2 },
      { name: 'Consoles & jeux vidéo', slug: 'gaming-consoles', icon: 'Gamepad2', sort_order: 3 },
      { name: 'Streaming & création', slug: 'gaming-streaming', icon: 'Mic', sort_order: 4 },
    ],
  },
]

export async function seedProductCategories(prisma: PrismaClient) {
  let roots = 0
  let children = 0

  for (const root of PRODUCT_CATEGORY_CATALOG) {
    const parent = await prisma.productCategory.upsert({
      where: { slug: root.slug },
      update: {
        name: root.name,
        icon: root.icon,
        sort_order: root.sort_order,
        is_active: true,
        parent_id: null,
      },
      create: {
        name: root.name,
        slug: root.slug,
        icon: root.icon,
        sort_order: root.sort_order,
        is_active: true,
      },
    })
    await prisma.productCategoryCountry.deleteMany({ where: { category_id: parent.id } })
    roots++

    for (const child of root.children ?? []) {
      await prisma.productCategory.upsert({
        where: { slug: child.slug },
        update: {
          name: child.name,
          icon: child.icon,
          sort_order: child.sort_order,
          parent_id: parent.id,
          is_active: true,
        },
        create: {
          name: child.name,
          slug: child.slug,
          icon: child.icon,
          sort_order: child.sort_order,
          parent_id: parent.id,
          is_active: true,
        },
      })
      children++
    }
  }

  return { roots, children, total: roots + children }
}
