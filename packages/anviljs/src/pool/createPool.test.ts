import { expect, test, afterEach, beforeEach } from "vitest";
import { createPool, type Pool } from "./createPool.js";
import { createAnvilClients } from "../../tests/utils/utils.js";

let pool: Pool<number>;
beforeEach(() => {
  pool = createPool();
});

afterEach(async () => {
  const instances = Array.from(pool.instances());
  await Promise.allSettled(instances.map(([id]) => pool.stop(id)));
});

test("should create instances with different ids", async () => {
  await expect(pool.start(1)).resolves.toBeDefined();
  await expect(pool.start(2)).resolves.toBeDefined();
  await expect(pool.start(1337)).resolves.toBeDefined();
});

test("can get an instance from the pool after creating it", async () => {
  const a = await pool.start(1);
  const b = await pool.start(2);
  await expect(pool.get(1)).resolves.toBe(a);
  await expect(pool.get(2)).resolves.toBe(b);
  expect(pool.get(3)).toBe(undefined);
});

test("can use `has` to check if an instance exists", async () => {
  await pool.start(1);
  await pool.start(2);
  expect(pool.has(1)).toBe(true);
  expect(pool.has(2)).toBe(true);
  expect(pool.has(3)).toBe(false);
});

test("can't create multiple instances with the same id", async () => {
  await expect(pool.start(1)).resolves.toBeDefined();
  await expect(pool.start(2)).resolves.toBeDefined();
  await expect(pool.start(1)).rejects.toMatchInlineSnapshot(
    '[Error: Anvil instance with id "1" already exists]',
  );
});

test("can retrieve the size of a pool", async () => {
  expect(pool.size).toBe(0);
  await pool.start(1);
  expect(pool.size).toBe(1);
  await pool.start(2);
  expect(pool.size).toBe(2);
});

test("can retrieve all active instances", async () => {
  await pool.start(1);
  await pool.start(2);

  const instances = Array.from(pool.instances());
  expect(instances).toHaveLength(2);
  await expect((await instances[0])?.[1]).resolves.toBeDefined();
  await expect((await instances[1])?.[1]).resolves.toBeDefined();
});

test("can close instances", async () => {
  await pool.start(1);
  await pool.start(2);
  expect(pool.has(1)).toBe(true);
  expect(pool.has(2)).toBe(true);
  expect(pool.has(3)).toBe(false);

  await expect(pool.stop(1)).resolves.toBe(undefined);
  await expect(pool.stop(2)).resolves.toBe(undefined);
  expect(pool.has(1)).toBe(false);
  expect(pool.has(2)).toBe(false);
  expect(pool.has(3)).toBe(false);
});

test("throws when trying to close an instance that doesn't exist", async () => {
  await pool.start(1);
  await expect(pool.stop(1)).resolves.toBe(undefined);
  await expect(pool.stop(2)).rejects.toThrowErrorMatchingInlineSnapshot(
    '"Anvil instance with id \\"2\\" doesn\'t exist"',
  );
});

test("can use the same ids after closing instances", async () => {
  const first = await pool.start(1);
  await expect(pool.start(1)).rejects.toThrow();
  const second = await pool.stop(1);
  await expect(pool.start(1)).resolves.toBeDefined();
  expect(first).not.toBe(second);
});

test("can create instances with different options", async () => {
  {
    const { publicClient, walletClient } = createAnvilClients(
      await pool.start(1, {
        accounts: 5,
        balance: 1_000n,
        chainId: 123,
      }),
    );

    await expect(publicClient.getChainId()).resolves.toBe(123);
    await expect(
      publicClient.getBalance({
        address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      }),
    ).resolves.toBe(1_000_000_000_000_000_000_000n);
    await expect(walletClient.getAddresses()).resolves.toMatchInlineSnapshot(`
      [
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      ]
    `);
  }

  {
    const { publicClient, walletClient } = createAnvilClients(
      await pool.start(2, {
        accounts: 2,
        balance: 543n,
        chainId: 321,
      }),
    );

    await expect(publicClient.getChainId()).resolves.toBe(321);
    await expect(
      publicClient.getBalance({
        address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      }),
    ).resolves.toBe(543_000_000_000_000_000_000n);
    await expect(walletClient.getAddresses()).resolves.toMatchInlineSnapshot(`
      [
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      ]
    `);
  }
});

test("throws if instance limit is exceeded", async () => {
  pool = createPool({
    instanceLimit: 3,
  });

  await expect(pool.start(1)).resolves.toBeDefined();
  await expect(pool.start(2)).resolves.toBeDefined();
  await expect(pool.start(3)).resolves.toBeDefined();
  await expect(pool.start(4)).rejects.toThrowErrorMatchingInlineSnapshot('"Anvil instance limit of 3 reached"');
});

test("throws if auto port detection is disabled", async () => {
  pool = createPool({
    autoPort: false,
  });

  await expect(pool.start(1)).resolves.toBeDefined();
  await expect(pool.start(2)).rejects.toThrow('Anvil exited');
});

test("empty closes all instance", async () => {
  await pool.start(1);
  await pool.start(2);
  await pool.start(3);
  await pool.start(4);

  expect(pool.get(1)).toBeDefined();
  expect(pool.get(2)).toBeDefined();
  expect(pool.get(3)).toBeDefined();
  expect(pool.get(4)).toBeDefined();

  await pool.empty();
  expect(pool.get(1)).toBeUndefined();
});
