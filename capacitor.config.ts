import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Recarga en vivo sobre el dispositivo.
 *
 * `npm run android:live` levanta el servidor de desarrollo y exporta esta
 * variable con la dirección de la máquina en la red local: la aplicación
 * instalada deja de leer la copia de `www` y carga desde la computadora, así
 * cada archivo que se guarda se ve en el celular sin recompilar ni reinstalar.
 * Sin la variable, el empaquetado es el normal, con la aplicación autónoma.
 */
const servidorEnVivo = process.env['CAP_SERVER_URL'];

const config: CapacitorConfig = {
  appId: 'ar.com.sakurapp.app',
  appName: 'SakurApp',
  webDir: 'www',
  ...(servidorEnVivo ? { server: { url: servidorEnVivo, cleartext: true } } : {}),
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
