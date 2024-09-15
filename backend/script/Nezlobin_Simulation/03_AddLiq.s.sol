//  Hook address 0x42cA7A32fBc371A6bf8974d03c9efeA768A86080
//   Token0 address 0x0b48aF34f4c854F5ae1A3D587da471FeA45bAD52
//   Token1 address 0xbCF26943C0197d2eE0E5D05c716Be60cc2761508
//   PoolManager address 0x8464135c8F25Da09e49BC8782676a84730C318bC
//   swapRouter address 0x71C95911E9a5D330f4D621842EC243EE1343292e
//   modifyLiquidityRouter address 0x712516e61C8B383dF4A63CFe83d7701Bce54B03e
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolModifyLiquidityTest} from "v4-core/test/PoolModifyLiquidityTest.sol";
import {CurrencyLibrary, Currency} from "v4-core/types/Currency.sol";
import {LPFeeLibrary} from "v4-core/libraries/LPFeeLibrary.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {TickMath} from "v4-core/libraries/TickMath.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {LiquidityAmounts} from "v4-periphery/lib/v4-core/test/utils/LiquidityAmounts.sol";
import {Nezlobin} from "../../src/Nezlobin.sol";
import {StateLibrary} from "v4-core/libraries/StateLibrary.sol";
import {Deployers} from "@uniswap/v4-core/test/utils/Deployers.sol";
import {DevOpsTools} from "lib/foundry-devops/src/DevOpsTools.sol";

contract PoolLiq is Script {
    PoolModifyLiquidityTest lpRouter =
        PoolModifyLiquidityTest(0x712516e61C8B383dF4A63CFe83d7701Bce54B03e);

    IPoolManager manager =
        IPoolManager(0x8464135c8F25Da09e49BC8782676a84730C318bC);

    address token0 = address(0x0b48aF34f4c854F5ae1A3D587da471FeA45bAD52);

    address token1 = address(0xbCF26943C0197d2eE0E5D05c716Be60cc2761508);
    address hookAddress = DevOpsTools.get_most_recent_deployment("Nezlobin", block.chainid);

    function run() external {
        // Pool that will receieve liquidity
        PoolKey memory pool = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: 60,
            hooks: Nezlobin(hookAddress)
        });
        int24 MAX_TICK = TickMath.maxUsableTick(60);
        int24 MIN_TICK = TickMath.minUsableTick(60);
        uint160 sqrtPriceX96Lower = TickMath.getSqrtPriceAtTick(MIN_TICK);
        uint160 sqrtPriceX96Upper = TickMath.getSqrtPriceAtTick(MAX_TICK);
        int24 lowerTick = TickMath.getTickAtSqrtPrice(sqrtPriceX96Lower);
        int24 upperTick = TickMath.getTickAtSqrtPrice(sqrtPriceX96Upper);

        console.log("Lower Tick", lowerTick);
        console.log("MAX_TICK Tick", MAX_TICK);
        console.log("MAX_TICK Tick", MAX_TICK);
        console.log("Upper Tick", upperTick);
        console.log("Lower Price", sqrtPriceX96Lower);
        console.log("Upper Price", sqrtPriceX96Upper);
        console.log("hookAddress", hookAddress);

        PoolId id = PoolIdLibrary.toId(pool);

        (
            uint160 sqrtPriceX96,
            int24 tick,
            uint24 protocolFee,
            uint24 lpFee
        ) = StateLibrary.getSlot0(IPoolManager(manager), id);

        uint128 liquidity = LiquidityAmounts.getLiquidityForAmounts(
            sqrtPriceX96,
            sqrtPriceX96Lower,
            sqrtPriceX96Upper,
            5000 ether,
            5000 ether
        );
        int256 liquidityDelta = int256(uint256(liquidity));
        console.log("Liquidity", liquidity);

        vm.broadcast(
            0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
        );
        lpRouter.modifyLiquidity(
            pool,
            IPoolManager.ModifyLiquidityParams({
                tickLower: MIN_TICK,
                tickUpper: MAX_TICK,
                liquidityDelta: liquidityDelta,
                salt: 0
            }),
            new bytes(0)
        );
    }
}
