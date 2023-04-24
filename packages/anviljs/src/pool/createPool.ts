import getPort from "get-port";
import { startAnvil, Anvil, type AnvilOptions } from "../anvil/startAnvil.js";

export type Pool<TKey> = ReturnType<typeof createPool<TKey>>;

export function createPool<TKey>() {
  const instances = new Map<TKey, Promise<Anvil>>();

  return {
    instances: () => instances.entries(),
    has: (id: TKey) => instances.has(id),
    get: (id: TKey) => instances.get(id),
    create: async (id: TKey, options?: AnvilOptions) => {
      if (instances.has(id)) {
        throw new Error("");
      }

      // rome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
      const anvil = new Promise<Anvil>(async (resolve, reject) => {
        try {
          const opts = {
            ...options,
            port: options?.port ?? (await getPort()),
          };

          resolve(await startAnvil(opts));
        } catch (error) {
          reject(error);
        }
      });

      instances.set(id, anvil);

      return anvil;
    },
    close: async (id: TKey) => {
      const anvil = instances.get(id);

      if (anvil !== undefined) {
        instances.delete(id);

        try {
          await (await anvil).exit();
        } catch {}
      }
    },
  } as const;
}
