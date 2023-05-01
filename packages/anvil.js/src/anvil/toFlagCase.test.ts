import { toFlagCase } from "./toFlagCase.js";
import { expect, test } from "vitest";

test.each([
  ["foo", "--foo"],
  ["fooBar", "--foo-bar"],
  ["fooBarBaz", "--foo-bar-baz"],
])("toFlagCase(%s) -> %s", (input, expected) => {
  expect(toFlagCase(input)).toBe(expected);
});
