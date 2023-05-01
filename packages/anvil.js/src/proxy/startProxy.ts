import { type Pool, createPool } from "../pool/createPool.js";
import { type CreateProxyOptions, createProxy } from "./createProxy.js";
import { Server } from "node:http";

export type StartProxyOptions = Omit<CreateProxyOptions, "pool"> & {
  /**
   * The anvil instance manager.
   */
  pool?: Pool | undefined;
  /**
   * The hostname to listen on.
   *
   * @defaultValue :: (all interfaces)
   */
  host?: string | undefined;
  /**
   * The port to listen on.
   *
   * @defaultValue 8545
   */
  port?: number | undefined;
};

/**
 * Creates and starts a proxy server that spawns anvil instance on demand.
 *
 * @example
 * ```
 * import { startProxy } from "@viem/anvil";
 *
 * // Returns a function to shut down the proxy and all created anvil instances.
 * const shutdown = await startProxy({
 *   port: 8555,
 *   options: {
 *     forkUrl: "https://eth-mainnet.alchemyapi.io/v2/<API_KEY>",
 *     blockNumber: 12345678,
 *   },
 * });
 *
 * // Shut down the proxy and all created anvil instances.
 * await shutdown();
 * ```
 */
export async function startProxy({
  port = 8545,
  host = "::",
  pool = createPool(),
  ...rest
}: StartProxyOptions = {}) {
  // rome-ignore lint/suspicious/noAsyncPromiseExecutor: this is fine ...
  const server = await new Promise<Server>(async (resolve, reject) => {
    const server = await createProxy({ pool, ...rest });

    server.on("listening", () => resolve(server));
    server.on("error", (error) => reject(error));

    server.listen(port, host);
  });

  return async () => {
    const shutdown = new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });

    await Promise.allSettled([pool.empty(), shutdown]);
  };
}
