import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'
import { colors } from '@/src/theme'

export function ProductFavoriteButton({
  productId,
  size = 22,
}: {
  productId: string
  size?: number
}) {
  const router = useRouter()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const queryClient = useQueryClient()

  const checkQuery = useQuery({
    queryKey: ['favorite-product', productId],
    queryFn: () => getApiClient().isProductFavorited(productId),
    enabled: isAuthenticated && !!productId,
  })

  const toggle = useMutation({
    mutationFn: () => getApiClient().toggleProductFavorite(productId),
    onSuccess: data => {
      queryClient.setQueryData(['favorite-product', productId], {
        is_favorited: data.is_favorited,
      })
      void queryClient.invalidateQueries({ queryKey: ['product-favorites'] })
    },
  })

  const favorited = checkQuery.data?.is_favorited ?? false

  return (
    <Pressable
      onPress={() => {
        if (!isAuthenticated) {
          router.push('/(auth)/login')
          return
        }
        toggle.mutate()
      }}
      hitSlop={10}
      style={styles.btn}
    >
      <Ionicons
        name={favorited ? 'heart' : 'heart-outline'}
        size={size}
        color={favorited ? '#ef4444' : colors.slate900}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: { padding: 4 },
})
