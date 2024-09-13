import { LaunchPadABI } from "../LaunchPadABI.json";
import { writeContract, readContract } from "@wagmi/core";
import { config } from "../config";
import { getAccount } from "@wagmi/core";
import { ERC20ABI } from "../ERC20ABI.json";
import { parseUnits, formatUnits } from "viem";

const launchPadAddress = "0x3975290f968Ce8354Dcd930235Bcc7eC66e4F681";

export async function createToken(tokenName: string, tokenSymbol: string) {
  try {
    const deployedToken = await writeContract(config, {
      abi: LaunchPadABI,
      address: launchPadAddress,
      functionName: "deployToken",
      args: [tokenName, tokenSymbol],
    });
    console.log("Deployed Token " + deployedToken);
  } catch (error) {
    console.log(error);
  }
}

// Tüm tokenların bilgilerini dönüyor
export async function getTokenInfo(
  setTokenInfo: (tokenInfo: TokenInfo[]) => void
) {
  try {
    const [tokenAddresses, mintedBys, names, symbols] = await readContract(
      config,
      {
        abi: LaunchPadABI,
        address: launchPadAddress,
        functionName: "getTokenInfo",
      }
    );

    const tokens: TokenInfo[] = names.map((name: string, index: number) => ({
      tokenAddress: tokenAddresses[index],
      mintedBy: mintedBys[index],
      name,
      symbol: symbols[index],
    }));
    console.log("Tokens ", tokens);
    setTokenInfo(tokens);
    return tokens;
  } catch (error) {
    console.log(error);
  }
}

export async function getUserTokens(
  setUserTokens: (userTokens: { name: string; symbol: string }[]) => void
) {
  const account = getAccount(config);
  try {
    const [names, symbols] = await readContract(config, {
      abi: LaunchPadABI,
      address: launchPadAddress,
      functionName: "getUserTokens",
      args: [account.address],
    });

    const userTokens = names.map((name: string, index: number) => ({
      name,
      symbol: symbols[index],
    }));

    setUserTokens(userTokens);
    console.log("User Tokens ", userTokens);
  } catch (error) {
    console.log(error);
  }
}

export async function mintToken(tokenAddress: string) {
  try {
    const mintedToken = await writeContract(config, {
      abi: LaunchPadABI,
      address: launchPadAddress,
      functionName: "mintToken",
      args: [tokenAddress],
    });
    console.log("Minted Token " + mintedToken);
  } catch (error) {
    console.log(error);
  }
}

export async function getBalance(tokenAddress: string) {
  console.log("Fetching balance for token:", tokenAddress);
  const decimal = 18;
  const account = getAccount(config);
  if (!account || !account.address) {
    console.error("Account not found or address is invalid.");
    return;
  }

  try {
    const balance = await readContract(config, {
      abi: ERC20ABI,
      address: tokenAddress,
      functionName: "balanceOf",
      args: [account.address],
    });
    console.log("Balance for token:", balance);
    return balance;
  } catch (error) {
    console.error("Error fetching balance:", error);
  }
}
