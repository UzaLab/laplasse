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
      backgroundColor: '#fffbeb',
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
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#FAFAFA',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#f59e0b',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'preprod',
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '95dff08d-bcca-43bb-9b70-0ef8db630b32',
    },
  },
})
