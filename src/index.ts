import { webcrypto } from 'node:crypto';

/**
 * Branded type for CUID strings.
 */
export type Cuid = string & { readonly __brand: unique symbol };

/**
 * Options for ID generation.
 */
export interface CreateIdOptions {
  /** Custom prefix for the generated ID. Defaults to 'c'. */
  prefix?: string;
  /** Length of the random segment. Defaults to 24. */
  length?: number;
  /** Custom fingerprint string to include in the ID. */
  fingerprint?: string;
}

/**
 * Options for short CUID generation.
 */
export interface ShortCuidOptions {
  /** Total length of the generated ID. Must be between 8 and 24. Defaults to 12. */
  length?: number;
}

const BASE36_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';
const DEFAULT_PREFIX = 'c';
const DEFAULT_LENGTH = 24;
const SHORT_DEFAULT_LENGTH = 12;
const SHORT_MIN_LENGTH = 8;
const SHORT_MAX_LENGTH = 24;

// Timestamps are encoded as fixed-width base36 strings of this length so they
// can be reliably extracted later. Date.now() fits in 8 base36 chars until
// year ~2059; using 8 keeps IDs compact and parsable.
const TIMESTAMP_WIDTH = 8;

// Lower epoch bound for parsed timestamps (2001-09-09). Upper bound is the
// current time plus a small clock-skew slack — IDs cannot be from the future.
const MIN_VALID_TIMESTAMP = 1_000_000_000_000;
const MAX_TIMESTAMP_SKEW_MS = 60_000;

let globalCounter = 0;

/**
 * FNV-1a hash (32-bit) for synchronous mixing.
 */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Encode a non-negative integer to a base-36 string.
 */
function toBase36(value: number): string {
  if (value === 0) return '0';
  let result = '';
  let v = value;
  while (v > 0) {
    result = BASE36_CHARS[v % 36]! + result;
    v = Math.floor(v / 36);
  }
  return result;
}

/**
 * Encode a non-negative integer to a fixed-width base-36 string,
 * left-padded with '0' or truncated from the left if it exceeds width.
 */
function toBase36Padded(value: number, width: number): string {
  const encoded = toBase36(value);
  if (encoded.length >= width) {
    return encoded.slice(encoded.length - width);
  }
  return encoded.padStart(width, '0');
}

/**
 * Decode a base-36 string to a number. Returns NaN if any char is invalid.
 */
function fromBase36(input: string): number {
  if (input.length === 0) return NaN;
  let value = 0;
  for (let i = 0; i < input.length; i++) {
    const idx = BASE36_CHARS.indexOf(input[i]!);
    if (idx === -1) return NaN;
    value = value * 36 + idx;
  }
  return value;
}

/**
 * Generate a cryptographically random base-36 string of the given length.
 */
function randomBase36(length: number): string {
  const bytes = new Uint8Array(length);
  (webcrypto as unknown as Crypto).getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE36_CHARS[bytes[i]! % 36];
  }
  return result;
}

/**
 * Get a default machine/process fingerprint.
 */
function getDefaultFingerprint(): string {
  const pid = typeof process !== 'undefined' ? process.pid : 0;
  const hostname =
    typeof process !== 'undefined' && process.env?.['HOSTNAME']
      ? process.env['HOSTNAME']
      : 'unknown';
  return toBase36(fnv1a(`${pid}${hostname}`));
}

/**
 * Generate a collision-resistant sortable unique ID.
 *
 * The ID is composed of: prefix + timestamp (fixed-width base36) +
 * counter (base36) + fingerprint hash (base36) + random bytes (base36),
 * all mixed via FNV-1a.
 *
 * @param options - Optional configuration for ID generation.
 * @returns A unique CUID string.
 */
export function createId(options?: CreateIdOptions): Cuid {
  const prefix = options?.prefix ?? DEFAULT_PREFIX;
  const length = options?.length ?? DEFAULT_LENGTH;
  const fingerprint = options?.fingerprint ?? getDefaultFingerprint();

  const timestamp = toBase36Padded(Date.now(), TIMESTAMP_WIDTH);
  const count = toBase36(globalCounter++);
  const random = randomBase36(length);

  const raw = `${timestamp}${count}${fingerprint}${random}`;
  const hash = toBase36(fnv1a(raw));

  const body = `${timestamp}${count}${hash}${random}`;
  const id = `${prefix}${body}`.slice(0, prefix.length + length);

  return id as Cuid;
}

/**
 * Create a pre-configured ID generator with fixed options.
 *
 * @param options - Configuration for the factory.
 * @returns A function that generates CUIDs with the given options.
 */
export function createIdFactory(
  options: CreateIdOptions,
): () => Cuid {
  return () => createId(options);
}

/**
 * Generate a short, URL-friendly CUID.
 *
 * The ID is composed of: timestamp (fixed-width base36) + counter (base36) +
 * cryptographic random base36 padding, truncated to `length`.
 *
 * Short IDs share the same timestamp encoding as {@link createId}, so they
 * can be parsed by {@link extractTimestamp}.
 *
 * @param options - Optional length override (8-24, default 12).
 * @returns A short CUID string.
 * @throws RangeError if `length` is outside the allowed range.
 */
export function shortCuid(options?: ShortCuidOptions): Cuid {
  const length = options?.length ?? SHORT_DEFAULT_LENGTH;
  if (
    !Number.isInteger(length) ||
    length < SHORT_MIN_LENGTH ||
    length > SHORT_MAX_LENGTH
  ) {
    throw new RangeError(
      `shortCuid length must be an integer between ${SHORT_MIN_LENGTH} and ${SHORT_MAX_LENGTH}, got ${length}`,
    );
  }

  const timestamp = toBase36Padded(Date.now(), TIMESTAMP_WIDTH);
  const count = toBase36(globalCounter++);
  const remaining = Math.max(0, length - timestamp.length - count.length);
  const random = randomBase36(Math.max(remaining, 1));

  const body = `${timestamp}${count}${random}`;
  return body.slice(0, length) as Cuid;
}

/**
 * Recover the timestamp embedded in a CUID or short CUID.
 *
 * Walks past any single-character alpha prefix and decodes the next
 * fixed-width base36 segment as the timestamp. Returns `null` if the input
 * is not a string, is too short, contains invalid characters, or decodes
 * to a value outside reasonable epoch bounds.
 *
 * @param id - The ID string to parse.
 * @returns The unix-millisecond timestamp, or `null` if it cannot be parsed.
 */
export function extractTimestamp(id: string): number | null {
  if (typeof id !== 'string' || id.length === 0) return null;

  // Try parsing assuming no prefix, then with a 1-char prefix. This covers
  // both shortCuid (no prefix) and createId (1-char default prefix 'c').
  const offsets: number[] = [];
  if (id.length >= TIMESTAMP_WIDTH) offsets.push(0);
  if (id.length >= TIMESTAMP_WIDTH + 1 && /^[a-z]/.test(id)) offsets.push(1);

  const max = Date.now() + MAX_TIMESTAMP_SKEW_MS;
  for (const offset of offsets) {
    const segment = id.slice(offset, offset + TIMESTAMP_WIDTH);
    if (segment.length !== TIMESTAMP_WIDTH) continue;
    const value = fromBase36(segment);
    if (
      Number.isFinite(value) &&
      value >= MIN_VALID_TIMESTAMP &&
      value <= max
    ) {
      return value;
    }
  }

  return null;
}

/**
 * Type guard that checks whether a value is a valid CUID.
 *
 * A valid CUID starts with a lowercase letter and contains only
 * lowercase alphanumeric characters.
 *
 * @param value - The value to check.
 * @returns `true` if the value matches CUID format.
 */
export function isCuid(value: unknown): value is Cuid {
  if (typeof value !== 'string') return false;
  if (value.length < 2) return false;
  return /^[a-z][0-9a-z]+$/.test(value);
}
