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

const BASE36_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';
const DEFAULT_PREFIX = 'c';
const DEFAULT_LENGTH = 24;

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
 * The ID is composed of: prefix + timestamp (base36) + counter (base36) +
 * fingerprint hash (base36) + random bytes (base36), all mixed via FNV-1a.
 *
 * @param options - Optional configuration for ID generation.
 * @returns A unique CUID string.
 */
export function createId(options?: CreateIdOptions): Cuid {
  const prefix = options?.prefix ?? DEFAULT_PREFIX;
  const length = options?.length ?? DEFAULT_LENGTH;
  const fingerprint = options?.fingerprint ?? getDefaultFingerprint();

  const timestamp = toBase36(Date.now());
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
