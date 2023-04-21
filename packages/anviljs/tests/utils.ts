import { createPublicClient, createTestClient, http } from "viem";
import { anvil } from "./globals.js";

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
