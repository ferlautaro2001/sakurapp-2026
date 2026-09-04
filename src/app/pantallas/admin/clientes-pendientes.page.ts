import { Component, computed, inject, signal } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { Usuario } from '../../nucleo/modelos/modelos';
import { EstadoUsuario, ROTULO_ESTADO_USUARIO } from '../../nucleo/modelos/enums';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';
import { DocumentoPipe } from '../../ui/documento.pipe';

const FILTROS = ['Todos', 'Pendiente', 'Aprobado', 'Rechazado'];

/** Qué significa cada estado para quien mira la ficha. */
const MENSAJE_ESTADO: Record<EstadoUsuario, string> = {
  PENDIENTE: 'Todavía no resolviste este registro. Podés aprobarlo o rechazarlo desde su fila.',
  APROBADO: 'La cuenta está habilitada: puede iniciar sesión en la aplicación.',
  RECHAZADO: 'La cuenta está bloqueada: no puede iniciar sesión en la aplicación.',
};



/**
 * Punto 6 · Listado de clientes pendientes de aprobación.
 *
 * Es la pantalla de inicio del dueño y del supervisor: entran acá al iniciar
 * sesión, sin tableros intermedios. Aceptar y rechazar viven dentro de la fila,
 * no en una barra global: la decisión es por persona. Van separados veinte
 * píxeles y con colores opuestos, para que sea imposible confundirlos de un
 * toque.
 */
@Component({
  selector: 'lm-clientes-pendientes',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap12">
        <lm-titulo [contador]="pendientes().length" bajada="Tocá una tarjeta para ver la ficha completa, o aceptá y rechazá desde su fila">
          Registros pendientes
        </lm-titulo>

        <lm-buscador
          marcador="Buscar por nombre o documento"
          [valor]="busqueda()"
          (cambiar)="busqueda.set($event)"
        />
        <lm-filtros [opciones]="filtros" [valor]="filtro()" (cambiar)="filtro.set($event)" />

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
          </lm-vacio>
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="registros" />
    </div>
  `,
  styles: [':host{display:flex;flex:1;min-height:0}'],
})
export class ClientesPendientesPage extends PaginaConSesion {
  private readonly usuarios = inject(UsuariosService);
  /** El mismo formato de documento que muestra la fila, también en el modal. */
  private readonly documento = new DocumentoPipe();

  protected readonly filtros = FILTROS;
  protected readonly filtro = signal('Pendiente');
  /** Fila en curso: evita resolver dos veces con un doble toque. */
  protected readonly resolviendo = signal<string | null>(null);
  protected readonly busqueda = signal('');

  protected readonly pendientes = computed(() => this.usuarios.pendientes());

  protected readonly visibles = computed(() => {
    const filtro = this.filtro();
    const texto = this.busqueda().trim().toLocaleLowerCase('es-AR');

    return this.usuarios
      .todos()
      .filter((u) => u.perfil === 'CLIENTE_REGISTRADO')
      .filter((u) => filtro === 'Todos' || ROTULO_ESTADO_USUARIO[u.estado] === filtro)
      .filter((u) => {
        if (!texto) return true;
        const nombre = this.usuarios.nombreCompleto(u).toLocaleLowerCase('es-AR');
        return nombre.includes(texto) || (u.dni ?? '').includes(texto);
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  });

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
      foto: this.usuarios.avatarSushi(cliente),
      detalle: [
        { rotulo: 'Nombres', valor: cliente.nombre },
        { rotulo: 'Apellidos', valor: cliente.apellido ?? 'Sin dato' },
        { rotulo: 'DNI', valor: this.documento.transform(cliente.dni) },
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
   * la persona. Confirmada la decisión, se muta el estado en Cloud SQL, suena
   * y vibra, y la fila desaparece del filtro de pendientes.
   */
  protected async resolver(cliente: Usuario, decision: 'aprobado' | 'rechazado'): Promise<void> {
    const aprobar = decision === 'aprobado';
    if (this.resolviendo()) return;

    const seguro = await this.preguntar({
      titulo: aprobar ? '¿Aprobás este registro?' : '¿Rechazás este registro?',
      mensaje: aprobar
        ? 'La cuenta queda habilitada para entrar a la aplicación.'
        : 'La cuenta queda bloqueada y la persona no va a poder iniciar sesión.',
      confirmar: aprobar ? 'Aprobar' : 'Rechazar',
      tono: aprobar ? 'exito' : 'peligro',
      icono: aprobar ? 'check' : 'close',
      foto: this.usuarios.avatarSushi(cliente),
      detalle: [
        { rotulo: 'Comensal', valor: this.usuarios.nombreCompleto(cliente) },
        { rotulo: 'DNI', valor: this.documento.transform(cliente.dni) },
        { rotulo: 'Correo', valor: cliente.email ?? 'Sin correo' },
      ],
    });
    if (!seguro) return;

    this.resolviendo.set(cliente.id);
    try {
      await this.cargando.durante(
        aprobar ? 'Aprobando el registro…' : 'Rechazando el registro…',
        () => this.usuarios.actualizarEstadoUsuario(cliente.id, aprobar ? 'APROBADO' : 'RECHAZADO'),
      );

      // El sonido y la vibración alcanzan como confirmación: la fila ya
      // desapareció del listado y no hace falta taparlo con un cartel.
      if (aprobar) {
        this.sonido.reproducir('exito');
        void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
      } else {
        this.sonido.reproducir('aviso');
        this.avisos.vibrarError();
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
    return this.filtro() === 'Pendiente'
      ? 'No hay registros pendientes'
      : `No hay registros en estado ${this.filtro().toLocaleLowerCase('es-AR')}`;
  }

  protected textoVacio(): string {
    if (this.busqueda().trim()) return 'Probá con otro nombre o con el número de documento completo.';
    return 'Cuando alguien se registre desde la aplicación, su solicitud aparece acá para que la apruebes o la rechaces.';
  }
}
