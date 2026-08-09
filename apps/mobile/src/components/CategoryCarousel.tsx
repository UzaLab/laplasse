import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ApiCategory } from '@laplasse/api-client'
import { useRouter } from 'expo-router'
import { HorizontalCarousel } from '@/src/components/HorizontalCarousel'
import { getCategoryCircleStyle } from '@/src/lib/categoryStyles'
import { getCategoryIcon } from '@/src/lib/categoryIcons'
import { colors, fonts } from '@/src/theme'

export function CategoryCarousel({ categories }: { categories: ApiCategory[] }) {
  const router = useRouter()

  if (categories.length === 0) return null

  return (
    <HorizontalCarousel
      data={categories}
      keyExtractor={c => c.id}
      renderItem={cat => {
        const style = getCategoryCircleStyle(cat.slug)
        const icon = getCategoryIcon(cat.slug, cat.icon)
        return (
          <Pressable
            onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: cat.slug } })}
            style={styles.item}
          >
            <View
              style={[
                styles.circle,
                { backgroundColor: style.circleBg, borderColor: style.circleBorder },
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
  label: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
})
