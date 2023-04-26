import { toFlagCase } from "./toFlagCase.js";

/**
 * Converts an object of options to an array of command line arguments.
 *
 * @param options The options object.
 * @returns The command line arguments.
 */
export function toArgs(options: {
  [key: string]: string | boolean | number | bigint | undefined;
}) {
  return Object.entries(options).flatMap(([key, value]) => {
    if (value === undefined) {
      return [];
    }

    const flag = toFlagCase(key);

    if (value === false) {
      return [];
    } else if (value === true) {
      return [flag];
    }

    const stringified = value.toString();
    if (stringified === "") {
      return [flag];
    }

    return [flag, stringified];
  });
}
