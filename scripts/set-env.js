const fs = require('fs');
const path = require('path');

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

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

try {
  const dotenv = require('dotenv');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else if (fs.existsSync(dotExamplePath)) {
    dotenv.config({ path: dotExamplePath });
  } else if (fs.existsSync(examplePath)) {
    dotenv.config({ path: examplePath });
  }
} catch {
  if (fs.existsSync(envPath)) parseEnvFile(envPath);
  else if (fs.existsSync(dotExamplePath)) parseEnvFile(dotExamplePath);
  else if (fs.existsSync(examplePath)) parseEnvFile(examplePath);
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
  restaurante: {
    nombre: "SakurApp",
    salon: "Sakura",
    direccion: "Arribeños 2288, Belgrano, Ciudad Autónoma de Buenos Aires",
    direccionCorta: "Arribeños 2288, Belgrano",
    telefono: "+54 11 4788 0022",
    remitente: "no-reply@sakur.app",
  },
  correo: {
    brevoApiKey: "${process.env.BREVO_API_KEY || ''}",
    remitente: "no-reply@sakur.app",
    nombreRemitente: "SakurApp",
  },
  defaultPassword: "${process.env.DEFAULT_USER_PASSWORD || 'Sakura.2026'}",
};
`;
}

fs.writeFileSync(path.join(envDir, 'environment.ts'), generarContenido(true), 'utf8');

console.log('✅ Archivo de entorno src/environments/environment.ts generado exitosamente desde .env (producción)');

// Generar android/app/google-services.json si no existe para evitar crash de Firebase
const androidAppDir = path.resolve(__dirname, '../android/app');
const googleServicesPath = path.join(androidAppDir, 'google-services.json');
if (fs.existsSync(androidAppDir) && !fs.existsSync(googleServicesPath)) {
  const googleServicesContent = {
    project_info: {
      project_number: process.env.FIREBASE_MESSAGING_SENDER_ID || "301899482653",
      project_id: process.env.FIREBASE_PROJECT_ID || "project-48c8c6f4-0e4f-456d-889",
      storage_bucket: process.env.FIREBASE_STORAGE_BUCKET || "project-48c8c6f4-0e4f-456d-889.firebasestorage.app"
    },
    client: [
      {
        client_info: {
          mobilesdk_app_id: "1:301899482653:android:7a182293a16db7038e68f4",
          android_client_info: {
            package_name: "ar.com.sakurapp.app"
          }
        },
        oauth_client: [],
        api_key: [
          {
            current_key: process.env.FIREBASE_API_KEY || "AIzaSyD0EI7W1MhycSe9UskqUbC2QJJtn1OvqjM"
          }
        ],
        services: {
          appinvite_service: {
            other_platform_oauth_client: []
          }
        }
      }
    ],
    configuration_version: "1"
  };
  fs.writeFileSync(googleServicesPath, JSON.stringify(googleServicesContent, null, 2), 'utf8');
  console.log('✅ Archivo android/app/google-services.json generado automáticamente desde variables de entorno.');
}

