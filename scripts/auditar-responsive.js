/**
 * Auditoría de responsividad de SakurApp.
 *
 * No mide "se ve bien": mide desborde, que es verificable. Expone tres cosas
 * que se combinan desde el asistente con el MCP de Chrome DevTools:
 *
 *   VIEWPORTS   los anchos efectivos que hay que soportar
 *   RUTAS       las pantallas a recorrer, con el perfil que hace falta
 *   DETECTOR    el código que corre dentro de la página y devuelve los desbordes
 *
 * Uso:
 *   node scripts/auditar-responsive.js            imprime el plan de recorrido
 *   node scripts/auditar-responsive.js --detector imprime sólo el detector
 *
 * El detector se inyecta con `evaluate_script` en cada combinación de ruta y
 * viewport. Devuelve `[]` cuando la pantalla está sana.
 */

/** Anchos efectivos reales. El piso de 320 es un iPhone SE de primera
 *  generación y varios Android de gama baja que siguen en uso; si entra ahí,
 *  entra en todos. Los altos son los del equipo, no los del área visible. */
const VIEWPORTS = [
  { nombre: 'mínimo-320', ancho: 320, alto: 568, dpr: 2 },
  { nombre: 'android-360', ancho: 360, alto: 640, dpr: 3 },
  { nombre: 'iphone-se', ancho: 375, alto: 667, dpr: 2 },
  { nombre: 'iphone-14', ancho: 390, alto: 844, dpr: 3 },
  { nombre: 'pixel', ancho: 412, alto: 915, dpr: 2.6 },
  { nombre: 'pro-max', ancho: 430, alto: 932, dpr: 3 },
];

/** Credenciales de la semilla, por perfil. */
const CUENTAS = {
  DUENO: { email: 'carlos@sakurapp.com.ar', clave: 'Duenio.2026' },
  SUPERVISOR: { email: 'laura@sakurapp.com.ar', clave: 'Supervisor.2026' },
  METRE: { email: 'roberto@sakurapp.com.ar', clave: 'Metre.2026' },
  MOZO: { email: 'marcos@sakurapp.com.ar', clave: 'Mozo.2026' },
  COCINERO: { email: 'ana@sakurapp.com.ar', clave: 'Cocina.2026' },
  CANTINERO: { email: 'juan@sakurapp.com.ar', clave: 'Barra.2026' },
  CLIENTE: { email: 'sofia@correo.com.ar', clave: 'Cliente.2026' },
};

/** Las pantallas, agrupadas por el lote de agente que las tiene a cargo, para
 *  que cada uno pueda auditar lo suyo sin recorrer las 63 rutas. */
const RUTAS = [
  // --- sin sesión ---
  { ruta: '/presentacion', perfil: null, lote: 'D' },
  { ruta: '/login', perfil: null, lote: 'D' },
  { ruta: '/registro-cliente', perfil: null, lote: 'C' },
  { ruta: '/registro-invitado', perfil: null, lote: 'C' },
  { ruta: '/registro-enviado', perfil: null, lote: 'C' },
  { ruta: '/estado-cuenta/pendiente', perfil: null, lote: 'C' },
  { ruta: '/estado-cuenta/rechazado', perfil: null, lote: 'C' },

  // --- dueño y administración (lote E) ---
  { ruta: '/dueno/registros', perfil: 'DUENO', lote: 'E' },
  { ruta: '/dueno/empleados', perfil: 'DUENO', lote: 'E' },
  { ruta: '/dueno/alta-empleado', perfil: 'DUENO', lote: 'E' },
  { ruta: '/dueno/correos', perfil: 'DUENO', lote: 'E' },
  { ruta: '/dueno/codigos', perfil: 'DUENO', lote: 'E' },
  { ruta: '/clientes-pendientes', perfil: 'DUENO', lote: 'E' },
  { ruta: '/admin/alta-empleado', perfil: 'DUENO', lote: 'E' },
  { ruta: '/admin/alta-mesa', perfil: 'DUENO', lote: 'E' },
  { ruta: '/mesas', perfil: 'DUENO', lote: 'E' },
  { ruta: '/mesas/nueva', perfil: 'DUENO', lote: 'E' },
  { ruta: '/mesas/1', perfil: 'DUENO', lote: 'E' },
  { ruta: '/mesas/1/qr', perfil: 'DUENO', lote: 'E' },
  { ruta: '/mesas/1/chat', perfil: 'DUENO', lote: 'E' },

  // --- carta y comanda (lote C) ---
  { ruta: '/carta', perfil: 'CLIENTE', lote: 'C' },
  { ruta: '/carta/1', perfil: 'CLIENTE', lote: 'C' },
  { ruta: '/comanda/carrito', perfil: 'CLIENTE', lote: 'C' },

  // --- cliente (lote C) ---
  { ruta: '/cliente/ingreso', perfil: 'CLIENTE', lote: 'C' },
  { ruta: '/cliente/espera', perfil: 'CLIENTE', lote: 'C' },
  { ruta: '/cliente/encuestas', perfil: 'CLIENTE', lote: 'C' },
  { ruta: '/cliente/pedido', perfil: 'CLIENTE', lote: 'C' },
  { ruta: '/cliente/consulta', perfil: 'CLIENTE', lote: 'C' },
  { ruta: '/cliente/estado-pedido', perfil: 'CLIENTE', lote: 'C' },
  { ruta: '/cliente/juegos', perfil: 'CLIENTE', lote: 'C' },
  { ruta: '/cliente/juegos/ninja-sakura', perfil: 'CLIENTE', lote: 'C' },
  { ruta: '/cliente/juegos/emparejando-sushis', perfil: 'CLIENTE', lote: 'C' },
  { ruta: '/cliente/juegos/tateti-sushis', perfil: 'CLIENTE', lote: 'C' },

  // --- carta: altas de producto (lote D) ---
  { ruta: '/cocinero/alta-plato', perfil: 'COCINERO', lote: 'D' },
  { ruta: '/cantinero/alta-bebida', perfil: 'CANTINERO', lote: 'D' },
  { ruta: '/carta/alta-plato', perfil: 'COCINERO', lote: 'D' },
  { ruta: '/carta/alta-bebida', perfil: 'CANTINERO', lote: 'D' },
  { ruta: '/carta/1/editar', perfil: 'COCINERO', lote: 'D' },

  // --- salón (lote D) ---
  { ruta: '/metre/espera', perfil: 'METRE', lote: 'D' },
  { ruta: '/metre/registrar', perfil: 'METRE', lote: 'D' },
  { ruta: '/mozo/pedidos', perfil: 'MOZO', lote: 'D' },
  { ruta: '/mozo/pedidos/1', perfil: 'MOZO', lote: 'D' },
  { ruta: '/mozo/pedidos/1/rechazar', perfil: 'MOZO', lote: 'D' },
  { ruta: '/mozo/consultas', perfil: 'MOZO', lote: 'D' },
  { ruta: '/mozo/consultas/1', perfil: 'MOZO', lote: 'D' },
  { ruta: '/sector/pedidos', perfil: 'COCINERO', lote: 'D' },
  { ruta: '/en-preparacion', perfil: 'CLIENTE', lote: 'D' },
];

/**
 * Detector de desborde. Corre en el contexto de la página.
 *
 * Reporta cuatro cosas distintas, porque "se rompe" tiene cuatro causas:
 *
 *   documento   la página entera es más ancha que la ventana
 *   elemento    un elemento se sale de los límites de la ventana
 *   recorte     un texto quedó cortado sin puntos suspensivos (se pierde)
 *   tactil      un control quedó por debajo del mínimo de área táctil
 *
 * Se ignora lo invisible, lo que está fuera de pantalla a propósito (menús,
 * carruseles) y lo que declara desplazamiento horizontal deliberado.
 */
const DETECTOR = function auditarDesborde() {
  const TOLERANCIA = 1; // el redondeo de subpíxel no es un error
  const MINIMO_TACTIL = 44;
  const anchoVentana = document.documentElement.clientWidth;
  const hallazgos = [];

  const identificar = (el) => {
    const clase = typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
      : '';
    return el.tagName.toLowerCase() + clase;
  };

  // 1. ¿La página entera desborda?
  const raiz = document.documentElement;
  if (raiz.scrollWidth - raiz.clientWidth > TOLERANCIA) {
    hallazgos.push({
      tipo: 'documento',
      selector: 'html',
      detalle: `la página mide ${raiz.scrollWidth}px de ancho en una ventana de ${raiz.clientWidth}px`,
      exceso: raiz.scrollWidth - raiz.clientWidth,
    });
  }

  for (const el of document.querySelectorAll('.sk-app *')) {
    const estilo = getComputedStyle(el);
    if (estilo.display === 'none' || estilo.visibility === 'hidden' || estilo.opacity === '0') continue;

    const caja = el.getBoundingClientRect();
    if (caja.width === 0 && caja.height === 0) continue;

    // Lo que está deliberadamente fuera de cuadro (paneles cerrados, pétalos
    // de la animación de fondo) no cuenta como desborde.
    if (caja.right < 0 || caja.left > anchoVentana) continue;
    if (estilo.position === 'fixed' && estilo.pointerEvents === 'none') continue;

    // 2. ¿El elemento se sale de la ventana?
    const sobraDerecha = caja.right - anchoVentana;
    const sobraIzquierda = -caja.left;
    if (sobraDerecha > TOLERANCIA || sobraIzquierda > TOLERANCIA) {
      hallazgos.push({
        tipo: 'elemento',
        selector: identificar(el),
        detalle: sobraDerecha > TOLERANCIA
          ? `se pasa ${Math.round(sobraDerecha)}px del borde derecho`
          : `se pasa ${Math.round(sobraIzquierda)}px del borde izquierdo`,
        exceso: Math.round(Math.max(sobraDerecha, sobraIzquierda)),
      });
      continue;
    }

    // 3. ¿Hay texto recortado sin aviso? Un `nowrap` u `overflow:hidden` que
    //    se come letras sin puntos suspensivos es pérdida de información.
    const desbordaDentro = el.scrollWidth - el.clientWidth > TOLERANCIA;
    const recorta = estilo.overflowX === 'hidden' || estilo.overflowX === 'clip';
    const avisa = estilo.textOverflow === 'ellipsis';
    if (desbordaDentro && recorta && !avisa && el.textContent.trim()) {
      hallazgos.push({
        tipo: 'recorte',
        selector: identificar(el),
        detalle: `recorta ${el.scrollWidth - el.clientWidth}px de texto sin puntos suspensivos`,
        exceso: el.scrollWidth - el.clientWidth,
      });
      continue;
    }

    // 4. ¿Quedó un control imposible de tocar?
    const esControl = ['BUTTON', 'A', 'INPUT', 'SELECT'].includes(el.tagName)
      || el.getAttribute('role') === 'button';
    if (esControl && caja.width > 0 && (caja.height < MINIMO_TACTIL - TOLERANCIA || caja.width < 24)) {
      hallazgos.push({
        tipo: 'tactil',
        selector: identificar(el),
        detalle: `mide ${Math.round(caja.width)}×${Math.round(caja.height)}px, por debajo del mínimo táctil de ${MINIMO_TACTIL}px`,
        exceso: 0,
      });
    }
  }

  // Los peores primero, y sin repetir el mismo selector con el mismo problema.
  const vistos = new Set();
  return hallazgos
    .filter((h) => {
      const clave = h.tipo + '|' + h.selector;
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    })
    .sort((a, b) => b.exceso - a.exceso);
};

if (process.argv.includes('--detector')) {
  console.log('(' + DETECTOR.toString() + ')()');
} else {
  const porLote = RUTAS.reduce((acc, r) => {
    (acc[r.lote] ??= []).push(r.ruta);
    return acc;
  }, {});
  console.log(`${RUTAS.length} pantallas × ${VIEWPORTS.length} viewports = ${RUTAS.length * VIEWPORTS.length} comprobaciones\n`);
  console.log('Viewports:');
  for (const v of VIEWPORTS) console.log(`  ${v.nombre.padEnd(14)} ${v.ancho}×${v.alto} @${v.dpr}x`);
  console.log('\nPantallas por lote:');
  for (const [lote, rutas] of Object.entries(porLote).sort()) {
    console.log(`  lote ${lote} (${rutas.length}): ${rutas.join(', ')}`);
  }
}

module.exports = { VIEWPORTS, RUTAS, CUENTAS, DETECTOR };
