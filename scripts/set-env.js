const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar o inicializar automáticamente .env desde la plantilla si no existe o está vacío
const envPath = path.resolve(__dirname, '../.env');
const dotExamplePath = path.resolve(__dirname, '../.env.example');
const examplePath = path.resolve(__dirname, '../env.example');

const isEnvEmpty = !fs.existsSync(envPath) || fs.statSync(envPath).size === 0;

if (isEnvEmpty) {
  const source = fs.existsSync(dotExamplePath) ? dotExamplePath : (fs.existsSync(examplePath) ? examplePath : null);
  if (source) {
    fs.copyFileSync(source, envPath);
    console.log('📋 Archivo .env inicializado automáticamente desde la plantilla del proyecto.');
  }
}

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else if (fs.existsSync(dotExamplePath)) {
  dotenv.config({ path: dotExamplePath });
} else if (fs.existsSync(examplePath)) {
  dotenv.config({ path: examplePath });
}

const envDir = path.resolve(__dirname, '../src/environments');
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

function generarContenido(isProduction) {
  return `// Archivo generado automáticamente por scripts/set-env.js - NO EDITAR DIRECTAMENTE
export const environment = {
  production: ${isProduction},
  firebase: {
    projectId: "${process.env.FIREBASE_PROJECT_ID || ''}",
    appId: "${process.env.FIREBASE_APP_ID || ''}",
    storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET || ''}",
    apiKey: "${process.env.FIREBASE_API_KEY || ''}",
    authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || ''}",
    messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID || ''}",
  },
  dataConnect: {
    service: "${process.env.DATA_CONNECT_SERVICE || 'sakurapp'}",
    location: "${process.env.DATA_CONNECT_LOCATION || 'us-east4'}",
    connector: "${process.env.DATA_CONNECT_CONNECTOR || 'example'}",
  },
  defaultPassword: "${process.env.DEFAULT_USER_PASSWORD || 'Sakura.2026'}",
};
`;
}

// En entorno educativo siempre se opera en modo producción con la base de datos real en un único archivo
fs.writeFileSync(path.join(envDir, 'environment.ts'), generarContenido(true), 'utf8');

console.log('✅ Archivo de entorno src/environments/environment.ts generado exitosamente desde .env (producción)');

