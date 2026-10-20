import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EncuestaComponent } from './encuesta';
import { AvisosService } from '../nucleo/servicios/avisos.service';
import { ENCUESTAS, RespuestasEncuesta } from '../nucleo/datos/encuestas';

vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: vi.fn().mockResolvedValue(undefined), notification: vi.fn().mockResolvedValue(undefined), vibrate: vi.fn().mockResolvedValue(undefined) },
  ImpactStyle: { Light: 'LIGHT' },
  NotificationType: { Error: 'ERROR', Success: 'SUCCESS' },
}));

const sabores = ENCUESTAS.find((e) => e.id === 'sabores')!;
const app = ENCUESTAS.find((e) => e.id === 'app')!;

describe('lm-encuesta · una pregunta por paso', () => {
  let fixture: ComponentFixture<EncuestaComponent>;
  let el: HTMLElement;
  const avisos = { error: vi.fn(), exito: vi.fn(), info: vi.fn() };

  function montar(soloLectura = false, respuestas: RespuestasEncuesta | null = null, definicion = sabores): void {
    fixture = TestBed.createComponent(EncuestaComponent);
    fixture.componentRef.setInput('definicion', definicion);
    fixture.componentRef.setInput('soloLectura', soloLectura);
    fixture.componentRef.setInput('respuestas', respuestas);
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  const paso = () => el.querySelector('.enc__paso')!.textContent!.trim();
  const errores = () => el.querySelectorAll('.enc__pregunta--error').length;
  /** El texto de una casilla sin el nombre del ícono de tilde que lleva adentro. */
  const rotulo = (b: Element) => b.textContent!.replace('check', '').trim();

  function tocar(texto: string): void {
    const boton = [...el.querySelectorAll('button')].find((b) => b.textContent!.replace(/\s+/g, ' ').trim().includes(texto));
    if (!boton) throw new Error(`No hay un botón con "${texto}"`);
    boton.click();
    fixture.detectChanges();
  }

  function tocarEstrella(n: number): void {
    (el.querySelectorAll('.escala__icono')[n - 1] as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [EncuestaComponent],
      providers: [{ provide: AvisosService, useValue: avisos }],
    });
  });

  it('arranca en la pregunta 1/5, una sola por pantalla, sin nada marcado en rojo', () => {
    montar();
    expect(paso()).toBe('Pregunta 1/5');
    expect(el.querySelectorAll('.enc__pregunta')).toHaveLength(1);
    expect(errores()).toBe(0);
  });

  it('no deja avanzar sin responder: marca la pregunta y avisa con vibración', () => {
    montar();
    tocar('Siguiente');

    expect(paso()).toBe('Pregunta 1/5');
    expect(errores()).toBe(1);
    expect(avisos.error).toHaveBeenCalledWith('Te falta responder', expect.any(String));
  });

  it('al responder la pregunta marcada, deja de estar en rojo', () => {
    montar();
    tocar('Siguiente');
    tocarEstrella(4);

    expect(errores()).toBe(0);
    expect(el.querySelector('.enc__lectura')!.textContent).toContain('Bien');
  });

  it('con la pregunta respondida avanza, y Anterior vuelve sin perder lo elegido', () => {
    montar();
    tocarEstrella(4);
    tocar('Siguiente');
    expect(paso()).toBe('Pregunta 2/5');

    tocar('Anterior');
    expect(paso()).toBe('Pregunta 1/5');
    expect(el.querySelectorAll('.escala__icono .lleno').length).toBe(4);
  });

  it('recorre las cinco preguntas y entrega todas las respuestas al enviar', () => {
    montar();
    const terminado = vi.fn();
    fixture.componentInstance.terminar.subscribe(terminado);

    tocarEstrella(5);
    tocar('Siguiente');
    // El deslizador ya arranca con valor, así que cuenta como respondido.
    tocar('Siguiente');
    tocar('Justos');
    tocar('Siguiente');
    tocar('Sí');
    tocar('Siguiente');
    expect(paso()).toBe('Pregunta 5/5');

    // El multiple choice pide al menos una opción.
    tocar('Enviar encuesta');
    expect(terminado).not.toHaveBeenCalled();
    expect(errores()).toBe(1);

    tocar('Ramen');
    tocar('Mochis');
    tocar('Enviar encuesta');

    expect(terminado).toHaveBeenCalledTimes(1);
    expect(terminado.mock.calls[0][0]).toEqual({
      comida: 5,
      rapidez: 3,
      precios: 'Justos',
      repetiria: true,
      probar: ['Ramen', 'Mochis'],
    });
  });

  it('la pregunta del juego favorito avisa que es opcional y deja seguir sin elegir', () => {
    montar(false, { dinamica: 4 }, app);
    tocar('Siguiente');
    expect(paso()).toBe('Pregunta 2/5');
    expect(el.querySelector('.enc__opcional')!.textContent).toContain('no jugaste');

    tocar('Siguiente');
    expect(paso()).toBe('Pregunta 3/5');
    expect(errores()).toBe(0);
  });

  it('en la opcional, tocar de nuevo el juego elegido lo desmarca', () => {
    montar(false, { dinamica: 4 }, app);
    tocar('Siguiente');
    tocar('Tateti de sushis');
    expect(el.querySelector('.opcion.on')!.textContent).toContain('Tateti');
    tocar('Tateti de sushis');
    expect(el.querySelector('.opcion.on')).toBeNull();
  });

  it('el interruptor se prende y se apaga con el mismo toque, y avanza en cualquiera de los dos', () => {
    montar(false, { dinamica: 4, juego: null, facilidad: 4 }, app);
    tocar('Siguiente');
    tocar('Siguiente');
    tocar('Siguiente');
    expect(paso()).toBe('Pregunta 4/5');

    const llave = () => el.querySelector('.llave') as HTMLButtonElement;
    expect(llave().getAttribute('aria-checked')).toBe('false');
    llave().click();
    fixture.detectChanges();
    expect(llave().getAttribute('aria-checked')).toBe('true');
    llave().click();
    fixture.detectChanges();
    expect(llave().getAttribute('aria-checked')).toBe('false');

    tocar('Siguiente');
    expect(paso()).toBe('Pregunta 5/5');
  });

  it('en el multiple choice, tocar de nuevo una opción la saca', () => {
    montar(false, { comida: 4, rapidez: 3, precios: 'Algo caros', repetiria: false });
    for (let i = 0; i < 4; i++) tocar('Siguiente');

    tocar('Ramen');
    tocar('Gyozas');
    tocar('Ramen');
    expect([...el.querySelectorAll('.marca.on')].map(rotulo)).toEqual(['Gyozas']);
  });

  describe('Mis respuestas (bloqueada)', () => {
    const mias: RespuestasEncuesta = {
      comida: 3,
      rapidez: 5,
      precios: 'Muy convenientes',
      repetiria: false,
      probar: ['Sake'],
    };

    it('muestra lo que respondió y no deja cambiar nada', () => {
      montar(true, mias);
      expect(el.querySelectorAll('.escala__icono .lleno').length).toBe(3);

      tocarEstrella(5);
      expect(el.querySelectorAll('.escala__icono .lleno').length).toBe(3);
      expect([...el.querySelectorAll('.escala__icono')].every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
    });

    it('avanza sin pedir respuestas, nunca ofrece enviar y al final vuelve a los resultados', () => {
      montar(true, mias);
      const cerrar = vi.fn();
      const terminado = vi.fn();
      fixture.componentInstance.cerrar.subscribe(cerrar);
      fixture.componentInstance.terminar.subscribe(terminado);

      tocar('Siguiente');
      expect((el.querySelector('.deslizador input') as HTMLInputElement).value).toBe('5');
      tocar('Siguiente');
      expect(rotulo(el.querySelector('.opcion.on')!)).toBe('Muy convenientes');
      tocar('Siguiente');
      expect(el.querySelector('.sino__b--no')!.classList.contains('on')).toBe(true);
      tocar('Siguiente');

      expect(paso()).toBe('Pregunta 5/5');
      expect(errores()).toBe(0);
      expect(el.textContent).not.toContain('Enviar encuesta');
      expect(rotulo(el.querySelector('.marca.on')!)).toBe('Sake');

      tocar('Volver a los resultados');
      expect(cerrar).toHaveBeenCalledTimes(1);
      expect(terminado).not.toHaveBeenCalled();
    });
  });
});
