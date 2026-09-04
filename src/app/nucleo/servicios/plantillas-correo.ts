import { environment } from '../../../environments/environment';

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

const R = environment.restaurante;

const PIE_MARCAS = `
  <div style="display:flex;gap:5px;align-items:flex-end;margin-bottom:14px">
    <i style="display:inline-block;width:10px;height:10px;border-radius:50% 0 50% 0;background:#FE8FAC;transform:rotate(45deg)"></i>
    <i style="display:inline-block;width:13px;height:13px;border-radius:50% 0 50% 0;background:#EB366B;transform:rotate(45deg);margin:0 5px"></i>
    <i style="display:inline-block;width:10px;height:10px;border-radius:50% 0 50% 0;background:#FE8FAC;transform:rotate(45deg)"></i>
  </div>`;

/**
 * Plantilla 1 · Registro Recibido / Pendiente (Punto 5).
 * Tono informativo y contenedor, con paleta flor de cerezo y badge ámbar.
 */
export function correoRegistroRecibido(d: DatosCorreo): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Registro recibido - SakurApp</title>
<style>
body{margin:0;background:#FDECEF;font-family:'Trebuchet MS',Figtree,'Segoe UI',Helvetica,Arial,sans-serif;padding:24px 0}
.wrap{max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 8px 24px rgba(110,18,52,.12);border:1px solid #F5B1C0}
.hero{background:linear-gradient(135deg,#9B2C52,#C72657);background-color:#C72657;padding:32px 36px;color:#FFFFFF}
.hero h1{margin:14px 0 0;font-size:30px;line-height:1.15;font-weight:800;letter-spacing:-.015em}
.hero p{margin:8px 0 0;font-size:16px;line-height:1.45;color:rgba(255,255,255,.9)}
.cuerpo{padding:28px 36px 12px}
.cuerpo h2{margin:14px 0 10px;font-size:22px;line-height:1.25;font-weight:800;color:#6E1234}
.cuerpo p{margin:0 0 14px;font-size:15px;line-height:1.6;color:#6E1234}
.pill{display:inline-block;padding:6px 14px;border-radius:999px;background:#FFF3D6;color:#8F5300;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.aviso{margin:18px 0;padding:16px 18px;background:#FDECEF;border-left:4px solid #C72657;border-radius:0 12px 12px 0;font-size:14.5px;line-height:1.55;color:#6E1234}
.datos{width:100%;margin:12px 0 20px;border-collapse:collapse}
.datos td{padding:10px 0;border-bottom:1px solid #F5B1C0;font-size:14.5px;line-height:1.4;color:#6E1234}
.datos td:first-child{color:#A4436A;font-size:12.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;width:38%}
.pie{padding:22px 36px 28px;background:#FFD7DF;font-size:13px;line-height:1.6;color:#A4436A}
</style></head><body>
<div class="wrap">
  <div class="hero">
    <img src="${d.logoUrl}" width="60" height="60" alt="SakurApp" style="border-radius:24%;display:block">
    <h1>Recibimos tu solicitud de registro</h1>
    <p>Tu cuenta en ${R.nombre} está en proceso de revisión institucional.</p>
  </div>
  <div class="cuerpo">
    <span class="pill">En revisión</span>
    <h2>Hola, ${d.nombre}</h2>
    <p>Te confirmamos que recibimos tu formulario de inscripción y la fotografía de tu documento. La administración del salón (Dueño o Supervisor) verificará tus datos para habilitar tu acceso.</p>
    <div class="aviso">
      <strong>¿Qué sigue?</strong> Cuando tu cuenta sea aprobada o revisada, te enviaremos una notificación automática a esta misma casilla con la confirmación.
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
    ${PIE_MARCAS}
    <strong style="color:#6E1234;font-size:14.5px;line-height:1.3">${R.nombre} · ${R.salon}</strong><br>
    ${R.direccion} · Tel: ${R.telefono}<br>
    Recibís este correo automático institucional porque solicitaste el alta en la plataforma de comensales.
  </div>
</div></body></html>`;
}

/**
 * Plantilla 2 · Cuenta Habilitada / Aprobada (Punto 8).
 * Cálida, viva y celebratoria en degradado coral con botón sólido y tipografía palo seco.
 */
export function correoAprobacion(d: DatosCorreo): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tu cuenta está aprobada</title>
<style>
body{margin:0;background:#FFD7DF;font-family:'Trebuchet MS',Figtree,'Segoe UI',Helvetica,Arial,sans-serif;padding:24px 0}
.wrap{max-width:600px;margin:0 auto;background:#FDECEF;border-radius:24px;overflow:hidden;box-shadow:0 8px 22px rgba(110,18,52,.2)}
.hero{background:linear-gradient(135deg,#FF7665,#EB366B);background-color:#EB366B;padding:34px 36px;color:#FFFFFF}
.hero h1{margin:16px 0 0;font-size:34px;line-height:1.1;font-weight:800;letter-spacing:-.015em}
.hero p{margin:8px 0 0;font-size:17px;line-height:1.45;font-weight:500;color:rgba(255,255,255,.9)}
.cuerpo{padding:30px 36px 8px}
.cuerpo h2{margin:16px 0 10px;font-size:22px;line-height:1.25;font-weight:800;color:#6E1234}
.cuerpo p{margin:0 0 14px;font-size:16px;line-height:1.6;color:#6E1234}
.pill{display:inline-block;padding:7px 16px;border-radius:999px;background:#DCF1E5;color:#1B7A4C;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.cta{display:block;text-align:center;margin:22px 0 6px;padding:18px;border-radius:16px;background:#EB366B;color:#FFF6F8 !important;font-size:18px;font-weight:700;text-decoration:none}
.datos{width:100%;margin:6px 0 18px;border-collapse:collapse}
.datos td{padding:11px 0;border-bottom:1px solid #F5B1C0;font-size:15px;line-height:1.4;color:#6E1234}
.datos td:first-child{color:#A4436A;font-size:13px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;width:42%}
.pie{padding:22px 36px 30px;background:#FFD7DF;font-size:13px;line-height:1.6;color:#A4436A}
</style></head><body>
<div class="wrap">
  <div class="hero">
    <img src="${d.logoUrl}" width="62" height="62" alt="SakurApp" style="border-radius:26%;display:block">
    <h1>Tu cuenta está aprobada</h1>
    <p>Ya podés entrar a ${R.nombre} y sumarte a la fila desde el teléfono.</p>
  </div>
  <div class="cuerpo">
    <span class="pill">Aprobado</span>
    <h2>Hola, ${d.nombre}</h2>
    <p>Revisamos tus datos y está todo en orden. Desde ahora podés escanear el código de ingreso al llegar, seguir tu lugar en la lista de espera y dejar tu encuesta al final de la noche.</p>
    <table class="datos">
      <tr><td>Nombre</td><td>${d.nombre} ${d.apellido}</td></tr>
      <tr><td>Documento</td><td>${d.dni}</td></tr>
      <tr><td>Perfil</td><td>Cliente registrado</td></tr>
      <tr><td>Aprobado por</td><td>${d.resueltoPor ?? 'Administración'} · ${d.perfilResolutor ?? 'Supervisor'}</td></tr>
      <tr><td>Fecha</td><td>${d.fecha}</td></tr>
    </table>
    <a class="cta" href="#">Ingresar a SakurApp</a>
    <p style="text-align:center;font-size:14px;color:#A4436A">Abrí la aplicación en tu teléfono e iniciá sesión con tu correo electrónico y tu contraseña.</p>
  </div>
  <div class="pie">
    ${PIE_MARCAS}
    <strong style="color:#6E1234;font-size:15px;line-height:1.3">${R.nombre} · ${R.salon}</strong><br>
    ${R.direccion} · ${R.telefono}<br>
    Recibís este correo corporativo porque tu solicitud fue aprobada por el personal autorizado.
  </div>
</div></body></html>`;
}

/**
 * Plantilla 3 · Solicitud Rechazada (Punto 7).
 * Sobria, formal y encuadrada en ciruela con tipografía serif y detalle explicativo del motivo.
 */
export function correoRechazo(d: DatosCorreo): string {
  const motivo =
    d.motivo?.trim() ||
    'Los datos del documento no coinciden con la foto enviada. No podemos habilitar el acceso sin esa verificación.';

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>No pudimos aprobar tu cuenta</title>
<style>
body{margin:0;background:#6E1234;font-family:Georgia,'Times New Roman',serif;padding:24px 0}
.wrap{max-width:600px;margin:0 auto;background:#FDECEF;border:2px solid #6E1234;border-radius:4px;overflow:hidden}
.barra{background:#6E1234;padding:18px 30px}
.barra span{font-size:13px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#FDECEF;vertical-align:middle;margin-left:12px}
.cabeza{padding:30px 30px 0}
.cabeza h1{margin:0;font-size:27px;line-height:1.2;font-weight:800;color:#6E1234}
.tag{display:inline-block;margin-bottom:14px;padding:6px 14px;border:1.5px solid #C0261A;border-radius:4px;color:#C0261A;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
.cuerpo{padding:16px 30px 26px}
.cuerpo p{margin:0 0 14px;font-size:15px;line-height:1.65;color:#6E1234}
.aviso{margin:18px 0;padding:16px 18px;background:#FFE0DB;border-left:4px solid #C0261A;font-size:15px;line-height:1.55;color:#6E1234}
.pasos{margin:0 0 20px;padding-left:20px}
.pasos li{font-size:15px;line-height:1.7;color:#6E1234}
.pie{padding:18px 30px;border-top:1px dashed #F5B1C0;font-size:12px;line-height:1.6;color:#A4436A}
</style></head><body>
<div class="wrap">
  <div class="barra">
    <img src="${d.logoUrl}" width="34" height="34" alt="SakurApp" style="border-radius:26%;vertical-align:middle">
    <span>${R.nombre} · Registro de clientes</span>
  </div>
  <div class="cabeza">
    <span class="tag">Registro rechazado</span>
    <h1>No pudimos aprobar tu cuenta</h1>
  </div>
  <div class="cuerpo">
    <p>Hola, ${d.nombre}. Revisamos el registro que enviaste y no pudimos aprobarlo.</p>
    <div class="aviso"><strong>Motivo:</strong> ${motivo}</div>
    <p>Esto no te deja afuera del salón:</p>
    <ol class="pasos">
      <li>Podés ingresar como invitado, con foto y nombre, sin aprobación.</li>
      <li>El metre puede registrarte desde el mostrador con tu documento en mano.</li>
      <li>Si querés reintentar, volvé a enviar el registro escaneando el código de tu documento.</li>
    </ol>
  </div>
  <div class="pie">
    ${R.nombre} · ${R.salon} · ${R.direccion}<br>
    Resuelto por ${d.resueltoPor ?? 'Administración'} · ${d.perfilResolutor ?? 'Supervisor'} · ${d.fecha}<br>
    Este correo se generó automáticamente al resolver tu registro institucional.
  </div>
</div></body></html>`;
}
