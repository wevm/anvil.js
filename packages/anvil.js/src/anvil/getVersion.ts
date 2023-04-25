import { execaSync } from "execa";

/**
 * Get anvil version
 * @param command Path to anvil command
 * @returns anvil version
 */
export function getVersion(command = "anvil") {
  return execaSync(command, ["--version"]).stdout.replace(/^anvil /, "");
}
