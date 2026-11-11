// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @notice What the market needs to know from the registry that created it.
interface IRestaurantRegistry {
    /// @notice The token of `restaurantAddress` and whether it is active. The token is zero when not registered.
    function tokenOf(address restaurantAddress) external view returns (address token, bool isActive);

    /// @notice True when `restaurantAddress` is registered and active.
    function isAuthorizedRestaurant(address restaurantAddress) external view returns (bool);

    /// @notice True when `restaurantAddress` is active and currently accepts `token` as payment.
    function acceptsToken(address restaurantAddress, address token) external view returns (bool);
}
