import getPort from "get-port";
import { test, vi, expect, afterEach } from "vitest";
import { makeStartAnvilWithCleanup } from "../../tests/utils.js";
import { Anvil } from "./startAnvil.js";

const startAnvil = makeStartAnvilWithCleanup(afterEach);

test("throws if anvil does not start in time", async () => {
  vi.useFakeTimers();
  const promise = startAnvil({ startUpTimeout: 10_000 });
  vi.advanceTimersByTime(10_000);

  await expect(promise).rejects.toThrow("Anvil failed to start in time");
});

test("throws if anvil can't start due to port collision", async () => {
  const port = await getPort();
  await expect(startAnvil({ port })).resolves.toBeInstanceOf(Anvil);
  await expect(startAnvil({ port })).rejects.toThrow("Address already in use");
});
