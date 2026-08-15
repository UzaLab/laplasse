import { useMutation } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  ProfileCard,
  ProfilePageTitle,
} from '@/src/components/profile/ProfileUi'
import { ProfileScreenScroll } from '@/src/components/profile/ProfileShell'
import { FieldInput, PrimaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { notify } from '@/src/lib/notify'
import { profileTheme } from '@/src/lib/profileTheme'
import { useAuthStore } from '@/src/stores/authStore'
import { layout } from '@/src/theme'

function StarPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (rating: number) => void
}) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map(n => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={32}
            color={n <= value ? profileTheme.navIconActive : profileTheme.border}
          />
        </Pressable>
      ))}
    </View>
  )
}

export default function WriteReviewScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    merchantId?: string
    merchantName?: string
  }>()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const merchantId = params.merchantId?.trim() ?? ''

  const submitMutation = useMutation({
    mutationFn: () =>
      getApiClient().createReview({
        merchant_id: merchantId,
        rating,
        title: title.trim() || undefined,
        content: content.trim() || undefined,
      }),
    onSuccess: () => {
      notify.success('Avis envoyé', 'Il sera visible après modération.')
      router.replace('/profile/reviews')
    },
    onError: (err: Error) => {
      notify.error('Avis', err.message || 'Envoi impossible')
    },
  })

  if (!isAuthenticated) {
    return (
      <ProfileScreenScroll bottomInset={layout.bottomNavInset + 24}>
        <ProfileCard>
          <Text style={styles.info}>Connectez-vous pour laisser un avis.</Text>
          <PrimaryButton label="Se connecter" onPress={() => router.push('/(auth)/login')} />
        </ProfileCard>
      </ProfileScreenScroll>
    )
  }

  if (!merchantId) {
    return (
      <ProfileScreenScroll bottomInset={layout.bottomNavInset + 24}>
        <ProfileCard>
          <Text style={styles.info}>
            Ouvrez cette page depuis la fiche d&apos;un établissement (bouton « Laisser un avis »).
          </Text>
          <PrimaryButton label="Retour" onPress={() => router.back()} />
        </ProfileCard>
      </ProfileScreenScroll>
    )
  }

  return (
    <ProfileScreenScroll bottomInset={layout.bottomNavInset + 24}>
      <ProfilePageTitle
        title="Laisser un avis"
        subtitle={params.merchantName ?? 'Partagez votre expérience'}
      />

      <ProfileCard>
        <Text style={styles.label}>Note</Text>
        <StarPicker value={rating} onChange={setRating} />

        <Text style={styles.label}>Titre (optionnel)</Text>
        <FieldInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ex. Excellent service"
          maxLength={100}
        />

        <Text style={styles.label}>Commentaire</Text>
        <FieldInput
          value={content}
          onChangeText={setContent}
          placeholder="Décrivez votre expérience…"
          multiline
          maxLength={1000}
          style={styles.textArea}
        />

        <PrimaryButton
          label="Publier mon avis"
          loading={submitMutation.isPending}
          onPress={() => {
            if (rating < 1) {
              notify.warning('Note requise', 'Choisissez entre 1 et 5 étoiles.')
              return
            }
            submitMutation.mutate()
          }}
        />
      </ProfileCard>
    </ProfileScreenScroll>
  )
}

const styles = StyleSheet.create({
  stars: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  label: {
    fontFamily: profileTheme.fonts.semibold,
    fontSize: 13,
    color: profileTheme.textMuted,
    marginBottom: 8,
    marginTop: 8,
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  info: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 14,
    color: profileTheme.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
})
