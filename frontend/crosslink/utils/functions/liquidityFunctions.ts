import { writeContract, readContract } from "@wagmi/core";
import { config } from "../config";
import { getAccount } from "@wagmi/core";
import { parseUnits, formatUnits, parseEther } from "viem";
import { ModifiyLiquidityABI } from "../modifyLiquidityABI.json";
import { LiquidiytDeltaABI } from "../readerABI.json";
import { ERC20ABI } from "../ERC20ABI.json";

export async function Approve(tokenAddress: string) {
  const uintMax = 10000000000000000000000000;

  async function isValidAddress(tokenAddress: string) {
    return /^0x[a-fA-F0-9]{40}$/.test(tokenAddress);
  }

  if (!isValidAddress(tokenAddress)) {
    alert("Invalid Token Address");
    return;
  }

  const account = getAccount(config);
  let address = "";
  if (account.chainId) {
    if (String(account.chainId) == "421614") {
      address = "0xc66f440Ee31e3aE0b026972Ad0C6D62DfD27596B";
    } else if (String(account.chainId) == "11155111") {
      address = "0x0E67d44a512Bcf556FA8ef0e957Fbe843f67b53f";
    } else {
      alert("Invalid chainId");
    }
  }
  try {
    const approve = await writeContract(config, {
      abi: ERC20ABI,
      address: tokenAddress,
      functionName: "approve",
      args: [address, uintMax],
    });
    console.log("Approve " + approve);
    return approve;
  } catch (error) {
    console.log(error);
  }
}

export async function addLiquidity(
  [currency0, currency1, fee, tickSpacing, hooks]: [
    string,
    string,
    number,
    number,
    string
  ],
  [lowerTick, upperTick, liquidityDelta]: [number, number, string]
) {
  const account = getAccount(config);
  let address = "";
  if (account.chainId) {
    if (String(account.chainId) == "421614") {
      address = "0xc66f440Ee31e3aE0b026972Ad0C6D62DfD27596B";
    } else if (String(account.chainId) == "11155111") {
      address = "0x0E67d44a512Bcf556FA8ef0e957Fbe843f67b53f";
    } else {
      alert("Invalid chainId");
    }
  }
  try {
    const liquidity = await writeContract(config, {
      abi: ModifiyLiquidityABI,
      address: address,
      functionName: "modifyLiquidity",
      value: parseEther("0"),
      args: [
        [currency0, currency1, fee, tickSpacing, hooks],
        [
          lowerTick,
          upperTick,
          liquidityDelta,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        ],
        "0x",
      ],
    });
    console.log("Liquidity " + liquidity);
  } catch (error) {
    console.log(error);
  }
}

export async function getLiquidityDelta(
  [currency0, currency1, fee, tickSpacing, hooks]: [
    string,
    string,
    number,
    number,
    string
  ],
  lowerTick: number,
  upperTick: number,
  token0Amount: string,
  token1Amount: string
) {
  const account = getAccount(config);
  let managerAddress = "";
  let address = "";
  if (account.chainId) {
    if (String(account.chainId) == "421614") {
      address = "0x86a6cE6DE9d2A6D4CDafcFfdD24C6B69676acF3E";
      managerAddress = "0x5F49Cf21273563a628F31cd08C1D4Ada7722aB58";
    } else if (String(account.chainId) == "11155111") {
      address = "0xB9A3472106Bb737FA7Fedd215D7cA35F0d52D879";
      managerAddress = "0xbb46AB4ecC82166Be4d34f5a79992e582d14206a";
    } else {
      alert("Invalid chainId");
    }
  }
  try {
    const liquidityDelta = await readContract(config, {
      abi: LiquidiytDeltaABI,
      address: address,
      functionName: "read",
      args: [
        [currency0, currency1, fee, tickSpacing, hooks],
        managerAddress,
        lowerTick,
        upperTick,
        parseEther(token0Amount),
        parseEther(token1Amount),
      ],
    });
    console.log("Liquidity Delta " + liquidityDelta);
    return liquidityDelta;
  } catch (error) {
    console.log(error);
  }
}
