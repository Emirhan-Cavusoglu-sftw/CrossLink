#  CrossLink

Welcome to the **CrossLink**! This repository contains the implementation of two innovative hooks designed to enhance liquidity management and trading efficiency on Uniswap v4. Our project takes full advantage of Uniswap v4’s advanced features, including custom hooks, concentrated liquidity, and dynamic fee structures.

## Features

### 1. Nezlobin Dynamic Fee Hook
Inspired by Alex Nezlobin’s dynamic fee concept, this hook dynamically adjusts swap fees based on real-time market conditions.

- **Dynamic Fee Adjustment:** The hook evaluates the price impact and direction before each swap.
- **Reduced Impermanent Loss:** Higher fees are applied to arbitrageurs, while lower fees attract uninformed traders, reducing impermanent loss for liquidity providers.
- **Real-Time Market Response:** Fees are adjusted dynamically to ensure that liquidity providers are better protected during volatile market conditions.

## Cross-Chain Limit Order Hook

The Cross-Chain Limit Order Hook enables users to place limit orders that can be executed across multiple blockchains, leveraging Chainlink's CCIP (Cross-Chain Interoperability Protocol). This innovative approach expands the possibilities for decentralized trading, allowing for greater flexibility and improved execution.

### Key Features:

1. **Cross-Chain Execution:**
   - Users can place a limit order on one blockchain and have it executed  , increasing the likelihood of achieving the desired trade price across different chains.

2. **Redeem on Any Chain:**
   - Once the limit order is successfully executed, users can redeem their tokens on any supported blockchain, offering more flexibility in managing assets across multiple ecosystems.

3. **Chainlink CCIP Integration:**
   - The hook integrates with Chainlink’s CCIP to securely handle the cross-chain communication, ensuring smooth and trustless transactions between different blockchains.

4. **Limit Order Logic:**
   - The basic limit order logic remains intact, ensuring that orders are only executed when the market price matches the user's specified price, guaranteeing control over trade execution.

5. **Future Enhancements:**
   - We are planning to automate the redeem process using Chainlink Automation for an even smoother cross-chain trading experience.
   
### How It Works:

1. **Place an Order:**  
   - A user sets a limit order on Chain A, specifying the price they want to trade at.
   
2. **Cross-Chain Execution:**  
   - When the conditions are met on Chain B, the order is executed using CCIP to relay the transaction between chains.
   
3. **Redeem on Any Chain:**  
   - Once the order is executed, the user can redeem the tokens on the chain of their choice, as long as the order has been fulfilled.

This hook brings a new level of interoperability to decentralized finance, allowing users to manage their trades across different blockchains while benefiting from the security and flexibility offered by Chainlink CCIP.



## Setup and Simulation with Foundry

To get started with the local simulation of the Nezlobin hook using Foundry, follow the steps below:

1. **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2. **Install dependencies using Foundry:**
    ```bash
    forge install
    ```

3. **Run Anvil in a separate terminal:**
    ```bash
    anvil
    ```

4. **Execute the simulation scripts:**

    - **Step 1: Deploy the pool manager, router, and hooks:**
        ```bash
        forge script script/Test/Nezlobin_Simulation/01_Deploy.s.sol --rpc-url 127.0.0.1:8545 --broadcast -vvv
        ```
        After running the deploy script, a console will display the addresses of the deployed contracts. Make sure to update these addresses in the subsequent scripts before proceeding.

    - **Step 2: Initialize the pool:**
        ```bash
        forge script script/Test/Nezlobin_Simulation/02_Initialize.s.sol --rpc-url 127.0.0.1:8545 --broadcast -vvv
        ```

    - **Step 3: Add liquidity (you can modify the values as needed):**
        ```bash
        forge script script/Test/Nezlobin_Simulation/03_AddLiq.s.sol --rpc-url 127.0.0.1:8545 --broadcast -vvv
        ```

    - **Step 4: Perform a swap:**
        ```bash
        forge script script/Test/Nezlobin_Simulation/04_Swap.s.sol --rpc-url 127.0.0.1:8545 --broadcast -vvv
        ```

    - **Step 5: Check values like swap fee and current tick:**
        ```bash
        forge script script/Test/Nezlobin_Simulation/05_Check.s.sol --rpc-url 127.0.0.1:8545 --broadcast -vvv
        ```


## Deployed Contracts

### Arbitrum Sepolia
- **PoolManager**: [0x5F49Cf21273563a628F31cd08C1D4Ada7722aB58](https://sepolia.arbiscan.io/address/0x5F49Cf21273563a628F31cd08C1D4Ada7722aB58)
- **PoolModifyLiquidityTest**: [0xc66f440Ee31e3aE0b026972Ad0C6D62DfD27596B](https://sepolia.arbiscan.io/address/0xc66f440Ee31e3aE0b026972Ad0C6D62DfD27596B)
- **PoolSwapTest**: [0x540bFc2FB3B040761559519f9F44690812f3514e](https://sepolia.arbiscan.io/address/0x540bFc2FB3B040761559519f9F44690812f3514e)
- **Reader**: [0x86a6cE6DE9d2A6D4CDafcFfdD24C6B69676acF3E](https://sepolia.arbiscan.io/address/0x86a6cE6DE9d2A6D4CDafcFfdD24C6B69676acF3E)
- **LimitOrder**: [0x735F883b29561463ec096670974670EC5Ff5D040](https://sepolia.arbiscan.io/address/0x735F883b29561463ec096670974670EC5Ff5D040)
- **Nezlobin**: [0xCB755c1c639517EE731Aa577cdb8308aBFEB2080](https://sepolia.arbiscan.io/address/0xCB755c1c639517EE731Aa577cdb8308aBFEB2080)

### Sepolia
- **PoolManager**: [0xbb46AB4ecC82166Be4d34f5a79992e582d14206a](https://sepolia.etherscan.io/address/0xbb46AB4ecC82166Be4d34f5a79992e582d14206a)
- **PoolModifyLiquidityTest**: [0x0E67d44a512Bcf556FA8ef0e957Fbe843f67b53f](https://sepolia.etherscan.io/address/0x0E67d44a512Bcf556FA8ef0e957Fbe843f67b53f)
- **LimitOrder**: [0x1dB4DF1583a546d74E7C3C303c37AC75204cD040](https://sepolia.etherscan.io/address/0x1dB4DF1583a546d74E7C3C303c37AC75204cD040)
- **Nezlobin**: [0x5886047EcfE4465CeF451C72B74C93c337F42080](https://sepolia.etherscan.io/address/0x5886047EcfE4465CeF451C72B74C93c337F42080)



## Acknowledgments

- **Alex Nezlobin:** For the dynamic fee concept that inspired the Nezlobin Dynamic Fee Hook.




We hope you find this project as exciting as we do! Thank you for your interest.