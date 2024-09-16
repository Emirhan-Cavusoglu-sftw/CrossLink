"use client";
import React, { useState, useEffect } from "react";
import { swap } from "../../../utils/functions/swapFunctions";
import { getTokenInfo } from "../../../utils/functions/createTokenFunctions";
import { config } from "../../../utils/config";
import { LiquidiytDeltaABI } from "../../../utils/readerABI.json";
import { writeContract, readContract } from "@wagmi/core";
import { ERC20ABI } from "../../../utils/ERC20ABI.json";
import { waitForTransactionReceipt } from "@wagmi/core";
import { useHook } from "../../../components/hookContext";
import { getAllowance } from "../../../utils/functions/allowanceFunction";
import { getBalance } from "../../../utils/functions/createTokenFunctions";
import { getAccount } from "@wagmi/core";

interface TokenInfo {
  tokenAddress: string;
  mintedBy: string;
  name: string;
  symbol: string;
}

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

const arbNative = "0x0000000000000000000000000000000000000000";
const ccip = "0xA8C0c11bf64AF62CDCA6f93D3769B88BdD7cb93D";

const Swap = () => {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [selectedToken1, setSelectedToken1] = useState("");
  const [selectedToken2, setSelectedToken2] = useState("");
  const [amountSpecified, setAmountIn] = useState("");
  const [token1Address, setToken1Address] = useState("");
  const [token2Address, setToken2Address] = useState("");
  const [tokens, setTokenInfo] = useState<TokenInfo[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [zeroForOne, setZeroForOne] = useState(true);
  const [sqrtPriceLimitX96, setSqrtPriceLimitX96] = useState<BigInt>(BigInt(0));
  const [selectedPool, setSelectedPool] = useState<Event | null>(null);
  const { selectedHook } = useHook();
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [poolSlot, setPoolSlot] = useState<any[]>([]);
  const [lpFee, setLpFee] = useState<string | null>(null);
  const [amountOut, setAmountOut] = useState("");
  const [balance, setBalance] = useState("");
  const [swapPopupVisible, setSwapPopupVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  console.log("Selected Hook:", selectedHook);

  const account = getAccount(config);
  console.log("Chain Id " + account.chainId);

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

  useEffect(() => {
    fetchEvents();
  }, [selectedHook, tokens]);

  useEffect(() => {
    if (selectedPool) {
      fetchsqrtPrivceLimitX96();
      getSlot();
    }
  }, [selectedPool, zeroForOne]);

  useEffect(() => {
    if (selectedPool) {
      fetchBalances();
    }
  }, [selectedPool]);

  async function fetchBalances() {
    if (!selectedPool) return;

    try {
      const balance1 = await getBalance(selectedPool.args.currency0);
      console.log("Balance: ", balance1);
      setBalance(String(balance1));
    } catch (error) {
      console.error("Error fetching balance: ", error);
    }
  }

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
      setFilteredEvents(data.events);
    } catch (error) {
      console.error("Error fetching events: ", (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const getTokens = async () => {
    await getTokenInfo(setTokenInfo);
  };

  const fetchsqrtPrivceLimitX96 = async () => {
    if (zeroForOne) {
      setSqrtPriceLimitX96(BigInt(4295128740));
    } else {
      setSqrtPriceLimitX96(
        BigInt("1461446703485210103287273052203988822378723970341")
      );
    }
  };

  const swapTokens = () => {
    setSelectedToken1(selectedToken2);
    setSelectedToken2(selectedToken1);
    setToken1Address(token2Address);
    setToken2Address(token1Address);
    setZeroForOne(!zeroForOne);
  };
  console.log("ZeroForOne:", zeroForOne);
  console.log("SqrtPriceLimitX96:", sqrtPriceLimitX96);

  const openPoolSelectPopup = () => {
    setIsPopupVisible(true);
  };

  const handlePoolSelect = (pool: Event) => {
    setSelectedPool(pool);
    setIsPopupVisible(false);
  };

  const handleSwap = async () => {
    if (!selectedPool) {
      alert("Please select a pool");
      return;
    }

    const account = getAccount(config);

    let swapAddress = "";

    if (account.chainId) {
      if (String(account.chainId) == "421614") {
        swapAddress = "0x540bFc2FB3B040761559519f9F44690812f3514e";
      } else if (String(account.chainId) == "11155111") {
        // Bu değişecek
        swapAddress = "0x540bFc2FB3B040761559519f9F44690812f3514e";
      }
    }
    try {
      let allowance1: number = 0;
      let allowance2: number = 0;
      if (swapAddress) {
        allowance1 = await getAllowance(
          selectedPool.args.currency0,
          swapAddress
        );
        allowance2 = await getAllowance(
          selectedPool.args.currency1,
          swapAddress
        );
      } else {
        alert("Swap address not found");
      }

      let approve1 = true; // Default olarak true, çünkü eğer allowance 0 değilse approval gerekmiyor.
      let approve2 = true; // Default olarak true, çünkü eğer allowance 0 değilse approval gerekmiyor.

      // Allowance kontrolü yap
      if (BigInt(allowance1) === BigInt(0)) {
        console.log("Token 1 için onay gerekli.");
        approve1 = await Approve(selectedPool.args.currency0);
        await waitForTransactionReceipt(config, {hash: approve1});
      } else {
        console.log("Token 1 için onay gerekli değil.");
      }

      if (BigInt(allowance2) === BigInt(0)) {
        console.log("Token 2 için onay gerekli.");
        approve2 = await Approve(selectedPool.args.currency1);
        await waitForTransactionReceipt(config, {hash: approve2});
      } else {
        console.log("Token 2 için onay gerekli değil.");
      }

      console.log("Selected Pool:", selectedPool);
      console.log("ZeroForOne:", zeroForOne);
      console.log("SqrtPriceLimitX96:", sqrtPriceLimitX96);

      if (approve1 && approve2) {
        console.log("Approve işlemleri başarılı.");
        await swap(
          [
            selectedPool.args.currency0,
            selectedPool.args.currency1,
            selectedPool.args.fee,
            selectedPool.args.tickSpacing,
            selectedPool.args.hooks,
          ],
          [zeroForOne, amountSpecified, sqrtPriceLimitX96]
        );
      } else {
        console.error("Approve işlemi başarısız oldu.");
      }
    } catch (error) {
      console.error("Swap işlemi sırasında hata oluştu:", error);
    }
  };

  async function getSlot() {
    if (!selectedPool) return;
    const account = getAccount(config);
    let readerAddress = "";
    let poolManagerAddress = "";
    if (account.chainId) {
      if (String(account.chainId) == "421614") {
        readerAddress = "0x86a6cE6DE9d2A6D4CDafcFfdD24C6B69676acF3E";
        poolManagerAddress = "0x5F49Cf21273563a628F31cd08C1D4Ada7722aB58";
      } else if (String(account.chainId) == "11155111") {
        // Bu değişecek
        readerAddress = "0x86a6cE6DE9d2A6D4CDafcFfdD24C6B69676acF3E";
        poolManagerAddress = "0x5F49Cf21273563a628F31cd08C1D4Ada7722aB58";
      } else {
        alert("Invalid chainId");
      }
    }
    try {
      const slot = await readContract(config, {
        abi: LiquidiytDeltaABI,
        address: readerAddress,
        functionName: "getSlot0",
        args: [
          [
            selectedPool.args.currency0,
            selectedPool.args.currency1,
            selectedPool.args.fee,
            selectedPool.args.tickSpacing,
            selectedPool.args.hooks,
          ],
          poolManagerAddress,
        ],
      });
      console.log(slot);
      setPoolSlot([slot]);
      if (slot && slot[3]) {
        setLpFee(slot[3].toString()); // Set the lpFee state with the third index value
      }
    } catch (error) {
      console.error("Error fetching or processing data:", error);
    }
  }

  async function Approve(tokenAddress: string) {
    const uintMax = 200000000000000000;

    async function isValidAddress(tokenAddress: string) {
      return /^0x[a-fA-F0-9]{40}$/.test(tokenAddress);
    }

    if (!isValidAddress(tokenAddress)) {
      alert("Invalid Token Address");
      return;
    }

    const account = getAccount(config);
    let address = "";
    if (account.chainId) {
      if (String(account.chainId) == "421614") {
        address = "0x540bFc2FB3B040761559519f9F44690812f3514e";
      } else if (String(account.chainId) == "11155111") {
        address = "0x540bFc2FB3B040761559519f9F44690812f3514e"; // bu değişecek
      } else {
        alert("Invalid chainId");
      }
    } else {
      alert("Chain ID not found");
    }

    try {
      const approve = await writeContract(config, {
        abi: ERC20ABI,
        address: tokenAddress,
        functionName: "approve",
        args: [address, uintMax],
      });
      console.log("Approve " + approve);
      return approve;
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (selectedPool && amountSpecified && poolSlot.length > 0) {
      // Extract the tick value from the getSlot response (1st index)
      const tick = Number(poolSlot[0][1]);

      // Calculate the price using the tick formula: price = 1.0001 ^ tick
      const price = Math.pow(1.0001, tick);

      console.log("Calculated Price (from tick):", price);

      // Calculate the amount out based on the input amount and price
      const calculatedAmountOut = parseFloat(amountSpecified) * price;

      // Update the amountOut state
      setAmountOut(calculatedAmountOut.toFixed(6)); // Round to 6 decimal places
    }
  }, [amountSpecified, selectedPool, poolSlot]);

  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-gray-900 to-blue-900 h-screen">
      <div
        className={`bg-neutral-900 opacity-80 w-[500px] h-[460px] rounded-3xl flex flex-col items-center relative `}
      >
        <div className="absolute top-0 right-4 mt-4">
          <button
            onClick={() => setSwapPopupVisible(true)}
            className="text-white opacity-60 text-xl"
          >
            ?
          </button>
        </div>
        <h1 className="p-4 text-lg text-white opacity-60 absolute top-0 left-4">
          Swap
        </h1>
        <div className="flex flex-col space-y-2 mt-16">
          <div className="flex flex-row w-[470px] h-32 p-2 bg-neutral-800 rounded-3xl">
            <div className="flex flex-col w-[470px] h-32">
              <h1 className="p-2 text-xs text-white opacity-60">You Pay</h1>
              <div className="flex items-center">
                <input
                  type="number"
                  className="bg-transparent w-[200px] h-12 p-2 text-white text-3xl appearance-none focus:outline-none"
                  placeholder="0"
                  value={amountSpecified}
                  onChange={(e) => setAmountIn(e.target.value)}
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
                <button
                  className={`ml-auto bg-blue-800 opacity-80 rounded-3xl hover:bg-blue-950 transition text-white text-xl px-4 py-2`}
                  onClick={openPoolSelectPopup}
                >
                  {selectedPool
                    ? zeroForOne
                      ? `${
                          tokens.find(
                            (t) =>
                              t.tokenAddress === selectedPool.args.currency0
                          )?.symbol
                        }/${
                          tokens.find(
                            (t) =>
                              t.tokenAddress === selectedPool.args.currency1
                          )?.symbol
                        }`
                      : `${
                          tokens.find(
                            (t) =>
                              t.tokenAddress === selectedPool.args.currency1
                          )?.symbol
                        }/${
                          tokens.find(
                            (t) =>
                              t.tokenAddress === selectedPool.args.currency0
                          )?.symbol
                        }`
                    : "Select Pool"}
                </button>
              </div>
              {balance && (
                <div className="text-white opacity-60 text-xs p-2">
                  Balance: {balance}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center items-center">
            <button
              className="text-white opacity-60 text-2xl transform rotate-0"
              onClick={swapTokens}
            >
              &darr;
            </button>
          </div>

          <div className="flex flex-row w-[470px] h-32 p-2 bg-neutral-800 rounded-3xl">
            <div className="flex flex-col w-[470px] h-32">
              <h1 className="p-2 text-xs text-white opacity-60">You Receive</h1>
              <div className="flex items-center">
                <input
                  type="number"
                  className="bg-transparent w-[200px] h-12 p-2 text-white text-3xl appearance-none focus:outline-none"
                  placeholder="0"
                  value={amountOut}
                  readOnly
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
                <button
                  className={`ml-auto bg-blue-800 opacity-80 rounded-3xl text-white text-xl px-4 py-2`}
                  disabled
                >
                  {selectedPool
                    ? `${
                        tokens.find(
                          (t) => t.tokenAddress === selectedPool.args.currency1
                        )?.symbol
                      }/${
                        tokens.find(
                          (t) => t.tokenAddress === selectedPool.args.currency0
                        )?.symbol
                      }`
                    : "Select Pool"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <button
          className={`w-[470px] h-12 bg-blue-800 opacity-80 rounded-3xl text-white hover:bg-blue-950 transition font-bold text-lg mt-2`}
          onClick={() => handleSwap()}
        >
          Swap
        </button>
        {lpFee && (
          <div className="mt-2 text-white opacity-60 text-sm flex flex-row">
            <svg
              width="20px"
              height="20px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2"
            >
              <path
                d="M3.5 22V5C3.5 3 4.84 2 6.5 2H14.5C16.16 2 17.5 3 17.5 5V22H3.5Z"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 22H19"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.39 9.99998H12.62C13.66 9.99998 14.51 9.49999 14.51 8.10999V6.87999C14.51 5.48999 13.66 4.98999 12.62 4.98999H8.39C7.35 4.98999 6.5 5.48999 6.5 6.87999V8.10999C6.5 9.49999 7.35 9.99998 8.39 9.99998Z"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.5 13H9.5"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.5 16.01L22 16V10L20 9"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>{" "}
            Swap Fee = {lpFee}
          </div>
        )}

        {/* Pool Select Popup */}
        {isPopupVisible && (
          <div
            id="popupOverlay"
            className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 "
            onClick={() => setIsPopupVisible(false)}
          >
            <div className="bg-neutral-900 w-[550px] h-[550px] rounded-3xl flex flex-col items-center p-4 ">
              <div className="w-full flex justify-between items-center ">
                <h1 className="text-white opacity-60 text-lg">Select a pool</h1>
                <button
                  className="text-white opacity-60 text-xl"
                  onClick={() => setIsPopupVisible(false)}
                >
                  &times;
                </button>
              </div>
              <div className="mt-4 w-full flex flex-col space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                {filteredEvents.map((pool, index) => (
                  <button
                    key={index}
                    className="w-full p-4 bg-neutral-800 hover:bg-blue-800 transition rounded-3xl text-white flex justify-between items-center"
                    onClick={() => handlePoolSelect(pool)}
                  >
                    <span>
                      {
                        tokens.find(
                          (t) => t.tokenAddress === pool.args.currency0
                        )?.symbol
                      }
                      /
                      {
                        tokens.find(
                          (t) => t.tokenAddress === pool.args.currency1
                        )?.symbol
                      }
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {swapPopupVisible && (
          <div
            className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 "
            id="popupOverlay"
            onClick={() => setSwapPopupVisible(false)}
          >
            <div className=" bg-blue-800 w-[600px] text-white p-4 rounded-lg z-50">
              <p>
                <strong>Testing Nezlobin Hook</strong>
                <br />
                <br />
                When testing the Nezlobin hook, the process involves several
                steps. First, switch to the Nezlobin mode and create a pool by
                selecting the Nezlobin hook during the pool creation. For this
                test, we set the tick spacing to 100 (though you can choose a
                different value, this setup is calculated for a more accurate
                test). Once the pool is created, navigate to the Explorer, click
                on the pool, and add liquidity. If the tokens are newly minted,
                you may need to approve them first.
                <br />
                <br />
                Next, set the parameters for liquidity provision: 5000, 5000,
                -887200, and 887200 (these are tick values, with the last two
                representing the minimum and maximum tick values for 100-tick
                spacing).
                <br />
                <br />
                Then, go to the Swap section and perform a swap by selling 590
                tokens in the direction of the pool’s pair (e.g., if the pool is
                USDC/WEDU, sell in this direction). Perform the swap twice, then
                use the direction toggle button to view the current swap fee.
                You should see a low fee, around 769, indicating the lower cost
                of the swap.
                <br />
                <br />
                Next, reverse the direction (e.g., WEDU/USDC) and swap the same
                amount (590 tokens). After the swap, toggle the direction button
                again, and you’ll observe a higher swap fee, around 5006. This
                increase is due to the significant price impact in the buying
                direction. Additionally, if an approval prompt appears, ensure
                that the previous transaction has fully processed before
                initiating the swap, the same caution applies when adding
                liquidity.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Swap;
