const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("BSUDerbyModule", (m) => {
  const bsuDerby = m.contract("BSUDerby");
  return { bsuDerby };
});