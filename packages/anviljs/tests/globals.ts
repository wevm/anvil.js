import { createTestClient, createPublicClient, type Chain, http } from "viem";
import { localhost } from "viem/chains";

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
