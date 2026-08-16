/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  name: 'LaPlasse Livraison',
  slug: 'laplasse-livraison',
  owner: 'uza.lab',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'laplasse-livraison',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#FAFAFA',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'tech.laplasse.livraison',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#FAFAFA',
      foregroundImage: './assets/images/icon.png',
    },
    package: 'tech.laplasse.livraison',
    predictiveBackGestureEnabled: false,
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
          'LaPlasse Livraison utilise votre position pour assigner des courses et guider vos livraisons.',
        locationAlwaysAndWhenInUsePermission:
          'LaPlasse Livraison envoie votre position en arrière-plan pendant que vous êtes en ligne.',
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
        androidForegroundServiceIcon: './assets/images/icon.png',
        isIosBackgroundLocationEnabled: true,
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
        color: '#059669',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Autorisez l\'accès aux photos pour joindre une preuve de livraison.',
        cameraPermission: 'Autorisez l\'accès à la caméra pour photographier la livraison.',
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
    eas: {
      projectId: process.env.EAS_COURIER_PROJECT_ID ?? '2202715b-f3ed-4547-9043-7a9dbe53ea0a',
    },
  },
})
