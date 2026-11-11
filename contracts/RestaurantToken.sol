// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IRestaurantToken} from "./interfaces/IRestaurantToken.sol";

/// @title RestaurantToken
/// @notice Loyalty token of one restaurant. Customers earn it by buying from that restaurant
///         and spend it on rewards at any restaurant whose policy accepts it.
/// @dev Deployed by RestaurantRegistry, one per restaurant. Whole points only (0 decimals).
///      Nobody can mint or burn directly: only the RestaurantMarket can, as part of a purchase or a reward.
///      Spent tokens are burned, so `totalSupply` is the amount of points still outstanding.
///      `Redeemed` records which restaurant honored them, for settlement between restaurants.
contract RestaurantToken is ERC20, IRestaurantToken {
    /// @notice The restaurant that issues this token.
    address public immutable restaurant;

    /// @notice The only account that can mint and burn this token.
    address public immutable market;

    /// @notice Total points `customer` has already spent, at any restaurant.
    mapping(address customer => uint256 points) public redeemedOf;

    event Redeemed(address indexed customer, address indexed atRestaurant, uint256 points);
    event Refunded(address indexed customer, address indexed atRestaurant, uint256 points);

    error NotMarket(address caller);

    modifier onlyMarket() {
        if (msg.sender != market) revert NotMarket(msg.sender);
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        address restaurant_,
        address market_
    ) ERC20(name_, symbol_) {
        restaurant = restaurant_;
        market = market_;
    }

    /// @inheritdoc IRestaurantToken
    function mint(address to, uint256 points) external onlyMarket {
        _mint(to, points);
    }

    /// @inheritdoc IRestaurantToken
    /// @dev Reverts with the ERC-20 error when `customer` holds fewer than `points`.
    function redeem(address customer, address atRestaurant, uint256 points) external onlyMarket {
        _burn(customer, points);
        redeemedOf[customer] += points;

        emit Redeemed(customer, atRestaurant, points);
    }

    /// @inheritdoc IRestaurantToken
    /// @dev Mints the points back and lowers `redeemedOf`. Only the market can call it, and it only
    ///      does so for a claim that was still pending.
    function refund(address customer, address atRestaurant, uint256 points) external onlyMarket {
        _mint(customer, points);
        redeemedOf[customer] -= points;

        emit Refunded(customer, atRestaurant, points);
    }

    /// @notice Points are whole numbers.
    function decimals() public pure override returns (uint8) {
        return 0;
    }
}
