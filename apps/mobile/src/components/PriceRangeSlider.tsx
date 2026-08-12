import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { colors, fonts } from '@/src/theme'

const THUMB_SIZE = 22

export function PriceRangeSlider({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue,
  step = 500,
}: {
  value: number
  onValueChange: (value: number) => void
  minimumValue?: number
  maximumValue: number
  step?: number
}) {
  const trackWidth = useRef(0)
  const [thumbX, setThumbX] = useState(0)

  const clampStep = useCallback(
    (raw: number) => {
      if (maximumValue <= minimumValue) return maximumValue
      const ratio = Math.max(0, Math.min(1, raw / trackWidth.current))
      const unstepped = minimumValue + ratio * (maximumValue - minimumValue)
      const stepped = Math.round(unstepped / step) * step
      return Math.min(maximumValue, Math.max(minimumValue, stepped))
    },
    [maximumValue, minimumValue, step],
  )

  const syncThumb = useCallback(
    (nextValue: number) => {
      if (trackWidth.current <= 0 || maximumValue <= minimumValue) return
      const ratio = (nextValue - minimumValue) / (maximumValue - minimumValue)
      setThumbX(Math.max(0, ratio * (trackWidth.current - THUMB_SIZE)))
    },
    [maximumValue, minimumValue],
  )

  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width
    syncThumb(value)
  }

  useEffect(() => {
    syncThumb(value)
  }, [value, syncThumb])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => {
        const next = clampStep(evt.nativeEvent.locationX - THUMB_SIZE / 2)
        onValueChange(next)
        syncThumb(next)
      },
      onPanResponderMove: evt => {
        const next = clampStep(evt.nativeEvent.locationX - THUMB_SIZE / 2)
        onValueChange(next)
        syncThumb(next)
      },
    }),
  ).current

  const fillWidth = thumbX + THUMB_SIZE / 2

  return (
    <View style={styles.wrap}>
      <Text style={styles.valueLabel}>
        {value >= maximumValue
          ? 'Tout'
          : `Jusqu'à ${value.toLocaleString('fr-FR')} F`}
      </Text>
      <View
        style={styles.trackOuter}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: fillWidth }]} />
        </View>
        <View style={[styles.thumb, { left: thumbX }]} />
      </View>
      <View style={styles.bounds}>
        <Text style={styles.boundText}>0 F</Text>
        <Text style={styles.boundText}>{maximumValue.toLocaleString('fr-FR')} F</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  valueLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  trackOuter: {
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.borderStrong,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.brand500,
    borderRadius: 999,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.brand500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    top: 0,
  },
  bounds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  boundText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted,
  },
})
