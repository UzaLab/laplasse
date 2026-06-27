import type { PrismaClient } from '../generated/prisma/client'

/**
 * Attributs structurés par catégorie LaPlasse.
 * Idempotent — upsert par (category_slug, key).
 */

type AttributeDef = {
  label: string
  key: string
  attribute_type: 'TEXT' | 'NUMBER' | 'ENUM' | 'BOOLEAN'
  is_required: boolean
  sort_order: number
  unit?: string
  placeholder?: string
  enum_options?: string[]
}

type CategoryAttributeSeed = {
  /** Slug de la catégorie racine OU d'une sous-catégorie */
  category_slug: string
  attributes: AttributeDef[]
}

export const CATEGORY_ATTRIBUTES_SEED: CategoryAttributeSeed[] = [
  // ── Mode & Accessoires ─────────────────────────────────────────────────────
  {
    category_slug: 'mode',
    attributes: [
      { label: 'Matière principale', key: 'material', attribute_type: 'TEXT', is_required: false, sort_order: 1, placeholder: 'Ex. 100% coton' },
      { label: 'Guide des tailles', key: 'size_guide', attribute_type: 'TEXT', is_required: false, sort_order: 2, placeholder: 'Ex. S=38-40, M=40-42…' },
      { label: 'Entretien', key: 'care_instructions', attribute_type: 'TEXT', is_required: false, sort_order: 3, placeholder: 'Ex. Lavage à 30°C' },
      {
        label: 'Origine tissu',
        key: 'fabric_origin',
        attribute_type: 'ENUM',
        is_required: false,
        sort_order: 4,
        enum_options: ['Côte d\'Ivoire', 'Ghana', 'Sénégal', 'Nigeria', 'Chine', 'Inde', 'Europe', 'Autre'],
      },
    ],
  },
  // ── Informatique & High-tech ────────────────────────────────────────────────
  {
    category_slug: 'informatique',
    attributes: [
      { label: 'Marque', key: 'brand', attribute_type: 'TEXT', is_required: false, sort_order: 1, placeholder: 'Ex. Lenovo, HP…' },
      { label: 'Modèle', key: 'model', attribute_type: 'TEXT', is_required: false, sort_order: 2 },
      { label: 'Garantie', key: 'warranty', attribute_type: 'TEXT', is_required: false, sort_order: 3, placeholder: 'Ex. 1 an constructeur' },
      { label: 'RAM', key: 'ram_gb', attribute_type: 'NUMBER', is_required: false, sort_order: 4, unit: 'Go' },
      { label: 'Stockage', key: 'storage_gb', attribute_type: 'NUMBER', is_required: false, sort_order: 5, unit: 'Go' },
      { label: '220V / 50Hz', key: 'compatible_ci_voltage', attribute_type: 'BOOLEAN', is_required: false, sort_order: 6 },
    ],
  },
  // ── Téléphones & Accessoires ────────────────────────────────────────────────
  {
    category_slug: 'telephones',
    attributes: [
      { label: 'Marque', key: 'brand', attribute_type: 'TEXT', is_required: false, sort_order: 1, placeholder: 'Ex. Samsung, Tecno…' },
      { label: 'Modèle', key: 'model', attribute_type: 'TEXT', is_required: false, sort_order: 2 },
      { label: 'Capacité batterie', key: 'battery_mah', attribute_type: 'NUMBER', is_required: false, sort_order: 3, unit: 'mAh' },
      { label: 'Mémoire interne', key: 'storage_gb', attribute_type: 'NUMBER', is_required: false, sort_order: 4, unit: 'Go' },
      { label: 'RAM', key: 'ram_gb', attribute_type: 'NUMBER', is_required: false, sort_order: 5, unit: 'Go' },
      { label: 'Garantie', key: 'warranty', attribute_type: 'TEXT', is_required: false, sort_order: 6, placeholder: 'Ex. 6 mois vendeur' },
    ],
  },
  // ── Beauté & Santé ──────────────────────────────────────────────────────────
  {
    category_slug: 'beaute-sante',
    attributes: [
      { label: 'Volume', key: 'volume_ml', attribute_type: 'NUMBER', is_required: false, sort_order: 1, unit: 'ml' },
      { label: 'Ingrédients principaux', key: 'ingredients', attribute_type: 'TEXT', is_required: false, sort_order: 2 },
      { label: 'Date de péremption', key: 'expiry_date', attribute_type: 'TEXT', is_required: false, sort_order: 3, placeholder: 'MM/AAAA' },
      {
        label: 'Type de peau / cheveux',
        key: 'skin_type',
        attribute_type: 'ENUM',
        is_required: false,
        sort_order: 4,
        enum_options: ['Tous types', 'Peau sèche', 'Peau grasse', 'Peau mixte', 'Peau sensible', 'Cheveux secs', 'Cheveux gras', 'Cheveux crépus'],
      },
      { label: 'Certifié halal', key: 'halal_certified', attribute_type: 'BOOLEAN', is_required: false, sort_order: 5 },
    ],
  },
  // ── Alimentation & Boissons ─────────────────────────────────────────────────
  {
    category_slug: 'alimentation',
    attributes: [
      { label: 'Poids net', key: 'net_weight_g', attribute_type: 'NUMBER', is_required: false, sort_order: 1, unit: 'g' },
      { label: 'Date limite de consommation', key: 'dlc', attribute_type: 'TEXT', is_required: false, sort_order: 2, placeholder: 'JJ/MM/AAAA ou durée' },
      { label: 'Allergènes', key: 'allergens', attribute_type: 'TEXT', is_required: false, sort_order: 3, placeholder: 'Ex. Contient gluten, arachides…' },
      { label: 'Conservation', key: 'storage_conditions', attribute_type: 'TEXT', is_required: false, sort_order: 4, placeholder: 'Ex. À conserver au frais' },
      { label: 'Certifié halal', key: 'halal_certified', attribute_type: 'BOOLEAN', is_required: false, sort_order: 5 },
      { label: 'Bio / naturel', key: 'is_organic', attribute_type: 'BOOLEAN', is_required: false, sort_order: 6 },
    ],
  },
  // ── Maison & Déco / Artisanat ────────────────────────────────────────────────
  {
    category_slug: 'maison-deco',
    attributes: [
      { label: 'Matériaux', key: 'materials', attribute_type: 'TEXT', is_required: false, sort_order: 1, placeholder: 'Ex. Bois, métal, tissu…' },
      { label: 'Dimensions (L×l×H)', key: 'dimensions_lxlxh', attribute_type: 'TEXT', is_required: false, sort_order: 2, placeholder: 'Ex. 120×60×75 cm' },
      { label: 'Région d\'origine artisan', key: 'artisan_region', attribute_type: 'TEXT', is_required: false, sort_order: 3, placeholder: 'Ex. Korhogo, Abidjan…' },
      { label: 'Fait main', key: 'handmade', attribute_type: 'BOOLEAN', is_required: false, sort_order: 4 },
    ],
  },
  {
    category_slug: 'artisanat',
    attributes: [
      { label: 'Matériaux', key: 'materials', attribute_type: 'TEXT', is_required: false, sort_order: 1, placeholder: 'Ex. Bronze, wax 100% coton…' },
      { label: 'Dimensions (L×l×H)', key: 'dimensions_lxlxh', attribute_type: 'TEXT', is_required: false, sort_order: 2 },
      { label: 'Région d\'origine artisan', key: 'artisan_region', attribute_type: 'TEXT', is_required: false, sort_order: 3, placeholder: 'Ex. Korhogo, Abidjan…' },
      { label: 'Fait main', key: 'handmade', attribute_type: 'BOOLEAN', is_required: false, sort_order: 4 },
    ],
  },
  // ── Auto & Moto ─────────────────────────────────────────────────────────────
  {
    category_slug: 'auto-moto',
    attributes: [
      { label: 'Marque véhicule compatible', key: 'vehicle_brand', attribute_type: 'TEXT', is_required: false, sort_order: 1, placeholder: 'Ex. Toyota, Renault…' },
      { label: 'Modèle véhicule compatible', key: 'vehicle_model', attribute_type: 'TEXT', is_required: false, sort_order: 2 },
      { label: 'Années compatibles', key: 'compatible_years', attribute_type: 'TEXT', is_required: false, sort_order: 3, placeholder: 'Ex. 2015–2022' },
      { label: 'Référence OEM', key: 'oem_reference', attribute_type: 'TEXT', is_required: false, sort_order: 4 },
    ],
  },
  // ── Électroménager ──────────────────────────────────────────────────────────
  {
    category_slug: 'electromenager',
    attributes: [
      { label: 'Marque', key: 'brand', attribute_type: 'TEXT', is_required: false, sort_order: 1 },
      { label: 'Puissance', key: 'power_w', attribute_type: 'NUMBER', is_required: false, sort_order: 2, unit: 'W' },
      { label: '220V / 50Hz', key: 'compatible_ci_voltage', attribute_type: 'BOOLEAN', is_required: false, sort_order: 3 },
      { label: 'Garantie', key: 'warranty', attribute_type: 'TEXT', is_required: false, sort_order: 4, placeholder: 'Ex. 2 ans constructeur' },
      { label: 'Classe énergie', key: 'energy_class', attribute_type: 'TEXT', is_required: false, sort_order: 5, placeholder: 'Ex. A++' },
    ],
  },
]

export async function seedCategoryAttributes(prisma: PrismaClient) {
  let total = 0

  for (const entry of CATEGORY_ATTRIBUTES_SEED) {
    const category = await prisma.productCategory.findUnique({
      where: { slug: entry.category_slug },
    })
    if (!category) continue

    for (const attr of entry.attributes) {
      await prisma.categoryAttribute.upsert({
        where: { category_id_key: { category_id: category.id, key: attr.key } },
        update: {
          label: attr.label,
          attribute_type: attr.attribute_type,
          is_required: attr.is_required,
          sort_order: attr.sort_order,
          unit: attr.unit ?? null,
          placeholder: attr.placeholder ?? null,
          enum_options: attr.enum_options ?? [],
        },
        create: {
          category_id: category.id,
          label: attr.label,
          key: attr.key,
          attribute_type: attr.attribute_type,
          is_required: attr.is_required,
          sort_order: attr.sort_order,
          unit: attr.unit ?? null,
          placeholder: attr.placeholder ?? null,
          enum_options: attr.enum_options ?? [],
        },
      })
      total++
    }
  }

  return { total }
}
