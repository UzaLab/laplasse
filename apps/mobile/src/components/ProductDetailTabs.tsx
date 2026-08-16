import { useState } from 'react'
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native'
import type { MarketplaceProduct, ProductAttributeValue, ProductSpecification } from '@laplasse/api-client'
import { ProductHtmlContent } from '@/src/components/ProductHtmlContent'
import { ProductReviewsSection } from '@/src/components/ProductReviewsSection'
import { hasHtmlContent } from '@/src/lib/htmlUtils'
import { colors, fonts, homeLayout } from '@/src/theme'

type TabId = 'description' | 'composition' | 'specifications' | 'reviews'

function conditionLabel(value: string) {
  switch (value) {
    case 'NEW':
      return 'Neuf'
    case 'USED_GOOD':
      return 'Occasion — bon état'
    case 'USED_FAIR':
      return 'Occasion — acceptable'
    case 'REFURBISHED':
      return 'Reconditionné'
    default:
      return value
  }
}

function originLabel(value: string) {
  switch (value) {
    case 'LOCAL_CI':
      return "Fabriqué en Côte d'Ivoire"
    case 'IMPORTED':
      return 'Importé'
    case 'HANDMADE':
      return 'Fait main / artisanat'
    default:
      return value
  }
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  )
}

function AttributeRows({ values }: { values: ProductAttributeValue[] }) {
  return (
    <>
      {values.map(av => (
        <SpecRow
          key={av.attribute_id}
          label={av.attribute?.label ?? av.attribute_id}
          value={
            av.value === 'true'
              ? 'Oui'
              : av.value === 'false'
                ? 'Non'
                : av.attribute?.unit
                  ? `${av.value} ${av.attribute.unit}`
                  : av.value
          }
        />
      ))}
    </>
  )
}

function SpecificationList({ specs }: { specs: ProductSpecification[] }) {
  return (
    <View style={styles.specCard}>
      {specs.map((spec, index) => (
        <SpecRow key={`${spec.label}-${index}`} label={spec.label} value={spec.value} />
      ))}
    </View>
  )
}

export function ProductDetailTabs({
  product,
  shopSlug,
  merchantName,
  reviewCount,
}: {
  product: MarketplaceProduct
  shopSlug: string
  merchantName: string
  reviewCount?: number
}) {
  const specs = (product.specifications ?? []).filter(s => s.label?.trim() && s.value?.trim())
  const hasSpecifications = specs.length > 0
  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'description', label: 'Description détaillée' },
    { id: 'composition', label: 'Composition & Origine' },
  ]
  if (hasSpecifications) tabs.push({ id: 'specifications', label: 'Caractéristiques' })
  tabs.push({
    id: 'reviews',
    label: reviewCount && reviewCount > 0 ? `Avis clients (${reviewCount})` : 'Avis clients',
  })

  const [activeTab, setActiveTab] = useState<TabId>('description')

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabHeader}
      >
        {tabs.map(tab => {
          const active = activeTab === tab.id
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <View style={styles.panel}>
        {activeTab === 'description' ? (
          <ProductHtmlContent
            html={product.description}
            emptyMessage="Aucune description détaillée disponible pour ce produit."
          />
        ) : null}

        {activeTab === 'composition' ? (
          <View style={styles.composition}>
            {(product.condition ||
              product.origin ||
              product.preparation_delay_days != null ||
              product.weight_grams ||
              product.dimensions) && (
              <View style={styles.specCard}>
                {product.condition ? (
                  <SpecRow label="État" value={conditionLabel(product.condition)} />
                ) : null}
                {product.origin ? (
                  <SpecRow label="Origine" value={originLabel(product.origin)} />
                ) : null}
                {product.weight_grams ? (
                  <SpecRow label="Poids" value={`${product.weight_grams} g`} />
                ) : null}
                {product.dimensions ? (
                  <SpecRow label="Dimensions" value={product.dimensions} />
                ) : null}
                {product.preparation_delay_days != null ? (
                  <SpecRow
                    label="Délai de préparation"
                    value={`${product.preparation_delay_days} jour${product.preparation_delay_days > 1 ? 's' : ''} ouvré${product.preparation_delay_days > 1 ? 's' : ''}`}
                  />
                ) : null}
              </View>
            )}

            {(product.attribute_values?.length ?? 0) > 0 ? (
              <View style={styles.specCard}>
                <AttributeRows values={product.attribute_values!} />
              </View>
            ) : null}

            {hasHtmlContent(product.composition) ? (
              <ProductHtmlContent html={product.composition} />
            ) : (
              <Text style={styles.fallbackText}>
                Produit proposé par {merchantName}
                {product.category?.name ? ` — catégorie ${product.category.name}.` : '.'}
              </Text>
            )}

            {product.category?.legal_notice ? (
              <Text style={styles.legalNotice}>{product.category.legal_notice}</Text>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'specifications' ? <SpecificationList specs={specs} /> : null}

        {activeTab === 'reviews' ? (
          <ProductReviewsSection productSlug={product.slug} shopSlug={shopSlug} />
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabHeader: {
    paddingHorizontal: 24,
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    marginBottom: 16,
  },
  tabBtn: {
    paddingBottom: 12,
    marginBottom: -1,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.brand500,
  },
  tabText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textMuted,
  },
  tabTextActive: {
    fontFamily: fonts.bold,
    color: colors.brand600,
  },
  panel: { paddingHorizontal: 24 },
  composition: { gap: 16 },
  specCard: {
    borderRadius: homeLayout.radiusLg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  specLabel: {
    flex: 0.4,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textMuted,
  },
  specValue: {
    flex: 0.6,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  fallbackText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
  },
  legalNotice: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
  },
})
