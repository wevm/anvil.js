import assert from "node:assert";
import { test } from "node:test";
import { createAnvil, getVersion } from "@viem/anvil";

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
