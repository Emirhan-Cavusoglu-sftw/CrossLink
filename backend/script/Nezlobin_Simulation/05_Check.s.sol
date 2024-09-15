// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// Hook address 0x0000000000000000000000000000000000002080
//   Token0 address 0x0b48aF34f4c854F5ae1A3D587da471FeA45bAD52
//   Token1 address 0xbCF26943C0197d2eE0E5D05c716Be60cc2761508
//   PoolManager address 0x8464135c8F25Da09e49BC8782676a84730C318bC
//   swapRouter address 0x71C95911E9a5D330f4D621842EC243EE1343292e
//   modifyLiquidityRouter address 0x712516e61C8B383dF4A63CFe83d7701Bce54B03e

import "forge-std/Script.sol";
import "forge-std/console.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {Position} from "v4-core/libraries/Position.sol";
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
import {Nezlobin} from "../../src/Nezlobin.sol";
import {LPFeeLibrary} from "v4-core/libraries/LPFeeLibrary.sol";
import {DevOpsTools} from "lib/foundry-devops/src/DevOpsTools.sol";


contract Look is Script {
    using CurrencyLibrary for Currency;

    PoolModifyLiquidityTest lpRouter =
        PoolModifyLiquidityTest(0x712516e61C8B383dF4A63CFe83d7701Bce54B03e);

    IPoolManager manager =
        IPoolManager(0x8464135c8F25Da09e49BC8782676a84730C318bC);

    address token0 = address(0x0b48aF34f4c854F5ae1A3D587da471FeA45bAD52);

    address token1 = address(0xbCF26943C0197d2eE0E5D05c716Be60cc2761508);

    Nezlobin hook =
        Nezlobin(address(DevOpsTools.get_most_recent_deployment("Nezlobin", block.chainid)));

    function run() view external {
        // vm.startPrank(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);

        PoolKey memory pool = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: 60,
            hooks: Nezlobin(address(hook))
        });

        // uint160 sqrtPriceX96Lower = TickMath.getSqrtPriceAtTick(0);
        // uint160 sqrtPriceX96Upper = TickMath.getSqrtPriceAtTick(100);

        PoolId id = PoolIdLibrary.toId(pool);

        (
            uint160 sqrtPriceX96,
            int24 tick,
            uint24 protocolFee,
            uint24 lpFee
        ) = StateLibrary.getSlot0(IPoolManager(manager), id);

        int24 currentTick = hook.poolToTick(id);

        console.log("sqrtPriceX96", sqrtPriceX96);
        console.log("tick", tick);
        console.log("CurrentTick" , currentTick);
        console.log("protocolFee", protocolFee);
        console.log("lpFee", lpFee);
        console.log("Balance token0", IERC20(token0).balanceOf(0x8464135c8F25Da09e49BC8782676a84730C318bC));
        console.log("Balance token1", IERC20(token1).balanceOf(0x8464135c8F25Da09e49BC8782676a84730C318bC));
    }
}
