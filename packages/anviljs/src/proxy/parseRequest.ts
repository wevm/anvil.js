export function parseRequest(request?: string) {
  const host = "http://localhost"; // Dummy value for URL constructor
  const url = new URL(`${host}${request ?? "/"}`);
  const matches =
    new RegExp("^([0-9]+)(?:/([^/]+))*$").exec(url.pathname.slice(1)) ?? [];

  const id = matches[1] ? Number(matches[1]) : undefined;
  if (id === undefined) {
    return { id: undefined, path: undefined };
  }

  const path = matches[2]
    ? matches[2].split("/").map((value) => value.trim())
    : [];

  return { id, path: `/${path.join("/")}` };
}
