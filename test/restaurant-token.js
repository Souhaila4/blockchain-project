const RestaurantRegistry = artifacts.require("RestaurantRegistry");
const RestaurantMarket = artifacts.require("RestaurantMarket");
const RestaurantToken = artifacts.require("RestaurantToken");
const { expectCustomError } = require("./helpers/errors");

const OWN_ONLY = 0;
const PRICE = web3.utils.toWei("0.01", "ether");

contract("RestaurantToken", (accounts) => {
  const [deployer, luna, customer, friend, other] = accounts;

  let registry;
  let market;
  let token;

  const balance = async (account) => (await token.balanceOf(account)).toString();

  beforeEach(async () => {
    registry = await RestaurantRegistry.new({ from: deployer });
    market = await RestaurantMarket.at(await registry.market());

    await registry.registerRestaurant("Cafe Luna", "12 Market Street", "LUNA", OWN_ONLY, [], {
      from: luna
    });
    token = await RestaurantToken.at((await registry.restaurants(luna)).token);

    await market.addItem("Latte", PRICE, 40, { from: luna });
    await market.purchase(luna, 0, 1, { from: customer, value: PRICE });
  });

  describe("who can create and burn points", () => {
    it("only lets the market mint, so nobody can print points by hand", async () => {
      await expectCustomError(token.mint(customer, 10, { from: luna }), "NotMarket(address)");
      await expectCustomError(token.mint(customer, 10, { from: deployer }), "NotMarket(address)");
      await expectCustomError(token.mint(customer, 10, { from: customer }), "NotMarket(address)");
      assert.equal(await balance(customer), "40");
      assert.equal((await token.totalSupply()).toString(), "40");
    });

    it("only lets the market burn, so nobody can take points from a customer", async () => {
      await expectCustomError(
        token.redeem(customer, luna, 10, { from: luna }),
        "NotMarket(address)"
      );
      await expectCustomError(
        token.redeem(customer, luna, 10, { from: customer }),
        "NotMarket(address)"
      );
      assert.equal(await balance(customer), "40");
      assert.equal((await token.redeemedOf(customer)).toString(), "0");
    });

    it("is tied to the market the registry deployed", async () => {
      assert.equal(await token.market(), market.address);
      assert.equal(await token.restaurant(), luna);
    });
  });

  describe("ERC-20 behaviour", () => {
    it("has whole-number points and a readable name", async () => {
      assert.equal(await token.name(), "Cafe Luna Points");
      assert.equal(await token.symbol(), "LUNA");
      assert.equal((await token.decimals()).toString(), "0");
    });

    it("lets holders transfer and approve like any ERC-20", async () => {
      await token.transfer(friend, 10, { from: customer });
      assert.equal(await balance(customer), "30");
      assert.equal(await balance(friend), "10");

      await token.approve(other, 5, { from: friend });
      await token.transferFrom(friend, other, 5, { from: other });
      assert.equal(await balance(friend), "5");
      assert.equal(await balance(other), "5");
    });

    it("lets a wallet that received points spend them on a reward", async () => {
      await market.addReward("Free coffee", 15, { from: luna });
      await token.transfer(friend, 20, { from: customer });

      await market.claimReward(luna, 0, token.address, { from: friend });

      assert.equal(await balance(friend), "5");
      assert.equal((await token.redeemedOf(friend)).toString(), "15");
      assert.equal((await token.redeemedOf(customer)).toString(), "0");
    });
  });
});
