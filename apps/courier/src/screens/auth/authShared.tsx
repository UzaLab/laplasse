import type { ComponentProps } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { colors, fonts, radii } from '@/src/theme'

export const AUTH_HORIZONTAL_PADDING = 24
export const AUTH_DARK = '#131b2e'
export const AUTH_SUBTITLE = 'Livraison et logistique LaPlasse'

export function AuthField({
  label,
  ...props
}: ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={authStyles.fieldWrap}>
      <Text style={authStyles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textLight}
        {...props}
        style={[authStyles.fieldInput, props.style]}
      />
    </View>
  )
}

export const authStyles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 28 },
  logo: { height: 36, width: 150, marginBottom: 24 },
  screenTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    width: 32,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AUTH_DARK,
    paddingVertical: 16,
    borderRadius: radii.button,
    marginTop: 16,
    alignSelf: 'stretch',
    shadowColor: AUTH_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  submitBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: '#fff',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  switchHint: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
  switchLink: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
    textDecorationLine: 'underline',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.borderStrong },
  dividerText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  altBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  altBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text,
    letterSpacing: 0.3,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.6 },
})
