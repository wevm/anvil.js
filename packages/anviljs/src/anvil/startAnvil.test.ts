import getPort from "get-port";
import { test, vi, expect, afterEach } from "vitest";
import {
  createAnvilClients,
  makeStartAnvilWithCleanup,
} from "../../tests/utils.js";
import { Anvil } from "./startAnvil.js";

const startAnvil = makeStartAnvilWithCleanup(afterEach);

afterEach(() => {
  vi.useRealTimers();
});

test("throws if anvil does not start in time with default timeout", async () => {
  vi.useFakeTimers();
  const promise = startAnvil();
  vi.advanceTimersByTime(10_000);

  await expect(promise).rejects.toThrow("Anvil failed to start in time");
});

test("throws if anvil does not start in time with custom timeout", async () => {
  // TODO: Test that the timeout is actually respected and it doesn't already throw at 10_000ms.
  vi.useFakeTimers();
  const anvil = startAnvil({ startUpTimeout: 50_000 });
  vi.advanceTimersByTime(50_000);

  await expect(anvil).rejects.toThrow("Anvil failed to start in time");
});

test("throws if anvil can'ta start due to port collision", async () => {
  const port = await getPort();
  await expect(startAnvil({ port })).resolves.toBeInstanceOf(Anvil);
  await expect(startAnvil({ port })).rejects.toThrow("Address already in use");
});

test("starts anvil with default options", async () => {
  const port = await getPort({ port: 54321 });
  const anvil = await startAnvil({
    port,
  });

  expect(anvil).toBeInstanceOf(Anvil);
  expect(anvil.port).toBe(port);
  expect(anvil.host).toBe("127.0.0.1");
  expect(anvil.options).toMatchObject({
    port,
  });
});

test("starts anvil with custom options", async () => {
  const timestamp = BigInt(new Date("Mon Apr 24 2020").getTime() / 1000);
  const port = await getPort({ port: 54321 });
  const anvil = await startAnvil({
    port,
    timestamp,
    chainId: 123,
    accounts: 3,
  });

  const { walletClient, publicClient } = createAnvilClients(anvil);

  const block = await publicClient.getBlock();
  expect(block.timestamp).toBe(timestamp);

  const addresses = await walletClient.getAddresses();
  expect(addresses.length).toBe(3);

  const id = await publicClient.getChainId();
  expect(id).toBe(123);
});
