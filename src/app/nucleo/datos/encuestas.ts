/**
 * Punto 20 · las tres encuestas de satisfacción.
 *
 * Cada una tiene cinco preguntas, una por pantalla, y ninguna pregunta se
 * repite entre las tres: cada encuesta mira la visita desde otro lado.
 *
 *  - Sabores de la visita: la comida, de punta a punta.
 *  - Ambiente y servicio: el salón y la atención.
 *  - La app y los juegos: la visita manejada desde el teléfono.
 *
 * La consigna pide además que no se usen siempre los mismos controles:
 * adentro de cada encuesta ninguno se repite, y entre las tres aparecen
 * estrellas, corazones, caritas, deslizador, escala del 0 al 10, botones de sí
 * o no, interruptor, opciones sueltas y casillas. La última pregunta es
 * siempre un multiple choice que llena la pantalla.
 *
 * Cada pregunta dice con qué gráfico se muestran sus resultados, y cada
 * encuesta usa los cuatro: torta, barras, línea y barras horizontales.
 */

export type TipoPregunta =
  | 'estrellas'
  | 'corazones'
  | 'caritas'
  | 'deslizador'
  | 'nps'
  | 'opciones'
  | 'interruptor'
  | 'sino'
  | 'multiple';

/**
 * Cómo se muestran los resultados de la pregunta:
 *  - `torta`: lo que se elige una sola vez (opciones, sí o no, del 0 al 10);
 *  - `barras`: cuánta gente le puso cada puntaje;
 *  - `linea`: el promedio de un puntaje, semana a semana;
 *  - `ranking`: el multiple choice, en barras horizontales. Cada uno elige
 *    varias, así que no suman cien y una torta mentiría.
 */
export type TipoGrafico = 'torta' | 'barras' | 'linea' | 'ranking';

export type ValorRespuesta = number | string | boolean | string[] | null;

export interface PreguntaEncuesta {
  id: string;
  tipo: TipoPregunta;
  titulo: string;
  grafico: TipoGrafico;
  /** Opciones de `opciones` y `multiple`. */
  opciones?: string[];
  /** Rango del deslizador. */
  min?: number;
  max?: number;
  paso?: number;
  /** Rótulos de los dos extremos del deslizador. */
  extremos?: [string, string];
  /** Se puede seguir sin responderla; el texto dice cuándo. */
  opcional?: string;
}

export interface PasoEncuesta {
  titulo: string;
  preguntas: PreguntaEncuesta[];
}

export interface DefinicionEncuesta {
  id: string;
  nombre: string;
  /** Nombre corto, para el selector de resultados. */
  corto: string;
  pasos: PasoEncuesta[];
}

export type RespuestasEncuesta = Record<string, ValorRespuesta>;

/** Las cinco caritas, de la peor a la mejor: valen del 1 al 5. */
export const CARITAS = [
  { icono: 'sentiment_very_dissatisfied', rotulo: 'Muy mal' },
  { icono: 'sentiment_dissatisfied', rotulo: 'Mal' },
  { icono: 'sentiment_neutral', rotulo: 'Regular' },
  { icono: 'sentiment_satisfied', rotulo: 'Bien' },
  { icono: 'sentiment_very_satisfied', rotulo: 'Excelente' },
];

/** Una pregunta por paso: el paso lleva el nombre del tema. */
const paso = (titulo: string, pregunta: PreguntaEncuesta): PasoEncuesta => ({ titulo, preguntas: [pregunta] });

export const ENCUESTAS: DefinicionEncuesta[] = [
  {
    id: 'sabores',
    nombre: 'Sabores de la visita',
    corto: 'Sabores',
    pasos: [
      paso('La comida', { id: 'comida', tipo: 'estrellas', titulo: '¿Cómo estuvo la comida?', grafico: 'barras' }),
      paso('La rapidez', {
        id: 'rapidez',
        tipo: 'deslizador',
        titulo: '¿Qué tan rápido llegó tu pedido?',
        min: 1,
        max: 5,
        extremos: ['Tardó mucho', 'Volando'],
        grafico: 'linea',
      }),
      paso('Los precios', {
        id: 'precios',
        tipo: 'opciones',
        titulo: '¿Qué te parecieron los precios para lo que comiste?',
        opciones: ['Caros para lo que son', 'Algo caros', 'Justos', 'Muy convenientes'],
        grafico: 'torta',
      }),
      paso('La próxima', { id: 'repetiria', tipo: 'sino', titulo: '¿Pedirías lo mismo la próxima vez?', grafico: 'torta' }),
      paso('Para probar', {
        id: 'probar',
        tipo: 'multiple',
        titulo: '¿Qué te gustaría probar la próxima vez?',
        opciones: [
          'Rolls especiales',
          'Ramen',
          'Gyozas',
          'Tempura',
          'Bowls',
          'Sashimi',
          'Mochis',
          'Tragos de autor',
          'Sake',
          'Té matcha',
        ],
        grafico: 'ranking',
      }),
    ],
  },
  {
    id: 'ambiente',
    nombre: 'Ambiente y servicio',
    corto: 'Ambiente',
    pasos: [
      paso('En general', { id: 'nps', tipo: 'nps', titulo: 'Del 0 al 10, ¿cuánto nos recomendarías?', grafico: 'torta' }),
      paso('La limpieza', { id: 'limpieza', tipo: 'caritas', titulo: '¿Qué tan limpio estaba el salón?', grafico: 'barras' }),
      paso('La atención', { id: 'mozo', tipo: 'corazones', titulo: '¿Cómo te atendió el mozo?', grafico: 'linea' }),
      paso('Cómo llegaste', {
        id: 'conociste',
        tipo: 'opciones',
        titulo: '¿Cómo nos conociste?',
        opciones: ['Redes sociales', 'Me lo recomendaron', 'Pasaba por acá', 'Buscando en internet', 'Ya era cliente'],
        grafico: 'torta',
      }),
      paso('A mejorar', {
        id: 'mejorar',
        tipo: 'multiple',
        titulo: '¿Qué mejorarías del salón?',
        opciones: [
          'La música',
          'La iluminación',
          'La temperatura',
          'Las sillas',
          'Los baños',
          'El ruido',
          'La decoración',
          'El wifi',
          'Los enchufes',
          'Nada, todo bien',
        ],
        grafico: 'ranking',
      }),
    ],
  },
  {
    id: 'app',
    nombre: 'La app y los juegos',
    corto: 'La app',
    pasos: [
      paso('La dinámica', {
        id: 'dinamica',
        tipo: 'caritas',
        titulo: '¿Qué te pareció manejar toda tu visita desde la app?',
        grafico: 'barras',
      }),
      paso('Los juegos', {
        id: 'juego',
        tipo: 'opciones',
        titulo: '¿Cuál juego te gustó más?',
        opciones: ['Ninja de Sakura', 'Emparejando sushis', 'Tateti de sushis'],
        opcional: 'Si no jugaste a ninguno, podés seguir sin responder.',
        grafico: 'torta',
      }),
      paso('Pedir desde el teléfono', {
        id: 'facilidad',
        tipo: 'deslizador',
        titulo: '¿Qué tan fácil fue pedir desde el teléfono?',
        min: 1,
        max: 5,
        extremos: ['Muy difícil', 'Muy fácil'],
        grafico: 'linea',
      }),
      paso('La próxima visita', {
        id: 'volveria',
        tipo: 'interruptor',
        titulo: '¿Volverías a usar la app en tu próxima visita?',
        grafico: 'torta',
      }),
      paso('Lo que falta', {
        id: 'deseos',
        tipo: 'multiple',
        titulo: '¿Qué más te gustaría hacer desde la app?',
        opciones: [
          'Pagar la cuenta',
          'Dividir la cuenta',
          'Reservar una mesa',
          'Repetir un pedido',
          'Juntar puntos',
          'Ver la espera en vivo',
          'Dejar propina',
          'Llamar al mozo',
          'Más juegos',
          'Pedir para llevar',
        ],
        grafico: 'ranking',
      }),
    ],
  },
];

export function encuestaPorId(id: string | null | undefined): DefinicionEncuesta | undefined {
  return ENCUESTAS.find((e) => e.id === id);
}

/** Una de las tres, al azar. Se sortea una vez por estadía y queda guardada. */
export function sortearEncuesta(): DefinicionEncuesta {
  return ENCUESTAS[Math.floor(Math.random() * ENCUESTAS.length)];
}

/** El valor con el que arranca cada control antes de que lo toquen. */
export function valorInicial(pregunta: PreguntaEncuesta): ValorRespuesta {
  switch (pregunta.tipo) {
    case 'interruptor':
      return false;
    case 'deslizador': {
      const min = pregunta.min ?? 1;
      const max = pregunta.max ?? 5;
      const salto = pregunta.paso ?? 1;
      return min + Math.round((max - min) / 2 / salto) * salto;
    }
    case 'multiple':
      return [];
    default:
      return null;
  }
}

export function respuestasIniciales(definicion: DefinicionEncuesta): RespuestasEncuesta {
  const respuestas: RespuestasEncuesta = {};
  for (const p of definicion.pasos) {
    for (const pregunta of p.preguntas) respuestas[pregunta.id] = valorInicial(pregunta);
  }
  return respuestas;
}

/** Si la pregunta deja avanzar. La opcional nunca frena. */
export function estaRespondida(pregunta: PreguntaEncuesta, valor: ValorRespuesta | undefined): boolean {
  return !!pregunta.opcional || tieneValor(valor);
}

/** Si hay algo elegido de verdad: el cero y el no cuentan; el vacío, no. */
export function tieneValor(valor: ValorRespuesta | undefined): boolean {
  if (valor === null || valor === undefined) return false;
  if (Array.isArray(valor)) return valor.length > 0;
  if (typeof valor === 'string') return valor.trim().length > 0;
  return true;
}
