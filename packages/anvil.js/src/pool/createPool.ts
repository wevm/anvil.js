import {
  type Anvil,
  type CreateAnvilOptions,
  createAnvil,
} from "../anvil/createAnvil.js";

/**
 * A pool of anvil instances.
 */
export type Pool<TKey = number> = {
  /**
   * The number of instances in the pool.
   */
  readonly size: number;
  /**
   * Returns an iterator of all instances in the pool.
   */
  instances: () => IterableIterator<[TKey, Promise<Anvil>]>;
  /**
   * Returns true if the pool contains an instance with the given id.
   *
   * @param id The id of the instance.
   * @returns True if the pool contains an instance with the given id.
   */
  has: (id: TKey) => boolean;
  /**
   * Returns the instance with the given id or undefined if it doesn't exist.
   *
   * @param id The id of the instance.
   * @returns The instance with the given id or undefined if it doesn't exist.
   */
  get: (id: TKey) => Promise<Anvil> | undefined;
  /**
   * Starts an instance with the given id.
   *
   * @param id The id of the instance.
   * @param options The options to pass to the instance.
   * @returns A promise that resolves to the instance.
   * @throws If an instance with the given id already exists.
   * @throws If the instance limit has been reached.
   */
  start: (id: TKey, options?: CreateAnvilOptions) => Promise<Anvil>;
  /**
   * Stops the instance with the given id.
   *
   * @param id The id of the instance.
   * @returns A promise that resolves when the instance has stopped.
   * @throws If the instance didn't stop gracefully.
   */
  stop: (id: TKey) => Promise<void>;
  /**
   * Stops all instances in the pool.
   *
   * @returns A promise that resolves when all instances have stopped.
   * @throws If any instance didn't stop gracefully.
   */
  empty: () => Promise<void>;
};

export type CreatePoolOptions = {
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

/**
 * Creates pool of anvil instances.
 */
export function createPool<TKey = number>({
  instanceLimit,
  autoPort = true,
}: CreatePoolOptions = {}): Pool<TKey> {
  const instances = new Map<TKey, Promise<Anvil>>();

  async function start(id: TKey, options?: CreateAnvilOptions) {
    if (instances.has(id)) {
      throw new Error(`Anvil instance with id "${id}" already exists`);
    }

    if (instanceLimit !== undefined && instances.size + 1 > instanceLimit) {
      throw new Error(`Anvil instance limit of ${instanceLimit} reached`);
    }

    // rome-ignore lint/suspicious/noAsyncPromiseExecutor: this is fine ...
    const anvil = new Promise<Anvil>(async (resolve, reject) => {
      try {
        const opts = {
          ...options,
          ...(options?.port === undefined && autoPort
            ? {
                port:  await ((await import("get-port")).default)(),
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
      return;
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
  };
}
