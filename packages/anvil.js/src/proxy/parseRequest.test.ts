import { parseRequest } from "./parseRequest.js";
import { expect, test } from "vitest";

test.each([
  ["", undefined],
  ["/", undefined],
  ["/1", { id: 1, path: "/" }],
  ["/1/", undefined],
  ["/-3", undefined],
  ["/123/foo", { id: 123, path: "/foo" }],
  ["/123456/bar", { id: 123456, path: "/bar" }],
  ["/-5/baz", undefined],
  ["/321/foo/bar", { id: 321, path: "/foo/bar" }],
  ["/567/foo/bar/baz", { id: 567, path: "/foo/bar/baz" }],
  ["/321/foo/bar/", undefined],
  ["/foo", undefined],
  ["/foo/bar", undefined],
])('parseRequest("%s") -> %o', (input, expected) => {
  expect(parseRequest(input)).toEqual(expected);
});
