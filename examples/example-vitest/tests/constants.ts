if (!process.env.VITE_ANVIL_FORK_URL) {
  throw new Error('Missing environment variable "VITE_ANVIL_FORK_URL"');
}

export const FORK_URL = process.env.VITE_ANVIL_FORK_URL;

if (!process.env.VITE_ANVIL_BLOCK_NUMBER) {
  throw new Error('Missing environment variable "VITE_ANVIL_BLOCK_NUMBER"');
}

export const FORK_BLOCK_NUMBER = BigInt(
  Number(process.env.VITE_ANVIL_BLOCK_NUMBER),
);
