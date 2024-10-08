"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useHook } from "./hookContext";
import Image from "next/image";
import Link from "next/link";
import { getAccount } from "@wagmi/core";
import { config } from "../utils/config";

let nezlobinHook = "0xCB755c1c639517EE731Aa577cdb8308aBFEB2080"; // Nezlobin
let limitOrderHook = "0x735F883b29561463ec096670974670EC5Ff5D040"; // Limit Order
const defaultHook = "0x0000000000000000000000000000000000000000"; //UniswapV4

const Header = () => {
  const router = useRouter();
  const { selectedHook, setSelectedHook, selectedColor, setSelectedColor } =
    useHook();
  const [isLimitOrderSelected, setIsLimitOrderSelected] = useState(false);
  const [selectedPage, setSelectedPage] = useState("");

  const handleNavigation = (path: string) => {
    router.push(path);
    setSelectedPage(path);
  };

  useEffect(() => {
    chainHooksSelector();
  }, []);

  const chainHooksSelector = async () => {
    const account = getAccount(config);
    if (account.chainId) {
      if (String(account.chainId) == "421614") {
        nezlobinHook = "0xCB755c1c639517EE731Aa577cdb8308aBFEB2080";
        limitOrderHook = "0x735F883b29561463ec096670974670EC5Ff5D040";
      } else if (String(account.chainId) == "11155111") {
        nezlobinHook = "0x5886047EcfE4465CeF451C72B74C93c337F42080";
        limitOrderHook = "0x1dB4DF1583a546d74E7C3C303c37AC75204cD040";
      } else {
        alert("Invalid chainId");
      }
    }
  };

  const getButtonClass = (path: string) => {
    return `transition ${
      selectedPage === path
        ? "border p-2 border-white text-white border-opacity-50 rounded-xl"
        : "text-white p-2 hover:text-gray-400 transition"
    }`;
  };

  const handleHookSelection = (
    hook: string,
    color: string,
    isLimitOrder: boolean
  ) => {
    setSelectedHook(hook);
    setSelectedColor(color);
    setIsLimitOrderSelected(isLimitOrder);
  };

  return (
    <header className="fixed top-0 left-0 w-full flex justify-between items-center py-4 px-8 bg-transparent z-50">
      <div className="flex space-x-4">
        <Link href="/" onClick={() => setSelectedPage("")}>
          <div className="flex flex-row space-x-2">
            <Image src="/icon.png" width={50} height={40} alt="InfHook" />
            <h1 className="text-cyan-400 flex pt-[7px] text-xl">CrossLink</h1>
          </div>
        </Link>
        <button
          onClick={() => handleNavigation(`/pages/swap`)}
          className={getButtonClass(`/pages/swap`)}
        >
          Swap
        </button>
        <button
          onClick={() => handleNavigation("/pages/explore")}
          className={getButtonClass(`/pages/explore`)}
        >
          Explorer
        </button>
        <button
          onClick={() => handleNavigation(`/pages/myPools`)}
          className={getButtonClass(`/pages/myPools`)}
        >
          My Positions
        </button>
        <button
          className={getButtonClass(`/pages/createToken`)}
          onClick={() => handleNavigation(`/pages/createToken`)}
        >
          Create Token
        </button>
        <Link
          href={
            "https://emirhancavusoglu.notion.site/InfHook-Tutorial-6098a38d0df0413d906761331a285479"
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="text-white hover:text-gray-400 transition pt-2">
            Doc
          </button>
        </Link>
        {isLimitOrderSelected && (
          <button
            onClick={() => handleNavigation("/pages/myOrders")}
            className={getButtonClass(`/pages/myOrders`)}
          >
            My Orders
          </button>
        )}
      </div>
      <div className="flex space-x-4 items-center">
        <button
          className={`transition ${
            selectedHook === defaultHook
              ? "text-pink-400 hover:text-gray-400"
              : "text-white hover:text-gray-400"
          }`}
          onClick={() => handleHookSelection(defaultHook, "pink", false)}
        >
          UniswapV4
        </button>
        <button
          className={`transition ${
            selectedHook === nezlobinHook
              ? "text-cyan-400 hover:text-gray-400"
              : "text-white hover:text-gray-400"
          }`}
          onClick={() => handleHookSelection(nezlobinHook, "cyan", false)}
        >
          Nezlobin
        </button>
        <button
          className={`transition ${
            selectedHook === limitOrderHook
              ? "text-lime-400 hover:text-gray-400"
              : "text-white hover:text-gray-400"
          }`}
          onClick={() => handleHookSelection(limitOrderHook, "lime", true)}
        >
          Limit Order
        </button>
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => (
            <div
              {...(!mounted && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {!mounted || !account || !chain ? (
                <button
                  className="px-4 py-2 bg-transparent text-gray-500 border border-gray-500 rounded-xl opacity-80 hover:text-blue-500 hover:opacity-80 hover:border-blue-500 hover:border-opacity-80 transition-colors duration-300"
                  onClick={openConnectModal}
                  type="button"
                >
                  Connect Wallet
                </button>
              ) : chain.unsupported ? (
                <button
                  className="px-4 py-2 bg-transparent text-red-500 border border-gray-500 rounded-xl opacity-80 hover:text-gray-500 hover:opacity-80 transition-colors duration-300"
                  onClick={openChainModal}
                  type="button"
                >
                  Wrong network
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 bg-transparent text-gray-500 border border-gray-500 rounded-xl opacity-80 hover:text-blue-500 hover:opacity-80 hover:border-blue-500 hover:border-opacity-80 transition-colors duration-300"
                    onClick={openChainModal}
                    type="button"
                  >
                    {chain.name}
                  </button>

                  <button
                    className="px-4 py-2 bg-transparent text-gray-500 border border-gray-500 rounded-xl opacity-80 hover:text-blue-500 hover:opacity-80 hover:border-blue-500 hover:border-opacity-80 transition-colors duration-300"
                    onClick={openAccountModal}
                    type="button"
                  >
                    {account.displayName}
                    {account.displayBalance && ` (${account.displayBalance})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </ConnectButton.Custom>
      </div>
    </header>
  );
};

export default Header;
