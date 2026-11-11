// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IRegistryLike {
    function registerRestaurant(
        string calldata name,
        string calldata location,
        string calldata symbol,
        uint8 mode,
        address[] calldata selectedPartners
    ) external;
}

interface IMarketLike {
    function addItem(string calldata name, uint128 price, uint64 points) external;

    function purchase(address restaurant, uint256 itemId, uint256 quantity) external payable;
}

/// @dev Test helper only. A restaurant that is a contract and misbehaves when it is paid.
contract HostileRestaurant {
    enum Behavior {
        Accept,
        Refuse,
        Reenter
    }

    Behavior public behavior;
    IMarketLike public market;
    address public victim;

    function setUp(
        IRegistryLike registry,
        IMarketLike market_,
        uint128 price,
        uint64 points
    ) external {
        market = market_;
        registry.registerRestaurant("Hostile", "Nowhere", "EVIL", 0, new address[](0));
        market_.addItem("Poison", price, points);
    }

    function setBehavior(Behavior behavior_, address victim_) external {
        behavior = behavior_;
        victim = victim_;
    }

    receive() external payable {
        if (behavior == Behavior.Refuse) revert("no thanks");
        // Try to buy again, from another restaurant, while the first purchase is still running.
        if (behavior == Behavior.Reenter) market.purchase{value: msg.value}(victim, 0, 1);
    }
}
