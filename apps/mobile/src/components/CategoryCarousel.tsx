import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ApiCategory } from '@laplasse/api-client'
import { useRouter } from 'expo-router'
import { HorizontalCarousel } from '@/src/components/HorizontalCarousel'
import { getCategoryCircleStyle } from '@/src/lib/categoryStyles'
import { getCategoryIcon } from '@/src/lib/categoryIcons'
import { isFoodCategorySlug } from '@/src/lib/merchantVertical'
import { colors, fonts } from '@/src/theme'

export function CategoryCarousel({
  categories,
  variant = 'default',
}: {
  categories: ApiCategory[]
  variant?: 'default' | 'home'
}) {
  const router = useRouter()

  if (categories.length === 0) return null

  return (
    <HorizontalCarousel
      data={categories}
      keyExtractor={c => c.id}
      renderItem={cat => {
        const style = variant === 'home'
          ? {
              circleBg: colors.surfaceContainer,
              circleBorder: colors.surfaceContainer,
              iconColor: colors.brand600,
              labelColor: colors.textMuted,
            }
          : getCategoryCircleStyle(cat.slug)
        const icon = getCategoryIcon(cat.slug, cat.icon)
        const onPress = () => {
          if (isFoodCategorySlug(cat.slug)) {
            router.push({ pathname: '/restauration', params: { cat: cat.slug } } as never)
            return
          }
          router.push({ pathname: '/(tabs)/search', params: { category: cat.slug } })
        }
        return (
          <Pressable
            onPress={onPress}
            style={styles.item}
          >
            <View
              style={[
                styles.circle,
                { backgroundColor: style.circleBg, borderColor: style.circleBorder },
                variant === 'home' && styles.circleHome,
              ]}
            >
              <Ionicons name={icon} size={26} color={style.iconColor} />
            </View>
            <Text style={[styles.label, { color: style.labelColor }]} numberOfLines={2}>
              {cat.name}
            </Text>
          </Pressable>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  item: {
    width: 80,
    alignItems: 'center',
    gap: 8,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleHome: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
})
