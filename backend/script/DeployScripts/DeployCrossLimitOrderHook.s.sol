// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {PoolManager} from "v4-core/PoolManager.sol";
import {PoolSwapTest} from "v4-core/Test/PoolSwapTest.sol";
import {PoolModifyLiquidityTest} from "v4-core/Test/PoolModifyLiquidityTest.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {CrossLimitOrder} from "../../src/CrossLimitOrder.sol";

import {HookMiner} from "../../test/HookMiner.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";

contract DeployCrossLimitOrderHook is Script {
    address constant CREATE2_DEPLOYER =
        address(0x4e59b44847b379578588920cA78FbF26c0B4956C);

    function run() external {
        vm.startBroadcast();

        // NEZLOBIN FLAGS
        // uint160 flags = uint160(
        //     Hooks.BEFORE_INITIALIZE_FLAG | Hooks.BEFORE_SWAP_FLAG
        // );

        // Limit order Flags
        uint160 flags = uint160(
            Hooks.AFTER_INITIALIZE_FLAG | Hooks.AFTER_SWAP_FLAG
        );

        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            type(CrossLimitOrder).creationCode,
            abi.encode(address(0xbb46AB4ecC82166Be4d34f5a79992e582d14206a),"",0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59,0x779877A7B0D9E8603169DdbD7836e478b4624789,16015286601757825753)
        );
        CrossLimitOrder hook = new CrossLimitOrder{salt: salt}(
            IPoolManager(address(0xbb46AB4ecC82166Be4d34f5a79992e582d14206a)),"",0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59,0x779877A7B0D9E8603169DdbD7836e478b4624789,16015286601757825753
        );
        console.log("Hook address: %s", address(hook));

        vm.stopBroadcast();
    }
}
