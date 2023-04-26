import type { ProxyResponse } from "./createProxy.js";

/**
 * Fetches logs for anvil instances.
 *
 * @param url URL to anvil proxy
 * @param id ID of test worker
 * @returns Logs of anvil instance
 */
export async function fetchLogs(url: string, id: number): Promise<string[]> {
  const response = await fetch(new URL(`${id}/logs`, url), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result = (await response.json()) as ProxyResponse<{ logs: string[] }>;

  if (result.success === false) {
    throw new Error(result.reason);
  }

  return result.logs;
}
