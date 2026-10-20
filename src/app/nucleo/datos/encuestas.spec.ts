import { describe, it, expect } from 'vitest';
import {
  ENCUESTAS,
  DefinicionEncuesta,
  estaRespondida,
  respuestasIniciales,
  sortearEncuesta,
  tieneValor,
  valorInicial,
} from './encuestas';

const preguntasDe = (e: DefinicionEncuesta) => e.pasos.flatMap((p) => p.preguntas);
const todas = () => ENCUESTAS.flatMap(preguntasDe);
/** El texto de una pregunta sin signos ni mayúsculas, para comparar de verdad. */
const normal = (t: string) => t.toLowerCase().replace(/[¿?¡!,.]/g, '').replace(/\s+/g, ' ').trim();

describe('Las tres encuestas de satisfacción', () => {
  it('son tres, con identificadores y nombres distintos', () => {
    expect(ENCUESTAS).toHaveLength(3);
    expect(new Set(ENCUESTAS.map((e) => e.id)).size).toBe(3);
    expect(new Set(ENCUESTAS.map((e) => e.corto)).size).toBe(3);
  });

  it('ninguna pregunta se repite entre las tres: quince preguntas distintas', () => {
    const titulos = todas().map((p) => normal(p.titulo));
    expect(titulos).toHaveLength(15);
    expect(new Set(titulos).size).toBe(15);
  });

  it('tampoco se repiten los identificadores de pregunta, ni siquiera entre encuestas', () => {
    const ids = todas().map((p) => p.id);
    expect(new Set(ids).size).toBe(15);
  });

  it('ningún multiple choice repite la lista de opciones de otro', () => {
    const listas = todas()
      .filter((p) => p.tipo === 'multiple')
      .map((p) => p.opciones!.join('|'));
    expect(new Set(listas).size).toBe(listas.length);
  });

  it('pregunta por los juegos y por la dinámica de manejar la visita desde la app', () => {
    const titulos = todas().map((p) => normal(p.titulo));
    expect(titulos).toContain('cuál juego te gustó más');
    expect(titulos.some((t) => t.includes('desde la app'))).toBe(true);
  });

  it('la del juego favorito es la única opcional y ofrece los tres juegos', () => {
    const opcionales = todas().filter((p) => p.opcional);
    expect(opcionales.map((p) => p.id)).toEqual(['juego']);
    expect(opcionales[0].opciones).toEqual(['Ninja de Sakura', 'Emparejando sushis', 'Tateti de sushis']);
  });

  for (const encuesta of ENCUESTAS) {
    describe(encuesta.nombre, () => {
      it('tiene cinco preguntas, una por paso', () => {
        expect(encuesta.pasos).toHaveLength(5);
        for (const paso of encuesta.pasos) expect(paso.preguntas).toHaveLength(1);
      });

      it('termina siempre con un multiple choice que llena la pantalla', () => {
        const ultima = encuesta.pasos[4].preguntas[0];
        expect(ultima.tipo).toBe('multiple');
        expect(ultima.opciones!.length).toBeGreaterThanOrEqual(8);
      });

      it('no repite controles: cada pregunta usa uno distinto', () => {
        const tipos = preguntasDe(encuesta).map((p) => p.tipo);
        expect(new Set(tipos).size).toBe(tipos.length);
      });

      it('muestra sus resultados con los cuatro tipos de gráfico', () => {
        const graficos = new Set(preguntasDe(encuesta).map((p) => p.grafico));
        expect([...graficos].sort()).toEqual(['barras', 'linea', 'ranking', 'torta']);
      });

      it('cada gráfico va con un control que lo puede dibujar', () => {
        for (const p of preguntasDe(encuesta)) {
          if (p.grafico === 'barras' || p.grafico === 'linea') {
            expect(['estrellas', 'corazones', 'caritas', 'deslizador']).toContain(p.tipo);
          }
          if (p.grafico === 'ranking') expect(p.tipo).toBe('multiple');
          if (p.grafico === 'torta') expect(['opciones', 'sino', 'interruptor', 'nps']).toContain(p.tipo);
        }
      });
    });
  }

  it('entre las tres usan los nueve controles', () => {
    expect(new Set(todas().map((p) => p.tipo)).size).toBe(9);
  });

  it('el sorteo devuelve alguna de las tres y, repetido, reparte entre todas', () => {
    const salidas = new Set<string>();
    for (let i = 0; i < 300; i++) salidas.add(sortearEncuesta().id);
    expect([...salidas].sort()).toEqual(ENCUESTAS.map((e) => e.id).sort());
  });
});

describe('Valores iniciales y preguntas respondidas', () => {
  it('el deslizador arranca en el medio de su rango y respeta el paso', () => {
    expect(valorInicial({ id: 'a', tipo: 'deslizador', titulo: '', grafico: 'linea', min: 1, max: 5 })).toBe(3);
    expect(valorInicial({ id: 'b', tipo: 'deslizador', titulo: '', grafico: 'linea', min: 0, max: 60, paso: 5 })).toBe(30);
  });

  it('el interruptor arranca en no, el multiple choice vacío y el resto sin responder', () => {
    expect(valorInicial({ id: 'a', tipo: 'interruptor', titulo: '', grafico: 'torta' })).toBe(false);
    expect(valorInicial({ id: 'c', tipo: 'multiple', titulo: '', grafico: 'ranking' })).toEqual([]);
    expect(valorInicial({ id: 'd', tipo: 'estrellas', titulo: '', grafico: 'barras' })).toBeNull();
  });

  it('una encuesta recién abierta tiene sin responder la pregunta de las estrellas', () => {
    const encuesta = ENCUESTAS[0];
    const comida = preguntasDe(encuesta).find((p) => p.id === 'comida')!;
    expect(estaRespondida(comida, respuestasIniciales(encuesta)['comida'])).toBe(false);
  });

  it('el multiple choice vacío no cuenta; el no y el cero sí son respuestas', () => {
    expect(tieneValor([])).toBe(false);
    expect(tieneValor(['Ramen'])).toBe(true);
    expect(tieneValor(false)).toBe(true);
    expect(tieneValor(0)).toBe(true);
    expect(tieneValor(null)).toBe(false);
  });

  it('la opcional deja avanzar sin responder; las otras no', () => {
    const juego = todas().find((p) => p.id === 'juego')!;
    const dinamica = todas().find((p) => p.id === 'dinamica')!;
    expect(estaRespondida(juego, null)).toBe(true);
    expect(estaRespondida(dinamica, null)).toBe(false);
  });
});
