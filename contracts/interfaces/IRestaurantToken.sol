// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @notice What the market can do to a restaurant token. Only the market is allowed to call these.
interface IRestaurantToken {
    /// @notice Creates `points` for `to`.
    function mint(address to, uint256 points) external;

    /// @notice Burns `points` of `customer`, spent at `atRestaurant`.
    function redeem(address customer, address atRestaurant, uint256 points) external;

    /// @notice Gives back `points` to `customer` after a cancelled claim. Undoes a `redeem`.
    function refund(address customer, address atRestaurant, uint256 points) external;
}
