import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AlmacenService } from '../datos/almacen.service';
import { nuevoId } from '../datos/semilla';
import { CorreoEnviado, Usuario } from '../modelos/modelos';
import { ROTULO_PERFIL } from '../modelos/enums';
import {
  DatosCorreo,
  correoAprobacion,
  correoRechazo,
  correoRegistroRecibido,
} from './plantillas-correo';

const LOGO = 'assets/img/logo-badge.png';
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

let logoIncrustado: string | null = null;

async function logoComoDatos(): Promise<string> {
  if (logoIncrustado) return logoIncrustado;
  try {
    const respuesta = await fetch(LOGO);
    const binario = await respuesta.blob();
    logoIncrustado = await new Promise<string>((resolver, rechazar) => {
      const lector = new FileReader();
      lector.onload = () => resolver(String(lector.result));
      lector.onerror = () => rechazar(lector.error);
      lector.readAsDataURL(binario);
    });
  } catch {
    logoIncrustado = LOGO;
  }
  return logoIncrustado;
}

/**
 * Servicio transaccional institucional de despacho de correos electrónicos vía API Brevo.
 *
 * Requisitos US-3.2:
 * 1. Automático e institucional: no utiliza casillas de correo personales de alumnos/devs.
 * 2. Remitente oficial SakurApp (no-reply@sakur.app).
 * 3. 3 plantillas HTML con identidad Sakura: Registro Recibido, Aprobación, Rechazo.
 * 4. Despacho asíncrono sin bloquear la interfaz de usuario.
 */
@Injectable({ providedIn: 'root' })
export class CorreoService {
  private readonly almacen = inject(AlmacenService);

  /**
   * Correo automático 1 · Confirmación de registro recibido en revisión (Punto 5).
   */
  async enviarConfirmacionRegistro(cliente: Usuario): Promise<CorreoEnviado> {
    const datos = await this.armarDatos(cliente);
    return this.enviar({
      para: cliente.email ?? '',
      asunto: `${environment.restaurante.nombre} · Recibimos tu registro`,
      plantilla: 'REGISTRO_RECIBIDO',
      cuerpoHtml: correoRegistroRecibido(datos),
    });
  }

  /**
   * Correo automático 2 · Aprobación de cuenta y bienvenida (Punto 8).
   */
  async enviarAprobacion(cliente: Usuario, resolutor: Usuario): Promise<CorreoEnviado> {
    const datos = await this.armarDatos(cliente, resolutor);
    return this.enviar({
      para: cliente.email ?? '',
      asunto: `${environment.restaurante.nombre} · ¡Tu cuenta está aprobada!`,
      plantilla: 'APROBACION',
      cuerpoHtml: correoAprobacion(datos),
    });
  }

  /**
   * Correo automático 3 · Solicitud rechazada con motivo explicativo (Punto 7).
   */
  async enviarRechazo(cliente: Usuario, resolutor: Usuario, motivo?: string): Promise<CorreoEnviado> {
    const datos = { ...(await this.armarDatos(cliente, resolutor)), motivo };
    return this.enviar({
      para: cliente.email ?? '',
      asunto: `${environment.restaurante.nombre} · Estado de tu solicitud de cuenta`,
      plantilla: 'RECHAZO',
      cuerpoHtml: correoRechazo(datos),
    });
  }

  private async armarDatos(cliente: Usuario, resolutor?: Usuario): Promise<DatosCorreo> {
    return {
      nombre: cliente.nombre,
      apellido: cliente.apellido ?? '',
      dni: this.formatearDni(cliente.dni),
      correo: cliente.email ?? '',
      resueltoPor: resolutor ? `${resolutor.nombre} ${resolutor.apellido ?? ''}`.trim() : undefined,
      perfilResolutor: resolutor ? ROTULO_PERFIL[resolutor.perfil] : undefined,
      fecha: new Date().toLocaleString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      logoUrl: await logoComoDatos(),
    };
  }

  private async enviar(
    base: Omit<CorreoEnviado, 'id' | 'enviadoEn' | 'entregado' | 'detalle'>,
  ): Promise<CorreoEnviado> {
    let entregado = false;
    let detalle = 'Pendiente de entrega';

    const apiKey = environment.correo.brevoApiKey;
    const remitenteEmail = environment.correo.remitente || 'no-reply@sakur.app';
    const remitenteNombre = environment.correo.nombreRemitente || 'SakurApp';

    if (apiKey && base.para) {
      try {
        const payload = {
          sender: { name: remitenteNombre, email: remitenteEmail },
          to: [{ email: base.para.trim(), name: base.para.split('@')[0] }],
          subject: base.asunto,
          htmlContent: base.cuerpoHtml,
        };

        const respuesta = await fetch(BREVO_ENDPOINT, {
          method: 'POST',
          headers: {
            'api-key': apiKey,
            accept: 'application/json',
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (respuesta.ok) {
          const resultado = await respuesta.json().catch(() => ({}));
          entregado = true;
          detalle = `Despachado exitosamente por Brevo (${resultado.messageId || 'OK'})`;
          console.log(`📧 Email [${base.plantilla}] enviado a ${base.para}:`, resultado);
        } else {
          const errorTexto = await respuesta.text().catch(() => '');
          detalle = `Brevo HTTP ${respuesta.status}: ${errorTexto}`;
          console.warn(`⚠️ Error en despacho de email (${respuesta.status}):`, errorTexto);
        }
      } catch (err: any) {
        detalle = `Fallo de conexión al relay: ${err?.message || err}`;
        console.warn('⚠️ No se pudo conectar a la API de correo Brevo:', err);
      }
    } else {
      detalle = 'No se envió: clave de Brevo no configurada o destinatario vacío.';
    }

    const correo: CorreoEnviado = {
      ...base,
      id: nuevoId(),
      enviadoEn: new Date().toISOString(),
      entregado,
      detalle,
    };

    try {
      await this.almacen.guardarCorreos([correo, ...this.almacen.correos()].slice(0, 50));
    } catch {
      // Si falla la persistencia local, el envío ya ocurrió
    }

    return correo;
  }

  private formatearDni(dni: string | null): string {
    if (!dni) return 'Sin documento';
    return dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}
