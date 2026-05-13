// src/config.js
export const CONFIG = {
  CONTRACT_ADDRESS: "0x9b11008F5054c95C247344d587610Bcba448E247",
  BACKEND_URL: "https://rip-mini-twisted-discussion.trycloudflare.com",
  CHAIN_ID: 11155111,
  ABI: [
    "function deposit() payable",
    "function withdraw(uint256 tokenAmount)",
    "function balanceOf(address) view returns (uint256)",
    "function placeBet(uint256 raceId, uint8 horse, uint256 tokenAmount)",
    "function claimWinnings(uint256 raceId)",
    "function getRace(uint256 raceId) view returns (uint256, uint8, uint8, uint256, uint256[7])",
    "function getBet(uint256 raceId, address player, uint8 horse) view returns (uint256)",
  ],
};