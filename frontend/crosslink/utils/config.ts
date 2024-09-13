import { createConfig, http } from "wagmi";
import { sepolia, arbitrumSepolia } from "wagmi/chains";

export const config = createConfig({
  chains: [sepolia, arbitrumSepolia],
  transports: {
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
    [arbitrumSepolia.id]: http("https://sepolia-rollup.arbitrum.io/rpc"),
  },
});
