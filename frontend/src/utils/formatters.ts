const SUPER = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

export function formatPolynomial(coeffs: number[]): string {
  const start = coeffs.findIndex(c => c !== 0);
  if (start === -1) return '0';

  const order = coeffs.length - 1;
  const parts: string[] = [];

  for (let i = start; i < coeffs.length; i++) {
    const c = coeffs[i];
    if (c === 0) continue;
    const pow = order - i;
    const abs = Math.abs(c);
    let term = '';

    if (pow === 0) {
      term = abs % 1 === 0 ? abs.toString() : abs.toFixed(2);
    } else if (pow === 1) {
      term = abs === 1 ? 's' : `${abs % 1 === 0 ? abs : abs.toFixed(2)}s`;
    } else {
      const sup = pow.toString().split('').map(d => SUPER[parseInt(d)]).join('');
      term = abs === 1 ? `s${sup}` : `${abs % 1 === 0 ? abs : abs.toFixed(2)}s${sup}`;
    }

    if (parts.length === 0) {
      parts.push(c < 0 ? `-${term}` : term);
    } else {
      parts.push(c < 0 ? ` - ${term}` : ` + ${term}`);
    }
  }
  return parts.join('');
}

export function formatFrequency(hz: number): string {
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(1)} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(2)} kHz`;
  if (hz >= 1) return `${hz.toFixed(2)} Hz`;
  if (hz >= 0.001) return `${(hz * 1e3).toFixed(2)} mHz`;
  return `${hz.toExponential(2)} Hz`;
}

export function fmt(n: number, d = 2): string {
  return n.toFixed(d);
}
