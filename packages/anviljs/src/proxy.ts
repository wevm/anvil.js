import httpProxy from "http-proxy";
import { Server, createServer } from "node:http";
import { type AnvilOptions } from "./anvil.js";
import {
  getAnvilInstance,
  getOrCreateAnvilInstance,
  shutdownAnvilInstances,
} from "./instances.js";

export type CreateAnvilProxyOptions = {
  anvilOptions?: Omit<AnvilOptions, "port">;
  /**
   * The hostname to listen on.
   *
   * @defaultValue :: (all interfaces)
   */
  proxyHostname?: string;
  /**
   * The port to listen on.
   *
   * @defaultValue 8545
   */
  proxyPort?: number;
};

/**
 * Using this proxy, we can parallelize our test suite by spawning multiple "on demand" anvil
 * instances and proxying requests to them. Especially for local development, this is much faster
 * than running the tests serially.
 *
 * In vitest, each thread is assigned a unique, numerical id (`process.env.VITEST_POOL_ID`). We
 * append this id to the local rpc url (e.g. `http://127.0.0.1:8545/<ID>`).
 *
 * Whenever a request hits the proxy server at this url, it spawns (or reuses) an anvil instance
 * at a randomly assigned port and proxies the request to it. The anvil instance is added to a
 * [id:port] mapping for future request and is kept alive until the test suite finishes.
 *
 * Since each thread processes one test file after the other, we don't have to worry about
 * non-deterministic behavior caused by multiple tests hitting the same anvil instance concurrently
 * as long as we avoid `test.concurrent()`.
 *
 * @example
 * ```
 * // globalSetup.ts
 * import { createAnvilProxy } from "@fubhy/anvil";
 *
 * export default async function () {
 *   return await createAnvilProxy({
 *     proxyPort: 8555,
 *     anvilOptions: {
 *       forkUrk: "https://eth-mainnet.alchemyapi.io/v2/<API_KEY>",
 *       blockNumber: 12345678,
 *     },
 *   });
 * }
 * ```
 */
export async function createAnvilProxy({
  proxyPort = 8545,
  proxyHostname = "::",
  anvilOptions,
}: CreateAnvilProxyOptions = {}) {
  // rome-ignore lint/suspicious/noAsyncPromiseExecutor: this is fine ...
  const server = await new Promise<Server>(async (resolve, reject) => {
    const proxy = httpProxy.createProxyServer({
      ignorePath: true,
      ws: true,
    });

    const server = createServer(async (req, res) => {
      const { id, path } = parseRequest(req.url);

      if (id === undefined) {
        res.writeHead(404).end("Missing worker id in request");
      } else if (path === "/logs") {
        const instance = getAnvilInstance(id);

        if (instance === undefined) {
          res.writeHead(404).end(`No anvil instance found for id ${id}`);
        } else {
          const logs = await instance.then((anvil) => anvil.logs);
          res.writeHead(200).end(JSON.stringify(logs ?? []));
        }
      } else if (path === "/") {
        const anvil = await getOrCreateAnvilInstance(id, anvilOptions);

        proxy.web(req, res, {
          target: `http://${anvil.host}:${anvil.port}`,
        });
      } else {
        res.writeHead(404).end("Invalid request");
      }
    });

    server.on("upgrade", async (req, socket, head) => {
      const { id, path } = parseRequest(req.url);

      if (id === undefined) {
        socket.destroy(new Error("Missing worker id in request"));
      } else if (path === "/") {
        const anvil = await getOrCreateAnvilInstance(id, anvilOptions);

        proxy.ws(req, socket, head, {
          target: `ws://${anvil.host}:${anvil.port}`,
        });
      } else {
        socket.destroy(new Error("Invalid request"));
      }
    });

    server.on("listening", () => resolve(server));
    server.on("error", (error) => reject(error));

    server.listen(proxyPort, proxyHostname);
  });

  return async () => {
    await Promise.allSettled([
      shutdownAnvilInstances(),
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
    ]);
  };
}

export async function getAnvilProxyLogs(
  url: string,
  id: number,
): Promise<string[]> {
  const response = await fetch(new URL(`${id}/logs`, url), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.json();
}

function parseRequest(request?: string) {
  const host = "http://localhost"; // Dummy value for URL constructor
  const url = new URL(`${host}${request ?? "/"}`);
  const matches =
    new RegExp("^([0-9]+)(?:/([^/]+))*$").exec(url.pathname.slice(1)) ?? [];

  const id = matches[1] ? Number(matches[1]) : undefined;
  if (id === undefined) {
    return { id: undefined, path: undefined };
  }

  const path = matches[2]
    ? matches[2].split("/").map((value) => value.trim())
    : [];

  return { id, path: `/${path.join("/")}` };
}
