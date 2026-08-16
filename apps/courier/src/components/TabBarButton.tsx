import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'

type TabBarButtonProps = PressableProps & {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}

/** Tab press without Android ripple / dark circle — icon-only feedback. */
export function TabBarButton({ children, style, ...rest }: TabBarButtonProps) {
  return (
    <Pressable {...rest} style={style} android_ripple={{ color: 'transparent' }}>
      {children}
    </Pressable>
  )
}
