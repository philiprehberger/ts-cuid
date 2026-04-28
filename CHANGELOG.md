# Changelog

## 0.2.0 (2026-04-27)
- Add `shortCuid()` generating shorter URL-friendly IDs (default 12 chars)
- Add `extractTimestamp(id)` to recover the embedded timestamp from a CUID
- Compliance: README badges aligned with repository slug

## 0.1.3

- Standardize README to 3-badge format with emoji Support section
- Update CI actions to v5 for Node.js 24 compatibility
- Add GitHub issue templates, dependabot config, and PR template

## 0.1.2

- Standardize README badges and CHANGELOG formatting

## 0.1.1

- Standardize package.json configuration

## 0.1.0

- `createId()` generates collision-resistant sortable unique IDs
- `createIdFactory()` returns a pre-configured ID generator
- `isCuid()` type guard for validating CUID strings
- Branded `Cuid` type for type-safe ID handling
- Dual ESM + CJS builds
