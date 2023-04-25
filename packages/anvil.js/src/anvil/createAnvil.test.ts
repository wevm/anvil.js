import getPort from "get-port";
import { test, vi, expect, afterEach } from "vitest";
import { createAnvilClients } from "../../tests/utils/utils.js";
import {
  createAnvil as createAnvilBase,
  type Anvil,
  type CreateAnvilOptions,
} from "./createAnvil.js";

const instances: Anvil[] = [];
afterEach(async () => {
  vi.useRealTimers();
  const anvils = instances.splice(0, instances.length);
  await Promise.allSettled(anvils.map((anvil) => anvil.stop()));
});

function createAnvil(options?: CreateAnvilOptions) {
  const anvil = createAnvilBase(options);
  instances.push(anvil);
  return anvil;
}

test("throws if anvil does not start in time with default timeout", async () => {
  vi.useFakeTimers();
  const anvil = createAnvil();
  const promise = anvil.start();
  vi.advanceTimersByTime(10_000);

  await expect(promise).rejects.toThrow("Anvil failed to start in time");
});

test("throws if anvil does not start in time with custom timeout", async () => {
  vi.useFakeTimers();
  const anvil = createAnvil({ startTimeout: 50_000 });
  expect(anvil.status).toBe("idle");
  const promise = anvil.start();
  expect(anvil.status).toBe("starting");
  vi.advanceTimersByTime(10_000);
  expect(anvil.status).toBe("starting");
  vi.advanceTimersByTime(40_000);

  await expect(promise).rejects.toThrow("Anvil failed to start in time");
  expect(anvil.status).toBe("idle");
});

test("throws if anvil can't start due to port collision", async () => {
  const port = await getPort();
  const a = createAnvil({ port });
  const b = createAnvil({ port });
  await expect(a.start()).resolves.toBeUndefined();
  await expect(b.start()).rejects.toThrow("Anvil exited");
});

test("throws if trying to start the same instance multiple times", async () => {
  const port = await getPort();
  const anvil = createAnvil({ port });
  await expect(anvil.start()).resolves.toBeUndefined();
  await expect(anvil.start()).rejects.toThrow("Anvil instance not idle");
});

test("can start and stop the same instance multiple times", async () => {
  const port = await getPort();
  const anvil = createAnvil({ port });
  await expect(anvil.start()).resolves.toBeUndefined();
  await expect(anvil.stop()).resolves.toBeUndefined();
  await expect(anvil.start()).resolves.toBeUndefined();
  await expect(anvil.stop()).resolves.toBeUndefined();
  await expect(anvil.start()).resolves.toBeUndefined();
  await expect(anvil.stop()).resolves.toBeUndefined();
});

test("starts anvil with default options", async () => {
  const port = await getPort({ port: 54321 });
  const anvil = createAnvil({
    port,
  });

  expect(anvil.port).toBe(port);
  expect(anvil.host).toBe("127.0.0.1");
  expect(anvil.options).toMatchObject({
    port,
  });
});

test("starts anvil with custom options", async () => {
  const timestamp = BigInt(new Date("Mon Apr 24 2020").getTime() / 1000);
  const anvil = createAnvil({
    port: await getPort({ port: 54321 }),
    timestamp,
    chainId: 123,
    accounts: 3,
  });

  await anvil.start();

  const { walletClient, publicClient } = createAnvilClients(anvil);

  const block = await publicClient.getBlock();
  expect(block.timestamp).toBe(timestamp);

  const addresses = await walletClient.getAddresses();
  expect(addresses.length).toBe(3);

  const id = await publicClient.getChainId();
  expect(id).toBe(123);
});

test("can subscribe to stdout", async () => {
  const messages: string[] = [];
  const port = await getPort();
  const timestamp = BigInt(new Date("Mon Apr 24 2020").getTime() / 1000);
  const anvil = createAnvil({ port, timestamp });
  anvil.on("stdout", (message) => messages.push(message));

  await anvil.start();
  expect(messages.length).toBeGreaterThanOrEqual(1);
});

test("can subscribe to stderr", async () => {
  const messages: string[] = [];
  const port = await getPort();

  const first = createAnvil({ port });
  await first.start();

  const second = createAnvil({ port });
  second.on("stderr", (message) => messages.push(message));
  await expect(second.start()).rejects.toThrow("Anvil exited");

  expect(messages.length).toBeGreaterThanOrEqual(1);
  expect(messages.join("")).toMatch("thread 'main' panicked");
});
