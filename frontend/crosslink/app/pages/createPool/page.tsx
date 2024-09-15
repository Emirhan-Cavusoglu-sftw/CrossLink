"use client";
import React, { useEffect, useState } from "react";
import { PoolManagerABI } from "../../../utils/poolManagerABI.json";
import { writeContract, readContract } from "@wagmi/core";
import { config } from "../../../utils/config";
import { getTokenInfo } from "../../../utils/functions/createTokenFunctions";
import { useHook } from "../../../components/hookContext";
import { motion } from "framer-motion";

const hookData = "0x";

const dynamicFee = 8388608;
interface TokenInfo {
  tokenAddress: string;
  mintedBy: string;
  name: string;
  symbol: string;
}

const ccip = "0xA8C0c11bf64AF62CDCA6f93D3769B88BdD7cb93D";
const arbNative = "0x0000000000000000000000000000000000000000";

const availableHooks = {
  UniswapV4: "0x0000000000000000000000000000000000000000",
  Nezlobin: "0x7Ce503FC8c2E2531D5aF549bf77f040Ad9c36080",
  LimitOrder: "0x735F883b29561463ec096670974670EC5Ff5D040",
};

const CreatePool = () => {
  const [currency0, setCurrency0] = useState("");
  const [currency1, setCurrency1] = useState("");
  const [fee, setFee] = useState("");
  const [tickSpacing, setTickSpacing] = useState("");
  const [selectedHookk, setSelectedHook] = useState("");
  const [sqrtPriceX96, setSqrtPriceX96] = useState("");
  const [tokenInfo, setTokenInfo] = useState<TokenInfo[]>([]);
  const { selectedHook } = useHook();

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
    if (selectedHook == "0x7Ce503FC8c2E2531D5aF549bf77f040Ad9c36080") {
      setFee("8388608");
    }
  }, [selectedHook]);

  const sqrtPriceOptions = [
    { value: "79228162514264337593543950336", label: "1:1" },
    { value: "56022770974786139918731938227", label: "1:2" },
    { value: "39614081257132168796771975168", label: "1:4" },
    { value: "112045541949572279837463876454", label: "2:1" },
    { value: "158456325028528675187087900672", label: "4:1" },
    { value: "87150978765690771352898345369", label: "121:100" },
  ];

  const handleSubmit = () => {
    // Compare the token addresses and set currency0 and currency1 accordingly
    const sortedAddresses =
      currency0.toLowerCase() < currency1.toLowerCase()
        ? [currency0, currency1]
        : [currency1, currency0];

    const poolData = {
      currency0: sortedAddresses[0],
      currency1: sortedAddresses[1],
      fee: fee,
      tickSpacing: tickSpacing,
      hooks: selectedHookk,
      sqrtPriceX96: sqrtPriceX96,
      hookDat: hookData,
    };
    console.log("Pool Data:", poolData);
    createPool(sortedAddresses[0], sortedAddresses[1]);
  };

  async function createPool(address0: string, address1: string) {
    try {
      const newPool = await writeContract(config, {
        abi: PoolManagerABI,
        address: "0x5F49Cf21273563a628F31cd08C1D4Ada7722aB58",
        functionName: "initialize",
        args: [
          [
            address0,
            address1,
            parseFloat(fee),
            parseFloat(tickSpacing),
            selectedHookk,
          ],
          sqrtPriceX96,
          hookData,
        ],
      });
      console.log(newPool);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="flex justify-center items-center text-center bg-gradient-to-br from-gray-900 to-blue-900 h-screen">
      <div className="flex flex-col bg-neutral-900 opacity-80 border-2 border-gray-500 border-opacity-80 w-[850px] h-[600px] mt-16 rounded-xl p-8 items-center ">
        <h2 className="text-white text-3xl mb-6">Create a New Pool</h2>

        <select
          className="mb-4 p-3 bg-neutral-700 text-white w-[800px] rounded-lg border border-gray-500 outline-none"
          value={currency0}
          onChange={(e) => setCurrency0(e.target.value)}
        >
          <option value="">Select Token 1</option>
          {tokenInfo.map((token) => (
            <option key={token.tokenAddress} value={token.tokenAddress}>
              {token.name} ({token.symbol})
            </option>
          ))}
        </select>

        <select
          className="mb-4 p-3 bg-neutral-700 text-white w-[800px] rounded-lg border border-gray-600 outline-none"
          value={currency1}
          onChange={(e) => setCurrency1(e.target.value)}
        >
          <option value="">Select Token 2</option>
          {tokenInfo.map((token) => (
            <option key={token.tokenAddress} value={token.tokenAddress}>
              {token.name} ({token.symbol})
            </option>
          ))}
        </select>

        <input
          className="mb-4 p-3 bg-neutral-700 text-white w-[800px] rounded-lg border border-gray-600 outline-none"
          type="number"
          placeholder="Fee"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          style={{
            MozAppearance: "textfield",
            WebkitAppearance: "none",
          }}
        />
        <style jsx>{`
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}</style>

        <input
          className="mb-4 p-3 bg-neutral-700 text-white w-[800px] rounded-lg border border-gray-600 outline-none"
          type="number"
          placeholder="Tick Spacing"
          value={tickSpacing}
          onChange={(e) => setTickSpacing(e.target.value)}
          style={{
            MozAppearance: "textfield",
            WebkitAppearance: "none",
          }}
        />
        <style jsx>{`
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}</style>

        <select
          className="mb-4 p-3 bg-neutral-700 text-white w-[800px] rounded-lg border border-gray-600 outline-none"
          value={selectedHookk}
          onChange={(e) => setSelectedHook(e.target.value)}
        >
          <option value="">Select Hook</option>
          {Object.entries(availableHooks).map(([label, value]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          className="mb-4 p-3 bg-neutral-700 text-white w-[800px] rounded-lg border border-gray-600 outline-none"
          value={sqrtPriceX96}
          onChange={(e) => setSqrtPriceX96(e.target.value)}
        >
          <option value="">Select sqrtPriceX96</option>
          {sqrtPriceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <motion.button
          className="mt-4 p-3 text-white rounded-lg w-[400px] text-xl bg-sky-600 hover:bg-indigo-700"
          onClick={handleSubmit}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.7 }}
        >
          Create Pool
        </motion.button>
      </div>
    </div>
  );
};

export default CreatePool;
