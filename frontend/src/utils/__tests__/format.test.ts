import { describe, it, expect } from 'vitest';
import { formatPrice, formatPriceWithDecimals } from '../format';

describe('formatPrice', () => {
  it('formatea 1000 como "$1,000"', () => {
    expect(formatPrice(1000)).toBe('$1,000');
  });

  it('formatea 0 como "$0"', () => {
    expect(formatPrice(0)).toBe('$0');
  });

  it('formatea 15999 como "$15,999"', () => {
    expect(formatPrice(15999)).toBe('$15,999');
  });

  it('formatea números grandes correctamente', () => {
    expect(formatPrice(1000000)).toBe('$1,000,000');
  });
});

describe('formatPriceWithDecimals', () => {
  it('formatea 1000 como "$1,000.00"', () => {
    expect(formatPriceWithDecimals(1000)).toBe('$1,000.00');
  });

  it('formatea 15999.50 como "$15,999.50"', () => {
    expect(formatPriceWithDecimals(15999.5)).toBe('$15,999.50');
  });

  it('formatea 0 como "$0.00"', () => {
    expect(formatPriceWithDecimals(0)).toBe('$0.00');
  });
});
