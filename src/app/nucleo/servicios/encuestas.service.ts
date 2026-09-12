import { Injectable, computed, signal } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDataConnect } from 'firebase/data-connect';
import { listEncuestas, connectorConfig } from '../../../dataconnect-generated';
import { environment } from '../../../environments/environment';
import { RespuestaEncuesta } from '../modelos/modelos';

export interface Porcion {
  rotulo: string;
  valor: number;
  color: string;
}

export interface PuntoSerie {
  rotulo: string;
  valor: number;
}

/** Colores de los gráficos: distinguibles entre sí y legibles sobre nieve. */
const COLORES = ['#C72657', '#FF7665', '#8F4B00', '#1B7A4C', '#7A2E86'];

/**
 * Resultados de las encuestas anteriores (US-5.1 · TASK-5.1.1.2).
 *
 * Sólo lectura: cargar encuestas nuevas es materia de una entrega posterior.
 * Acá se agregan las respuestas que ya están en Cloud SQL, que es lo único a
 * lo que el comensal puede acceder mientras espera su mesa.
 *
 * Mientras la base no tenga encuestas cargadas —los pedidos, de los que cuelga
 * cada encuesta, son de una entrega posterior— la pantalla muestra un juego de
 * respuestas de muestra, siempre anunciado como tal en pantalla: nunca se
 * hacen pasar por datos reales del salón.
 */
@Injectable({ providedIn: 'root' })
export class EncuestasService {
  readonly respuestas = signal<RespuestaEncuesta[]>([]);

  /** Verdadero cuando lo que se está mostrando son respuestas de muestra. */
  readonly muestra = signal(false);

  private cargado = false;

  readonly total = computed(() => this.respuestas().length);

  /** Desde cuándo hay datos, para poder decirlo en pantalla sin mentir. */
  readonly desde = computed(() => this.ordenadas()[0]?.fecha ?? null);

  readonly promedioMozo = computed(() => this.promedio((r) => r.calificacionMozo));
  readonly promedioLimpieza = computed(() => this.promedio((r) => r.nivelLimpieza));

  /** Porcentaje de comensales que recomendarían el salón. */
  readonly recomendarian = computed(() => {
    const lista = this.respuestas();
    if (!lista.length) return 0;
    return Math.round((lista.filter((r) => r.recomendaria).length / lista.length) * 100);
  });

  /** Torta: qué se llevó cada comensal como lo mejor de la visita. */
  readonly aspectosFavoritos = computed<Porcion[]>(() => {
    const conteo = new Map<string, number>();
    for (const respuesta of this.respuestas()) {
      const aspecto = respuesta.aspectoFavorito.trim() || 'Sin responder';
      conteo.set(aspecto, (conteo.get(aspecto) ?? 0) + 1);
    }
    return [...conteo.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([rotulo, valor], i) => ({ rotulo, valor, color: COLORES[i % COLORES.length] }));
  });

  /** Barras: cuánta gente le puso cada puntaje a la atención del mozo. */
  readonly puntajesDelMozo = computed<PuntoSerie[]>(() => {
    const lista = this.respuestas();
    return [1, 2, 3, 4, 5].map((puntaje) => ({
      rotulo: `${puntaje}`,
      valor: lista.filter((r) => r.calificacionMozo === puntaje).length,
    }));
  });

  /** Línea: cómo evolucionó la limpieza semana a semana. */
  readonly limpiezaPorSemana = computed<PuntoSerie[]>(() => {
    const lista = this.ordenadas();
    if (!lista.length) return [];

    const primera = new Date(lista[0].fecha).getTime();
    const semanas = new Map<number, number[]>();

    for (const respuesta of lista) {
      const semana = Math.floor((new Date(respuesta.fecha).getTime() - primera) / (7 * 24 * 3600 * 1000));
      const acumulado = semanas.get(semana) ?? [];
      acumulado.push(respuesta.nivelLimpieza);
      semanas.set(semana, acumulado);
    }

    return [...semanas.entries()]
      .sort(([a], [b]) => a - b)
      .map(([semana, puntajes]) => ({
        rotulo: `Semana ${semana + 1}`,
        valor: Number((puntajes.reduce((t, p) => t + p, 0) / puntajes.length).toFixed(2)),
      }));
  });

  /** Trae las encuestas históricas de Cloud SQL. Se lee una vez por sesión. */
  async cargar(): Promise<void> {
    if (this.cargado) return;
    this.cargado = true;

    try {
      const app = getApps().length ? getApp() : initializeApp(environment.firebase);
      const res = await listEncuestas(getDataConnect(app, connectorConfig));
      const encuestas = res?.data?.encuestas ?? [];
      if (encuestas.length) {
        this.muestra.set(false);
        this.respuestas.set(
          encuestas.map((e) => ({
            id: e.id,
            calificacionMozo: e.calificacionMozo,
            nivelLimpieza: e.nivelLimpieza,
            recomendaria: e.recomendaria,
            aspectoFavorito: e.aspectoFavorito,
            fecha: e.timestamp,
          })),
        );
        return;
      }
    } catch (err) {
      console.warn('⚠️ No se pudieron leer las encuestas de Data Connect:', err);
    }

    this.muestra.set(true);
    this.respuestas.set(respuestasDeMuestra());
  }

  private readonly ordenadas = computed(() =>
    [...this.respuestas()].sort((a, b) => a.fecha.localeCompare(b.fecha)),
  );

  private promedio(de: (r: RespuestaEncuesta) => number): number {
    const lista = this.respuestas();
    if (!lista.length) return 0;
    return Number((lista.reduce((total, r) => total + de(r), 0) / lista.length).toFixed(1));
  }
}

/**
 * Cuatro semanas de respuestas de muestra, para poder recorrer y mostrar los
 * gráficos antes de que la base tenga encuestas propias. La pantalla avisa que
 * son de muestra cada vez que las usa.
 */
function respuestasDeMuestra(): RespuestaEncuesta[] {
  const aspectos = ['La comida', 'La atención', 'El ambiente', 'Los precios', 'La rapidez'];
  const mozo = [5, 4, 5, 3, 4, 5, 5, 4, 2, 4, 5, 3, 5, 4, 4, 5, 5, 4, 3, 5, 4, 5, 5, 4];
  const limpieza = [4, 5, 4, 4, 3, 5, 5, 4, 4, 5, 5, 4, 5, 5, 4, 5, 4, 5, 5, 4, 5, 5, 4, 5];
  const arranque = new Date();
  arranque.setDate(arranque.getDate() - 28);

  return mozo.map((puntaje, i) => {
    const fecha = new Date(arranque);
    // Seis respuestas por semana, repartidas de a un día.
    fecha.setDate(arranque.getDate() + Math.floor(i / 6) * 7 + (i % 6));
    return {
      id: `muestra-${i + 1}`,
      calificacionMozo: puntaje,
      nivelLimpieza: limpieza[i],
      recomendaria: puntaje >= 4,
      aspectoFavorito: aspectos[i % aspectos.length],
      fecha: fecha.toISOString(),
    };
  });
}
