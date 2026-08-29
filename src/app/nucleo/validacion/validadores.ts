import { signal } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validadores del dominio.
 *
 * Cada uno devuelve un mensaje concreto y accionable, junto al campo:
 * "El documento tiene que tener ocho dígitos", nunca "Error de validación".
 */

const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const CUIL = /^\d{2}-?\d{8}-?\d$/;

export function requerido(mensaje: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    const vacio = valor === null || valor === undefined || String(valor).trim() === '';
    return vacio ? { lm: mensaje } : null;
  };
}

export function soloLetras(mensaje = 'Usá solamente letras y espacios'): ValidatorFn {
  return (control) => {
    const valor = String(control.value ?? '').trim();
    if (!valor) return null;
    return SOLO_LETRAS.test(valor) ? null : { lm: mensaje };
  };
}

export function largoMinimo(minimo: number, mensaje: string): ValidatorFn {
  return (control) => {
    const valor = String(control.value ?? '').trim();
    if (!valor) return null;
    return valor.length >= minimo ? null : { lm: mensaje };
  };
}

export function documento(mensaje = 'El documento tiene que tener ocho dígitos'): ValidatorFn {
  return (control) => {
    const valor = String(control.value ?? '').replace(/\./g, '').trim();
    if (!valor) return null;
    return /^\d{7,8}$/.test(valor) ? null : { lm: mensaje };
  };
}

export function cuil(mensaje = 'El CUIL tiene que tener once dígitos, con el formato 20-12345678-9'): ValidatorFn {
  return (control) => {
    const valor = String(control.value ?? '').trim();
    if (!valor) return null;
    return CUIL.test(valor) ? null : { lm: mensaje };
  };
}

export function correoElectronico(mensaje = 'El correo electrónico tiene que tener arroba y dominio'): ValidatorFn {
  return (control) => {
    const valor = String(control.value ?? '').trim();
    if (!valor) return null;
    return CORREO.test(valor) ? null : { lm: mensaje };
  };
}

export function clave(mensaje = 'La contraseña necesita al menos ocho caracteres, con una letra y un número'): ValidatorFn {
  return (control) => {
    const valor = String(control.value ?? '');
    if (!valor) return null;
    const suficiente = valor.length >= 8 && /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(valor) && /\d/.test(valor);
    return suficiente ? null : { lm: mensaje };
  };
}

export function enteroEntre(minimo: number, maximo: number, mensaje: string): ValidatorFn {
  return (control) => {
    const texto = String(control.value ?? '').trim();
    if (!texto) return null;
    const numero = Number(texto);
    if (!Number.isInteger(numero) || numero < minimo || numero > maximo) return { lm: mensaje };
    return null;
  };
}

export function precio(mensaje = 'El precio tiene que ser mayor a cero'): ValidatorFn {
  return (control) => {
    const texto = String(control.value ?? '').trim();
    if (!texto) return null;
    const numero = Number(texto.replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(numero) || numero <= 0) return { lm: mensaje };
    return null;
  };
}

/** Compara dos campos del mismo formulario. Se aplica al grupo, no al control. */
export function clavesIguales(campoClave: string, campoRepeticion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const clave = grupo.get(campoClave);
    const repeticion = grupo.get(campoRepeticion);
    if (!clave || !repeticion) return null;
    if (!repeticion.value) return null;

    if (clave.value !== repeticion.value) {
      repeticion.setErrors({ ...(repeticion.errors ?? {}), lm: 'Las contraseñas no coinciden' });
    } else if (repeticion.errors?.['lm'] === 'Las contraseñas no coinciden') {
      const { lm, ...resto } = repeticion.errors;
      repeticion.setErrors(Object.keys(resto).length ? resto : null);
    }
    return null;
  };
}

/**
 * Marca de envío.
 *
 * Un campo no se pinta de rojo por el solo hecho de haberlo tocado y dejado
 * vacío: los errores aparecen recién cuando la persona toca el botón de
 * enviar y algo está efectivamente mal. La marca queda pegada al control, así
 * que a partir de ahí el mensaje se actualiza solo mientras se corrige.
 */
const ENVIADO = '__lmEnviado';

/**
 * Contador de envíos. Los campos son componentes con detección de cambios por
 * entrada, así que necesitan una señal para enterarse de que el formulario se
 * envió: sin esto, el rojo aparecería recién al tocar el campo.
 */
const revisionDeEnvios = signal(0);

interface ControlMarcado {
  [ENVIADO]?: boolean;
  controls?: Record<string, AbstractControl> | AbstractControl[];
}

function recorrer(control: AbstractControl, valor: boolean): void {
  (control as unknown as ControlMarcado)[ENVIADO] = valor;
  const hijos = (control as unknown as ControlMarcado).controls;
  if (!hijos) return;
  for (const hijo of Object.values(hijos)) recorrer(hijo, valor);
}

/** Se llama al enviar el formulario: a partir de acá los errores se muestran. */
export function marcarEnviado(formulario: AbstractControl): void {
  recorrer(formulario, true);
  revisionDeEnvios.update((n) => n + 1);
}

/** Vuelve el formulario a foja cero: ningún campo en rojo. */
export function limpiarEnviado(formulario: AbstractControl): void {
  recorrer(formulario, false);
  revisionDeEnvios.update((n) => n + 1);
}

/** `true` cuando el formulario del control ya se intentó enviar. */
export function fueEnviado(control: AbstractControl): boolean {
  return (control as unknown as ControlMarcado)[ENVIADO] === true;
}

/** Toma el mensaje de error de un control, listo para mostrar debajo del campo. */
export function mensajeDe(control: AbstractControl | null): string | null {
  revisionDeEnvios();
  if (!control || !control.errors || !fueEnviado(control)) return null;
  const propio = control.errors['lm'];
  if (typeof propio === 'string') return propio;
  if (control.errors['required']) return 'Este dato es obligatorio';
  return 'Revisá este dato';
}
