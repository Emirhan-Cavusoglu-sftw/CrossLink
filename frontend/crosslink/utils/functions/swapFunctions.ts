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
  [zeroForOne, amountSpecified, sqrtPriceLimitX96]: [boolean, string, BigInt]
) {
  const account = getAccount(config);
  console.log("chainId: " + account.chainId);
  let address = "";

  if (account.chainId) {
    if (String(account.chainId) == "421614") {
      address = "0x540bFc2FB3B040761559519f9F44690812f3514e";
    } else if (String(account.chainId) == "11155111") {
      address = "0x4a4E86EC2e24ded9d7C77aD103C49b62a10c54A2";
    } else {
      alert("Invalid chainId");
    }
  } else {
    alert("Chain ID not found");
  }
  try {
    console.log("zeroForOne " + zeroForOne);
    console.log("amountSpecified " + -parseEther(amountSpecified.toString()));
    console.log("sqrtPriceLimitX96 " + sqrtPriceLimitX96);
    console.log("address " + address);
    const swap = writeContract(config, {
      abi: SwapRouterABI,
      address: address,
      functionName: "swap",
      args: [
        [currency0, currency1, fee, tickSpacing, hooks],
        [zeroForOne, -parseEther(amountSpecified), sqrtPriceLimitX96],
        [false, false],
        "0x",
      ],
    });
    console.log(swap);
  } catch (e) {
    console.error(e);
  }
}
