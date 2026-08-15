import RenderHtml from 'react-native-render-html'
import { StyleSheet, Text, useWindowDimensions } from 'react-native'
import { hasHtmlContent } from '@/src/lib/htmlUtils'
import { colors, fonts, spacing } from '@/src/theme'

interface ProductHtmlContentProps {
  html?: string | null
  emptyMessage?: string
}

export function ProductHtmlContent({ html, emptyMessage }: ProductHtmlContentProps) {
  const { width } = useWindowDimensions()
  const trimmed = html?.trim()

  if (!trimmed || trimmed === '<p></p>' || !hasHtmlContent(trimmed)) {
    if (emptyMessage) {
      return <Text style={styles.empty}>{emptyMessage}</Text>
    }
    return null
  }

  return (
    <RenderHtml
      contentWidth={width - spacing.gutter * 2}
      source={{ html: trimmed }}
      tagsStyles={tags}
      defaultTextProps={{ selectable: true }}
    />
  )
}

const styles = StyleSheet.create({
  empty: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textLight,
  },
})

const tags = {
  body: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 26,
  },
  p: {
    marginTop: 0,
    marginBottom: 12,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 26,
  },
  strong: {
    fontFamily: fonts.bold,
    color: colors.text,
  },
  b: {
    fontFamily: fonts.bold,
    color: colors.text,
  },
  h1: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    marginBottom: 12,
  },
  h2: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    marginBottom: 10,
  },
  h3: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    marginBottom: 8,
  },
  ul: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  ol: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  li: {
    marginBottom: 6,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  a: {
    color: colors.brand600,
    fontFamily: fonts.semibold,
  },
}
