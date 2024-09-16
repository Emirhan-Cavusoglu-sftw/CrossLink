// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {PoolManager} from "v4-core/PoolManager.sol";
import {PoolSwapTest} from "v4-core/Test/PoolSwapTest.sol";
import {PoolModifyLiquidityTest} from "v4-core/Test/PoolModifyLiquidityTest.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {Nezlobin} from "../../src/Nezlobin.sol";

import {HookMiner} from "../../test/HookMiner.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";

contract DeployNezlobinHook is Script {
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
            Hooks.BEFORE_INITIALIZE_FLAG | Hooks.BEFORE_SWAP_FLAG
        );

        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            type(Nezlobin).creationCode,
            abi.encode(address(0xbb46AB4ecC82166Be4d34f5a79992e582d14206a))
        );
        Nezlobin hook = new Nezlobin{salt: salt}(
            IPoolManager(address(0xbb46AB4ecC82166Be4d34f5a79992e582d14206a))
        );
        console.log("Hook address: %s", address(hook));

        vm.stopBroadcast();
    }
}
