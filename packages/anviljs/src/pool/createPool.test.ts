import { expect, test, afterEach, beforeEach } from "vitest";
import { createPool, type Pool } from "./createPool.js";
import { Anvil } from "../anvil/startAnvil.js";
import { createAnvilClients } from "../../tests/utils.js";

let pool: Pool<number>;
beforeEach(() => {
  pool = createPool();
});

afterEach(async () => {
  const instances = Array.from(pool.instances());
  await Promise.allSettled(instances.map(([id]) => pool.close(id)));
});

test("should create instances with different ids", async () => {
  await expect(pool.create(1)).resolves.toBeInstanceOf(Anvil);
  await expect(pool.create(2)).resolves.toBeInstanceOf(Anvil);
  await expect(pool.create(1337)).resolves.toBeInstanceOf(Anvil);
});

test("can get an instance from the pool after creating it", async () => {
  const a = await pool.create(1);
  const b = await pool.create(2);
  await expect(pool.get(1)).resolves.toBe(a);
  await expect(pool.get(2)).resolves.toBe(b);
  expect(pool.get(3)).toBe(undefined);
});

test("can use `has` to check if an instance exists", async () => {
  await pool.create(1);
  await pool.create(2);
  expect(pool.has(1)).toBe(true);
  expect(pool.has(2)).toBe(true);
  expect(pool.has(3)).toBe(false);
});

test("can't create multiple instances with the same id", async () => {
  await expect(pool.create(1)).resolves.toBeInstanceOf(Anvil);
  await expect(pool.create(2)).resolves.toBeInstanceOf(Anvil);
  await expect(pool.create(1)).rejects.toMatchInlineSnapshot(
    '[Error: Anvil instance with id "1" already exists]',
  );
});

test("can retrieve the size of a pool", async () => {
  expect(pool.size).toBe(0);
  await pool.create(1);
  expect(pool.size).toBe(1);
  await pool.create(2);
  expect(pool.size).toBe(2);
});

test("can retrieve all active instances", async () => {
  await pool.create(1);
  await pool.create(2);

  const instances = Array.from(pool.instances());
  expect(instances).toHaveLength(2);
  await expect((await instances[0])?.[1]).resolves.toBeInstanceOf(Anvil);
  await expect((await instances[1])?.[1]).resolves.toBeInstanceOf(Anvil);
});

test("can close instances", async () => {
  await pool.create(1);
  await pool.create(2);
  expect(pool.has(1)).toBe(true);
  expect(pool.has(2)).toBe(true);
  expect(pool.has(3)).toBe(false);

  await expect(pool.close(1)).resolves.toBe(undefined);
  await expect(pool.close(2)).resolves.toBe(undefined);
  expect(pool.has(1)).toBe(false);
  expect(pool.has(2)).toBe(false);
  expect(pool.has(3)).toBe(false);
});

test("throws when trying to close an instance that doesn't exist", async () => {
  await pool.create(1);
  await expect(pool.close(1)).resolves.toBe(undefined);
  await expect(pool.close(2)).rejects.toThrowErrorMatchingInlineSnapshot(
    '"Anvil instance with id \\"2\\" doesn\'t exist"',
  );
});

test("can use the same ids after closing instances", async () => {
  const first = await pool.create(1);
  await expect(pool.create(1)).rejects.toThrow();
  const second = await pool.close(1);
  await expect(pool.create(1)).resolves.toBeInstanceOf(Anvil);
  expect(first).not.toBe(second);
});

test("can create instances with different options", async () => {
  {
    const { publicClient, walletClient } = createAnvilClients(
      await pool.create(1, {
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
      await pool.create(2, {
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
