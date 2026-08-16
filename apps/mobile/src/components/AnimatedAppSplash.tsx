import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { BrandLogo } from '@/src/components/BrandLogo'
import { colors, fonts } from '@/src/theme'

const MIN_VISIBLE_MS = 2400
const EXIT_MS = 400

export function AnimatedAppSplash({ onFinish }: { onFinish: () => void }) {
  const screenOpacity = useSharedValue(1)
  const logoOpacity = useSharedValue(0)
  const logoScale = useSharedValue(0.94)
  const ringOpacity = useSharedValue(0)
  const sloganOpacity = useSharedValue(0)
  const ringRotation = useSharedValue(0)

  useEffect(() => {
    logoOpacity.value = withDelay(80, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }))
    logoScale.value = withDelay(80, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }))
    ringOpacity.value = withDelay(320, withTiming(1, { duration: 400 }))
    sloganOpacity.value = withDelay(520, withTiming(1, { duration: 500 }))

    ringRotation.value = withRepeat(
      withTiming(360, { duration: 800, easing: Easing.linear }),
      -1,
      false,
    )

    const timer = setTimeout(() => {
      screenOpacity.value = withTiming(
        0,
        { duration: EXIT_MS, easing: Easing.in(Easing.cubic) },
        finished => {
          if (finished) runOnJS(onFinish)()
        },
      )
    }, MIN_VISIBLE_MS)

    return () => clearTimeout(timer)
  }, [logoOpacity, logoScale, onFinish, ringOpacity, ringRotation, screenOpacity, sloganOpacity])

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }))

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }))

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }))

  const sloganStyle = useAnimatedStyle(() => ({
    opacity: sloganOpacity.value,
  }))

  return (
    <Animated.View style={[styles.root, screenStyle]} pointerEvents="none">
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />

      <View style={styles.topSpacer} />

      <View style={styles.centerBlock}>
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <BrandLogo variant="full" style={styles.logoFull} />
        </Animated.View>

        <Animated.View style={[styles.loadingRing, ringStyle]} />
      </View>

      <Animated.View style={[styles.footer, sloganStyle]}>
        <Text style={styles.slogan}>
          Découvrez le meilleur du <Text style={styles.sloganBold}>commerce local</Text>
        </Text>
        <View style={styles.footerBar} />
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  orbTop: {
    position: 'absolute',
    top: -128,
    right: -128,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  orbBottom: {
    position: 'absolute',
    bottom: -128,
    left: -128,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  topSpacer: {
    height: 56,
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
    paddingHorizontal: 32,
  },
  logoWrap: {
    alignItems: 'center',
  },
  logoFull: {
    height: 44,
    width: 188,
  },
  loadingRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.12)',
    borderTopColor: colors.brand500,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 48,
    paddingHorizontal: 24,
    gap: 40,
  },
  slogan: {
    fontFamily: fonts.regular,
    fontSize: 18,
    lineHeight: 26,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  sloganBold: {
    fontFamily: fonts.bold,
  },
  footerBar: {
    width: 128,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
  },
})
