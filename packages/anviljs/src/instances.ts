import getPort from "get-port";
import { startAnvil, type Anvil, type AnvilOptions } from "./anvil.js";

const anvilInstances = new Map<number, Promise<Anvil>>();

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

export async function shutdownAnvilInstances() {
  const instances = Array.from(anvilInstances.values());
  await Promise.allSettled(
    instances.map(async (anvil) => (await anvil).exit()),
  );
}

export function getAnvilInstance(id: number) {
  return anvilInstances.get(id) ?? undefined;
}
