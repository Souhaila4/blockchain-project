const RestaurantRegistry = artifacts.require("RestaurantRegistry");
const RestaurantMarket = artifacts.require("RestaurantMarket");
const RestaurantToken = artifacts.require("RestaurantToken");
const HostileRestaurant = artifacts.require("HostileRestaurant");
const { expectCustomError } = require("./helpers/errors");

const OWN_ONLY = 0;
const ALL = 1;
const SELECTED = 2;

const { toBN, toWei } = web3.utils;
const LATTE = toWei("0.01", "ether");
const SANDWICH = toWei("0.02", "ether");

contract("RestaurantMarket", (accounts) => {
  const [deployer, luna, nori, customer, other] = accounts;

  let registry;
  let market;
  let lunaToken;
  let noriToken;

  const balance = async (token, account) => (await token.balanceOf(account)).toString();
  const ether = async (account) => toBN(await web3.eth.getBalance(account));
  const logOf = (tx, name) => tx.logs.find((log) => log.event === name);

  beforeEach(async () => {
    registry = await RestaurantRegistry.new({ from: deployer });
    market = await RestaurantMarket.at(await registry.market());

    await registry.registerRestaurant("Cafe Luna", "12 Market Street", "LUNA", OWN_ONLY, [], {
      from: luna
    });
    await registry.registerRestaurant("Nori Sushi", "4 Harbor Road", "NORI", OWN_ONLY, [], {
      from: nori
    });
    lunaToken = await RestaurantToken.at((await registry.restaurants(luna)).token);
    noriToken = await RestaurantToken.at((await registry.restaurants(nori)).token);
  });

  it("has no owner or admin functions", async () => {
    const names = market.abi.filter((item) => item.type === "function").map((item) => item.name);

    assert.notInclude(names, "owner");
    assert.notInclude(names, "withdraw");
    assert.notInclude(names, "transferOwnership");
  });

  describe("menu", () => {
    it("lets a restaurant add items, and anyone read them", async () => {
      const first = await market.addItem("Latte", LATTE, 10, { from: luna });
      await market.addItem("Sandwich", SANDWICH, 25, { from: luna });

      const event = logOf(first, "ItemAdded");
      assert.equal(event.args.restaurant, luna);
      assert.equal(event.args.itemId.toString(), "0");
      assert.equal(event.args.name, "Latte");
      assert.equal(event.args.price.toString(), LATTE);
      assert.equal(event.args.points.toString(), "10");

      const items = await market.getItems(luna);
      assert.equal(items.length, 2);
      assert.equal(items[1].name, "Sandwich");
      assert.equal(items[1].price.toString(), SANDWICH);
      assert.equal(items[1].points.toString(), "25");
      assert.equal(items[1].isActive, true);

      assert.equal((await market.getItems(nori)).length, 0);
    });

    it("keeps each restaurant's menu apart", async () => {
      await market.addItem("Latte", LATTE, 10, { from: luna });
      await market.addItem("Maki", SANDWICH, 30, { from: nori });

      assert.equal((await market.getItems(luna))[0].name, "Latte");
      assert.equal((await market.getItems(nori))[0].name, "Maki");
    });

    it("allows an item that earns no points", async () => {
      await market.addItem("Water", LATTE, 0, { from: luna });
      assert.equal((await market.getItems(luna))[0].points.toString(), "0");
    });

    it("rejects wallets that are not restaurants", async () => {
      await expectCustomError(
        market.addItem("Latte", LATTE, 10, { from: customer }),
        "NotRegistered(address)"
      );
      await expectCustomError(market.addReward("Coffee", 10, 0xffffffff, { from: customer }), "NotRegistered(address)");
    });

    it("rejects bad names and prices", async () => {
      await expectCustomError(market.addItem("", LATTE, 10, { from: luna }), "EmptyName()");
      await expectCustomError(
        market.addItem("x".repeat(65), LATTE, 10, { from: luna }),
        "NameTooLong(uint256)"
      );
      await expectCustomError(market.addItem("Latte", 0, 10, { from: luna }), "ZeroPrice()");

      await market.addItem("x".repeat(64), LATTE, 10, { from: luna });
    });

    it("limits the size of a menu", async () => {
      for (let i = 0; i < 50; i += 1) {
        await market.addItem(`Item ${i}`, LATTE, 1, { from: luna });
      }
      await expectCustomError(market.addItem("One more", LATTE, 1, { from: luna }), "TooManyItems()");
      assert.equal((await market.getItems(luna)).length, 50);
    });

    it("lets a restaurant change price and points, and hide an item", async () => {
      await market.addItem("Latte", LATTE, 10, { from: luna });

      const tx = await market.updateItem(0, SANDWICH, 15, false, { from: luna });
      const event = logOf(tx, "ItemUpdated");
      assert.equal(event.args.itemId.toString(), "0");
      assert.equal(event.args.price.toString(), SANDWICH);
      assert.equal(event.args.points.toString(), "15");
      assert.equal(event.args.isActive, false);

      const item = (await market.getItems(luna))[0];
      assert.equal(item.name, "Latte");
      assert.equal(item.price.toString(), SANDWICH);
      assert.equal(item.points.toString(), "15");
      assert.equal(item.isActive, false);
    });

    it("lets a restaurant change only its own items", async () => {
      await market.addItem("Latte", LATTE, 10, { from: luna });

      // Nori has no item 0, and cannot reach Luna's.
      await expectCustomError(
        market.updateItem(0, SANDWICH, 1, true, { from: nori }),
        "UnknownItem(uint256)"
      );
      await expectCustomError(
        market.updateItem(0, SANDWICH, 1, true, { from: customer }),
        "UnknownItem(uint256)"
      );
      await expectCustomError(
        market.updateItem(7, SANDWICH, 1, true, { from: luna }),
        "UnknownItem(uint256)"
      );
      await expectCustomError(market.updateItem(0, 0, 1, true, { from: luna }), "ZeroPrice()");

      assert.equal((await market.getItems(luna))[0].price.toString(), LATTE);
    });
  });

  describe("rewards", () => {
    it("lets a restaurant add and change rewards", async () => {
      const tx = await market.addReward("Free coffee", 100, 0xffffffff, { from: luna });
      const event = logOf(tx, "RewardAdded");
      assert.equal(event.args.restaurant, luna);
      assert.equal(event.args.rewardId.toString(), "0");
      assert.equal(event.args.name, "Free coffee");
      assert.equal(event.args.cost.toString(), "100");

      const update = await market.updateReward(0, 80, 0xffffffff, false, { from: luna });
      assert.equal(logOf(update, "RewardUpdated").args.cost.toString(), "80");

      const reward = (await market.getRewards(luna))[0];
      assert.equal(reward.name, "Free coffee");
      assert.equal(reward.cost.toString(), "80");
      assert.equal(reward.isActive, false);
    });

    it("rejects bad input and other restaurants", async () => {
      await expectCustomError(market.addReward("", 10, 0xffffffff, { from: luna }), "EmptyName()");
      await expectCustomError(
        market.addReward("x".repeat(65), 10, 0xffffffff, { from: luna }),
        "NameTooLong(uint256)"
      );
      await expectCustomError(market.addReward("Free coffee", 0, 0xffffffff, { from: luna }), "ZeroCost()");

      await market.addReward("Free coffee", 100, 0xffffffff, { from: luna });
      await expectCustomError(
        market.updateReward(0, 50, 0xffffffff, true, { from: nori }),
        "UnknownReward(uint256)"
      );
      await expectCustomError(market.updateReward(0, 0, 0xffffffff, true, { from: luna }), "ZeroCost()");
    });

    it("limits the number of rewards", async () => {
      for (let i = 0; i < 50; i += 1) {
        await market.addReward(`Reward ${i}`, 10, 0xffffffff, { from: luna });
      }
      await expectCustomError(market.addReward("One more", 10, 0xffffffff, { from: luna }), "TooManyRewards()");
    });
  });

  describe("purchase", () => {
    beforeEach(async () => {
      await market.addItem("Latte", LATTE, 10, { from: luna });
      await market.addItem("Sandwich", SANDWICH, 25, { from: luna });
    });

    it("pays the restaurant and gives the customer points in one transaction", async () => {
      const before = await ether(luna);

      const tx = await market.purchase(luna, 1, 2, { from: customer, value: toBN(SANDWICH).muln(2) });

      const event = logOf(tx, "Purchased");
      assert.equal(event.args.restaurant, luna);
      assert.equal(event.args.customer, customer);
      assert.equal(event.args.itemId.toString(), "1");
      assert.equal(event.args.quantity.toString(), "2");
      assert.equal(event.args.paid.toString(), toBN(SANDWICH).muln(2).toString());
      assert.equal(event.args.points.toString(), "50");

      assert.equal((await ether(luna)).sub(before).toString(), toBN(SANDWICH).muln(2).toString());
      assert.equal(await balance(lunaToken, customer), "50");
      assert.equal((await lunaToken.totalSupply()).toString(), "50");
    });

    it("never keeps any money in the market", async () => {
      await market.purchase(luna, 0, 3, { from: customer, value: toBN(LATTE).muln(3) });
      assert.equal(await web3.eth.getBalance(market.address), "0");
    });

    it("adds up points over several purchases", async () => {
      await market.purchase(luna, 0, 1, { from: customer, value: LATTE });
      await market.purchase(luna, 1, 1, { from: customer, value: SANDWICH });

      assert.equal(await balance(lunaToken, customer), "35");
    });

    it("gives the points of the restaurant that was bought from", async () => {
      await market.addItem("Maki", LATTE, 7, { from: nori });
      await market.purchase(nori, 0, 1, { from: customer, value: LATTE });

      assert.equal(await balance(noriToken, customer), "7");
      assert.equal(await balance(lunaToken, customer), "0");
    });

    it("still pays when an item earns no points", async () => {
      await market.addItem("Water", LATTE, 0, { from: luna });
      const before = await ether(luna);

      await market.purchase(luna, 2, 1, { from: customer, value: LATTE });

      assert.equal((await ether(luna)).sub(before).toString(), LATTE);
      assert.equal(await balance(lunaToken, customer), "0");
    });

    it("needs exactly the right payment", async () => {
      const total = toBN(LATTE).muln(2);

      await expectCustomError(
        market.purchase(luna, 0, 2, { from: customer, value: LATTE }),
        "WrongPayment(uint256,uint256)"
      );
      await expectCustomError(
        market.purchase(luna, 0, 2, { from: customer, value: total.addn(1) }),
        "WrongPayment(uint256,uint256)"
      );
      await expectCustomError(
        market.purchase(luna, 0, 1, { from: customer, value: 0 }),
        "WrongPayment(uint256,uint256)"
      );
      assert.equal(await balance(lunaToken, customer), "0");
    });

    it("uses the price at the time of purchase", async () => {
      await market.purchase(luna, 0, 1, { from: customer, value: LATTE });

      await market.updateItem(0, SANDWICH, 20, true, { from: luna });
      await expectCustomError(
        market.purchase(luna, 0, 1, { from: customer, value: LATTE }),
        "WrongPayment(uint256,uint256)"
      );
      await market.purchase(luna, 0, 1, { from: customer, value: SANDWICH });

      assert.equal(await balance(lunaToken, customer), "30");
    });

    it("rejects zero quantity, unknown and hidden items", async () => {
      await expectCustomError(
        market.purchase(luna, 0, 0, { from: customer, value: 0 }),
        "ZeroQuantity()"
      );
      await expectCustomError(
        market.purchase(luna, 9, 1, { from: customer, value: LATTE }),
        "UnknownItem(uint256)"
      );
      await expectCustomError(
        market.purchase(other, 0, 1, { from: customer, value: LATTE }),
        "UnknownItem(uint256)"
      );

      await market.updateItem(0, LATTE, 10, false, { from: luna });
      await expectCustomError(
        market.purchase(luna, 0, 1, { from: customer, value: LATTE }),
        "ItemUnavailable(uint256)"
      );

      await market.updateItem(0, LATTE, 10, true, { from: luna });
      await market.purchase(luna, 0, 1, { from: customer, value: LATTE });
    });

    it("stops while the restaurant is paused and resumes afterwards", async () => {
      await registry.setRestaurantStatus(false, { from: luna });
      await expectCustomError(
        market.purchase(luna, 0, 1, { from: customer, value: LATTE }),
        "RestaurantNotActive(address)"
      );

      await registry.setRestaurantStatus(true, { from: luna });
      await market.purchase(luna, 0, 1, { from: customer, value: LATTE });
      assert.equal(await balance(lunaToken, customer), "10");
    });

    it("does not let a restaurant buy from itself", async () => {
      await expectCustomError(
        market.purchase(luna, 0, 1, { from: luna, value: LATTE }),
        "SelfPurchase()"
      );
      assert.equal(await balance(lunaToken, luna), "0");
    });

    it("cannot receive money by accident", async () => {
      await expectRejected(web3.eth.sendTransaction({ from: customer, to: market.address, value: 1 }));
    });
  });

  describe("purchase from a restaurant that is a contract", () => {
    let hostile;
    let hostileToken;

    beforeEach(async () => {
      hostile = await HostileRestaurant.new({ from: deployer });
      await hostile.setUp(registry.address, market.address, LATTE, 5, { from: deployer });
      hostileToken = await RestaurantToken.at((await registry.restaurants(hostile.address)).token);
      await market.addItem("Latte", LATTE, 10, { from: luna });
    });

    it("works when the restaurant accepts the payment", async () => {
      await market.purchase(hostile.address, 0, 1, { from: customer, value: LATTE });

      assert.equal(await web3.eth.getBalance(hostile.address), LATTE);
      assert.equal(await balance(hostileToken, customer), "5");
    });

    it("undoes everything when the restaurant refuses the payment", async () => {
      await hostile.setBehavior(1, other, { from: deployer });

      await expectCustomError(
        market.purchase(hostile.address, 0, 1, { from: customer, value: LATTE }),
        "PaymentFailed()"
      );
      assert.equal(await balance(hostileToken, customer), "0");
      assert.equal((await hostileToken.totalSupply()).toString(), "0");
      assert.equal(await web3.eth.getBalance(market.address), "0");
    });

    it("blocks a restaurant that buys again while it is being paid", async () => {
      await hostile.setBehavior(2, luna, { from: deployer });

      await expectCustomError(
        market.purchase(hostile.address, 0, 1, { from: customer, value: LATTE }),
        "PaymentFailed()"
      );
      assert.equal(await balance(hostileToken, customer), "0");
      assert.equal(await balance(lunaToken, hostile.address), "0");
    });
  });

  describe("rewards: claiming", () => {
    beforeEach(async () => {
      await market.addItem("Latte", LATTE, 60, { from: luna });
      await market.addReward("Free coffee", 100, 0xffffffff, { from: luna });
      await market.addReward("Free dessert", 30, 0xffffffff, { from: luna });
      await market.purchase(luna, 0, 2, { from: customer, value: toBN(LATTE).muln(2) }); // 120 LUNA
    });

    it("burns the points and records the claim", async () => {
      const tx = await market.claimReward(luna, 0, lunaToken.address, 1000000, { from: customer });

      const event = logOf(tx, "RewardClaimed");
      assert.equal(event.args.restaurant, luna);
      assert.equal(event.args.customer, customer);
      assert.equal(event.args.rewardId.toString(), "0");
      assert.equal(event.args.token, lunaToken.address);
      assert.equal(event.args.points.toString(), "100");

      const redeemed = await lunaToken.getPastEvents("Redeemed", {
        fromBlock: tx.receipt.blockNumber,
        toBlock: tx.receipt.blockNumber
      });
      assert.equal(redeemed.length, 1);
      assert.equal(redeemed[0].returnValues.customer, customer);
      assert.equal(redeemed[0].returnValues.atRestaurant, luna);
      assert.equal(redeemed[0].returnValues.points, "100");

      assert.equal(await balance(lunaToken, customer), "20");
      assert.equal((await lunaToken.redeemedOf(customer)).toString(), "100");
      assert.equal((await lunaToken.totalSupply()).toString(), "20");
    });

    it("needs enough points", async () => {
      await market.claimReward(luna, 0, lunaToken.address, 1000000, { from: customer });

      await expectCustomError(
        market.claimReward(luna, 0, lunaToken.address, 1000000, { from: customer }),
        "ERC20InsufficientBalance(address,uint256,uint256)"
      );
      await expectCustomError(
        market.claimReward(luna, 1, lunaToken.address, 1000000, { from: other }),
        "ERC20InsufficientBalance(address,uint256,uint256)"
      );
      assert.equal(await balance(lunaToken, customer), "20");
    });

    it("rejects unknown and hidden rewards", async () => {
      await expectCustomError(
        market.claimReward(luna, 5, lunaToken.address, 1000000, { from: customer }),
        "UnknownReward(uint256)"
      );

      await market.updateReward(1, 30, 0xffffffff, false, { from: luna });
      await expectCustomError(
        market.claimReward(luna, 1, lunaToken.address, 1000000, { from: customer }),
        "RewardUnavailable(uint256)"
      );

      await market.updateReward(1, 30, 0xffffffff, true, { from: luna });
      await market.claimReward(luna, 1, lunaToken.address, 1000000, { from: customer });
      assert.equal(await balance(lunaToken, customer), "90");
    });

    it("uses the cost at the time of the claim", async () => {
      await market.updateReward(0, 50, 0xffffffff, true, { from: luna });
      await market.claimReward(luna, 0, lunaToken.address, 1000000, { from: customer });

      assert.equal(await balance(lunaToken, customer), "70");
    });

    it("is refused for a token the restaurant does not accept", async () => {
      await market.addItem("Maki", LATTE, 40, { from: nori });
      await market.purchase(nori, 0, 1, { from: customer, value: LATTE });

      await expectCustomError(
        market.claimReward(luna, 1, noriToken.address, 1000000, { from: customer }),
        "NotAccepted(address,address)"
      );
      // A token that did not come from our registry is never accepted.
      await expectCustomError(
        market.claimReward(luna, 1, other, 1000000, { from: customer }),
        "NotAccepted(address,address)"
      );
      assert.equal(await balance(noriToken, customer), "40");
    });

    it("accepts a partner's token, and stops when the partner is removed", async () => {
      await market.addItem("Maki", LATTE, 40, { from: nori });
      await market.purchase(nori, 0, 1, { from: customer, value: LATTE });

      await registry.setAcceptanceMode(SELECTED, { from: luna });
      await registry.setPartner(nori, true, { from: luna });
      await market.claimReward(luna, 1, noriToken.address, 1000000, { from: customer });

      assert.equal(await balance(noriToken, customer), "10");
      assert.equal((await noriToken.redeemedOf(customer)).toString(), "30");
      assert.equal(await balance(lunaToken, customer), "120");

      await registry.setPartner(nori, false, { from: luna });
      await expectCustomError(
        market.claimReward(luna, 1, noriToken.address, 1000000, { from: customer }),
        "NotAccepted(address,address)"
      );
    });

    it("accepts any restaurant's token when the policy is all tokens", async () => {
      await market.addItem("Maki", LATTE, 40, { from: nori });
      await market.purchase(nori, 0, 1, { from: customer, value: LATTE });

      await registry.setAcceptanceMode(ALL, { from: luna });
      await market.claimReward(luna, 1, noriToken.address, 1000000, { from: customer });

      assert.equal(await balance(noriToken, customer), "10");
    });

    it("is refused while the restaurant is paused", async () => {
      await registry.setRestaurantStatus(false, { from: luna });
      await expectCustomError(
        market.claimReward(luna, 0, lunaToken.address, 1000000, { from: customer }),
        "NotAccepted(address,address)"
      );

      await registry.setRestaurantStatus(true, { from: luna });
      await market.claimReward(luna, 0, lunaToken.address, 1000000, { from: customer });
    });

    it("still works when the restaurant that issued the points is paused", async () => {
      await market.addItem("Maki", LATTE, 40, { from: nori });
      await market.purchase(nori, 0, 1, { from: customer, value: LATTE });
      await registry.setAcceptanceMode(ALL, { from: luna });
      await registry.setRestaurantStatus(false, { from: nori });

      await market.claimReward(luna, 1, noriToken.address, 1000000, { from: customer });
      assert.equal(await balance(noriToken, customer), "10");
    });
  });

  describe("rewards: stock and claim lifecycle", () => {
    beforeEach(async () => {
      await market.addItem("Latte", LATTE, 60, { from: luna });
      await market.addReward("Free coffee", 100, 1, { from: luna });
      await market.purchase(luna, 0, 3, { from: customer, value: toBN(LATTE).muln(3) }); // 180 LUNA
    });

    it("refuses when the cost is above maxCost", async () => {
      await expectCustomError(
        market.claimReward(luna, 0, lunaToken.address, 99, { from: customer }),
        "PriceTooHigh(uint256,uint256)"
      );
    });

    it("runs out of stock and creates a pending claim", async () => {
      const tx = await market.claimReward(luna, 0, lunaToken.address, 100, { from: customer });
      assert.equal(logOf(tx, "RewardClaimed").args.claimId.toString(), "0");
      const claim = await market.getClaim(0);
      assert.equal(claim.status.toString(), "0");
      assert.equal((await market.getCustomerClaims(customer)).ids.length, 1);
      await expectCustomError(
        market.claimReward(luna, 0, lunaToken.address, 100, { from: customer }),
        "OutOfStock(uint256)"
      );
    });

    it("lets only the restaurant fulfill, once", async () => {
      await market.claimReward(luna, 0, lunaToken.address, 100, { from: customer });
      await expectCustomError(market.fulfill(0, { from: customer }), "NotClaimRestaurant(uint256,address)");
      await market.fulfill(0, { from: luna });
      assert.equal((await market.getClaim(0)).status.toString(), "1");
      await expectCustomError(market.fulfill(0, { from: luna }), "ClaimNotPending(uint256)");
      await expectCustomError(market.cancel(0, { from: luna }), "ClaimNotPending(uint256)");
      await expectCustomError(market.getClaim(7), "UnknownClaim(uint256)");
    });

    it("cancels: refunds the points and restores the stock", async () => {
      await market.claimReward(luna, 0, lunaToken.address, 100, { from: customer });
      await expectCustomError(market.cancel(0, { from: other }), "NotCancelAllowed(uint256,address)");
      const tx = await market.cancel(0, { from: luna });
      assert.equal(logOf(tx, "ClaimCancelled").args.cancelledBy, luna);
      assert.equal(await balance(lunaToken, customer), "180");
      assert.equal((await lunaToken.redeemedOf(customer)).toString(), "0");
      assert.equal((await market.getRewards(luna))[0].stock.toString(), "1");
      assert.equal((await market.getClaim(0)).status.toString(), "2");
    });

    it("only lets the market refund", async () => {
      await expectCustomError(
        lunaToken.refund(customer, luna, 1, { from: customer }),
        "NotMarket(address)"
      );
    });
  });
});

async function expectRejected(promise) {
  try {
    await promise;
  } catch (error) {
    return;
  }
  throw new Error("expected the transaction to be rejected");
}
