// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolModifyLiquidityTest} from "v4-core/test/PoolModifyLiquidityTest.sol";
import {PoolSwapTest} from "v4-core/test/PoolSwapTest.sol";
import {CurrencyLibrary, Currency} from "v4-core/types/Currency.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {TickMath} from "v4-core/libraries/TickMath.sol";
import {LiquidityAmounts} from "v4-periphery/lib/v4-core/test/utils/LiquidityAmounts.sol";
import {Nezlobin} from "../../src/Nezlobin.sol";
import {StateLibrary} from "v4-core/libraries/StateLibrary.sol";
import {LPFeeLibrary} from "v4-core/libraries/LPFeeLibrary.sol";
import {TickBitmap} from "v4-core/libraries/TickBitmap.sol";
import {Pool} from "v4-core/libraries/Pool.sol";
import {DevOpsTools} from "lib/foundry-devops/src/DevOpsTools.sol";

//  Hook address 0x42cA7A32fBc371A6bf8974d03c9efeA768A86080
//   Token0 address 0x0b48aF34f4c854F5ae1A3D587da471FeA45bAD52
//   Token1 address 0xbCF26943C0197d2eE0E5D05c716Be60cc2761508
//   PoolManager address 0x8464135c8F25Da09e49BC8782676a84730C318bC
//   swapRouter address 0x71C95911E9a5D330f4D621842EC243EE1343292e
//   modifyLiquidityRouter address 0x712516e61C8B383dF4A63CFe83d7701Bce54B03e

contract Swap is Script {
    PoolSwapTest swapRouter =
        PoolSwapTest(0x71C95911E9a5D330f4D621842EC243EE1343292e);
    IPoolManager manager =
        IPoolManager(0x8464135c8F25Da09e49BC8782676a84730C318bC);
    using TickBitmap for mapping(int16 => uint256);

    uint160 public constant MIN_PRICE_LIMIT = TickMath.MIN_SQRT_PRICE + 1;
    uint160 public constant MAX_PRICE_LIMIT = TickMath.MAX_SQRT_PRICE - 1;
    address token0 = address(0x90118d110B07ABB82Ba8980D1c5cC96EeA810d2C);

    address token1 = address(0xC6bA8C3233eCF65B761049ef63466945c362EdD2);
    address hookAddress = DevOpsTools.get_most_recent_deployment("Nezlobin", block.chainid);

    function run() external {
        PoolKey memory pool = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: 60,
            hooks: Nezlobin(hookAddress)
        });

        PoolId id = PoolIdLibrary.toId(pool);


        console.log(
            "BeforeSwap CurrentTick",
            Nezlobin(hookAddress).poolToTick(id)
        );

       
      

        bool zeroForOne = false;
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: -30 ether,
            sqrtPriceLimitX96: zeroForOne ? MIN_PRICE_LIMIT : MAX_PRICE_LIMIT // unlimited impact
        });
        console.log(
            "Balance token0",
            IERC20(token0).balanceOf(0x8464135c8F25Da09e49BC8782676a84730C318bC)
        );
        console.log(
            "Balance token1",
            IERC20(token1).balanceOf(0x8464135c8F25Da09e49BC8782676a84730C318bC)
        );
        console.log(
            "USER Balance token1",
            IERC20(token1).balanceOf(0x70997970C51812dc3A010C7d01b50e0d17dc79C8)
        );
        console.log(
            "USER Balance token1",
            IERC20(token1).balanceOf(0x70997970C51812dc3A010C7d01b50e0d17dc79C8)
        );
        console.log(
            "Afterswap currentTick",
            Nezlobin(hookAddress).poolToTick(id)
        );
        // in v4, users have the option to receieve native ERC20s or wrapped ERC1155 tokens
        // here, we'll take the ERC20s
        PoolSwapTest.TestSettings memory testSettings = PoolSwapTest
            .TestSettings({takeClaims: false, settleUsingBurn: false});

        bytes memory hookData = new bytes(0); // no hook data on the hookless pool
        vm.broadcast(
            0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
        );
        swapRouter.swap(pool, params, testSettings, hookData);
        console.log(
            "Afterswap Balance token0",
            IERC20(token0).balanceOf(address(this))
        );
        console.log(
            "AfterSwap Balance token1",
            IERC20(token1).balanceOf(address(this))
        );
    }
}
