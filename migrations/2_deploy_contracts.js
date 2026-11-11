const RestaurantRegistry = artifacts.require("RestaurantRegistry");

module.exports = async function (deployer) {
  await deployer.deploy(RestaurantRegistry);
};