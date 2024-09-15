//  Hook address 0xcca7B31c978258A6D5b9a20AfB54CB19b326E080
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
import {Deployers} from "@uniswap/v4-core/test/utils/Deployers.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolModifyLiquidityTest} from "v4-core/test/PoolModifyLiquidityTest.sol";
import {CurrencyLibrary, Currency} from "v4-core/types/Currency.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {LPFeeLibrary} from "v4-core/libraries/LPFeeLibrary.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {Nezlobin} from "../../src/Nezlobin.sol";
import {DevOpsTools} from "lib/foundry-devops/src/DevOpsTools.sol";

contract PoolInitialize is Script, Deployers {
    using CurrencyLibrary for Currency;

    address constant Token0 =
        address(0x0b48aF34f4c854F5ae1A3D587da471FeA45bAD52);
    address constant Token1 =
        address(0xbCF26943C0197d2eE0E5D05c716Be60cc2761508);

    function run() external {
        IPoolManager manager = IPoolManager(
            0x8464135c8F25Da09e49BC8782676a84730C318bC
        );

        address token0 = address(Token0);
        address token1 = address(Token1);
        uint24 swapFee = LPFeeLibrary.DYNAMIC_FEE_FLAG;
        int24 tickSpacing = 60;

        // floor(sqrt(1) * 2^96)
        uint160 startingPrice = SQRT_PRICE_1_1;

        bytes memory hookData = new bytes(0);

        PoolKey memory pool = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: tickSpacing,
            hooks: Nezlobin(address(DevOpsTools.get_most_recent_deployment("Nezlobin", block.chainid)))
        });
        vm.broadcast(
            0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
        );
        manager.initialize(pool, startingPrice, hookData);
    }
}
