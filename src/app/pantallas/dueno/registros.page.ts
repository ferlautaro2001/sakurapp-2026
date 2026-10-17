import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { DocumentoPipe, UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { Usuario } from '../../nucleo/modelos/modelos';
import { ROTULO_ESTADO_USUARIO } from '../../nucleo/modelos/enums';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-dueno-registros',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap12 lm-body--pantalla">
        <lm-titulo [contador]="pendientes().length">
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
          <div class="registros__lista">
            @for (cliente of visibles(); track cliente.id) {
              <lm-fila-pendiente
                [cliente]="cliente"
                [mostrarEstado]="filtro() === 'Todos'"
                (abrir)="verFicha(cliente)"
                (aceptar)="resolver(cliente, 'aprobado')"
                (rechazar)="resolver(cliente, 'rechazado')"
              />
            }
          </div>
        } @else {
          <lm-vacio icono="how_to_reg" [titulo]="tituloVacio()">
            {{ textoVacio() }}
          </lm-vacio>
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="registros" />
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }

      /* Tandas exactas: cada tarjeta mide justo una fracción del alto de la
         lista y el snap la ancla al tope, así cada parada muestra tarjetas
         enteras y el final de la lista coincide con la última parada. Con
         filas de alto natural (128 a 203px según tengan botones o el correo
         en dos renglones) siempre quedaba una a medias.
         Cuántas van por pantalla sale del alto de la lista: tienen que
         entrar enteras aun las más altas, que en un equipo angosto lo son
         más. La tarjeta se estira a su casilla y centra el contenido; si aun
         así no entrara, la casilla crece: nunca se corta. */
      .registros__lista {
        flex: 1 1 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        container: registros / size;
        overflow-y: auto;
        overscroll-behavior: contain;
        overflow-anchor: none;
        scroll-snap-type: y mandatory;
        scroll-padding: 0;
        scrollbar-width: none;
      }
      .registros__lista::-webkit-scrollbar { display: none; }
      .registros__lista > lm-fila-pendiente {
        --por: 1;
        flex: 0 0 calc((100cqh - (var(--por) - 1) * var(--space-3)) / var(--por));
        min-height: min-content;
        display: flex;
        flex-direction: column;
        scroll-snap-align: start;
        scroll-snap-stop: always;
      }
      lm-fila-pendiente ::ng-deep .lm-pending { flex: 1 1 auto; max-height: none; justify-content: center; }
      /* De a dos por pantalla. La tarjeta mide hasta ~177px, así que de a dos
         necesita al menos 326px de lista. Si la lista es más baja, la tarjeta se
         achica (foto, espacios y relleno) para que entren dos igual. */
      @container registros (min-height: 326px) { .registros__lista > lm-fila-pendiente { --por: 2; } }
      @container registros (max-height: 365px) {
        .registros__lista > lm-fila-pendiente ::ng-deep .lm-pending { padding: 7px 10px; gap: 6px; }
        .registros__lista > lm-fila-pendiente ::ng-deep .fila { gap: 4px; }
        .registros__lista > lm-fila-pendiente ::ng-deep .fila .lm-avatar { width: 44px; }
        .registros__lista > lm-fila-pendiente ::ng-deep .lm-pending__datos { gap: 2px; }
      }
    `,
  ],
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
      mensaje: '',
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
      mensaje: '',
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
