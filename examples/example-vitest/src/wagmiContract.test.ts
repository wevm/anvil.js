import { ALICE, BOB } from "../tests/constants.js";
import { publicClient, walletClient } from "../tests/utils.js";
import { wagmiContract } from "./wagmiContract.js";
import { type Address, isAddress } from "viem";
import { beforeAll, expect, test } from "vitest";

let wagmi: Address;
beforeAll(async () => {
  const hash = await walletClient.deployContract({
    ...wagmiContract,
    // This account is already unlocked by anvil. If you were to use an account that is not unlocked, you'd
    // have to impersonate it first using `testClient.impersonateAccount(<account>)`.
    account: ALICE,
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  });

  // rome-ignore lint/style/noNonNullAssertion: this is guaranteed to be set.
  wagmi = receipt.contractAddress!;
});

test("can deploy the wagmi contract", async () => {
  expect(wagmi).toBeDefined();
  expect(isAddress(wagmi)).toBe(true);
});

test("can mint wagmi nfts", async () => {
  // Check that the balance is 0 before minting.
  const balanceBefore = await publicClient.readContract({
    address: wagmi,
    abi: wagmiContract.abi,
    functionName: "balanceOf",
    args: [ALICE],
  });

  expect(balanceBefore).toBe(0n);

  // NOTE: This is somewhat superfluous, in a test you could just use `writeContract` directly.
  const { request } = await publicClient.simulateContract({
    account: ALICE, // This account is already unlocked by anvil.
    address: wagmi,
    abi: wagmiContract.abi,
    functionName: "mint",
    args: [1234n], // This is just the token id.
  });

  // NOTE: Our anvil instance is configured to use `auto mining`, meaning that every time a transaction
  // is sent to it, it automatically mines a block (default). This means that we don't have to mine a block
  // manually here or lose time waiting for the mining interval to pass. If this wasn't the case, you'd
  // have to add either use `testClient.mine` (in case auto mining is disabled), or
  // `publicClient.waitForTransactionReceipt` (in case interval mining is enabled).
  await walletClient.writeContract(request);

  // Check that the balance is what we expect it to be after minting.
  const balanceAfter = await publicClient.readContract({
    address: wagmi,
    abi: wagmiContract.abi,
    functionName: "balanceOf",
    args: [ALICE],
  });

  expect(balanceAfter).toBe(1n);
});

test("can transfer the nft", async () => {
  const balanceBeforeAlice = await publicClient.readContract({
    address: wagmi,
    abi: wagmiContract.abi,
    functionName: "balanceOf",
    args: [ALICE],
  });

  const balanceBeforeBob = await publicClient.readContract({
    address: wagmi,
    abi: wagmiContract.abi,
    functionName: "balanceOf",
    args: [BOB],
  });

  // NOTE: The tests in this file are sequentially on top of the same anvil instance & state. We only
  // reset the anvil instance after each test file (see the use of `afterAll` in `setup.ts`). Hence,
  // the balance should be 1 here as a result of the previous test case. Whether you write your tests
  // sequentially like this or not is up to you and depends on the use case. Sometimes it's useful to write
  // leverage this pattern to test a specific flow step by step. In other cases, you might want to write
  // your tests in a more isolated fashion and even reset the anvil instance after every test case using
  // `afterEach` for instance.
  expect(balanceBeforeAlice).toBe(1n);
  expect(balanceBeforeBob).toBe(0n);

  await walletClient.writeContract({
    abi: wagmiContract.abi,
    address: wagmi,
    functionName: "transferFrom",
    account: ALICE,
    args: [ALICE, BOB, 1234n],
  });

  // NOTE: Multicall is pretty cool. You don't actually need it in test cases but I put that here to
  // put some variety in the examples.
  const [balanceAfterAlice, balanceAfterBob] = await publicClient.multicall({
    allowFailure: false,
    contracts: [
      {
        address: wagmi,
        abi: wagmiContract.abi,
        functionName: "balanceOf",
        args: [ALICE],
      },
      {
        address: wagmi,
        abi: wagmiContract.abi,
        functionName: "balanceOf",
        args: [BOB],
      },
    ],
  });

  expect(balanceAfterAlice).toBe(0n);
  expect(balanceAfterBob).toBe(1n);
});
