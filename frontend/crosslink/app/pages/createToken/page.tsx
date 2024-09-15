"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  createToken,
  getTokenInfo,
  getUserTokens,
  mintToken,
  getBalance,
} from "../../../utils/functions/createTokenFunctions";

interface TokenInfo {
  tokenAddress: string;
  mintedBy: string;
  name: string;
  symbol: string;
}

const CreateToken = () => {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenInfo, setTokenInfo] = useState<TokenInfo[]>([]);
  const [userTokens, setUserTokens] = useState<
    { name: string; symbol: string }[]
  >([]);
  const [createTokenPopup, setCreateTokenPopup] = useState(false);

  // New state to store balances
  const [tokenBalances, setTokenBalances] = useState<{
    [key: string]: number;
  }>({});

  const handleCreateToken = async () => {
    await createToken(tokenName, tokenSymbol);
    await getTokenInfo(setTokenInfo);
    await getUserTokens(setUserTokens);
    window.location.reload();
  };

  useEffect(() => {
    getTokenInfo(setTokenInfo);
    getUserTokens(setUserTokens);
  }, []);

  const handleMintToken = async (tokenAddress: string) => {
    await mintToken(tokenAddress);
    await handleGetBalance(tokenAddress);
    window.location.reload();
  };

  const handleGetBalance = async (tokenAddress: string) => {
    const balance = await getBalance(tokenAddress);
    if (Number(balance) > 0) {
      const token = tokenInfo.find((t) => t.tokenAddress === tokenAddress);
      if (token) {
        setUserTokens((prevTokens) => [
          ...prevTokens,
          { name: token.name, symbol: token.symbol },
        ]);
      }
    }
  };

  const _handleGetBalance = async (tokenAddress: string): Promise<number> => {
    const balance = await getBalance(tokenAddress);
    return Number(balance);
  };

  // useEffect to fetch balances when userTokens or tokenInfo changes
  useEffect(() => {
    const fetchBalances = async () => {
      const balances: { [key: string]: number } = {};

      for (const token of userTokens) {
        const matchingTokenInfo = tokenInfo.find(
          (t) => t.name === token.name && t.symbol === token.symbol
        );

        if (matchingTokenInfo) {
          const balance = await _handleGetBalance(
            matchingTokenInfo.tokenAddress
          );
          balances[token.name] = balance;
        }
      }
      setTokenBalances(balances);
    };

    fetchBalances();
  }, [userTokens, tokenInfo]);

  return (
    <div className="flex flex-col md:flex-row justify-center items-start gap-8 p-8 bg-transparent text-white">
      {/* All Tokens Section */}
      <div className="w-full md:w-[500px] bg-white bg-opacity-10 backdrop-blur-lg shadow-xl border border-white border-opacity-20 rounded-xl">
        <h2 className="text-2xl font-bold p-4 border-b border-white border-opacity-45">
          All Tokens
        </h2>
        <div className="h-[600px] overflow-y-auto custom-scrollbar">
          {tokenInfo.map((token) => (
            <div
              key={token.tokenAddress}
              className="flex justify-between items-center p-4 border-b border-white border-opacity-45 transition-colors"
            >
              <div>
                <p className="font-semibold">{token.name}</p>
                <p className="text-gray-400 text-sm">({token.symbol})</p>
              </div>
              <motion.button
                className="px-4 py-2 bg-sky-600 hover:bg-indigo-700 rounded-lg transition-colors w-24"
                onClick={() => handleMintToken(token.tokenAddress)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Mint
              </motion.button>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full md:w-[500px] space-y-8">
        {/* Create Token Section */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg shadow-xl border border-white border-opacity-20 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Create Token</h2>
            <button
              onClick={() => setCreateTokenPopup(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ?
            </button>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Token Name"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              className="w-full p-2 bg-white bg-opacity-10 border border-gray-600 rounded-lg focus:outline-none "
            />
            <input
              type="text"
              placeholder="Token Symbol"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              className="w-full p-2 bg-white bg-opacity-10 border border-gray-600 rounded-lg focus:outline-none"
            />
            <motion.button
              className="w-full py-2 bg-sky-600 hover:bg-indigo-700 rounded-lg transition-colors"
              onClick={handleCreateToken}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create Token
            </motion.button>
          </div>
        </div>

        {/* Your Tokens Section */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg shadow-xl border border-white border-opacity-20 rounded-xl">
          <h2 className="text-2xl font-bold p-4 border-b border-white border-opacity-45">
            Your Tokens
          </h2>
          <div className="h-[300px] overflow-y-auto custom-scrollbar">
            {userTokens.map((token) => {
              const balance = tokenBalances[token.name];
              if (balance !== undefined) {
                const balanceString = balance.toString();
                const truncatedBalance =
                  balanceString.length > 6
                    ? balanceString.substring(0, 6) + "..."
                    : balanceString;

                return (
                  <div
                    key={token.name}
                    className="flex justify-between items-center p-4 hover:bg-sky-600 hover:rounded-xl transition-colors"
                  >
                    <div>
                      <p className="font-semibold">{token.name}</p>
                      <p className="text-gray-400 text-sm">({token.symbol})</p>
                    </div>
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-yellow-500 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p>{truncatedBalance}</p>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>

      {/* Create Token Popup */}
      {createTokenPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50"
        onClick={() => setCreateTokenPopup(false)}
        >
          <div className="bg-gray-800 text-white p-6 rounded-xl max-w-lg relative">
          <button
              onClick={() => setCreateTokenPopup(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <p className="text-2xl">X</p>
            </button>
            <h3 className="text-xl font-bold mb-4">Create Token Information</h3>
            <p className="text-gray-300 mb-4">
              In our platform, you can create your own tokens or mint existing
              tokens. This feature facilitates more robust and realistic testing
              within the testnet environment. When you mint your first token,
              you will need to approve it for the hook liquidity router and the
              swap router, which are integral to the swap hook functionality.
              This approval is specifically required for the Limit Order Hook,
              and you&apos;ll see this process in action as you interact with
              the platform.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateToken;
