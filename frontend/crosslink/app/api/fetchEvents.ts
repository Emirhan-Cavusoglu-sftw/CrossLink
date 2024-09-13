import { ethers } from "ethers";
import { keccak256 } from "ethers/lib/utils";
import { NextApiRequest, NextApiResponse } from "next";

const etherScanApiKey = process.env.ETHERSCAN_API_KEY || "";
const arbiscanApiKey = process.env.ARBISCAN_API_KEY || "";

const CounterAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const SecondAddress = "0xYourSecondContractAddress"; // Diğer adres burada

// const ABI = [
//     "Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)"
// ];

// const ABI2 = [
//     "OrderPlaced(address,address,uint24,int24,address,int24,bool,uint256,address)"
// ];

interface Event {
  eventName: string;
  args: {
    currency0: string;
    currency1: string;
    fee: number;
    hooks: string;
    id: string;
    sqrtPriceX96: string;
    tick: number;
    tickSpacing: number;
  };
}

interface Order {
  eventName: string;
  args: {
    currency0: string;
    currency1: string;
    fee: number;
    tickSpacing: number;
    hooks: string;
    tickToSellAt: number;
    zeroForOne: boolean;
    inputAmount: number;
    sender: string;
  };
  positionId: number;
  balance: number;
  claimableTokens: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // İstekten chainId ve ABI bilgilerini alıyoruz
    const { chainId, ABIType } = req.body;

    let apiBaseUrl = "";
    let apiKey = "";

    // Choose API based on chain ID
    if (chainId === 11155111) {
      apiBaseUrl = "https://api-sepolia.etherscan.io/api";
      apiKey = etherScanApiKey;
    } else if (chainId === 421614) {
      apiBaseUrl = "https://api-sepolia.arbiscan.io/api";
      apiKey = arbiscanApiKey;
    } else {
      return res.status(400).json({ message: "Unsupported chain" });
    }

    // ABI türüne göre event signature ve adres seçimi
    let selectedABI, selectedAddress, eventSignature;

    if (ABIType === "Initialize") {
      selectedABI = [
        "Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)",
      ];
      eventSignature = keccak256(
        ethers.utils.toUtf8Bytes(
          "Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)"
        )
      );
      selectedAddress = CounterAddress;
    } else if (ABIType === "OrderPlaced") {
      selectedABI = [
        "OrderPlaced(address,address,uint24,int24,address,int24,bool,uint256,address)",
      ];
      eventSignature = keccak256(
        ethers.utils.toUtf8Bytes(
          "OrderPlaced(address,address,uint24,int24,address,int24,bool,uint256,address)"
        )
      );
      selectedAddress = SecondAddress;
    } else {
      return res.status(400).json({ message: "Invalid ABI type" });
    }

    // Logları fetch ediyoruz
    const response = await fetch(
      `${apiBaseUrl}?module=logs&action=getLogs&address=${selectedAddress}&topic0=${eventSignature}&apikey=${apiKey}`
    );
    const data = await response.json();

    if (data.status === "1") {
      const logs = data.result;
      const iface = new ethers.utils.Interface(selectedABI);

      // Gelen ABI türüne göre eventları decode ediyoruz
      let decodedEvents;
      if (ABIType === "Initialize") {
        decodedEvents = logs.map((log: any) => {
          const parsedLog = iface.parseLog(log);
          const event: Event = {
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
          return event;
        });
      } else if (ABIType === "OrderPlaced") {
        decodedEvents = logs.map((log: any) => {
          const parsedLog = iface.parseLog(log);
          const event: Order = {
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
            positionId: Number(log.topics[1]), // ID'yi topics'ten alabilirsiniz
            balance: Number(log.data), // Örneğin datadan
            claimableTokens: 0, // Placeholder, farklı bir veri kaynağına bağlı olabilir
          };
          return event;
        });
      }

      return res.status(200).json({ events: decodedEvents });
    } else {
      return res
        .status(400)
        .json({ message: data.message || "No events found" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching logs", error: (error as any).message });
  }
}
