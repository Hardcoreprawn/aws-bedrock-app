import { describe, it, expect } from 'vitest';
import { assertSafeInput } from '../../lib/safety.js';

describe('assertSafeInput', () => {
  it('passes clean documents without throwing', () => {
    expect(() => assertSafeInput(['This is a normal review document.'])).not.toThrow();
  });

  it('throws when a document contains "password"', () => {
    expect(() => assertSafeInput(['My password is hunter2'])).toThrow(/safety screening/);
  });

  it('throws when a document contains "secret" (case-insensitive)', () => {
    expect(() => assertSafeInput(['TOP SECRET document'])).toThrow(/safety screening/);
  });

  it('throws when a document contains "api key"', () => {
    expect(() => assertSafeInput(['Set the API key here'])).toThrow(/safety screening/);
  });

  it('throws when a document contains "national insurance"', () => {
    expect(() => assertSafeInput(['National Insurance number NI123456C'])).toThrow(/safety screening/);
  });

  it('throws when any document in a batch matches', () => {
    expect(() => assertSafeInput(['clean doc', 'contains secret data'])).toThrow(/safety screening/);
  });

  it('passes an empty array without throwing', () => {
    expect(() => assertSafeInput([])).not.toThrow();
  });
});
