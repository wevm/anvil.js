import { getVersion } from "./getVersion.js";
import { expect, test } from "vitest";

test("returns a valid version string", async () => {
  const version = await getVersion();
  expect(version).toBeDefined();
  expect(version).toMatch(
    /[0-9]+\.[0-9]+\.[0-9] \([0-9a-f]{7} [0-9]{4}\-[0-9]{2}\-[0-9]{2}T[0-9]{2}\:[0-9]{2}\:[0-9]{2}\.[0-9]+Z\)/,
  );
});
