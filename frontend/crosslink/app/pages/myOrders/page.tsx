"use client";
import React, { useEffect, useState } from "react";
import { useHook } from "../../../components/hookContext";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "../../../utils/config";
import { writeContract, readContract } from "@wagmi/core";
import { ERC20ABI } from "../../../utils/ERC20ABI.json";
import {
  placeOrder,
  redeem,
  balanceOf,
  claimableOutputTokens,
  getPositionId,
  cancelOrder,
} from "../../../utils/functions/placeOrderFunctions";
import { getAllowance } from "../../../utils/functions/allowanceFunction";
import { getTokenInfo } from "../../../utils/functions/createTokenFunctions";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAccount } from "@wagmi/core";
import { hexToNumber } from "viem";
import Image from "next/image";

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

interface Order {
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
  eventName: string;
  positionId: number;
  balance: number;
  claimableTokens: number;
}

interface TokenInfo {
  tokenAddress: string;
  mintedBy: string;
  name: string;
  symbol: string;
}

const MyOrders = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { selectedHook } = useHook();
  const [zeroForOne, setZeroForOne] = useState<boolean>(false);
  const [amountIn, setAmountIn] = useState<string>("");
  const [tickToSellAt, setTickToSellAt] = useState<number>(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [price, setPrice] = useState<string>("");
  const [usePrice, setUsePrice] = useState<boolean>(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo[]>([]);
  const router = useRouter();
  const [symbolData, setSymbolData] = useState([]);
  const [limitOrderInfoPopup, setLimitOrderInfoPopup] = useState(false);
  const [destinationChainSelector, setDestinationChainSelector] = useState(
    "16015286601757825753"
  );
  const [selectedLogo, setSelectedLogo] = useState("eth");

  console.log("Selected Hook:", selectedHook);

  const account = getAccount(config);
  console.log("Chain Id " + account.chainId);

  const { data, isLoading, isFetched } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const events = await fetchEvents();
      return {
        events,
      };
    },
  });

  const {
    data: data2,
    isLoading: isLoading2,
    refetch: refetch2,
    isFetched: isFetched2,
  } = useQuery({
    enabled: false,
    queryKey: ["orders"],
    queryFn: async () => {
      const orders = await fetchOrderEvents();
      return {
        orders,
      };
    },
  });

  useEffect(() => {
    if (isFetched) {
      refetch2();
    }
  }, [isFetched]);

  useEffect(() => {
    const fetchSymbols = async () => {
      const data = await Promise.all(
        events.map(async (event) => {
          const symbol0 = await getSymbols(event.args.currency0);
          const symbol1 = await getSymbols(event.args.currency1);
          return { symbol0, symbol1, fee: event.args.fee };
        })
      );
      setSymbolData(data);
    };

    fetchSymbols();
  }, [events]);

  useEffect(() => {
    if (selectedHook !== "0x735F883b29561463ec096670974670EC5Ff5D040") {
      router.push("/");
    }
  }, [selectedHook]);

  console.log("isloading: " + isLoading);

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
    } catch (error) {
      console.error("Error fetching events: ", (error as any).message);
    } finally {
    }
  };

  const fetchOrderEvents = async () => {
    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chainId: account.chainId, // Example chainId (replace with actual chainId)
          ABIType: "OrderPlaced", // Or "OrderPlaced", depending on what you want to fetch
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      console.log("Data: ", data);

      // Yeni veriyi orders array'ine eklemeden önce, eski state'i koruyarak güncelle
      const newOrders = [...orders]; // Mevcut orders array'ini kopyala

      // Data'nın tüm event'lerini işleyip orders'a ekleyelim
      for (let i = 0; i < data.events.length; i++) {
        const positionId = await getPositionId(
          data.events[i].args.currency0,
          data.events[i].args.currency1,
          data.events[i].args.fee,
          data.events[i].args.tickSpacing,
          data.events[i].args.tickToSellAt,
          data.events[i].args.zeroForOne
        );

        const balance = await balanceOf(String(positionId));
        console.log("Balance: ", Number(balance));

        const claimableTokens = await claimableOutputTokens(String(positionId));

        // Mevcut orders'a yeni order'ı ekle
        newOrders.push({
          ...data.events[i],
          positionId: Number(positionId),
          balance: Number(balance),
          claimableTokens,
        });
      }

      setOrders(newOrders); // Güncellenmiş orders array'ini set et
      console.log("Orders: ", newOrders);
    } catch (error) {
      console.error("Error fetching events: ", (error as any).message);
    } finally {
    }
  };

  function convertPriceToTick(price: string): number {
    const priceValue = parseFloat(price);

    // Fiyatı sqrtPrice'a çevir
    const sqrtPrice = Math.sqrt(priceValue) * Math.pow(2, 96);

    // Tick hesaplama (gerçek değeri almak için)
    const tick = Math.floor(
      Math.log(sqrtPrice / Math.pow(2, 96)) / Math.log(Math.sqrt(1.0001))
    );

    return tick;
  }

  console.log("Price to Tick: ", convertPriceToTick(price));

  async function handlePlaceOrder() {
    if (selectedEvent) {
      const tick = usePrice ? convertPriceToTick(price) : tickToSellAt;
      const argsArray = [
        selectedEvent.args.currency0,
        selectedEvent.args.currency1,
        selectedEvent.args.fee,
        selectedEvent.args.tickSpacing,
        selectedEvent.args.hooks,
      ];

      const hookAddress = "0x735F883b29561463ec096670974670EC5Ff5D040";

      // Token 0 için allowance kontrolü
      const allowance1 = await getAllowance(
        selectedEvent.args.currency0,
        hookAddress
      );

      // Token 1 için allowance kontrolü
      const allowance2 = await getAllowance(
        selectedEvent.args.currency1,
        hookAddress
      );

      console.log("Selected Event", selectedEvent);

      let approve1hash, approve2hash;

      // Allowance kontrolü yap, 0 ise approve yap
      if (BigInt(allowance1) === BigInt(0)) {
        console.log("Token 0 için onay gerekli.");
        approve1hash = await Approve(selectedEvent.args.currency0);
        await waitForTransactionReceipt(config, { hash: approve1hash });
      } else {
        console.log("Token 0 için onay gerekli değil.");
      }

      if (BigInt(allowance2) === BigInt(0)) {
        console.log("Token 1 için onay gerekli.");
        approve2hash = await Approve(selectedEvent.args.currency1);
        await waitForTransactionReceipt(config, { hash: approve2hash });
      } else {
        console.log("Token 1 için onay gerekli değil.");
      }

      try {
        const result = await placeOrder(
          [
            selectedEvent.args.currency0,
            selectedEvent.args.currency1,
            selectedEvent.args.fee,
            selectedEvent.args.tickSpacing,
            selectedEvent.args.hooks,
          ],
          tick,
          zeroForOne,
          amountIn
        );
        console.log("Order Placed:", result);
        await refetch2();
      } catch (error) {
        console.error("Error placing order:", error);
      }
    } else {
      console.error("No event selected");
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

    try {
      const approve = await writeContract(config, {
        abi: ERC20ABI,
        address: tokenAddress,
        functionName: "approve",
        args: ["0x735F883b29561463ec096670974670EC5Ff5D040", uintMax],
      });
      return approve;
    } catch (error) {
      console.error("Error approving token:", error);
    }
  }

  async function handleRedeem(order: Order) {
    console.log("Amount: ", hexToNumber(String(order.args.inputAmount.hex)));
    try {
      await redeem(
        [
          order.args.currency0,
          order.args.currency1,
          order.args.fee,
          order.args.tickSpacing,
          order.args.hooks,
        ],
        order.args.tickToSellAt,
        order.args.zeroForOne,
        hexToNumber(String(order.args.inputAmount.hex)),
        Number(destinationChainSelector)
      );
      await refetch2();
    } catch (error) {
      console.error("Error redeeming order:", error);
    }
  }

  async function handleCancelOrder(order: Order) {
    try {
      await cancelOrder(
        [
          order.args.currency0,
          order.args.currency1,
          order.args.fee,
          order.args.tickSpacing,
          order.args.hooks,
        ],
        order.args.tickToSellAt,
        order.args.zeroForOne
      );
      await refetch2();
    } catch (error) {
      console.error("Error canceling order:", error);
    }
  }

  function truncateString(str: string, maxLength: number) {
    if (str.length > maxLength) {
      return str.slice(0, maxLength) + "...";
    }
    return str;
  }

  function getLowerUsableTick(tick, orders) {
    let tickSpacing = Number(orders.args.tickSpacing);

    // Eğer tick negatifse:
    if (tick < 0) {
      let intervals = Math.ceil(tick / tickSpacing);
      if (tick % tickSpacing !== 0) {
        intervals--;
      }
      return intervals * tickSpacing;
    }

    // Eğer tick pozitifse:
    if (tick > 0) {
      let intervals = Math.floor(tick / tickSpacing);
      return intervals * tickSpacing;
    }

    // tick 0 ise, doğrudan 0 döndür
    return 0;
  }

  async function getSymbols(address: string) {
    try {
      const symbol = await readContract(config, {
        abi: ERC20ABI,
        address: address,
        functionName: "symbol",
      });
      return symbol;
    } catch (error) {
      console.error("Error fetching or processing data:", error);
    }
  }

  const handleLogoToggle = () => {
    if (selectedLogo === "eth") {
      setSelectedLogo("arb");
      setDestinationChainSelector("3478487238524512106");
    } else {
      setSelectedLogo("eth");
      setDestinationChainSelector("16015286601757825753");
    }
  };

  return (
    <>
      <div className="flex flex-row justify-center items-center bg-gradient-to-br from-gray-900 to-blue-900 space-x-48 h-screen">
        <div className="flex flex-col bg-neutral-900 opacity-80 w-[500px] h-[620px] pt-4 px-6 rounded-3xl shadow-xl p-8 border border-white border-opacity-20">
          <div className="flex items-center justify-between mb-8 ">
            <h1 className="text-white text-3xl">Place Order</h1>
            <button
              className="ml-4 text-white text-2xl flex pt-1"
              onClick={() => setLimitOrderInfoPopup(true)}
            >
              ?
            </button>
          </div>
          <div className="w-full">
            <h1 className="text-white text-lg mb-2">Select Pool</h1>
            <select
              onChange={(e) => {
                const selectedIndex = e.target.value;
                setSelectedEvent(events[parseInt(selectedIndex)]);
              }}
              className="mb-4 p-3 rounded bg-white bg-opacity-10 border border-white border-opacity-20 text-white w-full"
            >
              <option className="text-white bg-gray-700" value="">
                Select a Pool
              </option>
              {symbolData.map((data, index) => (
                <option
                  className="text-white bg-gray-700"
                  key={index}
                  value={index}
                >
                  {`Pool: ${data.symbol0} / ${data.symbol1} - Fee: ${data.fee}`}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full mb-4">
            <h1 className="text-white text-lg mb-2">Tick or Price</h1>
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setUsePrice(false)}
                className={`p-3 rounded-lg text-white w-full ${
                  !usePrice ? "bg-blue-800" : "bg-white bg-opacity-10"
                }`}
              >
                Tick
              </button>
              <button
                onClick={() => setUsePrice(true)}
                className={`p-3 rounded-lg text-white w-full ${
                  usePrice ? "bg-blue-800" : "bg-white bg-opacity-10"
                }`}
              >
                Price
              </button>
            </div>
            {!usePrice ? (
              <>
                <input
                  type="number"
                  placeholder="Enter Tick"
                  onChange={(e) =>
                    setTickToSellAt(
                      Number(getLowerUsableTick(e.target.value, selectedEvent))
                    )
                  }
                  className="p-3 rounded bg-white bg-opacity-10 text-white w-full outline-none"
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
              </>
            ) : (
              <input
                type="text"
                placeholder="Enter Price"
                value={price}
                onChange={(e) => {
                  const inputPrice = e.target.value;
                  if (parseFloat(inputPrice) >= 0 || inputPrice === "") {
                    setPrice(inputPrice);
                  }
                }}
                className="p-3 rounded bg-white bg-opacity-10 text-white w-full outline-none"
              />
            )}
          </div>

          <div className="w-full mb-4">
            <h1 className="text-white text-lg mb-2">Amount</h1>
            <input
              type="text"
              placeholder="Enter Amount"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="p-3 rounded bg-white bg-opacity-10 text-white w-full outline-none"
            />
          </div>

          <div className="w-full flex space-x-4 mb-8">
            <button
              onClick={() => setZeroForOne(false)}
              className={`p-3 rounded-lg text-white w-full ${
                !zeroForOne ? "bg-green-500" : "bg-white bg-opacity-10"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setZeroForOne(true)}
              className={`p-3 rounded-lg text-white w-full ${
                zeroForOne ? "bg-red-500" : "bg-white bg-opacity-10"
              }`}
            >
              Sell
            </button>
          </div>

          <button
            onClick={handlePlaceOrder}
            className="p-3 rounded-lg bg-blue-800 hover:bg-blue-950 transition text-white w-full"
          >
            Place Order
          </button>
        </div>

        <div className="flex flex-col bg-neutral-900 opacity-80 w-[500px] h-[620px] rounded-3xl items-center pt-2 shadow-xl border border-white border-opacity-20">
          <div className="flex justify-between mb-8">
            <h1 className="text-white text-3xl pr-80">Orders</h1>
            <button
              onClick={handleLogoToggle}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-700 hover:bg-gray-600"
            >
              {selectedLogo === "eth" ? (
                <Image
                src={"/ethLogo.png"}
                width={80}
                height={20}
                alt="ethLogo"
                /> // Eth logosu
              ) : (
                <Image
                src={"/arbLogo.png"}
                width={20}
                height={10}
                alt="ethLogo"
                /> // Arb logosu
              )}
            </button>
          </div>

          <ul className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {orders
              .filter((order) => order.balance > 0)
              .map((order, index) => (
                <li
                  key={index}
                  className="bg-white bg-opacity-5 rounded-xl p-4 space-y-4"
                >
                  <p className="text-white">
                    {`${index + 1}. Order ID: ${truncateString(
                      String(order.positionId),
                      10
                    )}, Balance: ${truncateString(String(order.balance), 10)}`}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRedeem(order)}
                      disabled={order.claimableTokens <= 0}
                      className={`flex-1 py-2 px-4 rounded-lg text-white font-medium transition-colors ${
                        order.claimableTokens > 0
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-600 cursor-not-allowed"
                      }`}
                    >
                      Redeem
                    </button>
                    <button
                      onClick={() => handleCancelOrder(order)}
                      className="flex-1 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white font-medium"
                    >
                      Cancel Order
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>

      {limitOrderInfoPopup && (
        <div
          className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50"
          onClick={() => setLimitOrderInfoPopup(false)}
        >
          <div
            className="bg-gray-800 max-w-2xl text-white p-8 rounded-2xl m-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLimitOrderInfoPopup(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <p className="text-2xl">X</p>
            </button>
            <h2 className="text-2xl font-bold mb-4">
              Testing Limit Order Hook
            </h2>
            <div className="space-y-4">
              <p>
                In the Limit Order test, you will follow a similar process to
                the Nezlobin test but with some key differences:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  <strong>Create a Pool:</strong> First, create a pool by
                  selecting the Limit Order hook. Set the dynamic fee to 3000
                  and tick spacing to 100. In the price ratio section, choose a
                  1:1 ratio.
                </li>
                <li>
                  <strong>Add Liquidity:</strong> After creating the pool, add
                  liquidity with the same parameters used in the Nezlobin test:
                  5000, 5000, -887200, and 887200.
                </li>
                <li>
                  <strong>Place an Order:</strong> Next, go to the &quot;My
                  Orders&quot; section while in Limit Order mode. Place an order
                  with the following instructions: &quot;Sell 20 tokens when the
                  tick reaches 100.&quot; After placing the order, you&apos;ll
                  see it listed in the orders section. Notice that the
                  &quot;Redeem&quot; button is disabled since the order
                  hasn&apos;t been executed yet, but you can cancel the order at
                  this point.
                </li>
                <li>
                  <strong>Trigger the Order:</strong> Now, act as another user
                  and perform a swap in the opposite direction of the pool pair
                  (e.g., if the pool is USDC/WEDU, swap in the WEDU/USDC
                  direction). Execute a swap of 200 tokens, which should push
                  the tick to 100, triggering the order you placed.
                </li>
                <li>
                  <strong>Redeem:</strong> After the swap, return to the
                  &quot;My Orders&quot; section. You will now see that the
                  &quot;Redeem&quot; button has turned green, indicating that
                  your order has been executed. At this point, you can redeem
                  the order, while the &quot;Cancel Order&quot; option will no
                  longer be available. The Limit Order hook has matched your
                  order by executing a corresponding swap when the tick reached
                  100.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyOrders;
