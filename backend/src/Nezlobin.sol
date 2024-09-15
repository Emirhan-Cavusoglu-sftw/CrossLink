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
import {Math} from "v4-periphery/lib/permit2/lib/openzeppelin-contracts/contracts/utils/math/Math.sol";

contract Nezlobin is BaseHook {
    using LPFeeLibrary for uint24;
    uint256 public counter = 3;
    error MustUseDynamicFee();
    IPoolManager public manager;
    uint256 public constant SCALE = 1000;
    uint256 public constant MULTIPLIER = 750; // 0.75
    uint24 public constant BASE_FEE = 3000; // 0.03%
    uint24 public constant MIN_FEE = 500; // 0.005%
    uint24 public constant MAX_LP_FEE = 900000;

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

    function getCurrentFee(PoolKey calldata key) public view returns (uint24) {
        PoolId id = PoolIdLibrary.toId(key);
        (, , , uint24 fee) = StateLibrary.getSlot0(manager, id);
        return fee;
    }

    function calculateDynamicFee(
        PoolKey calldata pool,
        uint24 delta,
        IPoolManager.SwapParams calldata params
    ) public view returns (uint24) {
        uint24 currentFee = getCurrentFee(pool);
        if (currentFee == 0) currentFee = BASE_FEE;

        uint256 c_temp = (MULTIPLIER * uint256(currentFee)) / SCALE;
        uint24 c = uint24(Math.min(c_temp, uint256(type(uint24).max)));

        uint256 beta_temp = uint256(c) * uint256(delta);
        uint24 beta = uint24(Math.min(beta_temp, uint256(MAX_LP_FEE)));

        uint24 newFee;
        if (!params.zeroForOne) {
            uint256 newFee_temp = BASE_FEE + beta;
            newFee = uint24(Math.min(newFee_temp, uint256(MAX_LP_FEE)));
        } else {
            if (beta >= BASE_FEE) {
                newFee = MIN_FEE;
            } else {
                uint256 newFee_temp = BASE_FEE - beta;
                newFee = uint24(Math.max(newFee_temp, uint256(MIN_FEE)));
            }
        }

        return newFee;
    }
}
