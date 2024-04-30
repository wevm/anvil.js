# @viem/anvil

## 0.0.10

### Patch Changes

- [`a0404ab`](https://github.com/wevm/anvil.js/commit/a0404ab4c654d7cbb576d7444e9c24645ca46c02) Thanks [@jxom](https://github.com/jxom)! - Added `execArgs` parameter to `AnvilOptions`.

## 0.0.9

### Patch Changes

- [#47](https://github.com/wevm/anvil.js/pull/47) [`35affef`](https://github.com/wevm/anvil.js/commit/35affef9ea748d18718841fb5f1a79ccaacfad79) Thanks [@banky](https://github.com/banky)! - Added `autoImpersonate` property.

## 0.0.8

### Patch Changes

- [#44](https://github.com/wevm/anvil.js/pull/44) [`5b39862`](https://github.com/wevm/anvil.js/commit/5b398626dd91832840b3bc2178aae40213cb72dc) Thanks [@jnsdls](https://github.com/jnsdls)! - Added support for specifying headers in fork mode

## 0.0.7

### Patch Changes

- [#38](https://github.com/wevm/anvil.js/pull/38) [`ad686bd`](https://github.com/wevm/anvil.js/commit/ad686bd82266ff7f11addd6abcd5a4f203457a1a) Thanks [@conwayconstar](https://github.com/conwayconstar)! - As Playwright imports CJS in global setup it will throw the error Error: require() of ES Module changed import to dynamic import.
  - Removed the import of getPort from `"get-port"`
  - Updated the port property to use `import("get-port").default` instead of `getPort()`

## 0.0.6

### Patch Changes

- [`82d8875`](https://github.com/wagmi-dev/anvil.js/commit/82d8875552d559aee1d80e6061bf10ab4a4f84db) Thanks [@fubhy](https://github.com/fubhy)! - Added `shanghai` and `paris` hardforks.

## 0.0.5

### Patch Changes

- [#24](https://github.com/wagmi-dev/anvil.js/pull/24) [`c6d71a3`](https://github.com/wagmi-dev/anvil.js/commit/c6d71a376fe49e53c3c7830836adbee7fd160489) Thanks [@fubhy](https://github.com/fubhy)! - Fixed `http-proxy` import for both cjs & esm

## 0.0.4

### Patch Changes

- [#19](https://github.com/wagmi-dev/anvil.js/pull/19) [`5848df9`](https://github.com/wagmi-dev/anvil.js/commit/5848df922d687978d37723144e55aa897acf7de7) Thanks [@fubhy](https://github.com/fubhy)! - Fixed imports for cjs consumers.

- [#22](https://github.com/wagmi-dev/anvil.js/pull/22) [`f03b3ec`](https://github.com/wagmi-dev/anvil.js/commit/f03b3ecb38c6eb5a3aa5fec433e50f09de558066) Thanks [@fubhy](https://github.com/fubhy)! - Fixed import from `http-proxy` package in cjs environments.

## 0.0.3

### Patch Changes

- [#14](https://github.com/wagmi-dev/anvil.js/pull/14) [`c617901`](https://github.com/wagmi-dev/anvil.js/commit/c617901751bd112355259ba65befaee2ceadf0d4) Thanks [@fubhy](https://github.com/fubhy)! - Added support for custom fallback routes.

- [`27c20e5`](https://github.com/wagmi-dev/anvil.js/commit/27c20e5640ea27dad49a786ed5ab5415d0862729) Thanks [@fubhy](https://github.com/fubhy)! - Added type exports

## 0.0.2

### Patch Changes

- [`83e9eaa`](https://github.com/wagmi-dev/anvil.js/commit/83e9eaaeaa3a5245724e72b05561f1bf53e81431) Thanks [@tmm](https://github.com/tmm)! - Exported pool utilities and types.

## 0.0.1

### Patch Changes

- [`6ed312a`](https://github.com/wagmi-dev/anvil.js/commit/6ed312ad7ddbc4e9d3cbf57afb81629c0bd6d7e5) Thanks [@tmm](https://github.com/tmm)! - Initial release
