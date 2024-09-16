"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useHook } from "../../../components/hookContext";
import {
  addLiquidity,
  getLiquidityDelta,
  Approve,
} from "../../../utils/functions/liquidityFunctions";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "../../../utils/config";
import { getAllowance } from "../../../utils/functions/allowanceFunction";
import { LiquidiytDeltaABI } from "../../../utils/readerABI.json";
import { readContract, getAccount } from "@wagmi/core";

const Liquidity = () => {
  const searchParams = useSearchParams();
  const { selectedHook } = useHook();
  const [token0Amount, setToken0Amount] = useState("");
  const [token1Amount, setToken1Amount] = useState("");
  const [lowerPrice, setLowerPrice] = useState("");
  const [upperPrice, setUpperPrice] = useState("");
  const [cfee, setcFee] = useState("");
  const [ctick, setcTick] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [usePrice, setUsePrice] = useState(true);

  const poolId = searchParams.get("id");
  const token0 = searchParams.get("token0");
  const token1 = searchParams.get("token1");
  const fee = searchParams.get("fee");
  const tickSpacing = searchParams.get("tickSpacing");
  const sqrtPriceX96 = searchParams.get("sqrtPriceX96");
  const tick = searchParams.get("tick");
  const price = searchParams.get("price");
  const hook = searchParams.get("hooks");
  const tokenSymbol1 = searchParams.get("tokenSymbol1");
  const tokenSymbol2 = searchParams.get("tokenSymbol2");
  const [addLiquidityInfoPopup, setAddLiquidityInfoPopup] = useState(false);

  useEffect(() => {
    getSlot(String(token0), String(token1), Number(fee), Number(tickSpacing));
  }, [token0, token1, fee, tickSpacing, selectedHook]);

  console.log("Token1 " + tokenSymbol1);
  console.log("Token2 " + tokenSymbol2);
  console.log("Token0 address " + token0);
  console.log("Token1 address " + token1);

  const calculateTick = (
    price: number,
    tickSpacing: number,
    roundUp: boolean
  ) => {
    let tick;

    if (price < 0) {
      // Negatif price için özel durum
      tick = -Math.log(Math.abs(price)) / Math.log(1.0001);
    } else {
      tick = Math.log(price) / Math.log(1.0001);
    }

    if (roundUp) {
      return Math.ceil(tick / tickSpacing) * tickSpacing;
    } else {
      return Math.floor(tick / tickSpacing) * tickSpacing;
    }
  };

  const handleAddLiquidity = async () => {
    let lowerTick, upperTick;

    if (usePrice) {
      // Price seçildiyse tick hesaplaması yapılır
      lowerTick = calculateTick(Number(lowerPrice), Number(tickSpacing), false);
      upperTick = calculateTick(Number(upperPrice), Number(tickSpacing), true);
    } else {
      // Tick seçildiyse, kullanıcı tarafından girilen değerler kullanılır
      lowerTick = Number(lowerPrice);
      upperTick = Number(upperPrice);
    }

    console.log("Lower Tick:", lowerTick);
    console.log("Upper Tick:", upperTick);

    const account = getAccount(config);
    let modifyLiquidityAddress = "";
    if (account.chainId) {
      if (String(account.chainId) == "421614") {
        modifyLiquidityAddress = "0xc66f440Ee31e3aE0b026972Ad0C6D62DfD27596B";
      } else if (String(account.chainId) == "11155111") {
        modifyLiquidityAddress = "0x0E67d44a512Bcf556FA8ef0e957Fbe843f67b53f";
      } else {
        alert("Chain ID not supported.");
      }
    }

    // Token 0 için allowance kontrolü
    const allowance1 = await getAllowance(
      String(token0),
      modifyLiquidityAddress
    );

    // Token 1 için allowance kontrolü
    const allowance2 = await getAllowance(
      String(token1),
      modifyLiquidityAddress
    );

    let approve1hash, approve2hash;

    // Allowance kontrolü yap, 0 ise approve yap
    if (BigInt(allowance1) === BigInt(0)) {
      console.log("Token 0 için onay gerekli.");
      approve1hash = await Approve(String(token0), modifyLiquidityAddress);
      await waitForTransactionReceipt(config, { hash: approve1hash });
    } else {
      console.log("Token 0 için onay gerekli değil.");
    }

    if (BigInt(allowance2) === BigInt(0)) {
      console.log("Token 1 için onay gerekli.");
      approve2hash = await Approve(String(token1), modifyLiquidityAddress);
      await waitForTransactionReceipt(config, { hash: approve2hash });
    } else {
      console.log("Token 1 için onay gerekli değil.");
    }

    // Likidite delta değerini hesapla
    const liquidityDelta = await getLiquidityDelta(
      [
        String(token0),
        String(token1),
        Number(fee),
        Number(tickSpacing),
        selectedHook,
      ],
      Number(lowerTick),
      upperTick,
      token0Amount,
      token1Amount
    );

    // Likidite ekle
    await addLiquidity(
      [
        String(token0),
        String(token1),
        Number(fee),
        Number(tickSpacing),
        selectedHook,
      ],
      [Number(lowerTick), upperTick, liquidityDelta]
    );
  };

  async function getSlot(
    token0: string,
    token1: string,
    fee: number,
    tickSpacing: number
  ) {
    const account = getAccount(config);
    let readerAddress = "";
    let address = "";
    if (account.chainId) {
      if (String(account.chainId) == "421614") {
        readerAddress = "0x86a6cE6DE9d2A6D4CDafcFfdD24C6B69676acF3E";
        address = "0x5F49Cf21273563a628F31cd08C1D4Ada7722aB58";
      } else if (String(account.chainId) == "11155111") {
        readerAddress = "0xB9A3472106Bb737FA7Fedd215D7cA35F0d52D879";
        address = "0xbb46AB4ecC82166Be4d34f5a79992e582d14206a";
      } else {
        alert("Chain ID not supported.");
      }
    }
    try {
      const slot: any[] = await readContract(config, {
        abi: LiquidiytDeltaABI,
        address: readerAddress,
        functionName: "getSlot0",
        args: [
          [token0, token1, fee, tickSpacing, selectedHook],
          address,
        ],
      });
      console.log(slot);
      const currentTick = Number(slot[1]);
      const currentFee = Number(slot[3]);
      setcFee(String(currentFee));
      setcTick(String(currentTick));
    } catch (error) {
      console.error("Error fetching or processing data:", error);
    }
  }

  const calculatePrice = (tick: number) => {
    return Math.pow(1.0001, tick);
  };

  const truncateId = (id: string | null, length: number) => {
    if (!id) return "";
    return id.length > length ? `${id.substring(0, length)}...` : id;
  };

  function getLowerUsableTick(tick) {
    let intervals = Math.floor(tick / Number(tickSpacing));

    if (tick < 0 && tick % Number(tickSpacing) !== 0) intervals--;

    return intervals * Number(tickSpacing);
  }

  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-gray-900 to-blue-900 min-h-screen p-4">
      <div className="bg-neutral-900 opacity-80 shadow-xl border border-white border-opacity-20 p-8 rounded-2xl w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">
            {tokenSymbol1}/{tokenSymbol2}{" "}
            <span className="text-cyan-400">Pool</span>
          </h1>
          <motion.button
            className="px-6 py-3 bg-sky-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPopup(true)}
          >
            Add Liquidity
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-neutral-700 p-4 rounded-lg">
              <h2 className="text-sm font-medium text-gray-400 mb-1">
                Pool ID
              </h2>
              <p className="text-lg font-semibold text-white break-all">
                {truncateId(poolId, 20)}
              </p>
            </div>
            <div className="bg-neutral-700 p-4 rounded-lg">
              <h2 className="text-sm font-medium text-gray-400 mb-1">Fee</h2>
              <p className="text-lg font-semibold text-white break-all">
                {cfee}
              </p>
            </div>
            <div className="bg-neutral-700 p-4 rounded-lg">
              <h2 className="text-sm font-medium text-gray-400 mb-1">
                Hook Address
              </h2>
              <p className="text-lg font-semibold text-white break-all">
                {selectedHook}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-neutral-700 p-4 rounded-lg">
              <h2 className="text-sm font-medium text-gray-400 mb-1">
                Current Tick
              </h2>
              <p className="text-lg font-semibold text-white break-all">
                {ctick}
              </p>
            </div>
            <div className="bg-neutral-700 p-4 rounded-lg">
              <h2 className="text-sm font-medium text-gray-400 mb-1">
                1 {tokenSymbol1} =
              </h2>
              <p className="text-lg font-semibold text-white break-all">
                {calculatePrice(Number(ctick))} {tokenSymbol2}
              </p>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setAddLiquidityInfoPopup(true)}
                className="text-cyan-400 hover:text-sky-600 transition flex items-center"
              >
                <span className="mr-2">&#9432;</span>
                <span>Learn about adding liquidity</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPopup && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="bg-neutral-900 shadow-xl border border-white border-opacity-20 p-8 rounded-lg w-[540px]"
            onClick={(e) => e.stopPropagation()} // Stop closing when clicking inside the popup
          >
            <div className="w-full flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Add Liquidity
              </h2>
              <button
                className="text-white opacity-60 text-xl"
                onClick={() => setShowPopup(false)}
              >
                &times;
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 mb-2">
                Enter Token 0 Amount
              </label>
              <input
                type="text"
                value={token0Amount}
                onChange={(e) => setToken0Amount(e.target.value)}
                className="w-full px-3 py-2 outline-none bg-neutral-700 text-white border border-neutral-600 rounded-lg"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">
                Enter Token 1 Amount
              </label>
              <input
                type="text"
                value={token1Amount}
                onChange={(e) => setToken1Amount(e.target.value)}
                className="w-full px-3 py-2 outline-none bg-neutral-700 text-white border border-neutral-600 rounded-lg"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">
                Choose Price or Tick
              </label>
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setUsePrice(true)}
                  className={`p-2 rounded-lg text-white w-full ${
                    usePrice ? "bg-sky-600 " : "bg-neutral-700"
                  }`}
                >
                  Price
                </button>
                <button
                  onClick={() => setUsePrice(false)}
                  className={`p-2 rounded-lg text-white w-full ${
                    !usePrice ? "bg-sky-600 " : "bg-neutral-700"
                  }`}
                >
                  Tick
                </button>
              </div>
              {usePrice ? (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-300">Lower Price</label>
                    <input
                      type="text"
                      onChange={(e) => setLowerPrice(e.target.value)}
                      className="w-full px-3 py-2 outline-none bg-neutral-700 text-white border border-neutral-600 rounded-lg"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-300">Upper Price</label>
                    <input
                      type="text"
                      onChange={(e) => setUpperPrice(e.target.value)}
                      className="w-full px-3 py-2 outline-none bg-neutral-700 text-white border border-neutral-600 rounded-lg"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-300">Lower Tick</label>
                    <input
                      type="number"
                      style={{
                        MozAppearance: "textfield",
                        WebkitAppearance: "none",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "." || e.key === ",") {
                          e.preventDefault(); // Nokta veya virgül basıldığında engellenir
                        }
                      }}
                      onChange={(e) =>
                        setLowerPrice(
                          String(getLowerUsableTick(e.target.value))
                        )
                      }
                      className="w-full px-3 py-2 outline-none bg-neutral-700 text-white border border-neutral-600 rounded-lg"
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
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-300">Upper Tick</label>
                    <input
                      type="number"
                      style={{
                        MozAppearance: "textfield",
                        WebkitAppearance: "none",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "." || e.key === ",") {
                          e.preventDefault(); // Nokta veya virgül basıldığında engellenir
                        }
                      }}
                      onChange={(e) =>
                        setUpperPrice(
                          String(getLowerUsableTick(e.target.value))
                        )
                      }
                      className="w-full px-3 py-2 outline-none bg-neutral-700 text-white border border-neutral-600 rounded-lg"
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
                  </div>
                </>
              )}
            </div>
            <motion.button
              className="w-full py-3 bg-sky-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddLiquidity}
            >
              Confirm Liquidity
            </motion.button>
          </div>
        </div>
      )}

      {addLiquidityInfoPopup && (
        <div
          className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-75 z-50"
          onClick={() => setAddLiquidityInfoPopup(false)}
        >
          <div
            className="bg-neutral-800 w-full max-w-2xl text-white p-8 rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Adding Liquidity</h2>
              <button
                className="text-gray-400 hover:text-white text-2xl"
                onClick={() => setAddLiquidityInfoPopup(false)}
              >
                &times;
              </button>
            </div>
            <p className="text-lg leading-relaxed">
              To add liquidity, first, navigate to the &apos;Explorer&apos;
              section, where pools will be displayed based on the active mode.
              By clicking on the pool you are interested in, you can view its
              details and proceed to add liquidity. In the liquidity form, you
              can set your desired price range, which can be specified either as
              ticks or as a price, depending on your preference. Additionally,
              you can adjust the amount of each token you want to contribute to
              the pool. This setup allows for flexible and precise liquidity
              provision, tailored to your strategy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Liquidity;
