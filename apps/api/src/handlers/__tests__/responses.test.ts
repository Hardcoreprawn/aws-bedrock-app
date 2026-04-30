import { describe, it, expect } from 'vitest';
import { jsonResponse } from '../../lib/responses.js';

describe('jsonResponse', () => {
  it('serialises the body to JSON', () => {
    const res = jsonResponse(200, { ok: true });
    expect(res.body).toBe('{"ok":true}');
  });

  it('sets Content-Type to application/json', () => {
    const res = jsonResponse(200, {});
    expect(res.headers['Content-Type']).toBe('application/json');
  });

  it('reflects the supplied status code', () => {
    expect(jsonResponse(404, {}).statusCode).toBe(404);
    expect(jsonResponse(202, {}).statusCode).toBe(202);
  });

  it('includes CORS headers', () => {
    const res = jsonResponse(200, {});
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});
