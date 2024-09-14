// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {LiquidityAmounts} from "v4-periphery/lib/v4-core/test/utils/LiquidityAmounts.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {CurrencyLibrary, Currency} from "v4-core/types/Currency.sol";
import {TickMath} from "v4-core/libraries/TickMath.sol";
import {StateLibrary} from "v4-core/libraries/StateLibrary.sol";

contract Reader {
    using StateLibrary for IPoolManager;
    using PoolIdLibrary for PoolKey;

    function read(
        PoolKey memory pool,
        IPoolManager manager,
        int24 lowerTick,
        int24 upperTick,
        uint256 token0Amount,
        uint256 token1Amount
    ) public view returns (uint128 liquidity) {
        // int24 MAX_TICK = TickMath.maxUsableTick(5);
        // int24 MIN_TICK = TickMath.minUsableTick(5);
        uint160 sqrtPriceX96Lower = TickMath.getSqrtPriceAtTick(lowerTick);
        uint160 sqrtPriceX96Upper = TickMath.getSqrtPriceAtTick(upperTick);
        (uint160 sqrtPriceX96, , , ) = manager.getSlot0(pool.toId());

        liquidity = LiquidityAmounts.getLiquidityForAmounts(
            sqrtPriceX96,
            sqrtPriceX96Lower,
            sqrtPriceX96Upper,
            token0Amount,
            token1Amount
        );
    }

    function getSlot0(
        PoolKey memory pool,
        IPoolManager manager
    )
        public
        view
        returns (
            uint160 sqrtPriceX96,
            int24 tick,
            uint24 protocolFee,
            uint24 lpFee
        )
    {
        (sqrtPriceX96, tick, protocolFee, lpFee) = manager.getSlot0(
            pool.toId()
        );
    }

    function getAmountsForLiquidity(
        PoolKey memory pool,
        IPoolManager manager,
        int24 lowerTick,
        int24 upperTick,
        uint128 liquidity
    ) public view returns (uint256 amount0, uint256 amount1) {
        uint160 sqrtPriceX96Lower = TickMath.getSqrtPriceAtTick(lowerTick);
        uint160 sqrtPriceX96Upper = TickMath.getSqrtPriceAtTick(upperTick);
        (uint160 sqrtPriceX96, , , ) = manager.getSlot0(pool.toId());

        (amount0, amount1) = LiquidityAmounts.getAmountsForLiquidity(
            sqrtPriceX96,
            sqrtPriceX96Lower,
            sqrtPriceX96Upper,
            liquidity
        );
    }
}
