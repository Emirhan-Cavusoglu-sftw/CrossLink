"use client";
import React, { useEffect, useState } from "react";
import { PoolManagerABI } from "../../../utils/poolManagerABI.json";
import { decodeEventLog } from "viem";
import { keccak256, toBytes } from "viem";
import { useHook } from "../../../components/hookContext";
import { useRouter } from "next/navigation";
import { getTokenInfo } from "../../../utils/functions/createTokenFunctions";
import { LiquidiytDeltaABI } from "../../../utils/readerABI.json";
import { writeContract, readContract, getAccount } from "@wagmi/core";
import { config } from "../../../utils/config";

interface Event {
  args: {
    currency0: string;
    currency1: string;
    fee: number;
    hooks: string;
    id: string;
    sqrtPriceX96: bigint;
    tick: number;
    tickSpacing: number;
  };
  eventName: string;
}

interface TokenInfo {
  tokenAddress: string;
  mintedBy: string;
  name: string;
  symbol: string;
}

const account = getAccount(config);
console.log("Chain Id " + account.chainId);

const ccip = "0xA8C0c11bf64AF62CDCA6f93D3769B88BdD7cb93D";

const Explore = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const { selectedHook } = useHook();
  const router = useRouter();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo[]>([]);
  const [tickPrices, setTickPrices] = useState<{ [key: string]: number }>({});
  const [price, setPrice] = useState<number>(0);

  console.log("Selected Hook:", selectedHook);

  useEffect(() => {
    const customTokens = [
      {
        tokenAddress: ccip,
        mintedBy: "0xYourAddressHere", // Bu adresi gerektiği gibi ayarlayın
        name: "CCIP-BnM",
        symbol: "CCIP",
      },
    ];

    getTokenInfo((fetchedTokens) => {
      setTokenInfo([...fetchedTokens, ...customTokens]);
    });
  }, []);

  const handleNavigationToPool = (pool) => {
    const token0 = tokenInfo.find(
      (token) => token.tokenAddress === pool.args.currency0
    );
    const token1 = tokenInfo.find(
      (token) => token.tokenAddress === pool.args.currency1
    );
    const tokenSymbol1 = token0 ? token0.symbol : "Unknown";
    const tokenSymbol2 = token1 ? token1.symbol : "Unknown";
    
    router.push(
      `/pages/addLiquidity?id=${pool.args.id}&token0=${
        pool.args.currency0
      }&token1=${pool.args.currency1}&fee=${pool.args.fee}&tickSpacing=${
        pool.args.tickSpacing
      }&sqrtPriceX96=${pool.args.sqrtPriceX96}&tick=${
        pool.args.tick
      }&price=${price}&hooks=${pool.args.hooks}&tokenSymbol1=${tokenSymbol1}&tokenSymbol2=${tokenSymbol2}`
    );
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chainId: account.chainId, // Example chainId (replace with actual chainId)
          ABIType: "Initialize", // Or "OrderPlaced", depending on what you want to fetch
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      console.log("Data: ", data);
      setEvents(data.events);
      // setFilteredEvents(data.events);
    } catch (error) {
      console.error("Error fetching events: ", (error as any).message);
    }
  };
  
  useEffect(() => {
    fetchEvents();
  }, [selectedHook, tokenInfo]);

  useEffect(() => {
    if (events.length > 0) {
      events.forEach((event) => {
        getSlot(
          event.args.currency0,
          event.args.currency1,
          event.args.fee,
          event.args.tickSpacing,
          event.args.hooks,
          event.args.id
        );
      });
    }
  }, [events]);

  const getTokenSymbol = (tokenAddress: string) => {
    const token = tokenInfo.find((t) => t.tokenAddress === tokenAddress);
    return token ? token.symbol : "Unknown";
  };

  async function getSlot(
    currency0: string,
    currency1: string,
    fee: number,
    tickSpacing: number,
    hooks: string,
    id: string
  ) {
    try {
      const slot: any[] = await readContract(config, {
        abi: LiquidiytDeltaABI,
        address: "0x86a6cE6DE9d2A6D4CDafcFfdD24C6B69676acF3E",
        functionName: "getSlot0",
        args: [
          [currency0, currency1, fee, tickSpacing, hooks],
          "0x5F49Cf21273563a628F31cd08C1D4Ada7722aB58",
        ],
      });
      console.log(slot);
      const tick = Number(slot[1]); // Extract tick value from the slot's 0th index (1st element)
      const price = calculatePriceFromTick(tick);
      if (!isNaN(tick)) {
        const price = calculatePriceFromTick(tick);
        setTickPrices((prevPrices) => ({
          ...prevPrices,
          [id]: price,
        }));
        setPrice(price);
      } else {
        console.error("Tick is not a number:", tick);
      }
    } catch (error) {
      console.error("Error fetching or processing data:", error);
    }
  }

  const calculatePriceFromTick = (tick: number) => {
    return Math.pow(1.0001, tick);
  };

  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-gray-900 to-blue-900 h-screen">
      <div className="relative border-2 border-gray-500 border-opacity-80 rounded-xl mt-16 w-[1000px]">
        <h2 className="absolute -top-3 left-4 bg-blue-800 w-16 text-center rounded-lg text-white px-2">
          Pools
        </h2>
        <div className="p-4 max-h-[500px] min-h-[500px] overflow-y-auto custom-scrollbar">
          {events.length > 0 ? (
            events.map((event, index) => {
              const token0 = tokenInfo.find(
                (token) => token.tokenAddress === event.args.currency0
              );
              const token1 = tokenInfo.find(
                (token) => token.tokenAddress === event.args.currency1
              );
              const price = tickPrices[event.args.id];
              return (
                <div
                  key={index}
                  className="bg-gray-800 hover:bg-indigo-700 transition text-white rounded-lg shadow-md p-6 mb-6 mt-4 cursor-pointer"
                  onClick={() => handleNavigationToPool(event)}
                >
                  <h3 className="text-2xl font-bold mb-4">
                    {index + 1}. Pool: {token0?.symbol}/{token1?.symbol}
                  </h3>
                  {price !== undefined ? (
                    <p className="text-xs">
                      1 {token0?.symbol} = {price.toFixed(6)} {token1?.symbol}
                    </p>
                  ) : (
                    <p>Loading price...</p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-400">No events found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;
