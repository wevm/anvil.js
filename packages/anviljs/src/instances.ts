import getPort from "get-port";
import { startAnvil, type Anvil, type AnvilOptions } from "./anvil.js";

const anvilInstances = new Map<number, Promise<Anvil>>();

/**
 * Get or create an anvil instance.
 *
 * @param id the id of the anvil instance
 * @param options the options to start the anvil instance with
 * @returns a promise of the anvil instance
 */
export async function getOrCreateAnvilInstance(
  id: number,
  options?: Omit<AnvilOptions, "port">,
) {
  let anvil = anvilInstances.get(id);

  if (anvil === undefined) {
    // rome-ignore lint/suspicious/noAsyncPromiseExecutor: we need this to be synchronous
    anvil = new Promise(async (resolve, reject) => {
      try {
        resolve(
          await startAnvil({
            ...options,
            port: await getPort(),
          }),
        );
      } catch (error) {
        reject(error);
      }
    });

    anvilInstances.set(id, anvil);

    return anvil;
  }

  return anvil;
}

/**
 * Attempts to gracefully shutdown all active anvil instances.
 */
export async function shutdownAnvilInstances() {
  const instances = Array.from(anvilInstances.values());
  await Promise.allSettled(
    instances.map(async (anvil) => (await anvil).exit()),
  );
}

/**
 * Get an anvil instance.
 *
 * @param id the id of the anvil instance
 * @returns a promise the anvil instance or undefined if it doesn't exist
 */
export function getAnvilInstance(id: number) {
  return anvilInstances.get(id) ?? undefined;
}
