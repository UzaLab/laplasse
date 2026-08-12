import { useCallback, useRef, useState } from 'react'
import {
  Animated,
  Platform,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'

const USE_NATIVE_DRIVER = Platform.OS !== 'web'

/** Masque la barre au scroll vers le bas ; réaffiche en haut, en bas de page ou au scroll vers le haut. */
export function useScrollRevealBar() {
  const scrollY = useRef(0)
  const barVisible = useRef(true)
  const opacity = useRef(new Animated.Value(1)).current
  const [interactive, setInteractive] = useState(true)

  const show = useCallback(() => {
    if (barVisible.current) return
    barVisible.current = true
    setInteractive(true)
    Animated.spring(opacity, {
      toValue: 1,
      useNativeDriver: USE_NATIVE_DRIVER,
      tension: 120,
      friction: 8,
    }).start()
  }, [opacity])

  const hide = useCallback(() => {
    if (!barVisible.current) return
    barVisible.current = false
    setInteractive(false)
    Animated.spring(opacity, {
      toValue: 0,
      useNativeDriver: USE_NATIVE_DRIVER,
      tension: 120,
      friction: 8,
    }).start()
  }, [opacity])

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent
      const newY = contentOffset.y
      const delta = newY - scrollY.current
      const atBottom =
        contentSize.height > 0
        && newY + layoutMeasurement.height >= contentSize.height - 48

      if (newY < 80 || atBottom) {
        show()
      } else if (delta > 10) {
        hide()
      } else if (delta < -10) {
        show()
      }
      scrollY.current = newY
    },
    [show, hide],
  )

  const animatedStyle = {
    opacity,
    transform: [
      {
        translateY: opacity.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
    ],
  }

  return { onScroll, animatedStyle, interactive }
}
