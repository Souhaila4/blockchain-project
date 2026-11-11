const RestaurantRegistry = artifacts.require("RestaurantRegistry");
const RestaurantToken = artifacts.require("RestaurantToken");
const { expectCustomError, expectRevert } = require("./helpers/errors");

const ZERO = "0x0000000000000000000000000000000000000000";
const OWN_ONLY = 0;
const ALL = 1;
const SELECTED = 2;

contract("RestaurantRegistry", (accounts) => {
  const [deployer, luna, nori, basil, other] = accounts;

  let registry;

  async function register(from, name = "Cafe Luna", symbol = "LUNA", mode = OWN_ONLY, picks = []) {
    return registry.registerRestaurant(name, "12 Market Street", symbol, mode, picks, { from });
  }

  beforeEach(async () => {
    registry = await RestaurantRegistry.new({ from: deployer });
  });

  it("has no owner or admin functions", async () => {
    const names = registry.abi.filter((item) => item.type === "function").map((item) => item.name);

    assert.notInclude(names, "owner");
    assert.notInclude(names, "transferOwnership");
    assert.notInclude(names, "acceptOwnership");
  });

  it("deploys the market that is wired to it, with no setup step", async () => {
    const RestaurantMarket = artifacts.require("RestaurantMarket");
    const market = await RestaurantMarket.at(await registry.market());

    assert.equal(await market.registry(), registry.address);
  });

  describe("registration", () => {
    it("lets any wallet register itself and creates its ERC-20 token", async () => {
      const tx = await register(luna);

      const stored = await registry.restaurants(luna);
      assert.equal(stored.name, "Cafe Luna");
      assert.equal(stored.location, "12 Market Street");
      assert.equal(stored.isActive, true);
      assert.equal(stored.mode.toString(), String(OWN_ONLY));
      assert.notEqual(stored.token, ZERO);

      assert.equal(tx.logs[0].event, "RestaurantRegistered");
      assert.equal(tx.logs[0].args.restaurantAddress, luna);
      assert.equal(tx.logs[0].args.token, stored.token);
      assert.equal(tx.logs[0].args.name, "Cafe Luna");
      assert.equal(tx.logs[0].args.location, "12 Market Street");

      const token = await RestaurantToken.at(stored.token);
      assert.equal(await token.name(), "Cafe Luna Points");
      assert.equal(await token.symbol(), "LUNA");
      assert.equal((await token.decimals()).toString(), "0");
      assert.equal((await token.totalSupply()).toString(), "0");
      assert.equal(await token.restaurant(), luna);
      assert.equal(await token.market(), await registry.market());

      assert.equal(await registry.issuerOf(stored.token), luna);
      assert.equal(await registry.isAuthorizedRestaurant(luna), true);
    });

    it("reports a restaurant's token and status in one call", async () => {
      assert.deepEqual(Object.values(await registry.tokenOf(other)).slice(0, 2), [ZERO, false]);

      await register(luna);
      const token = (await registry.restaurants(luna)).token;
      let result = await registry.tokenOf(luna);
      assert.equal(result.token, token);
      assert.equal(result.isActive, true);

      await registry.setRestaurantStatus(false, { from: luna });
      result = await registry.tokenOf(luna);
      assert.equal(result.token, token);
      assert.equal(result.isActive, false);
    });

    it("gives each restaurant its own token", async () => {
      await register(luna);
      await register(nori, "Nori Sushi", "NORI");

      const lunaToken = (await registry.restaurants(luna)).token;
      const noriToken = (await registry.restaurants(nori)).token;
      assert.notEqual(lunaToken, noriToken);
      assert.equal(await registry.issuerOf(noriToken), nori);
    });

    it("stores selected partners given at creation", async () => {
      await register(luna);
      const tx = await register(nori, "Nori Sushi", "NORI", SELECTED, [luna]);

      assert.equal(await registry.partners(nori, luna), true);
      const events = tx.logs.map((log) => log.event);
      assert.deepEqual(events, ["RestaurantRegistered", "PartnerUpdated"]);
      assert.equal(tx.logs[1].args.partner, luna);
    });

    it("rejects bad input", async () => {
      await expectCustomError(register(luna, ""), "EmptyName()");
      await expectCustomError(
        registry.registerRestaurant("Cafe", "", "LUNA", OWN_ONLY, [], { from: luna }),
        "EmptyLocation()"
      );
      await expectCustomError(register(luna, "Cafe", ""), "EmptySymbol()");
      await expectCustomError(register(luna, "a".repeat(129)), "NameTooLong(uint256)");
      await expectCustomError(
        registry.registerRestaurant("Cafe", "b".repeat(257), "LUNA", OWN_ONLY, [], { from: luna }),
        "LocationTooLong(uint256)"
      );
      await expectCustomError(register(luna, "Cafe", "S".repeat(12)), "SymbolTooLong(uint256)");

      await register(luna, "a".repeat(128), "S".repeat(11));
    });

    it("rejects a second restaurant for the same wallet", async () => {
      await register(luna);
      await expectCustomError(register(luna, "Other", "OTHR"), "AlreadyRegistered(address)");
    });

    it("rejects invalid partner lists", async () => {
      await register(nori, "Nori Sushi", "NORI");

      await expectCustomError(
        register(luna, "Cafe Luna", "LUNA", ALL, [nori]),
        "PartnersNeedSelectedMode()"
      );
      await expectCustomError(
        register(luna, "Cafe Luna", "LUNA", SELECTED, [luna]),
        "SelfPartner()"
      );
      await expectCustomError(
        register(luna, "Cafe Luna", "LUNA", SELECTED, [other]),
        "NotRegistered(address)"
      );
      await expectCustomError(
        register(luna, "Cafe Luna", "LUNA", SELECTED, [nori, nori]),
        "PartnerUnchanged(address,bool)"
      );
    });

    it("rejects plain ether transfers", async () => {
      await expectRevert(web3.eth.sendTransaction({ from: deployer, to: registry.address, value: 1 }));
    });
  });

  describe("status", () => {
    it("lets a restaurant pause and resume itself", async () => {
      await expectCustomError(
        registry.setRestaurantStatus(false, { from: luna }),
        "NotRegistered(address)"
      );

      await register(luna);

      const tx = await registry.setRestaurantStatus(false, { from: luna });
      assert.equal(tx.logs[0].event, "RestaurantStatusUpdated");
      assert.equal(tx.logs[0].args.isActive, false);
      assert.equal(await registry.isAuthorizedRestaurant(luna), false);
      assert.equal((await registry.restaurants(luna)).isActive, false);

      await expectCustomError(
        registry.setRestaurantStatus(false, { from: luna }),
        "StatusUnchanged(address,bool)"
      );

      await registry.setRestaurantStatus(true, { from: luna });
      assert.equal(await registry.isAuthorizedRestaurant(luna), true);
    });

    it("gives the deployer and other wallets no control over a restaurant", async () => {
      await register(luna);

      await expectCustomError(
        registry.setRestaurantStatus(false, { from: deployer }),
        "NotRegistered(address)"
      );
      assert.equal(await registry.isAuthorizedRestaurant(luna), true);
    });

    it("keeps a paused restaurant registered", async () => {
      await register(luna);
      await registry.setRestaurantStatus(false, { from: luna });

      await expectCustomError(register(luna, "Other", "OTHR"), "AlreadyRegistered(address)");
    });

    it("reports unknown wallets as not authorized", async () => {
      assert.equal(await registry.isAuthorizedRestaurant(other), false);
      assert.equal(await registry.isAuthorizedRestaurant(ZERO), false);
    });
  });

  describe("acceptance policy", () => {
    it("changes the mode and rejects a repeat", async () => {
      await expectCustomError(
        registry.setAcceptanceMode(ALL, { from: luna }),
        "NotRegistered(address)"
      );

      await register(luna);

      const tx = await registry.setAcceptanceMode(ALL, { from: luna });
      assert.equal(tx.logs[0].event, "AcceptanceModeUpdated");
      assert.equal(tx.logs[0].args.mode.toString(), String(ALL));
      assert.equal((await registry.restaurants(luna)).mode.toString(), String(ALL));

      await expectCustomError(registry.setAcceptanceMode(ALL, { from: luna }), "ModeUnchanged(uint8)");
    });

    it("adds and removes partners", async () => {
      await register(luna);
      await register(nori, "Nori Sushi", "NORI");

      await expectCustomError(
        registry.setPartner(nori, true, { from: other }),
        "NotRegistered(address)"
      );
      await expectCustomError(registry.setPartner(luna, true, { from: luna }), "SelfPartner()");
      await expectCustomError(
        registry.setPartner(other, true, { from: luna }),
        "NotRegistered(address)"
      );
      await expectCustomError(
        registry.setPartner(nori, false, { from: luna }),
        "PartnerUnchanged(address,bool)"
      );

      const added = await registry.setPartner(nori, true, { from: luna });
      assert.equal(added.logs[0].event, "PartnerUpdated");
      assert.equal(added.logs[0].args.restaurantAddress, luna);
      assert.equal(added.logs[0].args.partner, nori);
      assert.equal(added.logs[0].args.accepted, true);
      assert.equal(await registry.partners(luna, nori), true);
      assert.equal(await registry.partners(nori, luna), false);

      await expectCustomError(
        registry.setPartner(nori, true, { from: luna }),
        "PartnerUnchanged(address,bool)"
      );

      await registry.setPartner(nori, false, { from: luna });
      assert.equal(await registry.partners(luna, nori), false);
    });

    it("decides which tokens a restaurant accepts", async () => {
      await register(luna);
      await register(nori, "Nori Sushi", "NORI");
      await register(basil, "Basil Bar", "BASL");

      const lunaToken = (await registry.restaurants(luna)).token;
      const noriToken = (await registry.restaurants(nori)).token;
      const basilToken = (await registry.restaurants(basil)).token;
      const accepts = (restaurant, token) => registry.acceptsToken(restaurant, token);

      // Own token only: always its own token, nobody else's.
      assert.equal(await accepts(luna, lunaToken), true);
      assert.equal(await accepts(luna, noriToken), false);

      // Selected partners: only the ones it lists.
      await registry.setAcceptanceMode(SELECTED, { from: luna });
      await registry.setPartner(nori, true, { from: luna });
      assert.equal(await accepts(luna, lunaToken), true);
      assert.equal(await accepts(luna, noriToken), true);
      assert.equal(await accepts(luna, basilToken), false);

      // A partner list does not count outside the selected mode.
      await registry.setAcceptanceMode(OWN_ONLY, { from: luna });
      assert.equal(await accepts(luna, noriToken), false);

      // All tokens: every token this registry created.
      await registry.setAcceptanceMode(ALL, { from: luna });
      assert.equal(await accepts(luna, noriToken), true);
      assert.equal(await accepts(luna, basilToken), true);

      // Acceptance is one way. Nori never agreed to take Luna's token.
      assert.equal(await accepts(nori, lunaToken), false);

      // Addresses that are not tokens made here are never accepted.
      assert.equal(await accepts(luna, other), false);
      assert.equal(await accepts(luna, ZERO), false);

      // A paused restaurant accepts nothing, not even its own token.
      await registry.setRestaurantStatus(false, { from: luna });
      assert.equal(await accepts(luna, lunaToken), false);
      assert.equal(await accepts(luna, noriToken), false);

      // An unknown restaurant accepts nothing.
      assert.equal(await accepts(other, lunaToken), false);
    });
  });
});
