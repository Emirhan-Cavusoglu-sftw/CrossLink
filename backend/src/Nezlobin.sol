// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {BaseHook} from "v4-periphery/src/base/hooks/BaseHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";
import {LPFeeLibrary} from "v4-core/libraries/LPFeeLibrary.sol";
import {FullMath} from "v4-core/libraries/FullMath.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/types/BeforeSwapDelta.sol";
import {StateLibrary} from "v4-core/libraries/StateLibrary.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";

contract Nezlobin is BaseHook {
    using LPFeeLibrary for uint24;
    uint256 public counter = 3;
    error MustUseDynamicFee();
    IPoolManager public manager;
    uint24 public constant SCALE = 1000;
    uint24 public constant MULTIPLIER = 750; // 0.75
    uint24 public constant BASE_FEE = 3000; // 0.03%
    uint24 public constant MIN_FEE = 500; // 0.005%
    uint24 public constant MAX_FEE = 1000000; // 10%
    mapping(PoolId => uint256) public poolToTimeStamp;
    mapping(PoolId => int24) public poolToTick;

    // Initialize BaseHook parent contract in the constructor
    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {
        manager = _poolManager;
    }

    // Required override function for BaseHook to let the PoolManager know which hooks are implemented
    function getHookPermissions()
        public
        pure
        override
        returns (Hooks.Permissions memory)
    {
        return
            Hooks.Permissions({
                beforeInitialize: true,
                afterInitialize: false,
                beforeAddLiquidity: false,
                beforeRemoveLiquidity: false,
                afterAddLiquidity: false,
                afterRemoveLiquidity: false,
                beforeSwap: true,
                afterSwap: false,
                beforeDonate: false,
                afterDonate: false,
                beforeSwapReturnDelta: false,
                afterSwapReturnDelta: false,
                afterAddLiquidityReturnDelta: false,
                afterRemoveLiquidityReturnDelta: false
            });
    }

    function beforeInitialize(
        address,
        PoolKey calldata key,
        uint160,
        bytes calldata
    ) external override returns (bytes4) {
        if (!key.fee.isDynamicFee()) revert MustUseDynamicFee();
        poolToTimeStamp[PoolIdLibrary.toId(key)] = block.timestamp;
        return this.beforeInitialize.selector;
    }

    function beforeSwap(
        address,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        bytes calldata
    )
        external
        override
        onlyPoolManager
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        if (block.timestamp - poolToTimeStamp[PoolIdLibrary.toId(key)] > 1) {
            poolToTimeStamp[PoolIdLibrary.toId(key)] = block.timestamp;
            int24 currentTick = getCurrentTick(key);
            int24 tickDeltaSigned = currentTick -
                poolToTick[PoolIdLibrary.toId(key)];
            uint24 tickDelta = tickDeltaSigned >= 0
                ? uint24(tickDeltaSigned)
                : uint24(int24(-tickDeltaSigned));
            if (tickDelta == 0) {
                return (
                    this.beforeSwap.selector,
                    BeforeSwapDeltaLibrary.ZERO_DELTA,
                    0
                );
            }
            uint24 newFee = calculateDynamicFee(key, tickDelta, params);

            poolManager.updateDynamicLPFee(key, newFee);
            poolToTick[PoolIdLibrary.toId(key)] = currentTick;
        }
        return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    // Helper Functions
    function getCurrentTick(PoolKey calldata key) public view returns (int24) {
        PoolId id = PoolIdLibrary.toId(key);
        (, int24 tick, , ) = StateLibrary.getSlot0(manager, id);
        return tick;
    }

    function calculateDynamicFee(
        PoolKey calldata pool,
        uint24 delta,
        IPoolManager.SwapParams calldata params
    ) public pure returns (uint24) {
        uint24 c = (MULTIPLIER * BASE_FEE) / (delta * SCALE);
        uint24 beta = c * delta;

        if (!params.zeroForOne) {
            uint24 newFee = beta + BASE_FEE;
            if (newFee > MAX_FEE) {
                return MAX_FEE;
            }
            return newFee;
        } else {
            // Check to avoid underflow
            if (beta > BASE_FEE) {
                return MIN_FEE;
            }
            uint24 newFee = BASE_FEE - beta;
            return newFee;
        }
    }

    
}
