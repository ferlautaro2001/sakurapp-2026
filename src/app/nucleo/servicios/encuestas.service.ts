import { Injectable, computed, inject, signal } from '@angular/core';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { Pedido } from '../modelos/modelos';
import { FirestoreService } from './firestore.service';
import {
  CARITAS,
  DefinicionEncuesta,
  PreguntaEncuesta,
  RespuestasEncuesta,
  encuestaPorId,
  sortearEncuesta,
  tieneValor,
} from '../datos/encuestas';

export interface Porcion {
  rotulo: string;
  valor: number;
  color: string;
}

export interface PuntoSerie {
  rotulo: string;
  valor: number;
  /** Se dibuja el ícono en lugar del rótulo, que queda como nombre accesible. */
  icono?: string;
}

/**
 * La encuesta de una estadía, guardada en `encuestas/{idDelPedido}`: usar el
 * pedido como clave es lo que garantiza una sola por visita. Se crea al abrirla
 * por primera vez, con la variante ya sorteada, y pasa a `ENVIADA` al mandarla.
 */
export interface EncuestaDeVisita {
  pedidoId: string;
  variante: string;
  estado: 'EN_CURSO' | 'ENVIADA';
  respuestas: RespuestasEncuesta;
  enviadaEn?: string;
}

/** Una encuesta mandada, con sus cinco respuestas: la base de los gráficos. */
export interface EncuestaRespondida {
  id: string;
  variante: string;
  respuestas: RespuestasEncuesta;
  fecha: string;
}

/** El gráfico de una pregunta, ya con los totales de todos los que respondieron. */
export type GraficoEncuesta =
  | { tipo: 'torta'; id: string; titulo: string; porciones: Porcion[] }
  | { tipo: 'barras' | 'linea' | 'ranking'; id: string; titulo: string; puntos: PuntoSerie[] };

/** Colores de los gráficos: distinguibles entre sí y legibles sobre nieve. */
const COLORES = ['#C72657', '#FF7665', '#8F4B00', '#1B7A4C', '#7A2E86'];

const SEMANA = 7 * 24 * 3600 * 1000;

/**
 * Encuestas de satisfacción (punto 20).
 *
 * Guarda la encuesta de cada estadía —una sola por visita, con la variante
 * sorteada entre las tres— y lee las mandadas para los gráficos de resultados,
 * que se arman pregunta por pregunta para cada una de las tres encuestas.
 *
 * Todo vive en la colección `encuestas` de Firestore: las respuestas reales
 * tienen el id del pedido y las simuladas de cuatro semanas, el prefijo
 * `historica-` (las siembra `scripts/sembrar-encuestas.mjs`).
 */
@Injectable({ providedIn: 'root' })
export class EncuestasService {
  private readonly firestore = inject(FirestoreService);

  /** Las encuestas mandadas con todas sus respuestas, de las tres variantes. */
  readonly completas = signal<EncuestaRespondida[]>([]);

  readonly total = computed(() => this.completas().length);

  /** La lectura en curso, para que dos pantallas a la vez no lean dos veces. */
  private cargando: Promise<void> | null = null;

  /** La encuesta de cada estadía que ya se consultó, por pedido. */
  private readonly visitas = signal<Record<string, EncuestaDeVisita | null>>({});

  /**
   * Lee las encuestas mandadas. Se vuelve a leer cada vez que se entra a
   * Encuestas: los porcentajes tienen que incluir lo que mandaron los demás
   * comensales mientras tanto.
   */
  cargar(): Promise<void> {
    this.cargando ??= this.leer().finally(() => (this.cargando = null));
    return this.cargando;
  }

  private async leer(): Promise<void> {
    try {
      const snap = await getDocs(
        query(collection(this.firestore.obtenerDb(), 'encuestas'), where('estado', '==', 'ENVIADA')),
      );
      const leidas: EncuestaRespondida[] = snap.docs
        .map((d) => d.data())
        .filter((d) => encuestaPorId(d['variante']) && d['respuestas'])
        .map((d) => ({ id: d['pedidoId'], variante: d['variante'], respuestas: d['respuestas'], fecha: d['enviadaEn'] }));
      // Lo que se haya mandado mientras se leía no se pierde.
      const yaSumadas = this.completas().filter((c) => !leidas.some((x) => x.id === c.id));
      this.completas.set([...leidas, ...yaSumadas]);
    } catch (err) {
      console.warn('⚠️ No se pudieron leer las encuestas:', err);
    }
  }

  /** Si el comensal ya mandó la encuesta de esta estadía. */
  respondida(pedidoId: string | null | undefined): boolean {
    return !!pedidoId && this.visitas()[pedidoId]?.estado === 'ENVIADA';
  }

  /** La encuesta de la estadía, si ya se abrió alguna vez. */
  deLaVisita(pedidoId: string | null | undefined): EncuestaDeVisita | null {
    return pedidoId ? (this.visitas()[pedidoId] ?? null) : null;
  }

  definicionDe(visita: EncuestaDeVisita | null): DefinicionEncuesta | undefined {
    return encuestaPorId(visita?.variante);
  }

  /** Los gráficos de una encuesta, con lo de todos los que la respondieron. */
  graficosDe(definicion: DefinicionEncuesta): GraficoEncuesta[] {
    return graficosDeEncuesta(definicion, this.completas());
  }

  /** Lee si la estadía ya tiene encuesta, sin crear nada. */
  async consultar(pedidoId: string): Promise<EncuestaDeVisita | null> {
    if (pedidoId in this.visitas()) return this.visitas()[pedidoId];
    try {
      const snap = await getDoc(doc(this.firestore.obtenerDb(), 'encuestas', pedidoId));
      const visita = snap.exists() ? (snap.data() as EncuestaDeVisita) : null;
      this.visitas.update((v) => ({ ...v, [pedidoId]: visita }));
      return visita;
    } catch (err) {
      console.warn('⚠️ No se pudo consultar la encuesta de la visita:', err);
      return null;
    }
  }

  /**
   * Abre la encuesta de la estadía. La primera vez sortea cuál de las tres le
   * toca y la deja guardada: aunque cierre la aplicación, vuelve a la misma.
   */
  async abrir(pedido: Pedido): Promise<EncuestaDeVisita> {
    const existente = await this.consultar(pedido.id);
    if (existente) return existente;

    const visita: EncuestaDeVisita = {
      pedidoId: pedido.id,
      variante: sortearEncuesta().id,
      estado: 'EN_CURSO',
      respuestas: {},
    };
    this.visitas.update((v) => ({ ...v, [pedido.id]: visita }));
    try {
      await setDoc(doc(this.firestore.obtenerDb(), 'encuestas', pedido.id), {
        ...visita,
        clienteId: pedido.clienteUid || pedido.clienteId,
        mesaId: pedido.mesaId,
        mesaNumero: pedido.mesaNumero,
        creadaEn: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('⚠️ No se pudo guardar el sorteo de la encuesta:', err);
    }
    return visita;
  }

  /** Manda la encuesta con todo lo que respondió; su respuesta se suma enseguida a los gráficos. */
  async enviar(pedido: Pedido, definicion: DefinicionEncuesta, respuestas: RespuestasEncuesta): Promise<void> {
    if (this.respondida(pedido.id)) throw new Error('Ya respondiste la encuesta de esta visita.');

    const enviadaEn = new Date().toISOString();
    const visita: EncuestaDeVisita = {
      pedidoId: pedido.id,
      variante: definicion.id,
      estado: 'ENVIADA',
      respuestas,
      enviadaEn,
    };
    await setDoc(
      doc(this.firestore.obtenerDb(), 'encuestas', pedido.id),
      {
        ...visita,
        clienteId: pedido.clienteUid || pedido.clienteId,
        mesaId: pedido.mesaId,
        mesaNumero: pedido.mesaNumero,
      },
      { merge: true },
    );

    this.visitas.update((v) => ({ ...v, [pedido.id]: visita }));
    this.completas.update((lista) => [
      ...lista.filter((c) => c.id !== pedido.id),
      { id: pedido.id, variante: definicion.id, respuestas, fecha: enviadaEn },
    ]);
  }
}

/**
 * Un gráfico por pregunta, con las respuestas de todos los que respondieron
 * esa misma encuesta. El tipo de gráfico lo dice cada pregunta.
 */
export function graficosDeEncuesta(definicion: DefinicionEncuesta, todas: EncuestaRespondida[]): GraficoEncuesta[] {
  const deEsta = todas.filter((e) => e.variante === definicion.id);
  return definicion.pasos.flatMap((p) => p.preguntas).map((pregunta) => graficoDePregunta(pregunta, deEsta));
}

function graficoDePregunta(pregunta: PreguntaEncuesta, encuestas: EncuestaRespondida[]): GraficoEncuesta {
  // Sólo cuentan los que respondieron: la pregunta opcional sin responder no suma.
  const respondidas = encuestas.filter((e) => tieneValor(e.respuestas[pregunta.id]));
  const valores = respondidas.map((e) => e.respuestas[pregunta.id]);
  const pct = (cuantos: number) => (valores.length ? Math.round((cuantos / valores.length) * 100) : 0);
  const base = { id: pregunta.id, titulo: pregunta.titulo };

  switch (pregunta.grafico) {
    case 'barras': {
      // Las caritas se rotulan con la misma carita del control: los nombres no
      // entran en cinco columnas de un teléfono angosto.
      const caritas = pregunta.tipo === 'caritas';
      return {
        tipo: 'barras',
        ...base,
        puntos: [1, 2, 3, 4, 5].map((n) => ({
          rotulo: caritas ? CARITAS[n - 1].rotulo : `${n}`,
          ...(caritas ? { icono: CARITAS[n - 1].icono } : {}),
          valor: pct(valores.filter((v) => Number(v) === n).length),
        })),
      };
    }
    case 'linea':
      return { tipo: 'linea', ...base, puntos: promedioPorSemana(respondidas, pregunta.id) };
    case 'ranking':
      return {
        tipo: 'ranking',
        ...base,
        puntos: (pregunta.opciones ?? [])
          .map((rotulo) => ({ rotulo, valor: pct(valores.filter((v) => Array.isArray(v) && v.includes(rotulo)).length) }))
          .sort((a, b) => b.valor - a.valor),
      };
    case 'torta': {
      const [rotulos, cuenta] = porcionesDe(pregunta, valores);
      return {
        tipo: 'torta',
        ...base,
        porciones: rotulos.map((rotulo, i) => ({ rotulo, valor: cuenta(rotulo, i), color: COLORES[i % COLORES.length] })),
      };
    }
  }
}

/** Las porciones de una torta según lo que se haya elegido en la pregunta. */
function porcionesDe(
  pregunta: PreguntaEncuesta,
  valores: unknown[],
): [string[], (rotulo: string, i: number) => number] {
  switch (pregunta.tipo) {
    case 'nps': {
      // Las tres franjas de la escala: del 9 al 10, del 7 al 8 y del 0 al 6.
      const franjas = [(n: number) => n >= 9, (n: number) => n >= 7 && n <= 8, (n: number) => n <= 6];
      return [
        ['Lo recomiendan (9 y 10)', 'Neutrales (7 y 8)', 'No lo recomiendan (0 a 6)'],
        (_r, i) => valores.filter((v) => franjas[i](Number(v))).length,
      ];
    }
    case 'sino':
    case 'interruptor':
      return [['Sí', 'No'], (_r, i) => valores.filter((v) => v === (i === 0)).length];
    default:
      return [pregunta.opciones ?? [], (r) => valores.filter((v) => v === r).length];
  }
}

/** El promedio de un puntaje, semana a semana desde la primera respuesta. */
function promedioPorSemana(encuestas: EncuestaRespondida[], preguntaId: string): PuntoSerie[] {
  if (!encuestas.length) return [];
  const ordenadas = [...encuestas].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const primera = new Date(ordenadas[0].fecha).getTime();
  const semanas = new Map<number, number[]>();
  for (const e of ordenadas) {
    const semana = Math.floor((new Date(e.fecha).getTime() - primera) / SEMANA);
    semanas.set(semana, [...(semanas.get(semana) ?? []), Number(e.respuestas[preguntaId])]);
  }
  return [...semanas.entries()]
    .sort(([a], [b]) => a - b)
    .map(([semana, puntajes]) => ({
      rotulo: `Semana ${semana + 1}`,
      valor: Number((puntajes.reduce((t, p) => t + p, 0) / puntajes.length).toFixed(1)),
    }));
}
