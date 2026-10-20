/**
 * Siembra respuestas históricas de las tres encuestas de satisfacción, para que
 * los gráficos del punto 20 tengan porcentajes de verdad desde el primer día.
 *
 * La consigna pide un entorno que simule al menos cuatro semanas de
 * interacciones en la base: son 141 encuestas respondidas a lo largo de los
 * últimos 28 días.
 *
 *   node scripts/sembrar-encuestas.mjs            → siembra (o vuelve a sembrar)
 *   node scripts/sembrar-encuestas.mjs --borrar   → saca lo sembrado
 *
 * Son 47 respuestas por encuesta, repartidas día por día a lo largo de las
 * últimas cuatro semanas, en `encuestas/historica-<encuesta>-<número>`. Antes
 * de sembrar borra todas las históricas, así lo que quede siempre corresponde
 * a las preguntas de hoy. Los valores salen de un generador con semilla fija:
 * correrlo dos veces deja lo mismo. Las respuestas reales de los comensales
 * tienen el id de su pedido y no se tocan.
 *
 * Las preguntas se importan de la aplicación misma (Node corre TypeScript sin
 * compilar), así el script no puede quedar desfasado de las encuestas.
 *
 * Escribe directo en Firestore con el SDK web y la configuración del `.env`,
 * como `sembrar-pedido-prueba.mjs`.
 */
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { ENCUESTAS } from '../src/app/nucleo/datos/encuestas.ts';

const POR_ENCUESTA = 47;
const DIAS = 28;

function leerEnv() {
  return Object.fromEntries(
    readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .filter((linea) => linea.trim() && !linea.trim().startsWith('#') && linea.includes('='))
      .map((linea) => {
        const corte = linea.indexOf('=');
        return [linea.slice(0, corte).trim(), linea.slice(corte + 1).trim().replace(/^["']|["']$/g, '')];
      }),
  );
}

/** Generador pseudoaleatorio con semilla (mulberry32): mismos números en cada corrida. */
function generador(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pesos propios de las preguntas donde el orden de las opciones no va de la
 * más elegida a la menos: los precios se ven justos para la mayoría.
 */
const PESOS = {
  precios: [8, 22, 48, 22],
};

/** Elige un elemento según sus pesos. */
function elegir(azar, opciones, pesos) {
  const total = pesos.reduce((t, p) => t + p, 0);
  let r = azar() * total;
  for (let i = 0; i < opciones.length; i++) {
    r -= pesos[i];
    if (r < 0) return opciones[i];
  }
  return opciones[opciones.length - 1];
}

/**
 * Una respuesta creíble para cada tipo de pregunta: el salón anda bien, así
 * que los puntajes tiran para arriba, y lo que se muestra en línea mejora
 * semana a semana (para que la línea cuente algo). La pregunta opcional queda
 * sin responder una de cada tres veces: los que no jugaron.
 */
function responder(azar, pregunta, semana) {
  if (pregunta.opcional && azar() < 0.35) return null;
  switch (pregunta.tipo) {
    case 'estrellas':
    case 'corazones':
    case 'caritas':
    case 'deslizador': {
      const mejora = pregunta.grafico === 'linea' ? semana : 0;
      return elegir(azar, [1, 2, 3, 4, 5], [3, 6, 18 - mejora * 3, 36, 30 + mejora * 6]);
    }
    case 'nps':
      return elegir(azar, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 1, 1, 1, 2, 3, 5, 10, 18, 26, 32]);
    case 'sino':
    case 'interruptor':
      return azar() < 0.82;
    case 'opciones':
      return elegir(azar, pregunta.opciones, PESOS[pregunta.id] ?? [34, 26, 18, 10, 12].slice(0, pregunta.opciones.length));
    case 'multiple': {
      // Cada uno marca entre una y cuatro; las primeras de la lista son las más elegidas.
      const cuantas = 1 + Math.floor(azar() * 4);
      const pesos = pregunta.opciones.map((_, i) => pregunta.opciones.length - i + 2);
      const elegidas = new Set();
      while (elegidas.size < cuantas) elegidas.add(elegir(azar, pregunta.opciones, pesos));
      return pregunta.opciones.filter((o) => elegidas.has(o));
    }
    default:
      return null;
  }
}

function sembradas(definicion) {
  const azar = generador(definicion.id.split('').reduce((t, c) => t * 31 + c.charCodeAt(0), 7));
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);

  return Array.from({ length: POR_ENCUESTA }, (_, i) => {
    // Del día 28 para atrás hasta ayer, parejo: entre una y dos por día.
    const dia = Math.floor((i * DIAS) / POR_ENCUESTA);
    const semana = Math.floor(dia / 7);
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - DIAS + dia);
    fecha.setHours(12 + (i % 11), (i * 7) % 60);

    const respuestas = {};
    for (const paso of definicion.pasos) {
      for (const pregunta of paso.preguntas) respuestas[pregunta.id] = responder(azar, pregunta, semana);
    }
    const id = `historica-${definicion.id}-${String(i + 1).padStart(2, '0')}`;
    return {
      id,
      datos: {
        pedidoId: id,
        variante: definicion.id,
        estado: 'ENVIADA',
        respuestas,
        enviadaEn: fecha.toISOString(),
        mesaNumero: 1 + Math.floor(azar() * 10),
        clienteId: 'historico',
        historica: true,
        enSql: false,
      },
    };
  });
}

async function principal() {
  const env = leerEnv();
  const app = initializeApp({
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID || undefined,
  });
  const db = getFirestore(app, 'sakurapp');

  // Siempre se arranca de cero: las de preguntas que ya no existen no quedan.
  const viejas = await getDocs(query(collection(db, 'encuestas'), where('historica', '==', true)));
  await Promise.all(viejas.docs.map((d) => deleteDoc(d.ref)));
  console.log(`🗑️  Borradas ${viejas.size} respuestas históricas anteriores.`);
  if (process.argv.includes('--borrar')) process.exit(0);

  for (const definicion of ENCUESTAS) {
    const lista = sembradas(definicion);
    await Promise.all(lista.map(({ id, datos }) => setDoc(doc(db, 'encuestas', id), datos)));
    console.log(`🌸 ${definicion.nombre}: ${lista.length} respuestas históricas.`);
  }
  process.exit(0);
}

principal().catch((err) => {
  console.error('❌ No se pudieron sembrar las encuestas:', err);
  process.exit(1);
});
