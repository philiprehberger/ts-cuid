# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-03-20

### Added

- `createId()` generates collision-resistant sortable unique IDs using timestamp, counter, fingerprint, and crypto random bytes mixed with FNV-1a hash
- `createIdFactory()` returns a pre-configured ID generator
- `isCuid()` type guard for validating CUID strings
- Branded `Cuid` type for type-safe ID handling
- Dual ESM + CJS builds
