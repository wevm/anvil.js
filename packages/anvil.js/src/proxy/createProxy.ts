import type { CreateAnvilOptions } from "../anvil/createAnvil.js";
import { type Pool } from "../pool/createPool.js";
import { type InstanceRequestContext, parseRequest } from "./parseRequest.js";
import httpProxy from "http-proxy";
import { IncomingMessage, ServerResponse, createServer } from "node:http";
import type { Awaitable } from "vitest";

// rome-ignore lint/nursery/noBannedTypes: this is fine ...
export type ProxyResponseSuccess<TResponse extends object = {}> = {
  success: true;
} & TResponse;

export type ProxyResponseFailure = {
  success: false;
  reason: string;
};

export type ProxyResponse<TResponse extends object> =
  | ProxyResponseSuccess<TResponse>
  | ProxyResponseFailure;

export type ProxyRequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  context: ProxyRequestContext,
) => Awaitable<void>;

export type ProxyRequestContext = {
  pool: Pool;
  options?: AnvilProxyOptions | undefined;
  // rome-ignore lint/nursery/noBannedTypes: this is fine ...
} & (InstanceRequestContext | {});

/**
 * A function callback to dynamically derive the options based on the request.
 */
export type AnvilProxyOptionsFn = (
  id: number,
  request: IncomingMessage,
) => Awaitable<CreateAnvilOptions>;

export type AnvilProxyOptions = CreateAnvilOptions | AnvilProxyOptionsFn;

export type CreateProxyOptions = {
  /**
   * The pool of anvil instances.
   */
  pool: Pool;
  /**
   * The options to pass to each anvil instance.
   */
  options?: AnvilProxyOptions | undefined;
  /**
   * A function callback to handle custom proxy requests.
   */
  fallback?: ProxyRequestHandler | undefined;
};

/**
 * Creates a proxy server that spawns anvil instance on demand.
 *
 * @example
 * ```
 * import { createProxy, createPool } from "@viem/anvil";
 *
 * const server = createProxy({
 *   pool: createPool(),
 *   options: {
 *     forkUrl: "https://eth-mainnet.alchemyapi.io/v2/<API_KEY>",
 *     blockNumber: 12345678,
 *   },
 * });
 *
 * server.listen(8545, "::", () => {
 *   console.log("Proxy server listening on http://0.0.0.0:8545");
 * });
 * ```
 */
export async function createProxy({
  pool,
  options,
  fallback,
}: CreateProxyOptions) {
  let httpProxyWithCjsFallback: typeof httpProxy = httpProxy;

  if (httpProxyWithCjsFallback === undefined) {
    httpProxyWithCjsFallback = await import("http-proxy").then(
      // rome-ignore lint/suspicious/noExplicitAny: required to support both esm & cjs.
      (module) => (module as any).default,
    );
  }

  const proxy = await httpProxyWithCjsFallback.createProxyServer({
    ignorePath: true,
    ws: true,
  });

  const server = createServer(async (req, res) => {
    try {
      const context = parseRequest(req.url);

      if (context !== undefined) {
        switch (context.path) {
          case "/": {
            const anvil =
              (await pool.get(context.id)) ??
              (await pool.start(
                context.id,
                typeof options === "function"
                  ? await options(context.id, req)
                  : options,
              ));

            return proxy.web(req, res, {
              target: `http://${anvil.host}:${anvil.port}`,
            });
          }

          case "/start": {
            if (pool.has(context.id)) {
              return sendFailure(res, {
                code: 404,
                reason: "Anvil instance already exists",
              });
            }

            await pool.start(
              context.id,
              typeof options === "function"
                ? await options(context.id, req)
                : options,
            );

            return sendSuccess(res);
          }

          case "/stop": {
            const success = await pool
              .stop(context.id)
              .then(() => true)
              .catch(() => false);

            return sendResponse(res, 200, { success });
          }

          case "/logs": {
            const anvil = await pool.get(context.id);

            if (anvil !== undefined) {
              const logs = (await anvil.logs) ?? [];
              return sendSuccess(res, { logs });
            }

            return sendFailure(res, {
              code: 404,
              reason: `Anvil instance doesn't exist`,
            });
          }
        }
      }

      if (fallback !== undefined) {
        return await fallback(req, res, { ...context, pool, options });
      }

      return sendFailure(res, {
        code: 404,
        reason: "Unsupported request",
      });
    } catch (error) {
      console.error(error);

      return sendFailure(res, {
        code: 500,
        reason: "Internal server error",
      });
    }
  });

  server.on("upgrade", async (req, socket, head) => {
    const context = parseRequest(req.url);

    if (context?.path === "/") {
      const anvil =
        (await pool.get(context.id)) ??
        (await pool.start(
          context.id,
          typeof options === "function"
            ? await options(context.id, req)
            : options,
        ));

      proxy.ws(req, socket, head, {
        target: `ws://${anvil.host}:${anvil.port}`,
      });
    } else {
      socket.destroy(new Error("Unsupported request"));
    }
  });

  return server;
}

function sendFailure(
  res: ServerResponse,
  {
    reason = "Unsupported request",
    code = 400,
  }: { reason?: string; code?: number } = {},
) {
  sendResponse(res, code, {
    reason,
    success: false,
  });
}

function sendSuccess(
  res: ServerResponse,
  output?: { success?: never; [key: string]: unknown },
) {
  sendResponse(res, 200, {
    ...output,
    success: true,
  });
}

function sendResponse(
  res: ServerResponse,
  code = 200,
  output?: { success?: boolean; [key: string]: unknown },
) {
  const json = JSON.stringify({
    ...output,
    success: output?.success ?? code === 200,
  });

  res.writeHead(200).end(json);
}
