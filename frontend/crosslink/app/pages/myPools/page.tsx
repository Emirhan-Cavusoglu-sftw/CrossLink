"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PoolManagerABI } from "../../../utils/poolManagerABI.json";
import { motion } from "framer-motion";
import { useHook } from "../../../components/hookContext";
import { getAccount, readContract } from "@wagmi/core";
import { ethers } from "ethers";
import { keccak256 } from "ethers/lib/utils";
import { config } from "../../../utils/config";
import {
  getUserTokens,
  getBalance,
  getTokenInfo,
} from "../../../utils/functions/createTokenFunctions";
import { LiquidiytDeltaABI } from "../../../utils/readerABI.json";

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

const etherScanApiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "";
const arbiscanApiKey = process.env.NEXT_PUBLIC_ARBISCAN_API_KEY || "";

const arbNative = "0x0000000000000000000000000000000000000000";
const ccip = "0xA8C0c11bf64AF62CDCA6f93D3769B88BdD7cb93D";

const MyPools = () => {
  const router = useRouter();
  const { selectedHook } = useHook();
  const account = getAccount(config);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredPools, setFilteredPools] = useState<Event[]>([]);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo[]>([]);
  const [userTokens, setUserTokens] = useState<
    { name: string; symbol: string }[]
  >([]);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [tickPrices, setTickPrices] = useState<{ [key: string]: number }>({});
  const [poolInfoPopup, setPoolInfoPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const customTokens = [
      {
        tokenAddress: ccip,
        mintedBy: "0xYourAddressHere", // Bu adresi gerektiği gibi ayarlayın
        name: "CCIP-BnM",
        symbol: "CCIP",
      },
      {
        tokenAddress: arbNative,
        mintedBy: "0xYourAddressHere", // Bu adresi gerektiği gibi ayarlayın
        name: "Arbitrum Native",
        symbol: "ARB",
      },
    ];
  
    getTokenInfo((fetchedTokens) => {
      setTokenInfo([...fetchedTokens, ...customTokens]);
    });
  }, []);

  useEffect(() => {
    if (selectedHook && tokenInfo.length > 0) {
      fetchEvents(); // `selectedHook` değeri ve token bilgileri hazır olduğunda havuzları çek
    }
  }, [selectedHook, tokenInfo]);

  const fetchEvents = async () => {
    setLoading(true);

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
      handleGetBalance(data.events);
      setIsDataFetched(true);
    } catch (error) {
      console.error("Error fetching events: ", (error as any).message);
    } finally {
      setLoading(false);
    }
  };

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
      `/pages/addLiquidity?id=${pool.args.id}&token0=${pool.args.currency0}&token1=${pool.args.currency1}&fee=${pool.args.fee}&tickSpacing=${pool.args.tickSpacing}&sqrtPriceX96=${pool.args.sqrtPriceX96}&tick=${pool.args.tick}&price=${tickPrices}&hooks=${pool.args.hooks}&tokenSymbol1=${tokenSymbol1}&tokenSymbol2=${tokenSymbol2}`
    );
  };

  const fetchTokenInfo = async () => {
    const tokens = await getTokenInfo(setTokenInfo);
    fetchEvents();
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleGetBalance = async (pools: Event[]) => {
    const userTokens: string[] = [];

    for (let token of tokenInfo) {
      const balance = await getBalance(token.tokenAddress);
      if (Number(balance) > 0) {
        userTokens.push(token.tokenAddress);
      }
    }

    setUserTokens(userTokens);

    const filtered = pools.filter(
      (pool) =>
        userTokens.includes(pool.args.currency0) ||
        userTokens.includes(pool.args.currency1)
    );

    setFilteredPools(filtered);

    // Fetch and calculate the price for each filtered pool
    for (let pool of filtered) {
      getSlotAndCalculatePrice(pool);
    }
  };

  async function getSlotAndCalculatePrice(events: Event[]) {
    try {
      const slot: any[] = await readContract(config, {
        abi: LiquidiytDeltaABI,
        address: "0x86a6cE6DE9d2A6D4CDafcFfdD24C6B69676acF3E",
        functionName: "getSlot0",
        args: [
          [
            events.args.currency0,
            events.args.currency1,
            events.args.fee,
            events.args.tickSpacing,
            events.args.hooks,
          ],
          "0x5F49Cf21273563a628F31cd08C1D4Ada7722aB58",
        ],
      });
      const tick = Number(slot[1]); // Ensure tick is a number
      if (!isNaN(tick)) {
        const price = calculatePriceFromTick(tick);
        setTickPrices((prevPrices) => ({
          ...prevPrices,
          [events.args.id]: price,
        }));
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
      <div className="flex flex-col justify-center items-center w-[1000px]">
        <div className="flex justify-between items-center w-full mb-4">
          <h1 className="text-2xl font-bold text-white">Pools</h1>
          <div>
            <motion.button
              className="bg-sky-600 hover:bg-indigo-700 w-36 opacity-80 text-white py-2 px-4 rounded-xl"
              onClick={() => handleNavigation("/pages/createPool")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Create Pool
            </motion.button>
            <button
              onClick={() => setPoolInfoPopup(true)}
              className="ml-2 text-white opacity-60 text-lg"
            >
              ?
            </button>
          </div>
        </div>

        <div className="bg-transparent border-gray-500 border-opacity-80 border-2 p-6 rounded-lg w-full overflow-y-auto custom-scrollbar max-h-[600px]">
          {filteredPools.length > 0 ? (
            <ul className="space-y-2">
              {filteredPools.map((events, index) => {
                const token0 = tokenInfo.find(
                  (token) => token.tokenAddress === events.args.currency0
                );
                const token1 = tokenInfo.find(
                  (token) => token.tokenAddress === events.args.currency1
                );
                const price = tickPrices[events.args.id];

                return (
                  <li
                    key={index}
                    className="text-white text-xl bg-gray-800 hover:bg-indigo-700 transition p-4 rounded-lg cursor-pointer flex flex-row justify-between "
                    onClick={() => handleNavigationToPool(events)}
                  >
                    <div>
                      <p>
                        {token0?.name}/{token1?.name} ({token0?.symbol}/
                        {token1?.symbol})
                      </p>
                      {price !== undefined ? (
                        <p className="text-xs mt-2">
                          1 {token0?.symbol} = {price.toFixed(6)}{" "}
                          {token1?.symbol}
                        </p>
                      ) : (
                        <p>Loading price...</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : isDataFetched ? (
            <div className="flex flex-col items-center justify-center h-48 bg-transparent rounded-lg">
              <svg
                fill="rgba(255, 255, 255, 0.8)"
                width="100px"
                height="100px"
                viewBox="-2 -4 24 24"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMinYMin"
                className="jam jam-box-f mb-4"
              >
                <path d="M20 5H0V3a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2zm0 2v6a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V7h6.126a4.002 4.002 0 0 0 7.748 0H20z" />
              </svg>
              <p className="text-white">
                Your active liquidity positions will appear here.
              </p>
            </div>
          ) : (
            <p className="text-center text-white">Loading...</p>
          )}
        </div>
        {poolInfoPopup && (
          <div
            className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 "
            id="popupOverlay"
            onClick={() => setPoolInfoPopup(false)}
          >
            <div className=" bg-blue-800 w-[600px] text-white p-4 rounded-lg z-50 text-xl space-y-4">
              <p>
                If you navigate to the <strong>“My Positions”</strong> section
                and then to the <strong>“Create Pool”</strong> tab, you can
                create a pool tailored to your preferences. In this section, you
                can:
              </p>
              <ul className="space-y-2">
                <li>
                  <strong>Select the Tokens:</strong> Choose the tokens you want
                  to pair in the pool.
                </li>
                <li>
                  <strong>Set the Initial Price Ratio:</strong> Determine the
                  starting price of the tokens in the pool by setting the
                  initial price ratio.
                </li>
                <li>
                  <strong>Adjust Other Parameters:</strong> Configure additional
                  parameters like the fee and tick spacing.
                </li>
              </ul>
              <p>
                If the site is in <strong>Nezlobin mode</strong>, the dynamic
                fee field will automatically populate with a value. This value
                signifies that the pool carries the dynamic fee flag, essential
                for pools utilizing the Nezlobin hook.
              </p>
              <p>
                You also have the flexibility to customize the price ratios to
                establish the initial trading conditions for your pool.
                Additionally, you have full control over selecting the tokens
                you want to use, enabling you to create pools that align with
                your trading or liquidity provision strategies—whether in
                standard Uniswap v4 mode or when using specialized hooks like{" "}
                <strong>Nezlobin</strong> or <strong>Limit Order</strong>.
              </p>
            </div>{" "}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPools;
