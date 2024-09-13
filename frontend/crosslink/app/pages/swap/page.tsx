"use client";
import React, { useState, useEffect } from "react";
import { swap } from "../../../utils/functions/swapFunctions";
import { getTokenInfo } from "../../../utils/functions/createTokenFunctions";
import { decodeEventLog } from "viem";
import { keccak256, toBytes } from "viem";
import { config } from "../../../utils/config";
import { PoolManagerABI } from "../../../utils/poolManagerABI.json";
import { LiquidiytDeltaABI } from "../../../utils/readerABI.json";
import { writeContract, readContract } from "@wagmi/core";
import { ERC20ABI } from "../../../utils/ERC20ABI.json";
import { waitForTransactionReceipt } from "@wagmi/core";
import { useHook } from "../../../components/hookContext";
import { getAllowance } from "../../../utils/functions/allowanceFunction";
import { getBalance } from "../../../utils/functions/createTokenFunctions";
import { getAccount } from "@wagmi/core";
import { type GetAccountReturnType } from '@wagmi/core'

const Swap = () => {
  const account = getAccount(config);

  console.log("Chain Id " + account.chainId);

  return <div>Swap</div>;
};

export default Swap;
