import { createAnvilProxy } from "@fubhy/anvil";
import { FORK_BLOCK_NUMBER, FORK_URL } from "./constants.js";

export default async function () {
  return await createAnvilProxy({
    proxyPort: 8545, // By default, the proxy will listen on port 8545.
    proxyHostname: "::", // By default, the proxy will listen on all interfaces.
    anvilOptions: {
      chainId: 123,
      forkUrl: FORK_URL,
      forkBlockNumber: FORK_BLOCK_NUMBER,
    },
  });
}
