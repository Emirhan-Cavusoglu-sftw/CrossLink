// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {PoolManager} from "v4-core/PoolManager.sol";
import {PoolSwapTest} from "v4-core/Test/PoolSwapTest.sol";

import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockERC20} from "solmate/src/test/utils/mocks/MockERC20.sol";
import {Reader} from "../../src/Reader.sol";
contract DeployReader is Script {
    function run() external {
        vm.startBroadcast();

        Reader reader = new Reader();
        console.log("Reader deployed at:", address(reader));
        vm.stopBroadcast();
    }
}
