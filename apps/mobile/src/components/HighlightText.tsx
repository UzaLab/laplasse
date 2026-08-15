import { Text, type TextProps } from 'react-native'
import { colors, fonts } from '@/src/theme'

/** Affiche le surlignage Meilisearch (`<mark>`) renvoyé par l'API. */
export function HighlightText({
  html,
  fallback,
  style,
  highlightStyle,
}: {
  html: string | null | undefined
  fallback: string
  style?: TextProps['style']
  highlightStyle?: TextProps['style']
}) {
  const source = html?.trim() || fallback
  const parts = source.split(/(<mark>|<\/mark>)/g).filter(Boolean)
  let inMark = false

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part === '<mark>') {
          inMark = true
          return null
        }
        if (part === '</mark>') {
          inMark = false
          return null
        }
        return (
          <Text
            key={`${index}-${part.slice(0, 8)}`}
            style={inMark ? [style, styles.mark, highlightStyle] : style}
          >
            {part}
          </Text>
        )
      })}
    </Text>
  )
}

const styles = {
  mark: {
    fontFamily: fonts.bold,
    color: colors.brand700,
    backgroundColor: colors.brand50,
  },
}
