/**
 * Recarga en vivo en el celular (Capacitor + Android Studio).
 *
 * Se ejecuta una sola vez: deja corriendo el servidor de desarrollo, apunta la
 * aplicación instalada a la dirección de esta computadora en la red local y
 * abre Android Studio. Desde ahí se presiona Run una vez y el celular queda
 * mostrando los cambios apenas se guarda un archivo, sin recompilar ni volver
 * a instalar nada.
 *
 *   npm run android:live
 *
 * Para volver al empaquetado normal (aplicación autónoma, sin depender de la
 * computadora): npm run sync
 */
const os = require('os');
const { spawn, spawnSync } = require('child_process');
const net = require('net');

const PUERTO = Number(process.env.PORT ?? 4200);
const esWindows = process.platform === 'win32';

/** Interfaces que el celular no puede alcanzar aunque figuren como reales. */
const VIRTUALES = /(vEthernet|Hyper-V|VirtualBox|VMware|Docker|WSL|Loopback|Tailscale|ZeroTier|Hamachi|TAP|VPN)/i;

/**
 * Direcciones de esta máquina en la red local, la mejor primero.
 *
 * La computadora suele tener varias: la del WiFi, la de VirtualBox, la de una
 * VPN. Sólo una la ve el celular, así que se ordenan y se muestra la elegida
 * junto con las demás, por si hay que forzar otra con CAP_HOST.
 */
function direccionesLocales() {
  const candidatas = [];

  for (const [nombre, interfaces] of Object.entries(os.networkInterfaces())) {
    for (const red of interfaces ?? []) {
      if (red.family !== 'IPv4' || red.internal) continue;

      // 169.254.x.x es una dirección de emergencia, sin red detrás.
      if (red.address.startsWith('169.254.')) continue;
      // 192.168.56.x es la red privada que arma VirtualBox con el anfitrión.
      if (red.address.startsWith('192.168.56.')) continue;
      if (VIRTUALES.test(nombre)) continue;

      // El WiFi primero: es la red donde va a estar el celular.
      const esWifi = /(wi-?fi|wlan|wireless|inal[áa]mbrica)/i.test(nombre);
      const esPrivada = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(red.address);
      const puntaje = (esWifi ? 2 : 0) + (esPrivada ? 1 : 0);

      candidatas.push({ nombre, direccion: red.address, puntaje });
    }
  }

  return candidatas.sort((a, b) => b.puntaje - a.puntaje);
}

/** Espera a que el servidor de desarrollo acepte conexiones antes de seguir. */
function esperarPuerto(puerto, intentos = 90) {
  return new Promise((resolver, rechazar) => {
    const probar = (restantes) => {
      const socket = net.connect({ port: puerto, host: '127.0.0.1' });
      socket.once('connect', () => {
        socket.destroy();
        resolver();
      });
      socket.once('error', () => {
        socket.destroy();
        if (restantes <= 0) return rechazar(new Error('El servidor de desarrollo no respondió a tiempo.'));
        setTimeout(() => probar(restantes - 1), 1000);
      });
    };
    probar(intentos);
  });
}

function correr(comando, argumentos, opciones = {}) {
  const res = spawnSync(comando, argumentos, { stdio: 'inherit', shell: esWindows, ...opciones });
  if (res.status !== 0) {
    throw new Error(`Falló: ${comando} ${argumentos.join(' ')}`);
  }
}

async function main() {
  const candidatas = direccionesLocales();
  const ip = process.env.CAP_HOST ?? candidatas[0]?.direccion;
  if (!ip) {
    console.error('✖ No encontramos la dirección de esta computadora en la red local.');
    console.error('  Conectate a una red WiFi y volvé a intentar, o forzala: CAP_HOST=192.168.0.10 npm run android:live');
    process.exit(1);
  }

  const url = `http://${ip}:${PUERTO}`;
  const elegida = candidatas.find((c) => c.direccion === ip);
  console.log(`\n🌸 SakurApp · recarga en vivo\n   Servidor: ${url}${elegida ? `  (${elegida.nombre})` : ''}`);
  console.log('   El celular y esta computadora tienen que estar en la MISMA red WiFi.');

  const otras = candidatas.filter((c) => c.direccion !== ip);
  if (otras.length) {
    console.log(`   Si no carga, probá con otra: ${otras.map((c) => `${c.direccion} (${c.nombre})`).join(', ')}`);
    console.log(`   → CAP_HOST=${otras[0].direccion} npm run android:live`);
  }
  console.log('');

  // 1. El servidor de desarrollo, que queda corriendo hasta que se corte con Ctrl+C.
  const servidor = spawn('npx', ['ng', 'serve', '--host', '0.0.0.0', '--port', String(PUERTO)], {
    stdio: 'inherit',
    shell: esWindows,
  });
  servidor.on('exit', (codigo) => process.exit(codigo ?? 0));

  const cortar = () => {
    servidor.kill();
    process.exit(0);
  };
  process.on('SIGINT', cortar);
  process.on('SIGTERM', cortar);

  // 2. Cuando el servidor está arriba, se le avisa a la aplicación dónde buscar.
  await esperarPuerto(PUERTO);
  console.log('\n📱 Preparando el proyecto de Android para que apunte al servidor…\n');
  correr('npx', ['cap', 'sync', 'android'], { env: { ...process.env, CAP_SERVER_URL: url } });

  // 3. Android Studio: se presiona Run una sola vez.
  correr('npx', ['cap', 'open', 'android'], { env: { ...process.env, CAP_SERVER_URL: url } });

  console.log('\n✅ Listo. En Android Studio presioná Run (▶) una vez, con el celular enchufado.');
  console.log('   A partir de ahí, cada archivo que guardes se ve en el celular al instante.');
  console.log('   Para cortar, Ctrl+C acá. Después, `npm run sync` devuelve la aplicación a modo normal.\n');
}

main().catch((error) => {
  console.error(`✖ ${error.message}`);
  process.exit(1);
});
