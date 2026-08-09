/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  name: 'LaPlasse',
  slug: 'laplasse',
  owner: 'uza.lab',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'laplasse',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'tech.laplasse.app',
    associatedDomains: ['applinks:laplasse.tech', 'applinks:*.laplasse.tech'],
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    package: 'tech.laplasse.app',
    predictiveBackGestureEnabled: false,
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          { scheme: 'https', host: 'laplasse.tech', pathPrefix: '/m' },
          { scheme: 'https', host: 'www.laplasse.tech', pathPrefix: '/m' },
          { scheme: 'https', host: 'ci.laplasse.tech', pathPrefix: '/m' },
          { scheme: 'https', host: 'bf.laplasse.tech', pathPrefix: '/m' },
          { scheme: 'https', host: 'sn.laplasse.tech', pathPrefix: '/m' },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#0f766e',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api',
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '95dff08d-bcca-43bb-9b70-0ef8db630b32',
    },
  },
})
