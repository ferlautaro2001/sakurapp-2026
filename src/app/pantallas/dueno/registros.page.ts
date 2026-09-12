import { Component, computed, inject, signal } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { DocumentoPipe, UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { Usuario } from '../../nucleo/modelos/modelos';
import { EstadoUsuario, ROTULO_ESTADO_USUARIO } from '../../nucleo/modelos/enums';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';
import { CorreoService } from '../../nucleo/servicios/correo.service';
import { NotificacionesService } from '../../nucleo/servicios/notificaciones.service';

/**
 * Los cuatro estados, en las mismas pestañas que usan la carta y los sectores:
 * entran los cuatro en el ancho de la pantalla, sin desplazamiento lateral.
 */
const FILTROS = [
  { valor: 'Todos', rotulo: 'Todos' },
  { valor: 'Pendiente', rotulo: 'Pendientes' },
  { valor: 'Aprobado', rotulo: 'Aprobados' },
  { valor: 'Rechazado', rotulo: 'Rechazados' },
];

/** Qué significa cada estado para quien mira la ficha. */
const MENSAJE_ESTADO: Record<EstadoUsuario, string> = {
  PENDIENTE: 'Todavía no resolviste este registro. Podés aprobarlo o rechazarlo desde su fila.',
  APROBADO: 'La cuenta está habilitada: puede iniciar sesión en la aplicación.',
  RECHAZADO: 'La cuenta está bloqueada: no puede iniciar sesión en la aplicación.',
};

/**
 * Punto 6 · Listado de clientes pendientes de aprobación.
 *
 * Aceptar y rechazar viven dentro de la fila, no en una barra global: la
 * decisión es por persona. Van separados veinte píxeles y con colores
 * opuestos, para que sea imposible confundirlos de un toque. El alta de
 * empleado es un ícono en el encabezado, no un botón flotante que taparía la
 * última fila.
 */
@Component({
  selector: 'lm-dueno-registros',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()">
        <lm-icono-boton
          accion
          icono="person_add"
          rotulo="Dar de alta un empleado"
          tono="primario"
          (presionar)="ir(['/dueno/alta-empleado'])"
        />
      </lm-encabezado>

      <div class="lm-body lm-body--gap12">
        <lm-titulo [contador]="pendientes().length" bajada="Tocá aceptar o rechazar en la fila de cada persona">
          Registros pendientes
        </lm-titulo>

        @if (avisoPush()) {
          <lm-push
            variante="interno"
            [titulo]="avisoPush()!.titulo"
            [cuerpo]="avisoPush()!.cuerpo"
            (presionar)="marcarLeidos()"
          />
        }

        <lm-buscador
          marcador="Buscar por nombre o documento"
          [valor]="busqueda()"
          (cambiar)="busqueda.set($event)"
        />
        <lm-pestanas [opciones]="filtros" [valor]="filtro()" (cambiar)="filtro.set($event)" />

        @if (visibles().length) {
          <div class="lm-list">
            @for (cliente of visibles(); track cliente.id) {
              <lm-fila-pendiente
                [cliente]="cliente"
                (abrir)="verFicha(cliente)"
                (aceptar)="resolver(cliente, 'aprobado')"
                (rechazar)="resolver(cliente, 'rechazado')"
              />
            }
          </div>
        } @else {
          <lm-vacio icono="how_to_reg" [titulo]="tituloVacio()">
            {{ textoVacio() }}
            <lm-boton
              accion
              variante="secondary"
              icono="person_add"
              [ancho]="false"
              (presionar)="ir(['/dueno/alta-empleado'])"
            >
              Dar de alta un empleado
            </lm-boton>
          </lm-vacio>
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="registros" />
    </div>
  `,
  styles: [':host{display:flex;flex:1;min-height:0}'],
})
export class DuenoRegistrosPage extends PaginaConSesion {
  private readonly usuarios = inject(UsuariosService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly correos = inject(CorreoService);
  /** El mismo formato de documento que muestra la fila, también en el modal. */
  private readonly documento = new DocumentoPipe();

  protected readonly filtros = FILTROS;
  /** Sobre qué fila se está guardando la decisión, para no repetirla. */
  protected readonly resolviendo = signal<string | null>(null);
  protected readonly filtro = signal('Pendiente');
  protected readonly busqueda = signal('');

  protected readonly pendientes = computed(() => this.usuarios.pendientes());

  protected readonly visibles = computed(() => {
    const filtro = this.filtro();
    const texto = this.busqueda().trim().toLocaleLowerCase('es-AR');

    return this.usuarios
      .todos()
      .filter((u) => u.perfil === 'CLIENTE_REGISTRADO')
      .filter((u) => filtro === 'Todos' || this.rotulo(u) === filtro)
      .filter((u) => {
        if (!texto) return true;
        const nombre = this.usuarios.nombreCompleto(u).toLocaleLowerCase('es-AR');
        return nombre.includes(texto) || (u.dni ?? '').includes(texto);
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  });

  protected avisoPush() {
    const id = this.usuario()?.id;
    return id ? (this.notificaciones.pendientesDe(id)[0] ?? null) : null;
  }

  protected marcarLeidos(): void {
    const id = this.usuario()?.id;
    if (id) this.notificaciones.marcarLeidos(id);
  }

  /**
   * Ficha ampliada de un comensal, aprobado, rechazado o pendiente.
   *
   * La foto de la fila es chica: tocarla abre la misma tarjeta que usa la
   * confirmación, con la cara grande y todos los datos, para poder mirar con
   * calma a quien ya se resolvió o al que está esperando.
   */
  protected verFicha(cliente: Usuario): void {
    void this.confirmacion.mostrar({
      titulo: this.usuarios.nombreCompleto(cliente),
      mensaje: MENSAJE_ESTADO[cliente.estado],
      // La ficha no decide nada: el botón va neutro. Un "Cerrar" en rojo o en
      // verde se lee como si aprobara o rechazara. El estado se cuenta con
      // palabras, en el mensaje y en su propia fila.
      confirmar: 'Cerrar',
      icono: 'close',
      foto: cliente.fotoUrl || this.usuarios.avatarSushi(cliente),
      detalle: [
        { rotulo: 'Nombres', valor: this.usuarios.nombrePropio(cliente.nombre) },
        { rotulo: 'Apellidos', valor: this.usuarios.nombrePropio(cliente.apellido) || 'Sin dato' },
        { rotulo: 'Documento', valor: this.documento.transform(cliente.dni) },
        { rotulo: 'Correo', valor: cliente.email ?? 'Sin correo' },
        { rotulo: 'Estado', valor: ROTULO_ESTADO_USUARIO[cliente.estado] },
        { rotulo: 'Se registró', valor: this.fecha(cliente.createdAt) },
      ],
    });
  }

  /** Fecha del registro en formato rioplatense, sin la hora. */
  private fecha(iso: string): string {
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return 'Sin dato';
    return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /**
   * Puntos 7 y 8 · aprobar o rechazar.
   *
   * Una sola confirmación, sobre el listado: el modal muestra la foto grande y
   * los datos, así que no hace falta una pantalla aparte para volver a mirar a
   * la persona —y menos una que vuelva a preguntar lo mismo—. Confirmada la
   * decisión se guarda el estado, sale el correo, se avisa al resto de los
   * administradores y la fila cambia de estado en el listado.
   */
  protected async resolver(cliente: Usuario, decision: 'aprobado' | 'rechazado'): Promise<void> {
    const aprobar = decision === 'aprobado';
    const resolutor = this.usuario();
    if (!resolutor || this.resolviendo()) return;

    const seguro = await this.preguntar({
      titulo: aprobar ? '¿Aprobás este registro?' : '¿Rechazás este registro?',
      mensaje: aprobar
        ? 'La cuenta queda habilitada para entrar a la aplicación.'
        : 'La cuenta queda bloqueada y la persona no va a poder iniciar sesión.',
      confirmar: aprobar ? 'Aprobar' : 'Rechazar',
      tono: aprobar ? 'exito' : 'peligro',
      icono: aprobar ? 'check' : 'close',
      foto: cliente.fotoUrl || this.usuarios.avatarSushi(cliente),
      detalle: [
        { rotulo: 'Comensal', valor: this.usuarios.nombreCompleto(cliente) },
        { rotulo: 'Documento', valor: this.documento.transform(cliente.dni) },
        { rotulo: 'Correo', valor: cliente.email ?? 'Sin correo' },
      ],
    });
    if (!seguro) return;

    this.resolviendo.set(cliente.id);
    try {
      await this.cargando.conEsperaMinima(
        aprobar ? 'Aprobando el registro…' : 'Rechazando el registro…',
        async () => {
          const actualizado = aprobar
            ? await this.usuarios.aprobar(cliente.id)
            : await this.usuarios.rechazar(cliente.id);
          const destinatario = actualizado ?? cliente;

          if (aprobar) {
            await this.correos.enviarAprobacion(destinatario, resolutor);
          } else {
            await this.correos.enviarRechazo(destinatario, resolutor);
          }

          // Al resto de los administradores, para que no lo resuelvan dos veces.
          const otros = this.usuarios
            .administradores()
            .filter((u) => u.id !== resolutor.id)
            .map((u) => u.id);
          if (otros.length) {
            await this.notificaciones.enviar(
              otros,
              aprobar ? 'Registro aprobado' : 'Registro rechazado',
              `${this.usuarios.nombreCompleto(destinatario)} fue ${aprobar ? 'aprobado' : 'rechazado'} por ${resolutor.nombre}.`,
              ['/dueno/registros'],
            );
          }
        },
        400,
      );

      // Aprobar y rechazar vibran distinto, para que se distingan sin mirar.
      if (aprobar) {
        void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
        this.avisos.exito('Cliente aprobado', `${cliente.nombre} ya puede entrar a la aplicación.`);
      } else {
        this.avisos.error('Cliente rechazado', `${cliente.nombre} no va a poder ingresar con esta cuenta.`);
      }
    } catch (error) {
      console.error('No se pudo resolver el registro:', error);
      this.avisos.error('No pudimos guardar la decisión', 'Revisá la conexión y volvé a intentarlo.');
    } finally {
      this.resolviendo.set(null);
    }
  }

  protected tituloVacio(): string {
    if (this.busqueda().trim()) return 'No encontramos a nadie con esa búsqueda';
    if (this.filtro() === 'Pendiente') return 'No hay registros pendientes';
    if (this.filtro() === 'Todos') return 'Todavía no hay registros';
    return `No hay registros en estado ${this.filtro().toLocaleLowerCase('es-AR')}`;
  }

  protected textoVacio(): string {
    if (this.busqueda().trim()) return 'Probá con otro nombre o con el número de documento completo.';
    return 'Cuando alguien se registre desde la aplicación, su solicitud aparece acá para que la apruebes o la rechaces.';
  }

  private rotulo(usuario: Usuario): string {
    return usuario.estado.charAt(0) + usuario.estado.slice(1).toLocaleLowerCase('es-AR');
  }
}
