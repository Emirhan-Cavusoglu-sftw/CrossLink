import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { keccak256 } from "ethers/lib/utils";
import { PoolManagerABI } from "../../utils/poolManagerABI.json";
import { LimitOrderABI } from "../../utils/limitOrderHookABI.json";

const etherScanApiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "";
const arbiscanApiKey = process.env.NEXT_PUBLIC_ARBISCAN_API_KEY || "";

const CounterAddress = "0x5F49Cf21273563a628F31cd08C1D4Ada7722aB58";
const SecondAddress = "0x735F883b29561463ec096670974670EC5Ff5D040";

export async function POST(req: Request) {
  try {
    console.log("Received request"); // Log when the request is received
    const body = await req.json();
    const { chainId, ABIType } = body;

    console.log("Request body:", body); // Log the request body

    let apiBaseUrl = "";
    let apiKey = "";

    if (chainId === 11155111) {
      apiBaseUrl = "https://api-sepolia.etherscan.io/api";
      apiKey = etherScanApiKey;
    } else if (chainId === 421614) {
      apiBaseUrl = "https://api-sepolia.arbiscan.io/api";
      apiKey = arbiscanApiKey;
    } else {
      return NextResponse.json(
        { message: "Unsupported chain" },
        { status: 400 }
      );
    }

    console.log("API Base URL:", apiBaseUrl, "API Key:", apiKey);

    let selectedABI, selectedAddress, eventSignature;

    if (ABIType === "Initialize") {
      selectedABI = PoolManagerABI;
      eventSignature = keccak256(
        ethers.utils.toUtf8Bytes(
          "Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)"
        )
      );
      selectedAddress = CounterAddress;
    } else if (ABIType === "OrderPlaced") {
      selectedABI = LimitOrderABI;
      eventSignature = keccak256(
        ethers.utils.toUtf8Bytes(
          "OrderPlaced(address,address,uint24,int24,address,int24,bool,uint256,address)"
        )
      );
      selectedAddress = SecondAddress;
    } else {
      return NextResponse.json(
        { message: "Invalid ABI type" },
        { status: 400 }
      );
    }

    console.log("Selected ABI:", selectedABI);
    console.log("Event Signature:", eventSignature);

    const response = await fetch(
      `${apiBaseUrl}?module=logs&action=getLogs&address=${selectedAddress}&topic0=${eventSignature}&apikey=${apiKey}`
    );
    const data = await response.json();

    if (data.status === "1") {
      const logs = data.result;
      const iface = new ethers.utils.Interface(PoolManagerABI);

      let decodedEvents;
      if (ABIType === "Initialize") {
        decodedEvents = logs.map((log: any) => {
          const parsedLog = iface.parseLog(log);
          return {
            eventName: parsedLog.name,
            args: {
              currency0: parsedLog.args[1],
              currency1: parsedLog.args[2],
              fee: parsedLog.args[3],
              hooks: parsedLog.args[5],
              id: parsedLog.args[0],
              sqrtPriceX96: parsedLog.args[6],
              tick: parsedLog.args[7],
              tickSpacing: parsedLog.args[4],
            },
          };
        });
      } else if (ABIType === "OrderPlaced") {
        let iface2 = new ethers.utils.Interface(LimitOrderABI);
        decodedEvents = logs.map((log: any) => {
          const parsedLog = iface2.parseLog(log);
          return {
            eventName: parsedLog.name,
            args: {
              currency0: parsedLog.args[0],
              currency1: parsedLog.args[1],
              fee: parsedLog.args[2],
              tickSpacing: parsedLog.args[3],
              hooks: parsedLog.args[4],
              tickToSellAt: parsedLog.args[5],
              zeroForOne: parsedLog.args[6],
              inputAmount: parsedLog.args[7],
              sender: parsedLog.args[8],
            },
            positionId: Number(log.topics[1]),
            balance: Number(log.data),
            claimableTokens: 0,
          };
        });
      }

      console.log("Decoded Events:", decodedEvents);
      return NextResponse.json({ events: decodedEvents });
    } else {
      console.error("No events found:", data.message);
      return NextResponse.json(
        { message: data.message || "No events found" },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching logs", error: (error as any).message },
      { status: 500 }
    );
  }
}
