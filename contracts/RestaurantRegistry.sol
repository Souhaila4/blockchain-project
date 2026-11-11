// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IRestaurantRegistry} from "./interfaces/IRestaurantRegistry.sol";
import {RestaurantMarket} from "./RestaurantMarket.sol";
import {RestaurantToken} from "./RestaurantToken.sol";

/// @title RestaurantRegistry
/// @notice Open registry. A wallet registers itself as a restaurant, once, and gets its own ERC-20 token.
///         The restaurant also decides which other restaurants' tokens it accepts as rewards payment.
/// @dev There is no owner and no admin. This contract is the factory for every RestaurantToken, and it
///      deploys the one RestaurantMarket in its constructor, so tokens and market are tied together from
///      the first block and nobody has to wire them up afterwards.
///      It does not hold ether and never calls a token after creating it.
contract RestaurantRegistry is IRestaurantRegistry {
    /// @notice Which tokens a restaurant accepts. Its own token is always accepted.
    enum AcceptanceMode {
        OwnTokenOnly,
        AllTokens,
        SelectedPartners
    }

    /// @notice On-chain record for one restaurant.
    /// @dev `token`, `isActive` and `mode` share one storage slot. Keep them adjacent.
    ///      `isActive` is only ever true for a registered restaurant.
    struct Restaurant {
        string name;
        string location;
        RestaurantToken token;
        bool isActive;
        AcceptanceMode mode;
    }

    /// @notice Maximum `name` length, in bytes.
    uint256 public constant MAX_NAME_LENGTH = 128;

    /// @notice Maximum `location` length, in bytes.
    uint256 public constant MAX_LOCATION_LENGTH = 256;

    /// @notice Maximum token `symbol` length, in bytes.
    uint256 public constant MAX_SYMBOL_LENGTH = 11;

    /// @notice The market where restaurants publish menus and rewards, and customers buy and claim.
    ///         It is the only account that can mint and burn restaurant tokens.
    address public immutable market;

    /// @notice Restaurant records, keyed by the restaurant account.
    mapping(address restaurant => Restaurant) public restaurants;

    /// @notice The restaurant that issued `token`. Zero for any address that is not one of our tokens.
    mapping(address token => address restaurant) public issuerOf;

    /// @notice True when `restaurant` accepts the token of `partner`. Only used in `SelectedPartners` mode.
    mapping(address restaurant => mapping(address partner => bool accepted)) public partners;

    event RestaurantRegistered(
        address indexed restaurantAddress,
        address indexed token,
        string name,
        string location,
        AcceptanceMode mode
    );

    event RestaurantStatusUpdated(address indexed restaurantAddress, bool isActive);

    event AcceptanceModeUpdated(address indexed restaurantAddress, AcceptanceMode mode);

    event PartnerUpdated(address indexed restaurantAddress, address indexed partner, bool accepted);

    error EmptyName();
    error EmptyLocation();
    error EmptySymbol();
    error NameTooLong(uint256 length);
    error LocationTooLong(uint256 length);
    error SymbolTooLong(uint256 length);
    error AlreadyRegistered(address restaurant);
    error NotRegistered(address restaurant);
    error StatusUnchanged(address restaurant, bool isActive);
    error ModeUnchanged(AcceptanceMode mode);
    error PartnersNeedSelectedMode();
    error SelfPartner();
    error PartnerUnchanged(address partner, bool accepted);

    constructor() {
        market = address(new RestaurantMarket(this));
    }

    /// @notice Registers the caller as a restaurant, creates its ERC-20 token, and marks it active.
    /// @dev Registration is permanent for the caller. Name, location and token cannot change afterwards.
    ///      The restaurant list is read from `RestaurantRegistered` events, not from storage.
    ///      The new token's constructor makes no external calls, so there is no reentrancy path.
    /// @param name Non-empty name, at most `MAX_NAME_LENGTH` bytes. The token is called "<name> Points".
    /// @param location Non-empty location, at most `MAX_LOCATION_LENGTH` bytes.
    /// @param symbol Token symbol, 1 to `MAX_SYMBOL_LENGTH` bytes.
    /// @param mode Which tokens the restaurant accepts.
    /// @param selectedPartners Restaurants whose tokens are accepted. Only allowed with `SelectedPartners`.
    function registerRestaurant(
        string calldata name,
        string calldata location,
        string calldata symbol,
        AcceptanceMode mode,
        address[] calldata selectedPartners
    ) external {
        _validateMetadata(name, location, symbol);
        if (selectedPartners.length != 0 && mode != AcceptanceMode.SelectedPartners) {
            revert PartnersNeedSelectedMode();
        }

        Restaurant storage restaurant = restaurants[msg.sender];
        if (address(restaurant.token) != address(0)) revert AlreadyRegistered(msg.sender);

        RestaurantToken token = new RestaurantToken(
            string.concat(name, " Points"),
            symbol,
            msg.sender,
            market
        );

        restaurant.name = name;
        restaurant.location = location;
        restaurant.token = token;
        restaurant.isActive = true;
        restaurant.mode = mode;
        issuerOf[address(token)] = msg.sender;

        emit RestaurantRegistered(msg.sender, address(token), name, location, mode);

        for (uint256 i = 0; i < selectedPartners.length; ++i) {
            _setPartner(msg.sender, selectedPartners[i], true);
        }
    }

    /// @notice Lets a registered restaurant pause or resume itself.
    /// @dev A paused restaurant cannot sell, and does not accept any token for its rewards.
    ///      Reverts when the status already matches, so storage is not rewritten and no event is emitted.
    function setRestaurantStatus(bool isActive) external {
        Restaurant storage restaurant = _registered(msg.sender);
        if (restaurant.isActive == isActive) revert StatusUnchanged(msg.sender, isActive);

        restaurant.isActive = isActive;

        emit RestaurantStatusUpdated(msg.sender, isActive);
    }

    /// @notice Changes which tokens the caller accepts.
    function setAcceptanceMode(AcceptanceMode mode) external {
        Restaurant storage restaurant = _registered(msg.sender);
        if (restaurant.mode == mode) revert ModeUnchanged(mode);

        restaurant.mode = mode;

        emit AcceptanceModeUpdated(msg.sender, mode);
    }

    /// @notice Adds or removes `partner` from the restaurants whose token the caller accepts.
    /// @dev The list is stored even when the mode is not `SelectedPartners`, but only counts in that mode.
    function setPartner(address partner, bool accepted) external {
        _registered(msg.sender);
        _setPartner(msg.sender, partner, accepted);
    }

    /// @inheritdoc IRestaurantRegistry
    /// @dev Reads one packed slot. A memory copy of `Restaurant` would also load `name` and `location`.
    function tokenOf(address restaurantAddress) external view returns (address token, bool isActive) {
        Restaurant storage restaurant = restaurants[restaurantAddress];
        return (address(restaurant.token), restaurant.isActive);
    }

    /// @inheritdoc IRestaurantRegistry
    /// @dev Reads one packed slot. A memory copy of `Restaurant` would also load `name` and `location`.
    function isAuthorizedRestaurant(address restaurantAddress) external view returns (bool) {
        return restaurants[restaurantAddress].isActive;
    }

    /// @inheritdoc IRestaurantRegistry
    /// @dev A restaurant always accepts its own token. Tokens not created by this registry are never accepted.
    function acceptsToken(address restaurantAddress, address token) external view returns (bool) {
        Restaurant storage restaurant = restaurants[restaurantAddress];
        if (!restaurant.isActive) return false;

        address issuer = issuerOf[token];
        if (issuer == address(0)) return false;
        if (issuer == restaurantAddress) return true;

        AcceptanceMode mode = restaurant.mode;
        if (mode == AcceptanceMode.AllTokens) return true;
        return mode == AcceptanceMode.SelectedPartners && partners[restaurantAddress][issuer];
    }

    function _registered(address restaurantAddress) private view returns (Restaurant storage restaurant) {
        restaurant = restaurants[restaurantAddress];
        if (address(restaurant.token) == address(0)) revert NotRegistered(restaurantAddress);
    }

    function _setPartner(address restaurantAddress, address partner, bool accepted) private {
        if (partner == restaurantAddress) revert SelfPartner();
        if (address(restaurants[partner].token) == address(0)) revert NotRegistered(partner);
        if (partners[restaurantAddress][partner] == accepted) revert PartnerUnchanged(partner, accepted);

        partners[restaurantAddress][partner] = accepted;

        emit PartnerUpdated(restaurantAddress, partner, accepted);
    }

    /// @dev Length is read from calldata and does not copy the strings.
    function _validateMetadata(
        string calldata name,
        string calldata location,
        string calldata symbol
    ) private pure {
        uint256 nameLength = bytes(name).length;
        if (nameLength == 0) revert EmptyName();
        if (nameLength > MAX_NAME_LENGTH) revert NameTooLong(nameLength);

        uint256 locationLength = bytes(location).length;
        if (locationLength == 0) revert EmptyLocation();
        if (locationLength > MAX_LOCATION_LENGTH) revert LocationTooLong(locationLength);

        uint256 symbolLength = bytes(symbol).length;
        if (symbolLength == 0) revert EmptySymbol();
        if (symbolLength > MAX_SYMBOL_LENGTH) revert SymbolTooLong(symbolLength);
    }
}
