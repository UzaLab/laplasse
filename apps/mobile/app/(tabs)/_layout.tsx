import { Tabs } from 'expo-router'
import { MobileBottomNav } from '@/src/components/MobileBottomNav'
import { colors, fonts } from '@/src/theme'

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <MobileBottomNav state={props.state} navigation={props.navigation} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Découvrir' }} />
      <Tabs.Screen name="marketplace" options={{ title: 'Marketplace' }} />
      <Tabs.Screen name="search" options={{ title: 'Recherche' }} />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          href: null,
          headerShown: true,
          headerTitle: 'Mes commandes',
          headerTitleStyle: { fontFamily: fonts.bold },
          headerStyle: { backgroundColor: colors.background },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  )
}
