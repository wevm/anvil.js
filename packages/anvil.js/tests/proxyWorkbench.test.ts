import { FORK_BLOCK_NUMBER, FORK_URL } from "./utils/constants.js";
import { createProxyClients } from "./utils/utils.js";
import { afterAll, expect, test } from "vitest";

const clients = createProxyClients([1, 2, 3]);

afterAll(async () => {
  await Promise.all(
    clients.map(({ testClient }) => {
      return testClient.reset({
        jsonRpcUrl: FORK_URL,
        blockNumber: FORK_BLOCK_NUMBER,
      });
    }),
  );
});

test("proxy workbench", async () => {
  const [a, b, c] = clients;

  await expect(
    a.publicClient.getBlockNumber({
      maxAge: 0,
    }),
  ).resolves.toBe(FORK_BLOCK_NUMBER);
  await a.testClient.mine({
    blocks: 5,
  });
  await expect(
    a.publicClient.getBlockNumber({
      maxAge: 0,
    }),
  ).resolves.toBe(FORK_BLOCK_NUMBER + 5n);

  await b.publicClient.getBlockNumber();
  await expect(
    b.publicClient.getBlockNumber({
      maxAge: 0,
    }),
  ).resolves.toBe(FORK_BLOCK_NUMBER);

  await c.publicClient.getBlockNumber();
  await expect(
    c.publicClient.getBlockNumber({
      maxAge: 0,
    }),
  ).resolves.toBe(FORK_BLOCK_NUMBER);
});
