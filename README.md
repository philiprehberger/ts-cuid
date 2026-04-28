# @philiprehberger/cuid-ts

[![CI](https://github.com/philiprehberger/ts-cuid/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/ts-cuid/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/cuid-ts.svg)](https://www.npmjs.com/package/@philiprehberger/cuid-ts)
[![Last updated](https://img.shields.io/github/last-commit/philiprehberger/ts-cuid)](https://github.com/philiprehberger/ts-cuid/commits/main)

Collision-resistant sortable unique IDs for TypeScript

## Installation

```bash
npm install @philiprehberger/cuid-ts
```

## Usage

```ts
import { createId } from '@philiprehberger/cuid-ts';

const id = createId();
// => "c<timestamp><counter><hash><random>"
```

### Custom Prefix and Length

```ts
import { createId } from '@philiprehberger/cuid-ts';

const userId = createId({ prefix: 'user', length: 32 });
const orderId = createId({ prefix: 'ord', length: 28 });
```

### Pre-configured Factory

```ts
import { createIdFactory } from '@philiprehberger/cuid-ts';

const generateOrderId = createIdFactory({ prefix: 'ord', length: 28 });
const a = generateOrderId();
const b = generateOrderId();
```

### Type Guard

```ts
import { isCuid } from '@philiprehberger/cuid-ts';

if (isCuid(someValue)) {
  // someValue is typed as Cuid
}
```

### Short URL-Friendly IDs

```ts
import { shortCuid } from '@philiprehberger/cuid-ts';

const id = shortCuid();
// => 12-character base36 ID, e.g. "ll7kx2a3b9zd"

const longer = shortCuid({ length: 16 });
// => 16-character ID

// length is configurable from 8 to 24
shortCuid({ length: 8 });
shortCuid({ length: 24 });
```

### Extract Embedded Timestamp

```ts
import { createId, shortCuid, extractTimestamp } from '@philiprehberger/cuid-ts';

const id = createId();
const ts = extractTimestamp(id);
// => unix-millisecond timestamp, or null if it cannot be parsed

const short = shortCuid();
extractTimestamp(short); // works on short IDs too

extractTimestamp('not-an-id'); // => null
```

## API

| Method | Description |
|--------|-------------|
| `createId(options?)` | Generate a collision-resistant sortable unique ID. Options: `prefix` (default `'c'`), `length` (default `24`), `fingerprint`. |
| `createIdFactory(options)` | Return a zero-argument function that generates IDs with the given options baked in. |
| `shortCuid(options?)` | Generate a short, URL-friendly base36 ID. Options: `length` (8-24, default `12`). Throws `RangeError` on invalid length. |
| `extractTimestamp(id)` | Recover the unix-millisecond timestamp embedded in a CUID or short CUID. Returns `null` if the id cannot be parsed. |
| `isCuid(value)` | Type guard that returns `true` if `value` matches the CUID format (starts with a lowercase letter, lowercase alphanumeric). |
| `Cuid` | Branded string type representing a valid CUID. |
| `CreateIdOptions` | Options interface: `prefix?: string`, `length?: number`, `fingerprint?: string`. |
| `ShortCuidOptions` | Options interface: `length?: number` (8-24, default `12`). |

## Development

```bash
npm install
npm run build
npm test
```

## Support

If you find this project useful:

⭐ [Star the repo](https://github.com/philiprehberger/ts-cuid)

🐛 [Report issues](https://github.com/philiprehberger/ts-cuid/issues?q=is%3Aissue+is%3Aopen+label%3Abug)

💡 [Suggest features](https://github.com/philiprehberger/ts-cuid/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

❤️ [Sponsor development](https://github.com/sponsors/philiprehberger)

🌐 [All Open Source Projects](https://philiprehberger.com/open-source-packages)

💻 [GitHub Profile](https://github.com/philiprehberger)

🔗 [LinkedIn Profile](https://www.linkedin.com/in/philiprehberger)

## License

[MIT](LICENSE)
