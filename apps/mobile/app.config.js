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
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#FAFAFA',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'tech.laplasse.app',
    associatedDomains: ['applinks:laplasse.tech', 'applinks:*.laplasse.tech'],
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY ?? '',
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#FAFAFA',
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
    'expo-image',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'LaPlasse utilise votre position pour afficher les établissements à proximité sur la carte.',
      },
    ],
    [
      'react-native-maps',
      {
        // Requis sur Android (moteur Google Maps, tuiles OSM via UrlTile — pas de facturation tuiles Google).
        androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#FAFAFA',
        imageWidth: 200,
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#0f182b',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'preprod',
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    googleMapsIosApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY ?? '',
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '95dff08d-bcca-43bb-9b70-0ef8db630b32',
    },
  },
})
