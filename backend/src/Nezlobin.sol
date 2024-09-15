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
    error MustUseDynamicFee();
    IPoolManager public manager;
    uint256 public constant SCALE = 1000;
    uint256 public constant k = 1; // Ücretin volatiliteye duyarlılığını belirler
    uint24 public constant BASE_FEE = 3000; // 0.03%
    uint24 public constant MIN_FEE = 500; // 0.005%
    uint24 public constant MAX_LP_FEE = 900000;

    mapping(PoolId => uint256[]) public poolTickDifferences;
    mapping(PoolId => uint256) public poolToTimeStamp;
    mapping(PoolId => int24) public poolToTick;

    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {
        manager = _poolManager;
    }

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
        PoolId poolId = PoolIdLibrary.toId(key);
        int24 currentTick = getCurrentTick(key);
        int24 previousTick = poolToTick[poolId];
        int24 tickDifference = currentTick - previousTick;

        // tickDifference'ı int256'ya dönüştürüyoruz
        int256 tickDiff = int256(tickDifference);

        // Mutlak değerini alıyoruz ve uint256'ya dönüştürüyoruz
        uint256 absTickDifference = tickDiff >= 0 ? uint256(tickDiff) : uint256(-tickDiff);

        // Tick farkını kaydediyoruz
        poolTickDifferences[poolId].push(absTickDifference);

        // Varyansı hesaplıyoruz
        uint256 variance = calculateVariance(poolTickDifferences[poolId]);

        // Ücreti hesaplıyoruz
        uint256 sqrtVariance = sqrt(variance);
        uint256 newFee_temp = (uint256(BASE_FEE) * (SCALE + k * sqrtVariance)) / SCALE;
        uint24 newFee = uint24(Math.min(newFee_temp, uint256(MAX_LP_FEE)));

        // Ücreti güncelliyoruz
        poolManager.updateDynamicLPFee(key, newFee);
        poolToTick[poolId] = currentTick;

        return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    // Yardımcı Fonksiyonlar
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

    // Varyans hesaplama fonksiyonu
    function calculateVariance(uint256[] storage data) internal view returns (uint256) {
        uint256 sum = 0;
        uint256 squaresSum = 0;
        uint256 n = data.length;

        // Sadece son N değeri kullanabilirsiniz, örneğin son 10 değer
        uint256 m = n >= 10 ? 10 : n;
        uint256 start = n >= m ? n - m : 0;

        for (uint256 i = start; i < n; i++) {
            sum += data[i];
            squaresSum += data[i] * data[i];
        }

        if (m == 0) {
            return 0;
        }

        uint256 mean = sum / m;
        uint256 variance = (squaresSum / m) - (mean * mean);
        return variance;
    }

    // Karekök fonksiyonu
    function sqrt(uint y) internal pure returns (uint z) {
        if (y == 0) return 0;
        else if (y <= 3) return 1;
        uint x = y / 2 + 1;
        z = y;
        while (x < z) {
            z = x;
            x = (y / x + x) / 2;
        }
    }
}