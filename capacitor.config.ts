import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ar.com.sakurapp.app',
  appName: 'La Mesa',
  webDir: 'www',
  android: {
    // El fondo del contenedor nativo acompaña al coral de la aplicación:
    // así no aparece un flash blanco entre el splash y la primera pantalla.
    backgroundColor: '#B92E58',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#B92E58FF',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_lamesa',
      iconColor: '#C72657',
    },
    Keyboard: {
      resize: 'body',
    },
  },
};

export default config;
