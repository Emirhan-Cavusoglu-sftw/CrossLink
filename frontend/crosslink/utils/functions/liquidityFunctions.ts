import { PoolManagerABI } from "../poolManagerABI.json";
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
  try {
    const approve = await writeContract(config, {
      abi: ERC20ABI,
      address: tokenAddress,
      functionName: "approve",
      args: ["0x7b1d96aadfd510b24d46f3371e9b2dfa1963bb11", uintMax],
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
  try {
    const liquidity = await writeContract(config, {
      abi: ModifiyLiquidityABI,
      address: "0x7b1d96aadfd510b24d46f3371e9b2dfa1963bb11",
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

// export async function addLiquidity() {
//   try {
//     const liquidity = await writeContract(config, {
//       abi: ModifiyLiquidityABI,
//       address: "0x7b1d96aadfd510b24d46f3371e9b2dfa1963bb11",
//       functionName: "modifyLiquidity",
//       value: parseEther("0"),
//       args: [["0x3e5d5A90D887456f2F6A71214af6aFE1354aB005","0x62ed3d69a79A1C9c014e6cd4eB96eb2dC3db115C",8388608,79228162514264337593543950336,0,10000],[],],
//     });
//     console.log("Liquidity " + liquidity);
//   } catch (error) {
//     console.log(error);
//   }
// }

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
  const managerAddress = "0xccB5a2D19A67a1a5105F674465CAe2c5Ab1496Ac";
  try {
    const liquidityDelta = await readContract(config, {
      abi: LiquidiytDeltaABI,
      address: "0x3635b6d0b150d438163eaf7417812febc4030f2c",
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
