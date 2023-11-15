---
"@viem/anvil": patch
---

As Playwright imports CJS in global setup it will throw the error Error: require() of ES Module changed import to dynamic import.
* Removed the import of getPort from `"get-port"`
* Updated the port property to use `import("get-port").default` instead of `getPort()`
