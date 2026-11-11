// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IRestaurantRegistry} from "./interfaces/IRestaurantRegistry.sol";
import {IRestaurantToken} from "./interfaces/IRestaurantToken.sol";

/// @title RestaurantMarket
/// @notice Where customers buy from restaurants and turn points into rewards.
///         Each restaurant keeps a menu (what it sells, the price, the points a purchase earns)
///         and a list of rewards (what points can be spent on, and how many).
/// @dev Deployed once by RestaurantRegistry, so there is no owner and no setup step.
///      Payments are in the chain's native coin and go straight to the restaurant: this contract never
///      holds funds. Points are minted to the buyer in the same transaction as the payment.
///      Menu entries are never deleted, only hidden, so ids stay stable and old events stay meaningful.
contract RestaurantMarket is ReentrancyGuard {
    /// @notice One thing a restaurant sells.
    /// @dev `price`, `points` and `isActive` share one storage slot. Keep them adjacent.
    struct Item {
        string name;
        /// @dev In wei, for one unit.
        uint128 price;
        /// @dev Points earned for one unit.
        uint64 points;
        bool isActive;
    }

    /// @notice One thing a customer can get by spending points.
    /// @dev `cost` and `isActive` share one storage slot. Keep them adjacent.
    struct Reward {
        string name;
        /// @dev In points of any token the restaurant accepts.
        uint64 cost;
        bool isActive;
    }

    /// @notice Most menu items one restaurant can have. Keeps `getItems` cheap to read.
    uint256 public constant MAX_ITEMS = 50;

    /// @notice Most rewards one restaurant can have.
    uint256 public constant MAX_REWARDS = 50;

    /// @notice Maximum item or reward name length, in bytes.
    uint256 public constant MAX_NAME_LENGTH = 64;

    /// @notice The registry that knows the restaurants and their tokens.
    IRestaurantRegistry public immutable registry;

    mapping(address restaurant => Item[]) private _items;
    mapping(address restaurant => Reward[]) private _rewards;

    event ItemAdded(
        address indexed restaurant,
        uint256 indexed itemId,
        string name,
        uint128 price,
        uint64 points
    );
    event ItemUpdated(
        address indexed restaurant,
        uint256 indexed itemId,
        uint128 price,
        uint64 points,
        bool isActive
    );
    event RewardAdded(address indexed restaurant, uint256 indexed rewardId, string name, uint64 cost);
    event RewardUpdated(
        address indexed restaurant,
        uint256 indexed rewardId,
        uint64 cost,
        bool isActive
    );
    event Purchased(
        address indexed restaurant,
        address indexed customer,
        uint256 indexed itemId,
        uint256 quantity,
        uint256 paid,
        uint256 points
    );
    event RewardClaimed(
        address indexed restaurant,
        address indexed customer,
        uint256 indexed rewardId,
        address token,
        uint256 points
    );

    error NotRegistered(address account);
    error EmptyName();
    error NameTooLong(uint256 length);
    error ZeroPrice();
    error ZeroCost();
    error TooManyItems();
    error TooManyRewards();
    error UnknownItem(uint256 itemId);
    error UnknownReward(uint256 rewardId);
    error ItemUnavailable(uint256 itemId);
    error RewardUnavailable(uint256 rewardId);
    error ZeroQuantity();
    error SelfPurchase();
    error RestaurantNotActive(address restaurant);
    error WrongPayment(uint256 sent, uint256 expected);
    error PaymentFailed();
    error NotAccepted(address restaurant, address token);

    constructor(IRestaurantRegistry registry_) {
        registry = registry_;
    }

    // ---------------------------------------------------------------------------------------------
    // Menu and rewards: restaurants only
    // ---------------------------------------------------------------------------------------------

    /// @notice Adds an item to the caller's menu. It starts available.
    /// @param name Non-empty, at most `MAX_NAME_LENGTH` bytes. Cannot be changed later.
    /// @param price Price of one unit in wei. Must not be zero.
    /// @param points Points a customer earns per unit. Zero is allowed (an item that earns nothing).
    function addItem(string calldata name, uint128 price, uint64 points) external {
        _requireRegistered(msg.sender);
        _validateName(name);
        if (price == 0) revert ZeroPrice();

        Item[] storage items = _items[msg.sender];
        uint256 itemId = items.length;
        if (itemId >= MAX_ITEMS) revert TooManyItems();

        items.push(Item({name: name, price: price, points: points, isActive: true}));

        emit ItemAdded(msg.sender, itemId, name, price, points);
    }

    /// @notice Changes the price, the points, or the availability of one of the caller's items.
    /// @dev A hidden item cannot be bought. Past purchases are not affected.
    function updateItem(uint256 itemId, uint128 price, uint64 points, bool isActive) external {
        if (price == 0) revert ZeroPrice();

        Item storage item = _item(msg.sender, itemId);
        item.price = price;
        item.points = points;
        item.isActive = isActive;

        emit ItemUpdated(msg.sender, itemId, price, points, isActive);
    }

    /// @notice Adds a reward to the caller's list. It starts available.
    /// @param name Non-empty, at most `MAX_NAME_LENGTH` bytes. Cannot be changed later.
    /// @param cost Points needed to claim it. Must not be zero.
    function addReward(string calldata name, uint64 cost) external {
        _requireRegistered(msg.sender);
        _validateName(name);
        if (cost == 0) revert ZeroCost();

        Reward[] storage rewards = _rewards[msg.sender];
        uint256 rewardId = rewards.length;
        if (rewardId >= MAX_REWARDS) revert TooManyRewards();

        rewards.push(Reward({name: name, cost: cost, isActive: true}));

        emit RewardAdded(msg.sender, rewardId, name, cost);
    }

    /// @notice Changes the cost or the availability of one of the caller's rewards.
    function updateReward(uint256 rewardId, uint64 cost, bool isActive) external {
        if (cost == 0) revert ZeroCost();

        Reward storage reward = _reward(msg.sender, rewardId);
        reward.cost = cost;
        reward.isActive = isActive;

        emit RewardUpdated(msg.sender, rewardId, cost, isActive);
    }

    // ---------------------------------------------------------------------------------------------
    // Customers
    // ---------------------------------------------------------------------------------------------

    /// @notice Buys `quantity` of an item. Send exactly `price * quantity` wei.
    /// @dev The payment is forwarded to the restaurant and the points are minted to the caller.
    ///      Reverts, and so mints nothing, when the restaurant cannot receive the payment.
    ///      A restaurant cannot buy from itself: that would only mint points for free.
    ///      This does not stop one person from using a second wallet. What points are worth to other
    ///      restaurants is controlled by the acceptance policy of those restaurants.
    function purchase(address restaurant, uint256 itemId, uint256 quantity) external payable nonReentrant {
        if (quantity == 0) revert ZeroQuantity();
        if (msg.sender == restaurant) revert SelfPurchase();

        Item storage item = _item(restaurant, itemId);
        if (!item.isActive) revert ItemUnavailable(itemId);

        (address token, bool isActive) = registry.tokenOf(restaurant);
        if (!isActive) revert RestaurantNotActive(restaurant);

        uint256 total = uint256(item.price) * quantity;
        if (msg.value != total) revert WrongPayment(msg.value, total);

        uint256 points = uint256(item.points) * quantity;
        if (points != 0) IRestaurantToken(token).mint(msg.sender, points);

        (bool paid, ) = restaurant.call{value: total}("");
        if (!paid) revert PaymentFailed();

        emit Purchased(restaurant, msg.sender, itemId, quantity, total, points);
    }

    /// @notice Spends points on a reward of `restaurant`. The points are burned.
    /// @param token The token to pay with. It must be accepted by `restaurant` right now.
    function claimReward(address restaurant, uint256 rewardId, address token) external {
        Reward storage reward = _reward(restaurant, rewardId);
        if (!reward.isActive) revert RewardUnavailable(rewardId);
        if (!registry.acceptsToken(restaurant, token)) revert NotAccepted(restaurant, token);

        uint256 cost = reward.cost;
        IRestaurantToken(token).redeem(msg.sender, restaurant, cost);

        emit RewardClaimed(restaurant, msg.sender, rewardId, token, cost);
    }

    // ---------------------------------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------------------------------

    /// @notice Every item of `restaurant`, hidden ones included. The index is the item id.
    function getItems(address restaurant) external view returns (Item[] memory) {
        return _items[restaurant];
    }

    /// @notice Every reward of `restaurant`, hidden ones included. The index is the reward id.
    function getRewards(address restaurant) external view returns (Reward[] memory) {
        return _rewards[restaurant];
    }

    // ---------------------------------------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------------------------------------

    function _requireRegistered(address account) private view {
        (address token, ) = registry.tokenOf(account);
        if (token == address(0)) revert NotRegistered(account);
    }

    function _item(address restaurant, uint256 itemId) private view returns (Item storage) {
        Item[] storage items = _items[restaurant];
        if (itemId >= items.length) revert UnknownItem(itemId);
        return items[itemId];
    }

    function _reward(address restaurant, uint256 rewardId) private view returns (Reward storage) {
        Reward[] storage rewards = _rewards[restaurant];
        if (rewardId >= rewards.length) revert UnknownReward(rewardId);
        return rewards[rewardId];
    }

    /// @dev Length is read from calldata and does not copy the string.
    function _validateName(string calldata name) private pure {
        uint256 length = bytes(name).length;
        if (length == 0) revert EmptyName();
        if (length > MAX_NAME_LENGTH) revert NameTooLong(length);
    }
}
