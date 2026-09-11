/**
 * Siembra un pedido de prueba en estado PENDIENTE_CONFIRMACION, que es el
 * único estado en el que el mozo lo ve en `mozo/pedidos` y puede devolverlo.
 *
 * Sirve para probar el punto 13 sin tener que armar la comanda a mano desde
 * el teléfono cada vez: devolver un pedido lo saca de la lista del mozo, así
 * que hace falta uno nuevo por cada prueba.
 *
 *   node scripts/sembrar-pedido-prueba.mjs            → la mesa ocupada
 *   node scripts/sembrar-pedido-prueba.mjs --mesa 10  → una mesa concreta
 *
 * Escribe directo en Firestore con el SDK web y la configuración del `.env`:
 * las reglas del proyecto están abiertas, así que no hace falta la clave de
 * servicio que usan los scripts de `scripts_backend/`.
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
} from 'firebase/firestore';

/** Las bebidas salen de la barra; las comidas y los postres, de la cocina. */
const sectorDe = (tipo) => (tipo === 'BEBIDA' ? 'BAR' : 'COCINA');

/** Lo que va a pedir la mesa, por nombre de producto y cantidad. */
const COMANDA = [
  { nombre: 'Ramen Tonkotsu Tradicional', cantidad: 2 },
  { nombre: 'Roll SakurApp Especial', cantidad: 3 },
  { nombre: 'Mochis Artesanales de Té Matcha', cantidad: 2 },
  { nombre: 'Cerveza Japonesa Asahi Super Dry', cantidad: 2 },
  { nombre: 'Cóctel Sakura Blossom & Gin', cantidad: 1 },
];

function leerEnv() {
  return Object.fromEntries(
    readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .filter((linea) => linea.trim() && !linea.trim().startsWith('#') && linea.includes('='))
      .map((linea) => {
        const corte = linea.indexOf('=');
        return [
          linea.slice(0, corte).trim(),
          linea.slice(corte + 1).trim().replace(/^["']|["']$/g, ''),
        ];
      }),
  );
}

async function traerTodo(db, nombreColeccion) {
  const snapshot = await getDocs(collection(db, nombreColeccion));
  return snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
}

async function sembrar() {
  const env = leerEnv();

  const app = initializeApp({
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID,
  });
  const db = getFirestore(app, 'sakurapp');

  const [mesas, productos, usuarios] = await Promise.all([
    traerTodo(db, 'mesas'),
    traerTodo(db, 'productos'),
    traerTodo(db, 'usuarios'),
  ]);

  // La mesa: la pedida por parámetro, o la primera que esté ocupada.
  const pedida = process.argv.indexOf('--mesa');
  const numeroPedido = pedida !== -1 ? Number(process.argv[pedida + 1]) : null;

  const mesa = numeroPedido
    ? mesas.find((m) => m.numero === numeroPedido)
    : mesas.find((m) => m.estado === 'OCUPADA');

  if (!mesa) {
    throw new Error(
      numeroPedido
        ? `No existe la mesa ${numeroPedido}.`
        : 'No hay ninguna mesa ocupada. Sentá un comensal, o pasá --mesa <número>.',
    );
  }

  // El comensal: el que está sentado en esa mesa. Si la mesa no tiene a nadie
  // registrado, cae en Sofía Gómez, que es cliente aprobado de la semilla.
  const cliente =
    usuarios.find((u) => u.uid === mesa.clienteActualUid) ??
    usuarios.find((u) => u.id === mesa.clienteActualId) ??
    usuarios.find((u) => u.uid === 'uid-7');

  if (!cliente) throw new Error('No encontré un comensal para la mesa.');

  // Los renglones, con el precio y el sector que tienen hoy en la carta.
  const items = [];
  for (const linea of COMANDA) {
    const producto = productos.find((p) => p.nombre === linea.nombre);
    if (!producto) {
      console.warn(`   ⚠️  "${linea.nombre}" no está en la carta: lo salteo.`);
      continue;
    }
    items.push({
      id: randomUUID(),
      productoId: producto.id,
      productoNombre: producto.nombre,
      tipo: producto.tipo,
      sector: sectorDe(producto.tipo),
      cantidad: linea.cantidad,
      precioUnitario: producto.precio,
      subtotal: producto.precio * linea.cantidad,
    });
  }

  if (!items.length) throw new Error('Ningún producto de la comanda existe en la carta.');

  const total = items.reduce((suma, item) => suma + item.subtotal, 0);

  // Mismo cálculo que CarritoService: adentro del sector los tiempos se suman
  // —las unidades repetidas no multiplican—, y los sectores trabajan a la vez.
  const porSector = new Map();
  for (const item of items) {
    const producto = productos.find((p) => p.id === item.productoId);
    porSector.set(item.sector, (porSector.get(item.sector) ?? 0) + producto.tiempoElaboracion);
  }
  const tiempoEstimado = Math.max(...porSector.values());

  const pedido = {
    id: randomUUID(),
    mesaId: mesa.id,
    mesaNumero: mesa.numero,
    clienteId: cliente.id,
    clienteUid: cliente.uid || cliente.id,
    clienteNombre: [cliente.nombre, cliente.apellido ?? ''].join(' ').trim(),
    estadoGlobal: 'PENDIENTE_CONFIRMACION',
    estadoCocina: 'NO_APLICA',
    estadoBar: 'NO_APLICA',
    motivoRechazo: null,
    rechazadoPorNombre: null,
    alcanceRechazo: null,
    observaciones: [],
    tiempoEstimado,
    totalBruto: total,
    descuentoJuego: 0,
    montoDescuentoJuego: 0,
    totalFinal: total,
    confirmadoPorId: null,
    juegoIntentado: false,
    timestampCreacion: new Date().toISOString(),
    items,
  };

  await setDoc(doc(db, 'pedidos', pedido.id), pedido);

  const pesos = (n) => '$' + n.toLocaleString('es-AR');

  console.log(`\n🌸 Pedido sembrado, esperando al mozo.\n`);
  console.log(`   Mesa ${mesa.numero}  ·  ${pedido.clienteNombre}`);
  console.log(`   ${pesos(total)}  ·  ${tiempoEstimado} minutos  ·  ${items.length} renglones\n`);
  for (const item of items) {
    console.log(
      `   ${String(item.cantidad).padStart(2)} × ${item.productoNombre.padEnd(36)}` +
      `${item.sector.padEnd(7)} ${pesos(item.subtotal)}`,
    );
  }
  console.log(`\n   id: ${pedido.id}\n`);
}

sembrar()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ No se pudo sembrar el pedido:', error.message, '\n');
    process.exit(1);
  });
