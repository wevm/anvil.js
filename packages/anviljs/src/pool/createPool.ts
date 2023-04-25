import getPort from "get-port";
import {
  createAnvil,
  type Anvil,
  type CreateAnvilOptions,
} from "../anvil/createAnvil.js";

// TODO: Don't be lazy. Create a proper type for this.
export type Pool<TKey = number> = ReturnType<typeof createPool<TKey>>;

export type PoolOptions = {
  /**
   * Limits the number of instances that can be created.
   */
  instanceLimit?: number | undefined;
  /**
   * Automatically find a free port if none was given.
   *
   * @defaultValue true
   */
  autoPort?: boolean | undefined;
};

export function createPool<TKey = number>({
  instanceLimit,
  autoPort = true,
}: PoolOptions = {}) {
  const instances = new Map<TKey, Promise<Anvil>>();

  async function start(id: TKey, options?: CreateAnvilOptions) {
    if (instances.has(id)) {
      throw new Error(`Anvil instance with id "${id}" already exists`);
    }

    if (instanceLimit !== undefined && instances.size + 1 > instanceLimit) {
      throw new Error(`Anvil instance limit of ${instanceLimit} reached`);
    }

    // rome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
    const anvil = new Promise<Anvil>(async (resolve, reject) => {
      try {
        const opts = {
          ...options,
          ...(options?.port === undefined && autoPort
            ? {
                port: await getPort(),
              }
            : {}),
        };

        const instance = createAnvil(opts);
        await instance.start();

        resolve(instance);
      } catch (error) {
        reject(error);
      }
    });

    instances.set(id, anvil);

    return anvil;
  }

  async function stop(id: TKey) {
    const anvil = instances.get(id);

    if (anvil === undefined) {
      throw new Error(`Anvil instance with id "${id}" doesn't exist`);
    }

    instances.delete(id);

    // If the anvil instance hasn't even started, we don't attempt to stop it.
    return anvil.catch(() => undefined).then((anvil) => anvil?.stop());
  }

  async function empty() {
    const array = Array.from(instances.keys());
    const result = await Promise.allSettled(array.map((id) => stop(id)));

    if (result.some(({ status }) => status === "rejected")) {
      throw new Error("Failed to gracefully stop some instances");
    }
  }

  return {
    get size() {
      return instances.size;
    },
    instances: () => instances.entries(),
    has: (id: TKey) => instances.has(id),
    get: (id: TKey) => instances.get(id),
    start,
    stop,
    empty,
  } as const;
}
