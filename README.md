<br/>

# AnvilJS

TypeScript wrapper for Foundry [Anvil](https://github.com/foundry-rs/foundry/tree/master/anvil).

> Anvil is a local testnet node shipped with Foundry. You can use it for testing your contracts from frontends or for interacting over RPC. Anvil is part of the Foundry suite and is installed alongside `forge`, `cast`, and `chisel`.

Please refer to the [foundry book](https://book.getfoundry.sh) for Anvil [installation instructions](https://book.getfoundry.sh/getting-started/installation).

## Overview

TODO

## API

### `createAnvil`

Creates anvil instance.

| Name         | Description                             | Type                   |
| ------------ | --------------------------------------- | ---------------------- |
| `options`    | Options used to create anvil instance   | `CreateAnvilOptions`   |
| returns      | Anvil instance                          | `Anvil`                |

#### Usage

```ts
import { createAnvil } from "@viem/anvil"

const anvil = createAnvil();
```

### `getVersion`

Get `anvil` version.

| Name         | Description                             | Type       |
| ------------ | --------------------------------------- | ---------- |
| `command`    | Path to anvil command. Default `anvil`. | `string`   |
| returns      | `anvil version`                         | `string`   |

#### Usage

```ts
import { getVersion } from "@viem/anvil"

const version = getVersion()
```

### `createProxy`

Creates a proxy server that spawns an anvil instance for each request.

| Name      | Description                            | Type                 |
| --------- | -------------------------------------- | -------------------- |
| `options` | Options used to create proxy server.   | `CreateProxyOptions` |
| returns   | Server instance                        | `Server`             |

#### Usage

```ts
import { createProxy, createPool } from "@viem/anvil";

const server = const createProxy({
  pool: createPool<number>(),
  options: {
    forkUrk: "https://eth-mainnet.alchemyapi.io/v2/<API_KEY>",
    blockNumber: 12345678,
  },
});
 *
server.listen(8545, "::", () => {
  console.log("Proxy server listening on http://0.0.0.0:8545");
});
```

### `createPool`

Creates pool of anvil instances.

| Name      | Description                       | Type                 |
| --------- | --------------------------------- | -------------------- |
| `options` | Options used to create pool.      | `CreatePoolOptions` |
| returns   | Pool                              | `Pool`             |

#### Usage

```ts
import { createPool } from "@viem/anvil";

const pool = createPool();
```

### `startProxy`

Creates and starts a proxy server that spawns an anvil instance for each request.

| Name      | Description                                                      | Type                |
| --------- | ---------------------------------------------------------------- | ------------------- |
| `options` | Options used to spawn anvil instance.                            | `StartProxyOptions` |
| returns   | Function to shut down the proxy and all spawned anvil instances. | `response.json()`   |

#### Usage

```ts
import { startProxy } from "@viem/anvil";

// Returns a function to shut down the proxy and all spawned anvil instances.
const shutdown = await startProxy({
  port: 8555,
  options: {
    forkUrk: "https://eth-mainnet.alchemyapi.io/v2/<API_KEY>",
    blockNumber: 12345678,
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
| returns  | Logs of anvil instance. | `response.json()`   |

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
  CreateAnvilOptions,
  CreateProxyOptions,
  CreatePoolOptions,
  Pool,
  StartProxyOptions,
} from "@viem/anvil"
```

## Contributing

If you're interested in contributing, please read the [contributing docs](/.github/CONTRIBUTING.md) **before submitting a pull request**.

## Authors

- [@fubhy](https://github.com/fubhy) (fubhy.eth, [Twitter](https://twitter.com/thefubhy))

## License

[MIT](/LICENSE) License
