// contract.js — Smart contract connection
const { ethers } = require("ethers");
require("dotenv").config();

const ABI = [
  "function deposit() payable",
  "function withdraw(uint256 tokenAmount)",
  "function balanceOf(address) view returns (uint256)",
  "function createRace() returns (uint256)",
  "function closeRace(uint256 raceId)",
  "function finishRace(uint256 raceId, uint8 winningHorse)",
  "function placeBet(uint256 raceId, uint8 horse, uint256 tokenAmount)",
  "function claimWinnings(uint256 raceId)",
  "function getRace(uint256 raceId) view returns (uint256, uint8, uint8, uint256, uint256[7])",
  "function getBet(uint256 raceId, address player, uint8 horse) view returns (uint256)",
  "function raceCount() view returns (uint256)",
  "event RaceCreated(uint256 indexed raceId)",
  "event BetPlaced(uint256 indexed raceId, address indexed player, uint8 horse, uint256 amount)",
  "event RaceFinished(uint256 indexed raceId, uint8 winningHorse)",
];

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  ABI,
  wallet
);

module.exports = { contract, provider, wallet };