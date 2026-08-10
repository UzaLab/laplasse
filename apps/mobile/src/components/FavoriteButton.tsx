import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'
import { colors } from '@/src/theme'

export function FavoriteButton({
  merchantId,
  size = 22,
  color,
  favoritedColor = '#ef4444',
}: {
  merchantId: string
  size?: number
  color?: string
  favoritedColor?: string
}) {
  const router = useRouter()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const queryClient = useQueryClient()

  const checkQuery = useQuery({
    queryKey: ['favorite-merchant', merchantId],
    queryFn: () => getApiClient().isMerchantFavorited(merchantId),
    enabled: isAuthenticated && !!merchantId,
  })

  const toggle = useMutation({
    mutationFn: () => getApiClient().toggleMerchantFavorite(merchantId),
    onSuccess: data => {
      queryClient.setQueryData(['favorite-merchant', merchantId], {
        is_favorited: data.is_favorited,
      })
      void queryClient.invalidateQueries({ queryKey: ['favorites'] })
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
      accessibilityLabel={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Ionicons
        name={favorited ? 'heart' : 'heart-outline'}
        size={size}
        color={favorited ? favoritedColor : (color ?? colors.slate900)}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: { padding: 4 },
})
