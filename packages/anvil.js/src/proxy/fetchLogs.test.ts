import { beforeAll, afterEach, expect, test } from "vitest";
import { startProxy } from "./startProxy.js";
import getPort from "get-port";
import { createPool } from "../pool/createPool.js";
import { fetchLogs } from "./fetchLogs.js";

const pool = createPool();
afterEach(async () => {
  await pool.empty();
});

let port: number;
beforeAll(async () => {
  port = await getPort();
  return await startProxy({ port, pool });
});

test("can fetch logs from anvil instance", async () => {
  await pool.start(1);
  await expect(fetchLogs(`http://localhost:${port}`, 1)).resolves.toMatchObject(
    expect.arrayContaining([
      expect.stringMatching(
        /test test test test test test test test test test test junk/,
      ),
    ]),
  );
});

test("throws if trying to fetch logs from non-existent anvil instance", async () => {
  await expect(fetchLogs(`http://localhost:${port}`, 123)).rejects.toThrow(
    "Anvil instance doesn't exist",
  );
});
