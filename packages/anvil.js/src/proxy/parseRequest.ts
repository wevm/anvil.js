export type InstanceRequestContext = {
  id: number;
  path: string;
};

/**
 * Parse a request url into an object containing the id and path.
 *
 * @param request The request url.
 * @returns The parsed request context or undefined.
 */
export function parseRequest(
  request?: string,
): InstanceRequestContext | undefined {
  const host = "http://localhost"; // Dummy value for URL constructor
  const url = new URL(`${host}${request ?? "/"}`);
  const matches =
    new RegExp("^([0-9]+)((?:/[^/]+)*)$", "g").exec(url.pathname.slice(1)) ??
    [];

  const [, first, second] = matches;
  const id = first !== undefined ? Number(first) : undefined;
  if (id === undefined) {
    return undefined;
  }

  const segments = second?.slice(1).split("/") ?? [];
  return { id, path: `/${segments.join("/")}` };
}
