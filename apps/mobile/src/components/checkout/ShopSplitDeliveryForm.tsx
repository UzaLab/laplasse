import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { formatPrice } from '@laplasse/shared-config'
import type { Cart, DeliveryQuoteItem, GeoCity, GeoCommune } from '@laplasse/api-client'
import { OptionPicker } from '@/src/components/checkout/OptionPicker'
import { FieldInput } from '@/src/components/ui'
import { colors, fonts } from '@/src/theme'

export type ShopDeliveryState = {
  deliveryType: 'PICKUP' | 'DELIVERY'
  deliveryCityId: string
  deliveryCommuneId: string
  deliveryDistrict: string
  deliveryAddressDetail: string
}

export function ShopSplitDeliveryForm({
  cart,
  cities,
  communesByShop,
  shopDeliveries,
  deliveryQuotes,
  quoteLoading,
  onChange,
  onCityChange,
}: {
  cart: Cart
  cities: GeoCity[]
  communesByShop: Record<string, GeoCommune[]>
  shopDeliveries: Record<string, ShopDeliveryState>
  deliveryQuotes: DeliveryQuoteItem[]
  quoteLoading: boolean
  onChange: (shopId: string, patch: Partial<ShopDeliveryState>) => void
  onCityChange: (shopId: string, cityId: string) => void
}) {
  const merchants = cart.merchants ?? []

  return (
    <View style={styles.wrap}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Livraison par boutique</Text>
        <Text style={styles.bannerText}>
          Choisissez retrait ou livraison pour chaque vendeur — adresses différentes possibles.
        </Text>
      </View>

      {merchants.map(merchant => {
        const cfg = shopDeliveries[merchant.id] ?? {
          deliveryType: 'PICKUP' as const,
          deliveryCityId: '',
          deliveryCommuneId: '',
          deliveryDistrict: '',
          deliveryAddressDetail: '',
        }
        const communes = communesByShop[merchant.id] ?? []
        const quote = deliveryQuotes.find(q => q.shop_id === merchant.id)

        return (
          <View key={merchant.id} style={styles.shopCard}>
            <View>
              <Text style={styles.shopName}>{merchant.business_name}</Text>
              <Text style={styles.shopMeta}>
                {merchant.item_count} article{merchant.item_count > 1 ? 's' : ''} · {formatPrice(merchant.subtotal, cart.currency)}
              </Text>
            </View>

            <View style={styles.modeRow}>
              {(['PICKUP', 'DELIVERY'] as const).map(mode => (
                <Pressable
                  key={mode}
                  onPress={() => onChange(merchant.id, { deliveryType: mode })}
                  style={[styles.modeBtn, cfg.deliveryType === mode && styles.modeBtnActive]}
                >
                  <Text style={[styles.modeText, cfg.deliveryType === mode && styles.modeTextActive]}>
                    {mode === 'PICKUP' ? 'Retrait sur place' : 'Livraison'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {cfg.deliveryType === 'DELIVERY' ? (
              <View style={styles.addressBlock}>
                <OptionPicker
                  label="Ville"
                  placeholder="Choisir une ville"
                  value={cfg.deliveryCityId}
                  options={cities}
                  onChange={id => onCityChange(merchant.id, id)}
                />
                <OptionPicker
                  label="Commune"
                  placeholder="Choisir une commune"
                  value={cfg.deliveryCommuneId}
                  options={communes}
                  onChange={id => onChange(merchant.id, { deliveryCommuneId: id })}
                />
                <FieldInput
                  placeholder="Quartier *"
                  value={cfg.deliveryDistrict}
                  onChangeText={text => onChange(merchant.id, { deliveryDistrict: text })}
                />
                <FieldInput
                  placeholder="Complément (optionnel)"
                  value={cfg.deliveryAddressDetail}
                  onChangeText={text => onChange(merchant.id, { deliveryAddressDetail: text })}
                />

                {quoteLoading && cfg.deliveryCityId && cfg.deliveryCommuneId ? (
                  <ActivityIndicator color={colors.brand500} />
                ) : quote ? (
                  <View style={styles.quoteBox}>
                    {quote.available ? (
                      <Text style={styles.quoteFee}>
                        {formatPrice(quote.fee, cart.currency)}
                        {quote.zone_name ? ` · ${quote.zone_name}` : ''}
                      </Text>
                    ) : (
                      <Text style={styles.quoteError}>{quote.message ?? 'Livraison indisponible'}</Text>
                    )}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  banner: {
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand100,
    borderRadius: 16,
    padding: 14,
  },
  bannerTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand800 },
  bannerText: { fontFamily: fonts.regular, fontSize: 12, color: colors.brand700, marginTop: 4, lineHeight: 18 },
  shopCard: {
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  shopName: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  shopMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  modeBtnActive: { backgroundColor: colors.slate900, borderColor: colors.slate900 },
  modeText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  modeTextActive: { color: '#fff' },
  addressBlock: { gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  quoteBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
  },
  quoteFee: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  quoteError: { fontFamily: fonts.medium, fontSize: 12, color: '#dc2626' },
})
