import { ComplexNumber } from '@quantum/contracts';

export const EPSILON = 1e-9;

export function complex(real: number, imag = 0): ComplexNumber {
  if (!Number.isFinite(real) || !Number.isFinite(imag)) {
    throw new Error(`Non-finite amplitude component: real=${real}, imag=${imag}`);
  }
  return { real, imag };
}

export function cAdd(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return complex(a.real + b.real, a.imag + b.imag);
}

export function cSub(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return complex(a.real - b.real, a.imag - b.imag);
}

export function cMul(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return complex(
    a.real * b.real - a.imag * b.imag,
    a.real * b.imag + a.imag * b.real
  );
}

export function cScale(a: ComplexNumber, scalar: number): ComplexNumber {
  if (!Number.isFinite(scalar)) {
    throw new Error(`Non-finite scalar: ${scalar}`);
  }
  return complex(a.real * scalar, a.imag * scalar);
}

export function cMagSq(a: ComplexNumber): number {
  return a.real * a.real + a.imag * a.imag;
}

export function cMag(a: ComplexNumber): number {
  return Math.sqrt(cMagSq(a));
}

export function cPhase(a: ComplexNumber): number {
  if (cMagSq(a) < 1e-18) return 0;
  return Math.atan2(a.imag, a.real);
}

export function cConj(a: ComplexNumber): ComplexNumber {
  return complex(a.real, -a.imag);
}

export function cEqual(a: ComplexNumber, b: ComplexNumber, tol = EPSILON): boolean {
  return Math.abs(a.real - b.real) <= tol && Math.abs(a.imag - b.imag) <= tol;
}
