const { execaSync } = await import("execa");

/**
 * Get anvil version
 *
 * @param command Path or alias of the anvil binary. Defaults to `anvil`.
 * @returns The anvil version
 */
export function getVersion(command = "anvil") {
  return execaSync(command, ["--version"]).stdout.replace(/^anvil /, "");
}
