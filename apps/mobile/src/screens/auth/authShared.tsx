import * as WebBrowser from 'expo-web-browser'
import { type ComponentProps } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { colors, fonts, radii, spacing } from '@/src/theme'

export const AUTH_HORIZONTAL_PADDING = spacing.gutter

export const AUTH_DARK = '#131b2e'
export const AUTH_AMBER = '#fea619'
export const AUTH_SUBTITLE = 'Les meilleures adresses près de chez vous'

export const PHONE_PLACEHOLDERS: Record<string, string> = {
  CI: '07 XX XX XX XX',
  BF: '70 XX XX XX',
  SN: '77 XXX XX XX',
}

const SUBDOMAIN_BY_COUNTRY: Record<string, string> = {
  CI: 'ci',
  BF: 'bf',
  SN: 'sn',
}

function getWebOrigin(countryCode: string): string {
  const subdomain = SUBDOMAIN_BY_COUNTRY[countryCode.toUpperCase()] ?? 'ci'
  return `https://${subdomain}.laplasse.tech`
}

export async function openWebPath(path: string, countryCode: string) {
  const url = `${getWebOrigin(countryCode)}${path}`
  await WebBrowser.openBrowserAsync(url)
}

export function AuthField({
  label,
  ...props
}: ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={authStyles.fieldWrap}>
      <Text style={authStyles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.outlineVariant}
        {...props}
        style={[authStyles.fieldInput, props.style]}
      />
    </View>
  )
}

export const authStyles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 32 },
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
  forgotLink: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: AUTH_AMBER,
  },
  fieldInput: {
    backgroundColor: colors.surfaceBright,
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
  otpInput: {
    textAlign: 'center',
    fontFamily: fonts.extrabold,
    fontSize: 22,
    letterSpacing: 8,
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
    color: colors.outlineVariant,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  merchantBtn: {
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
    backgroundColor: colors.surfaceContainerLow,
  },
  merchantBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text,
    letterSpacing: 0.3,
  },
  legal: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 32,
    paddingHorizontal: 8,
  },
  legalLink: {
    textDecorationLine: 'underline',
    color: colors.textMuted,
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
  devBox: {
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand200,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  devText: { fontFamily: fonts.regular, fontSize: 13, color: colors.brand800 },
  devCode: { fontFamily: fonts.bold },
  methodToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    padding: 4,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.button,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radii.button,
  },
  methodBtnActive: {
    backgroundColor: colors.surfaceBright,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  methodText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textMuted,
  },
  methodTextActive: { color: colors.text },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.6 },
})
