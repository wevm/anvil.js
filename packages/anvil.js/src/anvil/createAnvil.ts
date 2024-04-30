import { stripColors } from "./stripColors.js";
import { toArgs } from "./toArgs.js";
import type { ExecaChildProcess, Options } from "execa";
import { EventEmitter } from "node:events";
import { Writable } from "node:stream";

/**
 * An anvil instance.
 */
export type Anvil = {
  /**
   * Starts the anvil instance.
   *
   * @returns A promise that resolves when the instance has started.
   * @throws If the instance didn't start gracefully.
   */
  start(): Promise<void>;
  /**
   * Stops the anvil instance.
   *
   * @returns A promise that resolves when the instance has stopped.
   * @throws If the instance didn't stop gracefully.
   */
  stop(): Promise<void>;
  /**
   * Subscribe to events of the anvil instance.
   *
   * @param event The event to subscribe to.
   * @param listener The listener to call when the event is emitted.
   */
  on(event: "message", listener: (message: string) => void): () => void;
  on(event: "stderr", listener: (message: string) => void): () => void;
  on(event: "stdout", listener: (message: string) => void): () => void;
  on(event: "closed", listener: () => void): () => void;
  on(
    event: "exit",
    listener: (code?: number, signal?: NodeJS.Signals) => void,
  ): () => void;
  /**
   * The current status of the anvil instance.
   */
  readonly status: "idle" | "starting" | "stopping" | "listening";
  /**
   * The most recent logs of the anvil instance.
   */
  readonly logs: string[];
  /**
   * The port the anvil instance is configured to listen on.
   */
  readonly port: number;
  /**
   * The host the anvil instance is configured to listen on.
   */
  readonly host: string;
  /**
   * The options which the anvil instance was created with.
   */
  readonly options: CreateAnvilOptions;
};

type Hardfork =
  | "Frontier"
  | "Homestead"
  | "Dao"
  | "Tangerine"
  | "SpuriousDragon"
  | "Byzantium"
  | "Constantinople"
  | "Petersburg"
  | "Istanbul"
  | "Muirglacier"
  | "Berlin"
  | "London"
  | "ArrowGlacier"
  | "GrayGlacier"
  | "Paris"
  | "Shanghai"
  | "Latest";

export type AnvilOptions = {
  /**
   * Enable autoImpersonate on startup
   */
  autoImpersonate?: boolean | undefined;
  /**
   * Sets the number of assumed available compute units per second for this fork provider.
   *
   * @defaultValue 350
   * @see https://github.com/alchemyplatform/alchemy-docs/blob/master/documentation/compute-units.md#rate-limits-cups
   */
  computeUnitsPerSecond?: number | undefined;
  /**
   * Fetch state over a remote endpoint instead of starting from an empty state.
   *
   * If you want to fetch state from a specific block number, add a block number like `http://localhost:8545@1400000`
   * or use the `forkBlockNumber` option.
   */
  forkUrl?: string | undefined;
  /**
   * Fetch state from a specific block number over a remote endpoint.
   *
   * Requires `forkUrl` to be set.
   */
  forkBlockNumber?: number | bigint | undefined;
  /**
   * Specify chain id to skip fetching it from remote endpoint. This enables offline-start mode.
   *
   * You still must pass both `forkUrl` and `forkBlockNumber`, and already have your required state cached
   * on disk, anything missing locally would be fetched from the remote.
   */
  forkChainId?: number | undefined;
  /**
   * Specify headers to send along with any request to the remote JSON-RPC server in forking mode.
   *
   * e.g. "User-Agent: test-agent"
   *
   * Requires `forkUrl` to be set.
   */
  forkHeader?: Record<string, string> | undefined;
  /**
   * Initial retry backoff on encountering errors.
   */
  forkRetryBackoff?: number | undefined;
  /**
   * Disables rate limiting for this node's provider.
   *
   * @defaultValue false
   * @see https://github.com/alchemyplatform/alchemy-docs/blob/master/documentation/compute-units.md#rate-limits-cups
   */
  noRateLimit?: boolean | undefined;
  /**
   * Explicitly disables the use of RPC caching.
   *
   * All storage slots are read entirely from the endpoint.
   */
  noStorageCaching?: boolean | undefined;
  /**
   * Number of retry requests for spurious networks (timed out requests).
   *
   * @defaultValue 5
   */
  retries?: number | undefined;
  /**
   * Timeout in ms for requests sent to remote JSON-RPC server in forking mode.
   *
   * @defaultValue 45000
   */
  timeout?: number | undefined;
  /**
   * The base fee in a block.
   */
  blockBaseFeePerGas?: number | bigint | undefined;
  /**
   * The chain id.
   */
  chainId?: number | undefined;
  /**
   * EIP-170: Contract code size limit in bytes. Useful to increase this because of tests.
   *
   * @defaultValue 0x6000 (~25kb)
   */
  codeSizeLimit?: number | undefined;
  /**
   * Disable the `call.gas_limit <= block.gas_limit` constraint.
   */
  disableBlockGasLimit?: boolean | undefined;
  /**
   * The block gas limit.
   */
  gasLimit?: number | bigint | undefined;
  /**
   * The gas price.
   */
  gasPrice?: number | bigint | undefined;
  /**
   * Number of dev accounts to generate and configure.
   *
   * @defaultValue 10
   */
  accounts?: number | undefined;
  /**
   * The balance of every dev account in Ether.
   *
   * @defaultValue 10000
   */
  balance?: number | bigint | undefined;
  /**
   * Sets the derivation path of the child key to be derived.
   *
   * @defaultValue m/44'/60'/0'/0/
   */
  derivationPath?: string | undefined;
  /**
   * BIP39 mnemonic phrase used for generating accounts.
   */
  mnemonic?: string | undefined;
  /**
   * Port number to listen on.
   *
   * @defaultValue 8545
   */
  port?: number | undefined;
  /**
   * Enable steps tracing used for debug calls returning geth-style traces.
   */
  stepsTracing?: boolean | undefined;
  /**
   * The timestamp of the genesis block.
   */
  timestamp?: number | bigint | undefined;
  /**
   * Set the Access-Control-Allow-Origin response header (CORS).
   *
   * @defaultValue *
   */
  allowOrigin?: string | undefined;
  /**
   * Block time in seconds for interval mining.
   */
  blockTime?: number | undefined;
  /**
   * Writes output of `anvil` as json to user-specified file.
   */
  configOut?: string | undefined;
  /**
   * Dump the state of chain on exit to the given file. If the value is a directory, the state will be
   * written to `<VALUE>/state.json`.
   */
  dumpState?: string | undefined;
  /**
   * The EVM hardfork to use.
   */
  hardfork?: Hardfork | undefined;
  /**
   * The host the server will listen on.
   */
  host?: string | undefined;
  /**
   * Initialize the genesis block with the given `genesis.json` file.
   */
  init?: string | undefined;
  /**
   * Launch an ipc server at the given path or default path = `/tmp/anvil.ipc`.
   */
  ipc?: string | undefined;
  /**
   * Initialize the chain from a previously saved state snapshot.
   */
  loadState?: string | undefined;
  /**
   * Disable CORS.
   */
  noCors?: boolean | undefined;
  /**
   * Disable auto and interval mining, and mine on demand instead.
   */
  noMining?: boolean | undefined;
  /**
   * How transactions are sorted in the mempool.
   *
   * @defaultValue fees
   */
  order?: string | undefined;
  /**
   * Don't keep full chain history. If a number argument is specified, at most this number of states is kept in memory.
   */
  pruneHistory?: number | undefined | boolean;
  /**
   * Interval in seconds at which the status is to be dumped to disk.
   */
  stateInterval?: number | undefined;
  /**
   * Don't print anything on startup and don't print logs.
   */
  silent?: boolean | undefined;
  /**
   * This is an alias for both `loadState` and `dumpState`. It initializes the chain with the state stored at the
   * file, if it exists, and dumps the chain's state on exit
   */
  state?: string | undefined;
  /**
   * Number of blocks with transactions to keep in memory.
   */
  transactionBlockKeeper?: number | undefined;
};

type ExecaParameters = [string, readonly string[], Options?];

export type CreateAnvilOptions = AnvilOptions & {
  /**
   * Path or alias of the anvil binary.
   *
   * @defaultValue anvil
   */
  anvilBinary?: string;
  /**
   * Arguments to pass to the underlying [`exec`](https://github.com/sindresorhus/execa) function.
   */
  execArgs?:
    | ExecaParameters
    | ((params: ExecaParameters) => ExecaParameters);
  /**
   * Allowed time for anvil to start up in milliseconds.
   *
   * @defaultValue 10_000
   */
  startTimeout?: number | undefined;
  /**
   * Allowed time for anvil to stop gracefully up in milliseconds.
   *
   * @defaultValue 10_000
   */
  stopTimeout?: number | undefined;
};

/**
 * Creates anvil instance.
 */
export function createAnvil(options: CreateAnvilOptions = {}): Anvil {
  const emitter = new EventEmitter();
  const logs: string[] = [];

  emitter.on("message", (message: string) => {
    logs.push(message);

    if (logs.length > 20) {
      logs.shift();
    }
  });

  let anvil: ExecaChildProcess | undefined;
  let controller: AbortController | undefined;
  let status: "idle" | "starting" | "stopping" | "listening" = "idle";

  const {
    anvilBinary = "anvil",
    execArgs: execArgs_,
    startTimeout = 10_000,
    stopTimeout = 10_000,
    ...anvilOptions
  } = options;

  const stdout = new Writable({
    write(chunk, _, callback) {
      try {
        const message = stripColors(chunk.toString());
        emitter.emit("message", message);
        emitter.emit("stdout", message);
        callback();
      } catch (error) {
        callback(
          error instanceof Error
            ? error
            : new Error(typeof error === "string" ? error : undefined),
        );
      }
    },
  });

  const stderr = new Writable({
    write(chunk, _, callback) {
      try {
        const message = stripColors(chunk.toString());
        emitter.emit("message", message);
        emitter.emit("stderr", message);
        callback();
      } catch (error) {
        callback(
          error instanceof Error
            ? error
            : new Error(typeof error === "string" ? error : undefined),
        );
      }
    },
  });

  async function start() {
    if (status !== "idle") {
      throw new Error("Anvil instance not idle");
    }

    status = "starting";

    // rome-ignore lint/suspicious/noAsyncPromiseExecutor: this is fine ...
    return new Promise<void>(async (resolve, reject) => {
      let log: string | undefined = undefined;

      async function setFailed(reason: Error) {
        status = "stopping";

        clearTimeout(timeout);
        emitter.off("message", onMessage);
        emitter.off("exit", onExit);

        try {
          if (controller !== undefined && !controller?.signal.aborted) {
            controller.abort();
          }

          await anvil;
        } catch {}

        status = "idle";
        reject(reason);
      }

      function setStarted() {
        status = "listening";

        clearTimeout(timeout);
        emitter.off("message", onMessage);
        emitter.off("exit", onExit);

        resolve();
      }

      function onExit() {
        if (status === "starting") {
          if (log !== undefined) {
            setFailed(new Error(`Anvil exited: ${log}`));
          } else {
            setFailed(new Error("Anvil exited"));
          }
        }
      }

      function onMessage(message: string) {
        log = message;

        if (status === "starting") {
          // We know that anvil is listening when it prints this message.
          if (message.includes('Listening on')) {
            setStarted();
          }
        }
      }

      emitter.on("exit", onExit);
      emitter.on("message", onMessage);

      const timeout = setTimeout(() => {
        setFailed(new Error("Anvil failed to start in time"));
      }, startTimeout);

      controller = new AbortController();

      const execArgs = (() => {
        const args: ExecaParameters = [
          anvilBinary,
          toArgs(anvilOptions),
          { signal: controller.signal, cleanup: true },
        ]

        if (typeof execArgs_ === "undefined") {
          return args
        }
        if (typeof execArgs_ === "function") {
          return execArgs_(args);
        }
        return execArgs_;
      })()

      const { execa } = await import("execa");
      anvil = execa(...execArgs);

      anvil.on("closed", () => emitter.emit("closed"));
      anvil.on("exit", (code, signal) => {
        emitter.emit("exit", code ?? undefined, signal ?? undefined);
      });

      // rome-ignore lint/style/noNonNullAssertion: this is guaranteed to be defined
      anvil.pipeStdout!(stdout);
      // rome-ignore lint/style/noNonNullAssertion: this is guaranteed to be defined
      anvil.pipeStderr!(stderr);
    });
  }

  async function stop() {
    if (status === "idle") {
      return;
    }

    const timeout = new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Anvil failed to stop in time"));
      }, stopTimeout);
    });

    const closed = new Promise<void>((resolve) => {
      anvil?.once("close", () => resolve());
    });

    try {
      if (controller !== undefined && !controller?.signal.aborted) {
        controller.abort();
      }

      await anvil;
    } catch {}

    status = "idle";
    anvil = undefined;
    controller = undefined;

    return Promise.race([closed, timeout]);
  }

  return {
    start,
    stop,
    // rome-ignore lint/suspicious/noExplicitAny: typed via the return type
    on: (event: string, listener: any) => {
      emitter.on(event, listener);

      return () => {
        emitter.off(event, listener);
      };
    },
    get status() {
      return status;
    },
    get logs() {
      return logs.slice();
    },
    get port() {
      return options.port ?? 8545;
    },
    get host() {
      return options.host ?? "127.0.0.1";
    },
    get options() {
      // NOTE: This is effectively a safe, readonly copy because the options are a flat object.
      return { ...options };
    },
  };
}
