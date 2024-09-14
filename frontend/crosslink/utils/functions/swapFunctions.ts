import { writeContract, readContract } from "@wagmi/core";
import { config } from "../config";
import { getAccount } from "@wagmi/core";
import { SwapRouterABI } from "../swapRouterABI.json";
import { parseUnits, formatUnits, parseEther } from "viem";

export async function swap(
  [currency0, currency1, fee, tickSpacing, hooks]: [
    string,
    string,
    number,
    number,
    string
  ],
  [zeroForOne, amountSpecified, sqrtPriceLimitX96]: [boolean, BigInt, BigInt]
) {
  try {
    console.log("zeroForOne " + zeroForOne);
    console.log("amountSpecified " + -parseEther(amountSpecified.toString()));
    console.log("sqrtPriceLimitX96 " + sqrtPriceLimitX96);
    const swap = writeContract(config, {
      abi: SwapRouterABI,
      address: "0x540bFc2FB3B040761559519f9F44690812f3514e",
      functionName: "swap",
      args: [
        [currency0, currency1, fee, tickSpacing, hooks],
        [
          zeroForOne,
          -parseEther(amountSpecified.toString()),
          sqrtPriceLimitX96,
        ],
        [false, false],
        "0x",
      ],
    });
    console.log(swap);
  } catch (e) {
    console.error(e);
  }
}
