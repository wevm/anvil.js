import { expect, test } from "vitest";
import { publicClient } from "../tests/utils.js";
import { FORK_BLOCK_NUMBER } from "../tests/constants.js";

test("vitest runs this test in parallel to the other", async () => {
  // NOTE: This test is run concurrently with the `wagmiContract` test file.
  //
  // Each test file runs in its own worker (controlled by `vitest`) and is assigned a unique pool id.
  // We append this pool id (`process.env.VITEST_POOL_ID`) to the rpc urls
  // (e.g. `http://127.0.0.1:8545/${id}`).
  //
  // The anvil proxy we spawn in `globalSetup.ts` listens on this address and routes requests to the
  // correct underlying anvil instance. If no anvil instance for the given `id` exists, it spawns it
  // on demand (jit) and forwards the request to it once it's ready.
  //
  // This allows us to run tests in parallel without having to worry about state determinism due to
  // concurrent access to the same anvil instance. Each test file gets its own anvil instance, and
  // we reset it after each test file (see `afterAll` in `setup.ts`).
  await expect(publicClient.getBlockNumber()).resolves.toBe(FORK_BLOCK_NUMBER);
});
