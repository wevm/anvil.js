import httpProxy from "http-proxy";
import { IncomingMessage, createServer } from "node:http";
import { parseRequest } from "./parseRequest.js";
import { type Pool } from "../pool/createPool.js";
import type { Awaitable } from "vitest";
import type { CreateAnvilOptions } from "../anvil/createAnvil.js";

export type AnvilProxyOptions =
  | CreateAnvilOptions
  | ((id: number, request: IncomingMessage) => Awaitable<CreateAnvilOptions>);

export type CreateProxyOptions = {
  pool: Pool<number>;
  options?: AnvilProxyOptions | undefined;
};

/**
 * Creates a proxy server that spawns an anvil instance for each request.
 *
 * @example
 * ```
 * import { createProxy, createPool } from "@viem/anvil";
 *
 * const server = const createProxy({
 *   pool: createPool<number>(),
 *   options: {
 *     forkUrk: "https://eth-mainnet.alchemyapi.io/v2/<API_KEY>",
 *     blockNumber: 12345678,
 *   },
 * });
 *
 * server.listen(8545, "::", () => {
 *   console.log("Proxy server listening on http://0.0.0.0:8545");
 * });
 * ```
 */
export function createProxy({ pool, options }: CreateProxyOptions) {
  const proxy = httpProxy.createProxyServer({
    ignorePath: true,
    ws: true,
  });

  const server = createServer(async (req, res) => {
    const { id, path } = parseRequest(req.url);

    if (id === undefined) {
      res.writeHead(404).end("Missing instance id in request");
    } else if (path === "/logs") {
      const anvil = await pool.get(id);

      if (anvil !== undefined) {
        const output = JSON.stringify((await anvil.logs) ?? []);
        res.writeHead(200).end(output);
      } else {
        res.writeHead(404).end(`Anvil instance doesn't exists.`);
      }
    } else if (path === "/shutdown") {
      if (pool.has(id)) {
        const output = JSON.stringify({ success: await pool.stop(id) });
        res.writeHead(200).end(output);
      } else {
        res.writeHead(404).end(`Anvil instance doesn't exists.`);
      }
    } else if (path === "/") {
      const anvil =
        (await pool.get(id)) ??
        (await pool.start(
          id,
          typeof options === "function" ? await options(id, req) : options,
        ));

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
      socket.destroy(new Error("Anvil instance doesn't exists."));
    } else if (path === "/") {
      const anvil =
        (await pool.get(id)) ??
        (await pool.start(
          id,
          typeof options === "function" ? await options(id, req) : options,
        ));

      proxy.ws(req, socket, head, {
        target: `ws://${anvil.host}:${anvil.port}`,
      });
    } else {
      socket.destroy(new Error("Invalid request"));
    }
  });

  return server;
}
