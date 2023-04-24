import getPort from "get-port";
import { startAnvil, Anvil, type AnvilOptions } from "../anvil/startAnvil.js";

export type Pool<TKey> = ReturnType<typeof createPool<TKey>>;

export type PoolOptions = {
  instanceLimit?: number;
};

export function createPool<TKey>({ instanceLimit }: PoolOptions = {}) {
  const instances = new Map<TKey, Promise<Anvil>>();

  return {
    get size() {
      return instances.size;
    },
    instances: () => instances.entries(),
    has: (id: TKey) => instances.has(id),
    get: (id: TKey) => instances.get(id),
    create: async (id: TKey, options?: AnvilOptions) => {
      if (instances.has(id)) {
        throw new Error(`Anvil instance with id "${id}" already exists`);
      }

      if (instanceLimit !== undefined && instances.size + 1 >= instanceLimit) {
        throw new Error(`Anvil instance limit of ${instanceLimit} reached`);
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

      if (anvil === undefined) {
        throw new Error(`Anvil instance with id "${id}" doesn't exist`);
      }

      instances.delete(id);
      await (await anvil).exit();
    },
  } as const;
}
