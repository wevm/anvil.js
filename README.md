# AnvilJS

TypeScript wrapper for Foundry [Anvil](https://github.com/foundry-rs/foundry/tree/master/crates/anvil). AnvilJS provides a simple API to create and manage Anvil instances programmatically.

```ts
import { createAnvil } from "@viem/anvil";

const anvil = createAnvil({
  forkUrl: "https://eth-mainnet.alchemyapi.io/v2/<API_KEY>",
  forkBlockNumber: 12345678n,
});

await anvil.start();
await anvil.stop();
```

## Install

```bash
pnpm add @viem/anvil
```

```bash
npm i @viem/anvil
```

```bash
yarn add @viem/anvil
```

> **Note**
> Anvil is required to use `@viem/anvil`. Please refer to the [foundry book](https://book.getfoundry.sh) for Anvil [installation instructions](https://book.getfoundry.sh/getting-started/installation).

## API

### `createAnvil`

Creates anvil instance.

| Name         | Description                             | Type                   |
| ------------ | --------------------------------------- | ---------------------- |
| `options`    | Options used to create anvil instance   | `CreateAnvilOptions`   |
| returns      | Anvil instance                          | `Anvil`                |

#### Usage

```ts
import { createAnvil } from "@viem/anvil";

const anvil = createAnvil({
  // All anvil options are supported & typed.
  forkUrl: "https://eth-mainnet.alchemyapi.io/v2/<API_KEY>",
  forkBlockNumber: 12345678n,
});

await anvil.start();
await anvil.stop();
```

### `getVersion`

Get `anvil` version.

| Name         | Description                             | Type       |
| ------------ | --------------------------------------- | ---------- |
| `command`    | Path to anvil command. Default `anvil`. | `string`   |
| returns      | `anvil version`                         | `string`   |

#### Usage

```ts
import { getVersion } from "@viem/anvil";

const version = await getVersion();
```

### `createProxy`

Creates and starts a proxy server that spawns anvil instance on demand (e.g. per test file or per test case).

| Name      | Description                            | Type                 |
| --------- | -------------------------------------- | -------------------- |
| `options` | Options used to create proxy server.   | `CreateProxyOptions` |
| returns   | Server instance                        | `Server`             |

#### Usage

```ts
import { createProxy, createPool } from "@viem/anvil";

const server = await createProxy({
  pool: createPool(),
  options: {
    forkUrl: "https://eth-mainnet.alchemyapi.io/v2/<API_KEY>",
    forkBlockNumber: 12345678n,
  },
});

server.listen(8545, "::", () => {
  console.log("Proxy server listening on http://0.0.0.0:8545");
});
```

### `createPool`

Creates pool of anvil instances.

| Name      | Description                       | Type                 |
| --------- | --------------------------------- | -------------------- |
| `options` | Options used to create pool.      | `CreatePoolOptions`  |
| returns   | Pool                              | `Pool`               |

#### Usage

```ts
import { createPool } from "@viem/anvil";

const pool = createPool();
await pool.start(1, {
  forkUrl: "https://eth-mainnet.alchemyapi.io/v2/<API_KEY>",
  forkBlockNumber: 12345678n,
});
await pool.start(2, {
  forkUrl: "https://eth-mainnet.alchemyapi.io/v2/<API_KEY>",
  forkBlockNumber: 12345678n,
});
```

### `startProxy`

Creates and starts a proxy server that spawns anvil instance on demand (e.g. per test file or per test case).

| Name      | Description                                                      | Type                      |
| --------- | ---------------------------------------------------------------- | ------------------------- |
| `options` | Options used to spawn anvil instance.                            | `StartProxyOptions`       |
| returns   | Function to shut down the proxy and all spawned anvil instances. | `() => Awaitable<void>`   |

#### Usage

```ts
import { startProxy } from "@viem/anvil";

// Returns a function to shut down the proxy and all spawned anvil instances.
const shutdown = await startProxy({
  port: 8555,
  options: {
    forkUrl: "https://eth-mainnet.alchemyapi.io/v2/<API_KEY>",
    forkBlockNumber: 12345678n,
  },
});

// Shut down the proxy and all spawned anvil instances.
await shutdown();
```

### `fetchLogs`

Fetches logs for anvil instances.

| Name     | Description             | Type                |
| -------- | ----------------------- | ------------------- |
| `url`    | URL to anvil proxy.     | `string`            |
| `id`     | ID of test worker.      | `number`            |
| returns  | Logs of anvil instance. | `string[]`          |

#### Usage

```ts
import { fetchLogs } from "@viem/anvil";

const logs = await fetchLogs("http://localhost:8545", 1);
// Only print the 20 most recent log messages.
console.log(...logs.slice(-20));
```

## Types

```ts
import type {
  Anvil,
  AnvilOptions,
  AnvilProxyOptions,
  AnvilProxyOptionsFn,
  CreateAnvilOptions,
  CreateProxyOptions,
  CreatePoolOptions,
  Pool,
  ProxyRequestContext,
  ProxyRequestHandler,
  ProxyResponse,
  ProxyResponseFailure,
  ProxyResponseSuccess,
  StartProxyOptions,
} from "@viem/anvil";
```

## Contributing

If you're interested in contributing, please read the [contributing docs](/.github/CONTRIBUTING.md) **before submitting a pull request**.

## Authors

- [@fubhy](https://github.com/fubhy) (fubhy.eth, [Twitter](https://twitter.com/thefubhy))

## License

[MIT](/LICENSE) License
