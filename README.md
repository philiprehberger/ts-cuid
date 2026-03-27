# @philiprehberger/cuid-ts

[![CI](https://github.com/philiprehberger/ts-cuid/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/ts-cuid/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/cuid-ts.svg)](https://www.npmjs.com/package/@philiprehberger/cuid-ts)
[![License](https://img.shields.io/github/license/philiprehberger/ts-cuid)](LICENSE)
[![Sponsor](https://img.shields.io/badge/sponsor-GitHub%20Sponsors-ec6cb9)](https://github.com/sponsors/philiprehberger)

Collision-resistant sortable unique IDs for TypeScript

## Installation

```bash
npm install @philiprehberger/cuid-ts
```

## Usage

```ts
import { createId, createIdFactory, isCuid } from '@philiprehberger/cuid-ts';

// Generate a unique ID
const id = createId();
// => "clx8f0a3b00001k9z..."

// Generate with options
const customId = createId({ prefix: 'user', length: 32 });

// Create a pre-configured factory
const generateOrderId = createIdFactory({ prefix: 'ord', length: 28 });
const orderId = generateOrderId();

// Type guard
if (isCuid(someValue)) {
  // someValue is typed as Cuid
}
```

## API

| Export | Description |
| --- | --- |
| `createId(options?)` | Generate a collision-resistant sortable unique ID. Options: `prefix` (default `'c'`), `length` (default `24`), `fingerprint`. |
| `createIdFactory(options)` | Return a zero-argument function that generates IDs with the given options baked in. |
| `isCuid(value)` | Type guard that returns `true` if `value` matches the CUID format (starts with a lowercase letter, lowercase alphanumeric). |
| `Cuid` | Branded string type representing a valid CUID. |
| `CreateIdOptions` | Options interface: `prefix?: string`, `length?: number`, `fingerprint?: string`. |

## Development

```bash
npm install
npm run build
npm test
npm run typecheck
```

## License

MIT
