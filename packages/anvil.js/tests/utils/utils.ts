import type { Anvil } from "../../src/anvil/createAnvil.js";
import {
  type Chain,
  createPublicClient,
  createTestClient,
  createWalletClient,
  http,
} from "viem";
import { localhost } from "viem/chains";

type TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N
  ? R
  : TupleOf<T, N, [T, ...R]>;

export type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : TupleOf<T, N, []>
  : never;

export function createProxyClients<const TIds extends readonly number[]>(
  ids: TIds,
  port = 8545,
) {
  const output = ids.map((i) => {
    const publicClient = createPublicClient({
      chain: anvil,
      transport: http(`http://127.0.0.1:${port}/${i}`),
    });

    const testClient = createTestClient({
      chain: anvil,
      mode: "anvil",
      transport: http(`http://127.0.0.1:${port}/${i}`),
    });

    const walletClient = createWalletClient({
      chain: anvil,
      transport: http(`http://127.0.0.1:${port}/${i}`),
    });

    return { publicClient, testClient, walletClient } as const;
  });

  return output as Tuple<typeof output[number], TIds["length"]>;
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
