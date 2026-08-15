import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { OrderItem } from '@laplasse/api-client'
import { formatPrice } from '@laplasse/shared-config'
import { AppImage } from '@/src/components/ui/AppImage'
import {
  formatModifiersLabel,
  groupModifiersByLabel,
  parseSelectedModifiers,
} from '@/src/lib/menuModifiers'
import { colors, fonts, homeLayout } from '@/src/theme'

const PLACEHOLDER_IMAGE = 'https://cdn.laplasse.ci/static/product-placeholder.png'

function orderItemHref(
  item: OrderItem,
  ctx: { merchantSlug?: string | null; shopSlug?: string | null },
): string | null {
  const slug = ctx.merchantSlug ?? ctx.shopSlug
  if (!slug) return null
  if (item.menu_item_id) return `/m/${slug}`
  const productSlug = item.product?.slug
  if (!productSlug || productSlug.startsWith('menu-')) return null
  return `/m/${slug}/p/${productSlug}`
}

function orderItemMetaLines(item: OrderItem): Array<{ label?: string; value: string }> {
  const lines: Array<{ label?: string; value: string }> = []
  const modifiers = parseSelectedModifiers(item.modifiers)
  const modifierGroups = groupModifiersByLabel(modifiers)

  if (item.variant_name && item.menu_item_id) {
    if (modifierGroups.length === 0) lines.push({ value: item.variant_name })
  } else if (item.variant_name) {
    lines.push({ value: item.variant_name })
  }

  for (const { group, options } of modifierGroups) {
    lines.push({ label: group, value: options.join(', ') })
  }

  const modifiersFlat = formatModifiersLabel(modifiers)
  if (
    item.variant_name
    && modifiersFlat
    && item.variant_name !== modifiersFlat
    && !item.menu_item_id
    && modifierGroups.length === 0
  ) {
    lines.push({ value: item.variant_name })
  }

  return lines
}

export function OrderItemRow({
  item,
  merchantSlug,
  shopSlug,
  currency = 'XOF',
}: {
  item: OrderItem
  merchantSlug?: string | null
  shopSlug?: string | null
  currency?: string
}) {
  const router = useRouter()
  const metaLines = orderItemMetaLines(item)
  const href = orderItemHref(item, { merchantSlug, shopSlug })
  const imageSrc = item.image_url ?? item.product?.image_url ?? PLACEHOLDER_IMAGE

  const openProduct = () => {
    if (href) router.push(href as never)
  }

  return (
    <View style={styles.row}>
      <Pressable onPress={openProduct} disabled={!href}>
        <AppImage uri={imageSrc} style={styles.thumb} contentFit="cover" />
      </Pressable>
      <View style={styles.body}>
        <Pressable onPress={openProduct} disabled={!href}>
          <Text style={[styles.name, href && styles.nameLink]} numberOfLines={2}>
            {item.product_name}
          </Text>
        </Pressable>
        {metaLines.map(line => (
          <Text key={`${line.label ?? ''}-${line.value}`} style={styles.meta}>
            {line.label ? (
              <>
                <Text style={styles.metaLabel}>{line.label} : </Text>
                {line.value}
              </>
            ) : (
              line.value
            )}
          </Text>
        ))}
        <Text style={styles.qty}>
          Qté {item.quantity}
          <Text style={styles.qtySep}> · </Text>
          {formatPrice(item.unit_price, currency)}/u
        </Text>
        <Text style={styles.lineTotal}>{formatPrice(item.line_total, currency)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: homeLayout.radiusLg,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 14, color: colors.slate900, lineHeight: 20 },
  nameLink: { color: colors.slate900 },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  metaLabel: { fontFamily: fonts.semibold, color: colors.text },
  qty: { fontFamily: fonts.regular, fontSize: 12, color: colors.textLight, marginTop: 2 },
  qtySep: { color: colors.borderStrong },
  lineTotal: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.brand600, marginTop: 2 },
})
