import { createAnvil, createPool, getVersion, startProxy } from "@viem/anvil";
import assert from "node:assert";
import { test } from "node:test";

test("can fetch the anvil version", async () => {
  const version = await getVersion();
  assert(version !== undefined);

  const regex =
    /[0-9]+\.[0-9]+\.[0-9] \([0-9a-f]{7} [0-9]{4}\-[0-9]{2}\-[0-9]{2}T[0-9]{2}\:[0-9]{2}\:[0-9]{2}\.[0-9]+Z\)/i;
  assert(regex.test(version));
});

test("can start and stop anvil instances", async () => {
  const getPort = await import("get-port").then((mod) => mod.default);
  const anvil = createAnvil({ port: await getPort() });
  assert(anvil !== undefined);

  await anvil.start();
  assert(anvil.status === "listening");
  await anvil.stop();
  assert((anvil.status as string) === "idle");
});

test("can start and stop pool instances", async () => {
  const pool = createPool();

  const a = await pool.start(1);
  assert(a !== undefined);
  assert(a.status === "listening");

  const b = await pool.start(123);
  assert(b !== undefined);
  assert(b.status === "listening");

  await a.stop();
  assert((a.status as string) === "idle");

  await b.stop();
  assert((b.status as string) === "idle");
});

test("can start and stop an anvil proxy", async () => {
  const stop = await startProxy();
  await stop();
});
