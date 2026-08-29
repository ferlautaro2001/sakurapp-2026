const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar .env desde la raíz del proyecto
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️ Archivo .env no encontrado. Intentando usar archivo de plantilla de entorno como contingencia.');
  const dotExamplePath = path.resolve(__dirname, '../.env.example');
  const examplePath = path.resolve(__dirname, '../env.example');
  if (fs.existsSync(dotExamplePath)) {
    dotenv.config({ path: dotExamplePath });
  } else if (fs.existsSync(examplePath)) {
    dotenv.config({ path: examplePath });
  }
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

fs.writeFileSync(path.join(envDir, 'environment.ts'), generarContenido(false), 'utf8');
fs.writeFileSync(path.join(envDir, 'environment.prod.ts'), generarContenido(true), 'utf8');

console.log('✅ Archivos de entorno src/environments/environment*.ts generados exitosamente desde .env');

