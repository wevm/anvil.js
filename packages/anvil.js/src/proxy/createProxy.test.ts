import { createProxyClients } from "../../tests/utils/utils.js";
import { type StartProxyOptions, startProxy } from "./startProxy.js";
import getPort from "get-port";
import { afterEach, expect, test } from "vitest";

const cleanup: (() => Promise<void>)[] = [];

afterEach(async () => {
  await Promise.allSettled(cleanup.map((fn) => fn()));
});

// NOTE: We are shamelessly using `startProxy` for these tests as it's just a thin wrapper.
async function createProxy(options?: StartProxyOptions) {
  const port = options?.port ?? (await getPort());
  const proxy = await startProxy({ ...options, port });
  cleanup.push(proxy);
  return port;
}

test("can start a proxy that spawns and serves multiple anvil instances", async () => {
  const port = await createProxy();
  const [a, b, c] = createProxyClients([1, 2, 3], port);

  await expect(
    a.publicClient.getBlockNumber({
      maxAge: 0,
    }),
  ).resolves.toBe(0n);
  await a.testClient.mine({ blocks: 5 });
  await expect(
    a.publicClient.getBlockNumber({
      maxAge: 0,
    }),
  ).resolves.toBe(5n);

  await expect(
    b.publicClient.getBlockNumber({
      maxAge: 0,
    }),
  ).resolves.toBe(0n);
  await b.testClient.mine({ blocks: 3 });
  await expect(
    b.publicClient.getBlockNumber({
      maxAge: 0,
    }),
  ).resolves.toBe(3n);

  await expect(
    c.publicClient.getBlockNumber({
      maxAge: 0,
    }),
  ).resolves.toBe(0n);
  await c.testClient.mine({ blocks: 10 });
  await expect(
    c.publicClient.getBlockNumber({
      maxAge: 0,
    }),
  ).resolves.toBe(10n);
});
