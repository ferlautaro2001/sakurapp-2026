import { environment } from '../../../environments/environment';
import type { DatosFactura } from '../factura/factura-pdf';
import { fechaFactura, numeroDeFactura, numeroDePedido, pesos, rotuloPropina } from '../factura/datos-factura';

export interface DatosCorreo {
  nombre: string;
  apellido: string;
  dni: string;
  correo: string;
  resueltoPor?: string;
  perfilResolutor?: string;
  fecha: string;
  motivo?: string;
  logoUrl: string;
}

/**
 * Punto 22 · el correo de la factura. Lleva los mismos datos que el PDF (que
 * va adjunto): la factura se puede leer entera en el cuerpo del correo.
 */
export interface DatosCorreoFactura {
  factura: DatosFactura;
  urlDescarga: string;
  logoUrl: string;
  /** El pétalo de la banda, ya sin su parte de arriba (ver petaloRecortado). */
  petaloUrl?: string;
}

const R = environment.restaurante;

const PIE_MARCAS = `
  <div style="display:flex;gap:5px;align-items:flex-end;margin-bottom:14px">
    <i style="display:inline-block;width:10px;height:10px;border-radius:50% 0 50% 0;background:#FE8FAC;transform:rotate(45deg)"></i>
    <i style="display:inline-block;width:13px;height:13px;border-radius:50% 0 50% 0;background:#EB366B;transform:rotate(45deg);margin:0 5px"></i>
    <i style="display:inline-block;width:10px;height:10px;border-radius:50% 0 50% 0;background:#FE8FAC;transform:rotate(45deg)"></i>
  </div>`;

/**
 * Plantilla 1 · Registro Recibido / Pendiente.
 * Ámbar y crema con letra de serifa: se lee como una carta que queda en
 * espera, bien distinta del rosa celebratorio de la aprobación y del oscuro
 * del rechazo. Gmail ignora las fuentes web, así que el respaldo (Georgia)
 * ya es de serifa.
 */
export function correoRegistroRecibido(d: DatosCorreo): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Registro recibido - SakurApp</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;800&family=Lora:wght@400;600&display=swap" rel="stylesheet">
<style>
body{margin:0;background:#F4E7CF;font-family:Lora,Georgia,'Times New Roman',serif;padding:24px 0}
.wrap{max-width:600px;margin:0 auto;background:#FFFBF2;border:1px solid #E2C998;border-radius:8px;overflow:hidden}
.hero{background:#8A5A14;padding:30px 36px;color:#FFF6E3;border-bottom:4px double #E9B95C}
.hero h1{margin:14px 0 0;font-family:'Playfair Display',Georgia,serif;font-size:31px;line-height:1.15;font-weight:800;letter-spacing:.005em}
.hero p{margin:8px 0 0;font-size:16px;line-height:1.5;font-style:italic;color:#F6E2BA}
.cuerpo{padding:28px 36px 12px}
.cuerpo h2{margin:14px 0 10px;font-family:'Playfair Display',Georgia,serif;font-size:23px;line-height:1.25;font-weight:600;color:#5C3A0C}
.cuerpo p{margin:0 0 14px;font-size:15.5px;line-height:1.65;color:#4A3210}
.pill{display:inline-block;padding:5px 14px;border:1.5px solid #B7791F;border-radius:4px;background:#FCEFD3;color:#8A5A14;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase}
.aviso{margin:18px 0;padding:16px 18px;background:#FCEFD3;border:1px dashed #D9A649;border-radius:6px;font-size:15px;line-height:1.6;color:#4A3210}
.datos{width:100%;margin:12px 0 20px;border-collapse:collapse}
.datos td{padding:10px 0;border-bottom:1px dotted #D9BE86;font-size:15px;line-height:1.4;color:#4A3210}
.datos td:first-child{color:#9A6B22;font-size:12.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;width:38%}
.pie{padding:22px 36px 28px;background:#F4E2BE;font-size:13px;line-height:1.6;color:#7A5A2A;font-style:italic}
</style></head><body>
<div class="wrap">
  <div class="hero">
    <img src="${d.logoUrl}" width="60" height="60" alt="SakurApp" style="border-radius:24%;display:block">
    <h1>Recibimos tu solicitud</h1>
    <p>Gracias por registrarte en ${R.nombre}. Estamos revisando tus datos.</p>
  </div>
  <div class="cuerpo">
    <span class="pill">En revisión</span>
    <h2>Hola, ${d.nombre}</h2>
    <p>Te confirmamos que ya tenemos tu formulario de registro y la información enviada. Nuestro equipo de administración (Dueño o Supervisor) estará revisando los datos para habilitar tu cuenta en breve.</p>
    <div class="aviso">
      <strong>¿Qué tenés que hacer ahora?</strong> Nada por el momento. Te enviaremos un correo apenas esté aprobada para que puedas comenzar a disfrutar del salón y la app.
    </div>
    <table class="datos">
      <tr><td>Comensal</td><td>${d.nombre} ${d.apellido}</td></tr>
      <tr><td>Documento</td><td>${d.dni}</td></tr>
      <tr><td>Correo</td><td>${d.correo}</td></tr>
      <tr><td>Fecha de solicitud</td><td>${d.fecha}</td></tr>
      <tr><td>Estado</td><td>Pendiente de aprobación</td></tr>
    </table>
  </div>
  <div class="pie">
    <strong style="color:#5C3A0C;font-size:14.5px;line-height:1.3;font-style:normal">${R.nombre} · ${R.salon}</strong><br>
    ${R.direccion} · Tel: ${R.telefono}<br>
    Recibís este correo porque iniciaste tu solicitud de registro en SakurApp.
  </div>
</div></body></html>`;
}

/**
 * Plantilla 2 · Cuenta Habilitada / Aprobada.
 * Cálida, viva y celebratoria en degradado coral con botón de acceso a la app web.
 * Letra bien redondeada y alegre (Baloo 2 en los títulos, Varela Round en el texto); en
 * Gmail, que ignora las fuentes web, queda la Trebuchet de respaldo.
 */
export function correoAprobacion(d: DatosCorreo): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>¡Tu cuenta ya está activa! - SakurApp</title>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Varela+Round&display=swap" rel="stylesheet">
<style>
body{margin:0;background:#FFD7DF;font-family:'Varela Round','Trebuchet MS','Segoe UI',Helvetica,Arial,sans-serif;padding:24px 0}
.hero h1,.cuerpo h2,.cta{font-family:'Baloo 2','Trebuchet MS','Segoe UI',sans-serif}
.wrap{max-width:600px;margin:0 auto;background:#FDECEF;border-radius:24px;overflow:hidden;box-shadow:0 8px 22px rgba(110,18,52,.2)}
.hero{background:linear-gradient(135deg,#FF7665,#EB366B);background-color:#EB366B;padding:34px 36px;color:#FFFFFF}
.hero h1{margin:16px 0 0;font-size:34px;line-height:1.15;font-weight:600;letter-spacing:0}
.hero p{margin:8px 0 0;font-size:16.5px;line-height:1.45;font-weight:500;color:rgba(255,255,255,.94)}
.cuerpo{padding:30px 36px 14px}
.cuerpo h2{margin:16px 0 10px;font-size:24px;line-height:1.25;font-weight:600;color:#6E1234}
.cuerpo p{margin:0 0 14px;font-size:15.5px;line-height:1.6;color:#6E1234}
.pill{display:inline-block;padding:6px 15px;border:1.5px solid #1B5E3B;border-radius:999px;background:#DCF1E5;color:#1B5E3B;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.cta{display:block;text-align:center;margin:22px 0 10px;padding:18px;border-radius:16px;background:#EB366B;color:#FFFFFF !important;font-size:17.5px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(235,54,107,.35)}
.datos{width:100%;margin:10px 0 18px;border-collapse:collapse}
.datos td{padding:11px 0;border-bottom:1px solid #F5B1C0;font-size:15px;line-height:1.4;color:#6E1234}
.datos td:first-child{color:#A4436A;font-size:13px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;width:40%}
.pie{padding:22px 36px 30px;background:#FFD7DF;font-size:13px;line-height:1.6;color:#A4436A}
</style></head><body>
<div class="wrap">
  <div class="hero">
    <img src="${d.logoUrl}" width="62" height="62" alt="SakurApp" style="border-radius:26%;display:block">
    <h1>¡Te damos la bienvenida!</h1>
    <p>Tu cuenta en ${R.nombre} ya fue aprobada y está lista para usarse.</p>
  </div>
  <div class="cuerpo">
    <span class="pill">Cuenta activa</span>
    <h2>¡Hola, ${d.nombre}!</h2>
    <p>Revisamos tu solicitud y validamos tus datos con éxito. Ya podés disfrutar de todas las comodidades de SakurApp:</p>
    <ul style="margin:0 0 18px;padding-left:22px;color:#6E1234;font-size:15px;line-height:1.7">
      <li>Sumarte a la lista de espera digital desde tu teléfono antes de llegar.</li>
      <li>Escanear el código QR en tu mesa para explorar la carta y pedir.</li>
      <li>Participar de juegos, sorteos y dejarnos tu opinión sobre el servicio.</li>
    </ul>
    <table class="datos">
      <tr><td>Comensal</td><td>${d.nombre} ${d.apellido}</td></tr>
      <tr><td>Documento</td><td>${d.dni}</td></tr>
      <tr><td>Perfil</td><td>Cliente registrado</td></tr>
      <tr><td>Aprobado por</td><td>${d.resueltoPor ?? 'Administración'} · ${d.perfilResolutor ?? 'Supervisor'}</td></tr>
      <tr><td>Fecha de alta</td><td>${d.fecha}</td></tr>
    </table>
    <a class="cta" href="https://project-48c8c6f4-0e4f-456d-889.firebaseapp.com/login" target="_blank" rel="noopener">Ingresar a SakurApp</a>
    <p style="text-align:center;font-size:13.5px;color:#A4436A;margin-top:8px">Iniciá sesión en la app con tu correo y contraseña habituales.</p>
  </div>
  <div class="pie">
    ${PIE_MARCAS}
    <strong style="color:#6E1234;font-size:15px;line-height:1.3">${R.nombre} · ${R.salon}</strong><br>
    ${R.direccion} · Tel: ${R.telefono}<br>
    ¡Nos alegra tenerte con nosotros! Te esperamos pronto en el salón.
  </div>
</div></body></html>`;
}

/**
 * Plantilla 3 · Solicitud Rechazada.
 * Misma paleta de la app pero apagada, en violeta azulado oscuro. Títulos en
 * letra condensada de trazo duro (Bebas Neue) y texto en monoespaciada (IBM
 * Plex Mono): no se confunde con la aprobación ni con la revisión. Gmail ignora
 * las fuentes web, así que los respaldos (Impact y Courier) ya son distintos.
 */
export function correoRechazo(d: DatosCorreo): string {
  const motivo =
    d.motivo?.trim() ||
    'Hubo una dificultad para verificar la documentación o los datos ingresados. Te sugerimos verificar que los datos sean legibles y coincidan exactamente.';

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Información sobre tu solicitud - SakurApp</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
body{margin:0;background:#2B2335;font-family:'IBM Plex Mono','Courier New',Courier,monospace;padding:24px 0}
.wrap{max-width:600px;margin:0 auto;background:#3A3047;border:1px solid #54456A;border-radius:4px;overflow:hidden}
.barra{background:#241D2E;padding:16px 30px;border-bottom:3px solid #A8557C}
.barra td{vertical-align:middle}
.barra .marca{font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:28px;line-height:1;letter-spacing:.08em;text-transform:uppercase;color:#F1E8F3}
.barra .area{margin-top:4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#C3B3CE}
.cabeza{padding:28px 30px 0}
.cabeza h1{margin:0;font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:40px;line-height:1.02;font-weight:400;letter-spacing:.03em;text-transform:uppercase;color:#F1E8F3}
.tag{display:inline-block;margin-bottom:14px;padding:5px 12px;background:#8E4467;border-radius:2px;color:#FBEFF5;font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:15px;letter-spacing:.14em;text-transform:uppercase}
.cuerpo{padding:16px 30px 24px}
.cuerpo p{margin:0 0 14px;font-size:14px;line-height:1.7;color:#D3C6DB}
.cuerpo strong{color:#F1E8F3;font-weight:600}
.aviso{margin:16px 0;padding:16px 18px;background:#2F2639;border-left:4px solid #A8557C;font-size:13.5px;line-height:1.65;color:#D3C6DB}
.pasos{margin:0 0 20px;padding-left:20px}
.pasos li{font-size:13.5px;line-height:1.7;color:#D3C6DB;margin-bottom:4px}
.pie{padding:18px 30px;background:#30283B;border-top:1px solid #54456A;font-size:11.5px;line-height:1.65;color:#A797B3}
</style></head><body>
<div class="wrap">
  <div class="barra">
    <!-- Tabla y no flex: es lo que respetan todos los clientes de correo. -->
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td><img src="${d.logoUrl}" width="56" height="56" alt="SakurApp" style="border-radius:26%;display:block"></td>
      <td style="padding-left:14px"><div class="marca">${R.nombre}</div><div class="area">Atención a comensales</div></td>
    </tr></table>
  </div>
  <div class="cabeza">
    <span class="tag">Solicitud rechazada</span>
    <h1>No pudimos completar tu registro</h1>
  </div>
  <div class="cuerpo">
    <p>Hola, ${d.nombre}. Revisamos tu solicitud de registro y en esta oportunidad no pudimos habilitar tu cuenta con los datos enviados.</p>
    <div class="aviso"><strong>Motivo informado:</strong> ${motivo}</div>
    <p><strong>Podés venir a disfrutar de Sakura de todas formas.</strong> Tenés varias opciones:</p>
    <ol class="pasos">
      <li><strong>Ingresar como invitado:</strong> Podés acceder a la aplicación en modo invitado ingresando tu nombre y foto de perfil, sin necesidad de aprobación previa.</li>
      <li><strong>Registro presencial en recepción:</strong> Nuestro metre o personal de sala puede registrarte personalmente al llegar con tu documento en mano.</li>
      <li><strong>Volver a enviar la solicitud:</strong> Podés reiniciar el registro asegurándote de que los datos ingresados coincidan y que la fotografía sea nítida y bien iluminada.</li>
    </ol>
  </div>
  <div class="pie">
    ${R.nombre} · ${R.salon} · ${R.direccion}<br>
    Revisado por ${d.resueltoPor ?? 'Administración'} · ${d.perfilResolutor ?? 'Supervisor'} · ${d.fecha}<br>
    Si tenés dudas sobre tu solicitud, podés consultarnos directamente en el local o llamándonos al ${R.telefono}.
  </div>
</div></body></html>`;
}

/** Para lo que escribió una persona (nombres, productos): nunca se toma como HTML. */
function escapar(texto: string): string {
  const entidades: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return texto.replace(/[&<>"']/g, (c) => entidades[c]);
}

/**
 * Plantilla 4 · Factura del consumo (punto 22).
 * Es la factura en PDF pasada a correo, con su mismo orden: la banda con el
 * logo, el nombre y la dirección del local, y el pétalo grande cortado por el
 * borde de arriba (viene ya recortado: ningún cliente de correo respeta los
 * márgenes negativos); el cliente y el pedido a la
 * izquierda y la tarjeta de la Factura C a la derecha; el detalle con precio
 * unitario e importe en renglones alternados; el subtotal, el descuento del
 * juego, la propina con el grado de satisfacción y el TOTAL en la banda
 * azul.
 * Colores y letras propios, distintos de las otras tres plantillas: índigo
 * y azul, con el fucsia de la aplicación en los rótulos y en el botón de
 * descarga;
 * todo en Share Tech Mono, letra angosta de ticket de caja (en Gmail, que
 * ignora las fuentes web, queda Lucida Console: tampoco es la Courier del
 * rechazo). Tablas en lugar de flex, que es lo que respetan
 * todos los clientes de correo. Los bloques de cliente y factura se apilan
 * solos en el teléfono.
 */
export function correoFactura(d: DatosCorreoFactura): string {
  const f = d.factura;
  const numero = numeroDeFactura(f.puntoDeVenta, f.numero);
  const cliente = f.cliente.anonimo
    ? `<div class="gris">Cliente anónimo · consumidor final</div>`
    : [
        f.cliente.documento ? `<div class="gris">Documento: ${escapar(f.cliente.documento)}</div>` : '',
        f.cliente.correo ? `<div class="gris">Correo: ${escapar(f.cliente.correo)}</div>` : '',
      ].join('');
  const renglones = f.renglones
    .map(
      (r, i) => `<tr${i % 2 === 0 ? ' class="par"' : ''}>
        <td class="cant">${r.cantidad}</td>
        <td class="desc">${escapar(r.descripcion)}</td>
        <td class="unit">${pesos(r.precioUnitario)}</td>
        <td class="imp">${pesos(r.importe)}</td>
      </tr>`,
    )
    .join('');
  const fila = (rotulo: string, valor: string, clase = '') =>
    `<tr class="${clase}"><td>${rotulo}</td><td class="valor">${valor}</td></tr>`;

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Factura ${numero} - ${f.restaurante.nombre}</title>
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
<style>
body{margin:0;background:#D8DDEE;font-family:'Share Tech Mono','Lucida Console',Monaco,monospace;color:#1B2440;padding:24px 0}
.hoja{max-width:640px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(27,36,64,.22)}
.banda{background:#1E2A5A}
.banda td{vertical-align:middle}
.banda .logo{padding:26px 0 26px 28px}
.banda .local-datos{padding:26px 8px 26px 16px}
.banda .petalo{vertical-align:top;padding-right:12px}
.marca{font-size:30px;line-height:1.1;font-weight:800;color:#FFFFFF}
.local{margin-top:4px;font-size:15px;color:#D9DEF2}
.dir{margin-top:6px;font-size:12.5px;line-height:1.5;color:#D9DEF2}
.saludo{padding:22px 28px 0;font-size:15px;line-height:1.6;color:#4A5378}
.saludo b{color:#1B2440}
.cabecera{padding:12px 20px 4px;font-size:0}
.col{display:inline-block;vertical-align:top;width:100%;max-width:290px;font-size:14px;padding:0 8px;box-sizing:border-box}
.rotulo{margin:10px 0 4px;font-size:11.5px;font-weight:800;letter-spacing:.06em;color:#C72657}
.nombre{font-size:17px;font-weight:700;color:#1B2440}
.gris{margin-top:3px;font-size:13px;color:#5A6282}
.pedido{font-size:15.5px;font-weight:800;color:#1B2440}
.tarjeta{margin:10px 0;padding:16px 12px;background:#EEF0F7;border-radius:12px;text-align:center}
.tipo{font-size:22px;font-weight:800;color:#C72657}
.final{margin-top:4px;font-size:12.5px;color:#5A6282}
.nro{margin-top:8px;font-size:15px;font-weight:800;color:#1B2440}
.cuerpo{padding:12px 28px 4px}
.detalle{width:100%;border-collapse:separate;border-spacing:0;font-size:13.5px}
.detalle th{background:#1B2440;color:#FFFFFF;font-size:12.5px;font-weight:700;padding:10px 8px;text-align:left}
.detalle th:first-child{border-radius:8px 0 0 8px;text-align:center}
.detalle th:last-child{border-radius:0 8px 8px 0}
.detalle th.der{text-align:right}
.detalle td{padding:10px 8px;vertical-align:top}
.detalle .par td{background:#EEF0F7}
.cant{width:34px;text-align:center;font-weight:700}
.desc{font-weight:700}
.unit{text-align:right;white-space:nowrap;color:#5A6282}
.imp{text-align:right;white-space:nowrap;font-weight:800}
.resumen{width:100%;max-width:340px;margin:16px 0 0 auto;border-collapse:collapse;font-size:15px}
.resumen td{padding:4px 0}
.resumen .valor{text-align:right;font-weight:800;white-space:nowrap}
.resumen .verde{color:#2E7D4F}
.total{width:100%;max-width:340px;margin:10px 0 0 auto;background:#2D4BA0;border-radius:12px;border-collapse:separate}
.total td{padding:14px 18px;color:#FFFFFF;font-weight:800;font-size:19px}
.total .monto{text-align:right;font-size:28px;white-space:nowrap}
.pago{margin:10px 0 0;text-align:right;font-size:12.5px;color:#5A6282}
.cta{display:block;margin:22px 0 6px;padding:15px;border-radius:12px;background:#C72657;color:#FFFFFF !important;text-align:center;font-size:16px;font-weight:700;text-decoration:none}
.adjunto{margin:0 0 6px;text-align:center;font-size:12.5px;color:#5A6282}
.pie{margin:18px 28px 0;padding:16px 0 24px;border-top:2px solid #C72657;text-align:center}
.gracias{font-size:19px;font-weight:800;color:#C72657}
.pie .gris{font-size:12.5px}
@media (max-width:600px){.banda .logo{padding:22px 0 22px 20px}.banda .local-datos{padding:22px 20px 22px 14px}.petalo{display:none}.col{max-width:none}.cuerpo{padding:12px 16px 4px}.saludo{padding:20px 20px 0}.pie{margin:18px 20px 0}}
</style></head><body>
<div class="hoja">
  <div class="banda">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td class="logo" width="80"><img src="${d.logoUrl}" width="68" height="68" alt="${f.restaurante.nombre}" style="border-radius:26%;display:block;box-shadow:0 4px 12px rgba(27,36,64,.45)"></td>
      <td class="local-datos">
        <div class="marca">${f.restaurante.nombre}</div>
        <div class="local">Restaurante ${f.restaurante.salon}</div>
        <div class="dir">${f.restaurante.direccion}<br>Tel. ${f.restaurante.telefono}</div>
      </td>
      ${d.petaloUrl ? `<td class="petalo" width="140" align="right"><img src="${d.petaloUrl}" width="140" height="110" alt="" style="display:block"></td>` : ''}
    </tr></table>
  </div>

  <div class="saludo">Hola <b>${escapar(f.cliente.nombre.split(' ')[0])}</b>, te enviamos la factura de tu consumo en nuestro restaurante ${f.restaurante.salon}:</div>

  <div class="cabecera">
    <div class="col">
      <div class="rotulo">CLIENTE</div>
      <div class="nombre">${escapar(f.cliente.nombre)}</div>
      ${cliente}
      <div class="rotulo" style="margin-top:14px">PEDIDO</div>
      <div class="pedido">N° ${numeroDePedido(f.pedido.id)} · Mesa ${f.pedido.mesa}</div>
    </div><div class="col">
      <div class="tarjeta">
        <div class="tipo">FACTURA C</div>
        <div class="final">Consumidor final</div>
        <div class="nro">N° ${numero}</div>
        <div class="final">${fechaFactura(f.emitidaEn)}</div>
      </div>
    </div>
  </div>

  <div class="cuerpo">
    <table class="detalle" role="presentation">
      <tr><th>Cant.</th><th>Descripción</th><th class="der">P. unitario</th><th class="der">Importe</th></tr>
      ${renglones}
    </table>

    <table class="resumen" role="presentation">
      ${fila('Subtotal', pesos(f.subtotal))}
      ${f.descuento && f.descuento.monto > 0 ? fila(`Descuento (${f.descuento.porcentaje} %)`, `- ${pesos(f.descuento.monto)}`, 'verde') : ''}
      ${fila(rotuloPropina(f.propina), `+ ${pesos(f.propina.monto)}`)}
    </table>
    <table class="total" role="presentation"><tr><td>TOTAL</td><td class="monto">${pesos(f.total)}</td></tr></table>
    ${f.pago ? `<p class="pago">Pagado con ${f.pago.medio} · Operación #${f.pago.operacion}</p>` : ''}

    <a class="cta" href="${d.urlDescarga}" target="_blank" rel="noopener">Descargar la factura en PDF</a>
    <p class="adjunto">El archivo factura-${numero}.pdf también va adjunto a este correo.</p>
  </div>

  <div class="pie">
    <div class="gracias">¡Gracias por tu visita!</div>
    <div class="gris">${f.restaurante.nombre} · ${f.restaurante.direccion}</div>
  </div>
</div></body></html>`;
}
