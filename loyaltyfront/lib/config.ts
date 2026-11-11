/** Network and contract settings. Update the registry values after every `truffle migrate --reset`. */

export const CHAIN_ID = 1337;
export const CHAIN_ID_HEX = "0x539";
export const CHAIN_NAME = "LoyalChain Local";
export const RPC_URL = "http://127.0.0.1:7545";

/** What customers pay with: the native coin of the chain. Prices on the menu are in this currency. */
export const CURRENCY = "ETH";

/**
 * The only contract we deploy. It creates every restaurant token and the market (menus, purchases,
 * rewards). The market address is read from `registry.market()`, so there is nothing else to configure.
 */
export const REGISTRY_ADDRESS = "0x2D8BE6BF0baA74e0A907016679CaE9190e80dD0A";

/** Block the registry was deployed in. Restaurant and market events are read from here. */
export const REGISTRY_DEPLOY_BLOCK = 132;

/** Must match RestaurantRegistry.MAX_NAME_LENGTH, MAX_LOCATION_LENGTH and MAX_SYMBOL_LENGTH (bytes). */
export const MAX_NAME_LENGTH = 128;
export const MAX_LOCATION_LENGTH = 256;
export const MAX_SYMBOL_LENGTH = 11;

/** Must match RestaurantMarket.MAX_NAME_LENGTH (bytes), MAX_ITEMS and MAX_REWARDS. */
export const MAX_ITEM_NAME_LENGTH = 64;
export const MAX_ITEMS = 50;
export const MAX_REWARDS = 50;
