import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { EncuestaRespondida, EncuestasService, GraficoEncuesta, graficosDeEncuesta } from './encuestas.service';
import { FirestoreService } from './firestore.service';
import { Pedido } from '../modelos/modelos';
import { ENCUESTAS } from '../datos/encuestas';

/** Firestore falso en memoria: alcanza con documentos por ruta y un filtro por estado. */
const base = vi.hoisted(() => ({ docs: new Map<string, Record<string, unknown>>() }));

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, coleccion: string, id: string) => ({ ruta: `${coleccion}/${id}` }),
  collection: (_db: unknown, coleccion: string) => ({ coleccion }),
  where: (campo: string, _op: string, valor: unknown) => ({ campo, valor }),
  query: (col: { coleccion: string }, filtro: { campo: string; valor: unknown }) => ({ ...col, filtro }),
  getDoc: vi.fn(async (ref: { ruta: string }) => ({
    exists: () => base.docs.has(ref.ruta),
    data: () => base.docs.get(ref.ruta),
  })),
  setDoc: vi.fn(async (ref: { ruta: string }, datos: Record<string, unknown>, opciones?: { merge?: boolean }) => {
    const previo = opciones?.merge ? (base.docs.get(ref.ruta) ?? {}) : {};
    base.docs.set(ref.ruta, { ...previo, ...datos });
  }),
  getDocs: vi.fn(async (q: { coleccion: string; filtro: { campo: string; valor: unknown } }) => ({
    docs: [...base.docs.entries()]
      .filter(([ruta, d]) => ruta.startsWith(`${q.coleccion}/`) && d[q.filtro.campo] === q.filtro.valor)
      .map(([, d]) => ({ data: () => d })),
  })),
}));

function pedido(id: string): Pedido {
  return {
    id,
    mesaId: 'mesa-1',
    mesaNumero: 4,
    clienteId: 'cliente-1',
    clienteUid: 'uid-1',
    clienteNombre: 'Sofía',
    estadoGlobal: 'CUENTA_SOLICITADA',
    estadoCocina: 'LISTO',
    estadoBar: 'LISTO',
    motivoRechazo: null,
    rechazadoPorNombre: null,
    alcanceRechazo: null,
    observaciones: [],
    tiempoEstimado: 20,
    totalBruto: 10000,
    descuentoJuego: 0,
    montoDescuentoJuego: 0,
    totalFinal: 10000,
    confirmadoPorId: 'mozo-1',
    juegoIntentado: false,
    timestampCreacion: new Date().toISOString(),
    items: [],
  } as Pedido;
}

const sabores = ENCUESTAS.find((e) => e.id === 'sabores')!;
const ambiente = ENCUESTAS.find((e) => e.id === 'ambiente')!;
const app = ENCUESTAS.find((e) => e.id === 'app')!;

const respuestasSabores = {
  comida: 5,
  rapidez: 4,
  precios: 'Justos',
  repetiria: true,
  probar: ['Ramen', 'Mochis'],
};

function servicioNuevo(): EncuestasService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [EncuestasService, { provide: FirestoreService, useValue: { obtenerDb: () => ({}) } }],
  });
  return TestBed.inject(EncuestasService);
}

describe('EncuestasService · la encuesta de cada estadía (punto 20)', () => {
  let service: EncuestasService;

  beforeEach(() => {
    base.docs.clear();
    vi.clearAllMocks();
    service = servicioNuevo();
  });

  it('al abrirla por primera vez sortea una de las tres y la deja guardada en curso', async () => {
    const visita = await service.abrir(pedido('ped-1'));

    expect(ENCUESTAS.map((e) => e.id)).toContain(visita.variante);
    expect(visita.estado).toBe('EN_CURSO');
    expect(base.docs.get('encuestas/ped-1')).toMatchObject({ variante: visita.variante, estado: 'EN_CURSO' });
    expect(service.respondida('ped-1')).toBe(false);
  });

  it('al volver a abrirla trae la misma variante, aunque la aplicación se haya cerrado', async () => {
    const primera = await service.abrir(pedido('ped-1'));
    const otro = servicioNuevo();

    for (let i = 0; i < 20; i++) {
      expect((await otro.abrir(pedido('ped-1'))).variante).toBe(primera.variante);
    }
  });

  it('al enviarla queda ENVIADA con todas sus respuestas', async () => {
    await service.enviar(pedido('ped-1'), sabores, respuestasSabores);

    expect(service.respondida('ped-1')).toBe(true);
    expect(base.docs.get('encuestas/ped-1')).toMatchObject({
      estado: 'ENVIADA',
      variante: 'sabores',
      respuestas: respuestasSabores,
      mesaNumero: 4,
    });
  });

  it('es una sola por estadía: la segunda vez la rechaza y no pisa la primera', async () => {
    await service.enviar(pedido('ped-1'), sabores, respuestasSabores);

    await expect(service.enviar(pedido('ped-1'), sabores, { ...respuestasSabores, comida: 1 })).rejects.toThrow(
      'Ya respondiste',
    );
    expect((base.docs.get('encuestas/ped-1')?.['respuestas'] as Record<string, unknown>)['comida']).toBe(5);
  });

  it('una visita nueva (otro pedido) sí puede responder la suya', async () => {
    await service.enviar(pedido('ped-1'), sabores, respuestasSabores);
    await service.enviar(pedido('ped-2'), sabores, respuestasSabores);

    expect(service.respondida('ped-2')).toBe(true);
  });

  it('una encuesta abierta pero no enviada no se cuenta en los gráficos', async () => {
    await service.abrir(pedido('ped-1'));
    await service.cargar();

    expect(service.total()).toBe(0);
  });

  it('las enviadas en otra sesión vuelven a aparecer al releer', async () => {
    await service.enviar(pedido('ped-1'), sabores, respuestasSabores);
    const otro = servicioNuevo();
    await otro.cargar();

    expect(otro.total()).toBe(1);
    expect(otro.completas()[0]).toMatchObject({ id: 'ped-1', variante: 'sabores' });
  });

  it('se puede releer las veces que sea sin duplicar, y trae las que mandaron otros', async () => {
    await service.enviar(pedido('ped-1'), sabores, respuestasSabores);
    await service.cargar();
    await service.cargar();
    expect(service.total()).toBe(1);

    // Otro comensal manda la suya desde su teléfono: aparece al volver a entrar.
    base.docs.set('encuestas/otro', {
      pedidoId: 'otro', variante: 'ambiente', estado: 'ENVIADA', enviadaEn: new Date().toISOString(),
      respuestas: { nps: 9, limpieza: 5, mozo: 5, conociste: 'Redes sociales', mejorar: ['El wifi'] },
    });
    await service.cargar();
    expect(service.total()).toBe(2);
  });

  it('ignora encuestas de variantes que ya no existen', async () => {
    base.docs.set('encuestas/vieja', {
      pedidoId: 'vieja', variante: 'tiempos', estado: 'ENVIADA', enviadaEn: new Date().toISOString(), respuestas: { mozo: 4 },
    });
    await service.cargar();
    expect(service.total()).toBe(0);
  });
});

describe('Los gráficos de cada encuesta (punto 20)', () => {
  /** Cuatro respuestas viejas de "Sabores" y una de "Ambiente", que no tiene que contarse. */
  const historicas = (): EncuestaRespondida[] => [
    { id: 'h1', variante: 'sabores', fecha: '2026-09-22T12:00:00Z', respuestas: { comida: 5, rapidez: 3, precios: 'Algo caros', repetiria: true, probar: ['Ramen', 'Gyozas'] } },
    { id: 'h2', variante: 'sabores', fecha: '2026-09-23T12:00:00Z', respuestas: { comida: 5, rapidez: 4, precios: 'Algo caros', repetiria: true, probar: ['Ramen'] } },
    { id: 'h3', variante: 'sabores', fecha: '2026-09-30T12:00:00Z', respuestas: { comida: 4, rapidez: 5, precios: 'Justos', repetiria: false, probar: ['Sake'] } },
    { id: 'h4', variante: 'sabores', fecha: '2026-10-01T12:00:00Z', respuestas: { comida: 2, rapidez: 5, precios: 'Algo caros', repetiria: true, probar: ['Ramen', 'Sake'] } },
    { id: 'h5', variante: 'ambiente', fecha: '2026-10-01T12:00:00Z', respuestas: { nps: 3, limpieza: 1, mozo: 1, conociste: 'Redes sociales', mejorar: ['El wifi'] } },
  ];
  const grafico = (lista: GraficoEncuesta[], id: string) => lista.find((g) => g.id === id)! as any;

  it('arma un gráfico por pregunta, con el tipo que dice cada pregunta', () => {
    for (const encuesta of ENCUESTAS) {
      const graficos = graficosDeEncuesta(encuesta, historicas());
      expect(graficos.map((g) => g.tipo)).toEqual(encuesta.pasos.map((p) => p.preguntas[0].grafico));
    }
  });

  it('cuenta sólo las respuestas de esa misma encuesta y da los porcentajes justos', () => {
    const graficos = graficosDeEncuesta(sabores, historicas());

    // Estrellas: dos de cuatro pusieron 5, una 4 y una 2.
    expect(grafico(graficos, 'comida').puntos.map((p: { valor: number }) => p.valor)).toEqual([0, 25, 0, 25, 50]);
    // Precios: tres "Algo caros" y uno "Justos".
    const precios = grafico(graficos, 'precios').porciones;
    expect(precios.find((p: { rotulo: string }) => p.rotulo === 'Algo caros').valor).toBe(3);
    expect(precios.find((p: { rotulo: string }) => p.rotulo === 'Caros para lo que son').valor).toBe(0);
    // Repetiría: tres sí y un no.
    expect(grafico(graficos, 'repetiria').porciones.map((p: { valor: number }) => p.valor)).toEqual([3, 1]);
    // Rapidez: promedio de 3,5 la primera semana y de 5 la segunda.
    expect(grafico(graficos, 'rapidez').puntos).toEqual([
      { rotulo: 'Semana 1', valor: 3.5 },
      { rotulo: 'Semana 2', valor: 5 },
    ]);
  });

  it('el multiple choice dice qué parte eligió cada opción, de la más elegida a la menos', () => {
    const ranking = grafico(graficosDeEncuesta(sabores, historicas()), 'probar');
    expect(ranking.puntos.slice(0, 3)).toEqual([
      { rotulo: 'Ramen', valor: 75 },
      { rotulo: 'Sake', valor: 50 },
      { rotulo: 'Gyozas', valor: 25 },
    ]);
  });

  it('cuando llega una encuesta nueva, los porcentajes se actualizan', () => {
    const antes = graficosDeEncuesta(sabores, historicas());
    const nueva: EncuestaRespondida = {
      id: 'nueva',
      variante: 'sabores',
      fecha: '2026-10-02T12:00:00Z',
      respuestas: { comida: 1, rapidez: 5, precios: 'Justos', repetiria: false, probar: ['Gyozas'] },
    };
    const despues = graficosDeEncuesta(sabores, [...historicas(), nueva]);

    // Con cinco respuestas, cada una vale 20 %.
    expect(grafico(antes, 'comida').puntos[0].valor).toBe(0);
    expect(grafico(despues, 'comida').puntos.map((p: { valor: number }) => p.valor)).toEqual([20, 20, 0, 20, 40]);
    expect(grafico(despues, 'repetiria').porciones.map((p: { valor: number }) => p.valor)).toEqual([3, 2]);
    expect(grafico(despues, 'probar').puntos.find((p: { rotulo: string }) => p.rotulo === 'Gyozas').valor).toBe(40);
  });

  it('las caritas se rotulan con su nombre y la escala del 0 al 10 se agrupa en tres franjas', () => {
    const lista: EncuestaRespondida[] = [10, 9, 8, 7, 6, 0].map((nps, i) => ({
      id: `n${i}`,
      variante: 'ambiente',
      fecha: '2026-10-01T12:00:00Z',
      respuestas: { nps, limpieza: 4, mozo: 4, conociste: 'Redes sociales', mejorar: ['El wifi'] },
    }));
    const graficos = graficosDeEncuesta(ambiente, lista);
    expect(grafico(graficos, 'nps').porciones.map((p: { valor: number }) => p.valor)).toEqual([2, 2, 2]);
    expect(grafico(graficos, 'limpieza').puntos.map((p: { rotulo: string }) => p.rotulo)).toEqual([
      'Muy mal', 'Mal', 'Regular', 'Bien', 'Excelente',
    ]);
  });

  it('la pregunta opcional sin responder no cuenta en su torta, pero sí en las demás', () => {
    const lista: EncuestaRespondida[] = [
      { id: 'a', variante: 'app', fecha: '2026-10-01T12:00:00Z', respuestas: { dinamica: 5, juego: 'Ninja de Sakura', facilidad: 4, volveria: true, deseos: ['Más juegos'] } },
      { id: 'b', variante: 'app', fecha: '2026-10-01T12:00:00Z', respuestas: { dinamica: 4, juego: null, facilidad: 5, volveria: true, deseos: ['Pagar la cuenta'] } },
    ];
    const graficos = graficosDeEncuesta(app, lista);
    expect(grafico(graficos, 'juego').porciones.map((p: { valor: number }) => p.valor)).toEqual([1, 0, 0]);
    expect(grafico(graficos, 'volveria').porciones.map((p: { valor: number }) => p.valor)).toEqual([2, 0]);
  });

  it('el servicio suma al instante la que se acaba de mandar a los gráficos de esa encuesta', async () => {
    base.docs.clear();
    for (const h of historicas()) {
      base.docs.set(`encuestas/${h.id}`, { pedidoId: h.id, variante: h.variante, respuestas: h.respuestas, enviadaEn: h.fecha, estado: 'ENVIADA' });
    }
    const service = servicioNuevo();
    await service.cargar();
    expect(grafico(service.graficosDe(sabores), 'comida').puntos[0].valor).toBe(0);

    await service.enviar(pedido('ped-nuevo'), sabores, { comida: 1, rapidez: 5, precios: 'Justos', repetiria: false, probar: ['Gyozas'] });

    expect(grafico(service.graficosDe(sabores), 'comida').puntos[0].valor).toBe(20);
  });
});
