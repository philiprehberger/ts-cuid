import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createId,
  createIdFactory,
  extractTimestamp,
  isCuid,
  shortCuid,
} from '../../dist/index.js';

describe('createId', () => {
  it('should generate a string starting with default prefix "c"', () => {
    const id = createId();
    assert.ok(id.startsWith('c'), `Expected id to start with "c", got: ${id}`);
  });

  it('should generate unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 10_000; i++) {
      ids.add(createId());
    }
    assert.equal(ids.size, 10_000, 'Expected 10,000 unique IDs');
  });

  it('should respect custom prefix', () => {
    const id = createId({ prefix: 'x' });
    assert.ok(id.startsWith('x'), `Expected id to start with "x", got: ${id}`);
  });

  it('should respect custom length', () => {
    const id = createId({ prefix: 'c', length: 32 });
    assert.equal(id.length, 33, 'Expected length of prefix (1) + 32 = 33');
  });

  it('should accept a custom fingerprint', () => {
    const id = createId({ fingerprint: 'myhost' });
    assert.ok(typeof id === 'string');
    assert.ok(id.length > 0);
  });

  it('should produce sortable IDs over time', async () => {
    const first = createId();
    await new Promise((resolve) => setTimeout(resolve, 10));
    const second = createId();
    assert.ok(
      first < second,
      `Expected "${first}" < "${second}" for temporal ordering`,
    );
  });

  it('should only contain lowercase alphanumeric characters', () => {
    for (let i = 0; i < 100; i++) {
      const id = createId();
      assert.match(id, /^[a-z0-9]+$/, `Invalid characters in: ${id}`);
    }
  });
});

describe('createIdFactory', () => {
  it('should return a function that generates IDs with preset options', () => {
    const generate = createIdFactory({ prefix: 'f', length: 20 });
    const id = generate();
    assert.ok(id.startsWith('f'), `Expected id to start with "f", got: ${id}`);
    assert.equal(id.length, 21, 'Expected length of prefix (1) + 20 = 21');
  });

  it('should generate unique IDs from factory', () => {
    const generate = createIdFactory({ prefix: 'g' });
    const a = generate();
    const b = generate();
    assert.notEqual(a, b, 'Factory should produce unique IDs');
  });
});

describe('isCuid', () => {
  it('should return true for valid CUIDs', () => {
    const id = createId();
    assert.ok(isCuid(id), `Expected isCuid to return true for: ${id}`);
  });

  it('should return false for non-string values', () => {
    assert.equal(isCuid(123), false);
    assert.equal(isCuid(null), false);
    assert.equal(isCuid(undefined), false);
    assert.equal(isCuid({}), false);
  });

  it('should return false for strings that do not match CUID format', () => {
    assert.equal(isCuid(''), false);
    assert.equal(isCuid('A'), false);
    assert.equal(isCuid('123abc'), false);
    assert.equal(isCuid('ABCDEF'), false);
    assert.equal(isCuid('c-invalid!'), false);
  });

  it('should return false for single character strings', () => {
    assert.equal(isCuid('c'), false);
  });

  it('should return true for manually constructed valid CUID strings', () => {
    assert.ok(isCuid('cab123def456'));
    assert.ok(isCuid('z0a1b2c3d4e5'));
  });
});

describe('shortCuid', () => {
  it('should default to 12 characters', () => {
    const id = shortCuid();
    assert.equal(id.length, 12, `Expected length 12, got ${id.length}: ${id}`);
  });

  it('should respect a custom length within the allowed range', () => {
    for (const length of [8, 10, 16, 20, 24]) {
      const id = shortCuid({ length });
      assert.equal(
        id.length,
        length,
        `Expected length ${length}, got ${id.length}: ${id}`,
      );
    }
  });

  it('should reject lengths outside 8-24', () => {
    assert.throws(() => shortCuid({ length: 7 }), RangeError);
    assert.throws(() => shortCuid({ length: 25 }), RangeError);
    assert.throws(() => shortCuid({ length: 0 }), RangeError);
    assert.throws(() => shortCuid({ length: -1 }), RangeError);
    assert.throws(() => shortCuid({ length: 12.5 }), RangeError);
  });

  it('should generate URL-friendly base36 characters only', () => {
    for (let i = 0; i < 100; i++) {
      const id = shortCuid();
      assert.match(id, /^[a-z0-9]+$/, `Invalid characters in: ${id}`);
    }
  });

  it('should generate unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 5_000; i++) {
      ids.add(shortCuid());
    }
    assert.equal(ids.size, 5_000, 'Expected 5,000 unique short IDs');
  });

  it('should produce sortable IDs over time', async () => {
    const first = shortCuid();
    await new Promise((resolve) => setTimeout(resolve, 10));
    const second = shortCuid();
    assert.ok(
      first < second,
      `Expected "${first}" < "${second}" for temporal ordering`,
    );
  });
});

describe('extractTimestamp', () => {
  it('should recover the timestamp from a freshly generated CUID', () => {
    const before = Date.now();
    const id = createId();
    const after = Date.now();
    const ts = extractTimestamp(id);
    assert.ok(ts !== null, `Expected non-null timestamp from ${id}`);
    assert.ok(
      ts! >= before && ts! <= after,
      `Expected timestamp between ${before} and ${after}, got ${ts}`,
    );
  });

  it('should recover the timestamp from a short CUID', () => {
    const before = Date.now();
    const id = shortCuid();
    const after = Date.now();
    const ts = extractTimestamp(id);
    assert.ok(ts !== null, `Expected non-null timestamp from ${id}`);
    assert.ok(
      ts! >= before && ts! <= after,
      `Expected timestamp between ${before} and ${after}, got ${ts}`,
    );
  });

  it('should recover the timestamp from a CUID with a custom prefix', () => {
    const before = Date.now();
    const id = createId({ prefix: 'u' });
    const after = Date.now();
    const ts = extractTimestamp(id);
    assert.ok(ts !== null, `Expected non-null timestamp from ${id}`);
    assert.ok(
      ts! >= before && ts! <= after,
      `Expected timestamp between ${before} and ${after}, got ${ts}`,
    );
  });

  it('should return null for non-string input', () => {
    // @ts-expect-error testing runtime guard
    assert.equal(extractTimestamp(null), null);
    // @ts-expect-error testing runtime guard
    assert.equal(extractTimestamp(undefined), null);
    // @ts-expect-error testing runtime guard
    assert.equal(extractTimestamp(12345), null);
  });

  it('should return null for empty or too-short strings', () => {
    assert.equal(extractTimestamp(''), null);
    assert.equal(extractTimestamp('abc'), null);
    assert.equal(extractTimestamp('1234567'), null);
  });

  it('should return null for strings with no parseable timestamp segment', () => {
    assert.equal(extractTimestamp('!!!!!!!!!!!!'), null);
    assert.equal(extractTimestamp('00000000xxxx'), null);
  });
});
