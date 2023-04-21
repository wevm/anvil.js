import { createTestClient, createPublicClient, type Chain, http } from "viem";
import { localhost } from "viem/chains";

type TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N
  ? R
  : TupleOf<T, N, [T, ...R]>;

export type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : TupleOf<T, N, []>
  : never;

export function createClients<TCount extends number>(count: TCount) {
  const output = Array.from(Array(count).keys()).map((i) => {
    const publicClient = createPublicClient({
      chain: anvil,
      transport: http(`http://127.0.0.1:8545/${i}`),
    });

    const testClient = createTestClient({
      chain: anvil,
      mode: "anvil",
      transport: http(`http://127.0.0.1:8545/${i}`),
    });

    return { publicClient, testClient } as const;
  });

  return output as Tuple<typeof output[number], TCount>;
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
