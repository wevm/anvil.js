import { execaSync } from "execa";

export function getVersion(command = "anvil") {
  return execaSync(command, ["--version"]).stdout.replace(/^anvil /, "");
}
