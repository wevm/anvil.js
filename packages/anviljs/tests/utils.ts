import {
  createTestClient,
  createPublicClient,
  type Chain,
  http,
  createWalletClient,
} from "viem";
import { localhost } from "viem/chains";
import {
  startAnvil,
  type Anvil,
  type StartAnvilOptions,
} from "../src/anvil/startAnvil.js";
import {
  type afterAll,
  type afterEach,
  type beforeAll,
  type Awaitable,
} from "vitest";
import type { beforeEach } from "node:test";

type TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N
  ? R
  : TupleOf<T, N, [T, ...R]>;

export type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : TupleOf<T, N, []>
  : never;

export function createProxyClients<TIds extends readonly number[]>(ids: TIds) {
  const output = ids.map((i) => {
    const publicClient = createPublicClient({
      chain: anvil,
      transport: http(`http://127.0.0.1:8545/${i}`),
    });

    const testClient = createTestClient({
      chain: anvil,
      mode: "anvil",
      transport: http(`http://127.0.0.1:8545/${i}`),
    });

    const walletClient = createWalletClient({
      chain: anvil,
      transport: http(`http://127.0.0.1:8545/${i}`),
    });

    return { publicClient, testClient, walletClient } as const;
  });

  return output as Tuple<(typeof output)[number], TIds["length"]>;
}

export function createAnvilClients(instance: Anvil) {
  const publicClient = createPublicClient({
    chain: anvil,
    transport: http(`http://${instance.host}:${instance.port}`),
  });

  const testClient = createTestClient({
    chain: anvil,
    mode: "anvil",
    transport: http(`http://${instance.host}:${instance.port}`),
  });

  const walletClient = createWalletClient({
    chain: anvil,
    transport: http(`http://${instance.host}:${instance.port}`),
  });

  return { publicClient, testClient, walletClient } as const;
}

export function makeStartAnvilWithCleanup(
  hook:
    | typeof afterEach
    | typeof beforeEach
    | typeof afterAll
    | typeof beforeAll
) {
  const instances: Awaitable<Anvil>[] = [];

  hook(async () => {
    await Promise.allSettled(
      instances.map(async (anvil) => (await anvil).exit())
    );
  });

  return function (options?: StartAnvilOptions) {
    const anvil = startAnvil(options);
    instances.push(anvil);
    return anvil;
  };
}

const id = process.env.VITEST_POOL_ID ?? 1;
export const anvil = {
  ...localhost,
  rpcUrls: {
    default: {
      http: [`http://127.0.0.1:8545/${id}`],
      webSocket: [`ws://127.0.0.1:8545/${id}`],
    },
    public: {
      http: [`http://127.0.0.1:8545/${id}`],
      webSocket: [`ws://127.0.0.1:8545/${id}`],
    },
  },
} as const satisfies Chain;

export const testClient = createTestClient({
  chain: anvil,
  mode: "anvil",
  transport: http(),
});

export const publicClient = createPublicClient({
  chain: anvil,
  transport: http(),
});
