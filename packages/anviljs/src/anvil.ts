import { execa, type ExecaChildProcess } from "execa";
import { Writable } from "node:stream";

export type AnvilOptions = {
  blockTime?: number;
  forkUrl?: string | undefined;
  forkBlockNumber?: number | bigint | undefined;
  port: number;
  startUpTimeout?: number;
};

export function startAnvil(options: AnvilOptions) {
  const opts = {
    startUpTimeout: 10_000,
    ...options,
  };

  let resolve: (value: Anvil) => void = () => {};
  let reject: (reason: Error) => void = () => {};

  const resolvable = new Promise<Anvil>((resolve_, reject_) => {
    resolve = resolve_;
    reject = reject_;

    // If anvil fails to start up in time, we reject the promise.
    setTimeout(() => {
      let message = "Anvil failed to start in time";
      const logs = recorder.flush();

      if (logs.length > 0) {
        message += `:\n\n${logs.join("\n")}}`;
      }

      reject(new Error(message));
    }, opts.startUpTimeout);
  });

  const controller = new AbortController();
  const recorder = new LogRecorder((message) => {
    // We know that anvil has started up when it prints this message.
    // TODO: This needs to be adjusted once we offer the `--host` option.
    if (message.includes(`Listening on 127.0.0.1:${opts.port}`)) {
      resolve(instance);
    }
  });

  // TODO: Expose all options here and possibly allow passing in custom string arguments.
  const args = Object.entries({
    "--port": `${opts.port}`,
    ...(opts.forkUrl ? { "--fork-url": opts.forkUrl } : {}),
    ...(opts.forkBlockNumber
      ? { "--fork-block-number": `${Number(opts.forkBlockNumber)}` }
      : {}),
    ...(opts.blockTime ? { "--block-time": `${opts.blockTime}` } : {}),
  }).flatMap(([key, value]) => [key, value]);

  const subprocess = execa("anvil", args, {
    signal: controller.signal,
    cleanup: true,
    all: true,
  });

  // Assign the anvil instance that is returned from the promise.
  const instance = new Anvil(subprocess, controller, recorder, opts);

  // rome-ignore lint/style/noNonNullAssertion: this is guaranteed to be set with `all: true`.
  subprocess.pipeAll!(recorder);
  subprocess.catch((error) => reject(error));

  return resolvable;
}

export class Anvil {
  public readonly options: AnvilOptions;
  public readonly process: ExecaChildProcess;
  private readonly controller: AbortController;
  private readonly recorder: LogRecorder;

  constructor(
    subprocess: ExecaChildProcess,
    controller: AbortController,
    recorder: LogRecorder,
    options: AnvilOptions,
  ) {
    this.process = subprocess;
    this.controller = controller;
    this.recorder = recorder;
    this.options = options;
  }

  public async exit(reason?: string) {
    if (!this.controller.signal.aborted) {
      this.controller.abort(reason);
    }

    try {
      await this.process;
    } catch {}
  }

  public get port() {
    return this.options.port;
  }

  public get logs() {
    return this.recorder.flush();
  }
}

class LogRecorder extends Writable {
  private readonly callback: (message: string) => void;
  private readonly messages: string[] = [];

  constructor(callback: (message: string) => void) {
    super();
    this.callback = callback;
  }

  // rome-ignore lint/suspicious/noExplicitAny: that's literally the type here ...
  override _write(chunk: any, _: string, next: (error?: Error) => void) {
    const message = chunk.toString().trim();
    this.messages.push(message);

    // Limit the number of messages we store.
    if (this.messages.length > 100) {
      this.messages.shift();
    }

    this.callback(message);
    next();
  }

  public flush() {
    return this.messages.splice(0, this.messages.length);
  }
}
