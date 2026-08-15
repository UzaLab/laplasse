import { createElement } from 'react'
import { StyleSheet, Text } from 'react-native'
import { hasHtmlContent } from '@/src/lib/htmlUtils'
import { colors, fonts } from '@/src/theme'

interface ProductHtmlContentProps {
  html?: string | null
  emptyMessage?: string
}

export function ProductHtmlContent({ html, emptyMessage }: ProductHtmlContentProps) {
  const trimmed = html?.trim()

  if (!trimmed || trimmed === '<p></p>' || !hasHtmlContent(trimmed)) {
    if (emptyMessage) {
      return <Text style={styles.empty}>{emptyMessage}</Text>
    }
    return null
  }

  return createElement('div', {
    dangerouslySetInnerHTML: { __html: trimmed },
    style: webStyles as Record<string, string | number>,
  })
}

const styles = StyleSheet.create({
  empty: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textLight,
  },
})

const webStyles = {
  color: colors.textMuted,
  fontFamily: fonts.regular,
  fontSize: 16,
  lineHeight: '26px',
  wordBreak: 'break-word',
}
