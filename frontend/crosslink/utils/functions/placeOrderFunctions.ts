import { config } from "../config";
import { LimitOrderABI } from "../limitOrderHookABI.json";
import { writeContract, readContract } from "@wagmi/core";
import { parseEther } from "viem";
import { getAccount } from "@wagmi/core";

export async function placeOrder(
  [currency0, currency1, fee, tickSpacing, hooks]: [
    string,
    string,
    number,
    number,
    string
  ],
  tickToSellAt: number,
  zeroForOne: boolean,
  amountIn: string
) {
  try {
    const placeOrder = await writeContract(config, {
      abi: LimitOrderABI,
      address: "0x735F883b29561463ec096670974670EC5Ff5D040",
      functionName: "placeOrder",
      args: [
        [currency0, currency1, fee, tickSpacing, hooks],
        tickToSellAt,
        zeroForOne,
        parseEther(amountIn),
      ],
    });
    console.log("Place Order:", placeOrder);
    return placeOrder;
  } catch (error) {
    console.error(error);
  }
}

async function getLowerUsableTick(tick: number, tickSpacing: number) {
  // intervals = tick / tickSpacing (integer division)
  let intervals = Math.floor(tick / tickSpacing);

  // since tick < 0, we round intervals down further if there's a remainder
  if (tick < 0 && tick % tickSpacing !== 0) {
    intervals--; // round towards negative infinity
  }

  // actual usable tick is intervals * tickSpacing
  return intervals * tickSpacing;
}

export async function getPositionId(
  currency0: string,
  currency1: string,
  fee: number,
  tickSpacing: number,
  tick: number,
  zeroForOne: boolean
) {
  const revertedTick = await getLowerUsableTick(tick, tickSpacing);
  try {
    const positionId = await readContract(config, {
      abi: LimitOrderABI,
      address: "0x735F883b29561463ec096670974670EC5Ff5D040",
      functionName: "getPositionId",
      args: [
        [
          currency0,
          currency1,
          fee,
          tickSpacing,
          "0x735F883b29561463ec096670974670EC5Ff5D040",
        ],
        revertedTick,
        zeroForOne,
      ],
    });
    console.log("Position ID:", positionId);
    return positionId;
  } catch (error) {
    console.error(error);
  }
}

export async function balanceOf(positionId: string) {
  const account = getAccount(config);
  if (!account || !account.address) {
    console.error("Account not found or address is invalid.");
    return;
  }
  try {
    const balance = await readContract(config, {
      abi: LimitOrderABI,
      address: "0x735F883b29561463ec096670974670EC5Ff5D040",
      functionName: "balanceOf",
      args: [account.address, BigInt(positionId)],
    });
    console.log("Balance for positionId:", positionId, "is", balance);
    return balance;
  } catch (error) {
    console.error(error);
  }
}

export async function claimableOutputTokens(positionId: string) {
  try {
    const claimableOutputTokens = await readContract(config, {
      abi: LimitOrderABI,
      address: "0x735F883b29561463ec096670974670EC5Ff5D040",
      functionName: "claimableOutputTokens",
      args: [BigInt(positionId)],
    });
    console.log("Claimable Output Tokens:", claimableOutputTokens);
    return claimableOutputTokens;
  } catch (error) {
    console.error(error);
  }
}

export async function redeem(
  [currency0, currency1, fee, tickSpacing, hooks]: [
    string,
    string,
    number,
    number,
    string
  ],
  tickToSellAt: number,
  zeroForOne: boolean,
  amountIn: string
) {
  try {
    const redeem = await writeContract(config, {
      abi: LimitOrderABI,
      address: "0x735F883b29561463ec096670974670EC5Ff5D040",
      functionName: "redeem",
      args: [
        [currency0, currency1, fee, tickSpacing, hooks],
        tickToSellAt,
        zeroForOne,
        BigInt(amountIn),
      ],
    });
    console.log("Redeem:", redeem);
    return redeem;
  } catch (error) {
    console.error(error);
  }
}

export async function cancelOrder(
  [currency0, currency1, fee, tickSpacing, hooks]: [
    string,
    string,
    number,
    number,
    string
  ],
  tickToSellAt: number,
  zeroForOne: boolean
) {
  try {
    const cancelOrder = await writeContract(config, {
      abi: LimitOrderABI,
      address: "0x735F883b29561463ec096670974670EC5Ff5D040",
      functionName: "cancelOrder",
      args: [
        [currency0, currency1, fee, tickSpacing, hooks],
        tickToSellAt,
        zeroForOne,
      ],
    });
    console.log("Cancel Order:", cancelOrder);
    return cancelOrder;
  } catch (error) {
    console.error(error);
  }
}
