// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {PoolManager} from "v4-core/PoolManager.sol";
import {PoolSwapTest} from "v4-core/Test/PoolSwapTest.sol";
import {PoolModifyLiquidityTest} from "v4-core/Test/PoolModifyLiquidityTest.sol";

import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
contract DeployManager is Script {
    IPoolManager public poolManager;
    function run() external {
        vm.startBroadcast(); 
        poolManager= new PoolManager();
        PoolSwapTest poolSwapTest = new PoolSwapTest(IPoolManager(address(poolManager)));
        PoolModifyLiquidityTest poolLiq = new PoolModifyLiquidityTest(IPoolManager(address(poolManager)));
        
        vm.stopBroadcast();

        console.log("PoolManager address: %s", address(poolManager));
        console.log("PoolSwapTest address: %s", address(poolSwapTest));
        console.log("PoolModifyLiquidityTest address: %s", address(poolLiq));
    }
}
