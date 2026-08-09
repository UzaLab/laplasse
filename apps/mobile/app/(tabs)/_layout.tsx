import type { ComponentProps } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import type { ColorValue } from 'react-native'
import { colors, fonts } from '@/src/theme'

type TabIconName = ComponentProps<typeof Ionicons>['name']

function TabIcon({ name, color }: { name: TabIconName; color: ColorValue }) {
  return <Ionicons name={name} size={22} color={color} />
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand600,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderStrong,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Découvrir',
          tabBarIcon: ({ color }) => <TabIcon name="compass-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ color }) => <TabIcon name="storefront-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Recherche',
          tabBarIcon: ({ color }) => <TabIcon name="search" color={color} />,
          headerShown: true,
          headerTitle: 'Recherche',
          headerTitleStyle: { fontFamily: fonts.bold },
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          tabBarIcon: ({ color }) => <TabIcon name="bag-handle-outline" color={color} />,
          headerShown: true,
          headerTitle: 'Mes commandes',
          headerTitleStyle: { fontFamily: fonts.bold },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <TabIcon name="person-outline" color={color} />,
          headerShown: true,
          headerTitle: 'Mon profil',
          headerTitleStyle: { fontFamily: fonts.bold },
        }}
      />
    </Tabs>
  )
}
