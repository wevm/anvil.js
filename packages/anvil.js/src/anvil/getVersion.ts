/**
 * Get anvil version
 *
 * @param command Path or alias of the anvil binary. Defaults to `anvil`.
 * @returns The anvil version
 */
export async function getVersion(command = "anvil") {
  const { execa } = await import("execa");
  const result = await execa(command, ["--version"]);
  return result.stdout.replace(/^anvil /, "");
}
