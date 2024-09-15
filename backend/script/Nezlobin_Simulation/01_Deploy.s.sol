// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import {Test} from "forge-std/Test.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolModifyLiquidityTest} from "v4-core/test/PoolModifyLiquidityTest.sol";
import {CurrencyLibrary, Currency} from "v4-core/types/Currency.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {TickMath} from "v4-core/libraries/TickMath.sol";
import {StateLibrary} from "v4-core/libraries/StateLibrary.sol";
import {MockERC20} from "solmate/src/test/utils/mocks/MockERC20.sol";
import {PoolSwapTest} from "v4-core/Test/PoolSwapTest.sol";
import {PoolManager} from "v4-core/PoolManager.sol";
import {LiquidityAmounts} from "v4-periphery/lib/v4-core/test/utils/LiquidityAmounts.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {Deployers} from "@uniswap/v4-core/test/utils/Deployers.sol";
import {Nezlobin} from "../../src/Nezlobin.sol";
import {HookMiner} from "../../test/HookMiner.sol";

contract Deployer is Test, Script, Deployers {
    using StateLibrary for IPoolManager;
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;
    Currency token0;
    Currency token1;
    address USER = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    Nezlobin hook;
    address constant CREATE2_DEPLOYER =
        address(0x4e59b44847b379578588920cA78FbF26c0B4956C);

    function run() public {
        vm.startBroadcast(
            0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
        );
        deployFreshManagerAndRouters(); // Deploy two test tokens
        (token0, token1) = deployMintAndApprove2Currencies();

        MockERC20(Currency.unwrap(token0)).mint(USER, type(uint128).max);
        MockERC20(Currency.unwrap(token1)).mint(USER, type(uint128).max);

        uint160 flags = uint160(
            Hooks.BEFORE_INITIALIZE_FLAG | Hooks.BEFORE_SWAP_FLAG
        );

        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            type(Nezlobin).creationCode,
            abi.encode(address(manager))
        );

        hook = new Nezlobin{salt: salt}(IPoolManager(address(manager)));

        MockERC20(Currency.unwrap(token0)).approve(
            address(hook),
            type(uint256).max
        );
        MockERC20(Currency.unwrap(token1)).approve(
            address(hook),
            type(uint256).max
        );
        MockERC20(Currency.unwrap(token0)).approve(
            address(modifyLiquidityRouter),
            type(uint256).max
        );
        MockERC20(Currency.unwrap(token1)).approve(
            address(modifyLiquidityRouter),
            type(uint256).max
        );
        MockERC20(Currency.unwrap(token0)).approve(
            address(swapRouter),
            type(uint256).max
        );
        MockERC20(Currency.unwrap(token1)).approve(
            address(swapRouter),
            type(uint256).max
        );
        address Token0 = Currency.unwrap(token0);
        address Token1 = Currency.unwrap(token1);
        console.log("Hook address", address(hook));
        console.log("Token0 address", Token0);
        console.log("Token1 address", Token1);
        console.log("PoolManager address", address(manager));
        console.log("swapRouter address", address(swapRouter));
        console.log(
            "modifyLiquidityRouter address",
            address(modifyLiquidityRouter)
        );
        vm.stopBroadcast();
    }
}
