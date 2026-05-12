// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// ============================================================
//  BSU Derby — Blockchain Horse Racing
//  Capstone Project | Bowie State University
// ============================================================
contract BSUDerby is ERC20 {

    // ── CONSTANTS ───────────────────────────────────────────
    uint256 public constant RATE = 100000; // 1 ETH = 100,000 BSUD tokens
    uint256 public constant MAX_HORSES = 6;

    // ── STATE ───────────────────────────────────────────────
    address public owner;
    uint256 public raceCount;

    enum RaceStatus { Open, Closed, Finished }

    struct Race {
        uint256 id;
        RaceStatus status;
        uint8 winningHorse;        // 1-6, set after race finishes
        uint256 totalPool;         // total tokens bet in this race
        uint256[7] horsePools;     // tokens bet per horse (index 1-6)
    }

    // raceId => Race
    mapping(uint256 => Race) public races;

    // raceId => player address => horse number => amount bet
    mapping(uint256 => mapping(address => mapping(uint8 => uint256))) public bets;

    // raceId => list of bettors
    mapping(uint256 => address[]) private bettors;

    // raceId => player => has claimed
    mapping(uint256 => mapping(address => bool)) public claimed;

    // ── EVENTS ──────────────────────────────────────────────
    event RaceCreated(uint256 indexed raceId);
    event BetPlaced(uint256 indexed raceId, address indexed player, uint8 horse, uint256 amount);
    event RaceClosed(uint256 indexed raceId);
    event RaceFinished(uint256 indexed raceId, uint8 winningHorse);
    event WinningsClaimed(uint256 indexed raceId, address indexed player, uint256 amount);
    event Deposited(address indexed player, uint256 ethAmount, uint256 tokenAmount);
    event Withdrawn(address indexed player, uint256 tokenAmount, uint256 ethAmount);

    // ── MODIFIERS ───────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier raceExists(uint256 raceId) {
        require(raceId > 0 && raceId <= raceCount, "Race does not exist");
        _;
    }

    // ── CONSTRUCTOR ─────────────────────────────────────────
    constructor() ERC20("BSU Derby Token", "BSUD") {
        owner = msg.sender;
    }

    // ── DEPOSIT: ETH -> Tokens ───────────────────────────────
    function deposit() external payable {
        require(msg.value > 0, "No ETH sent");
        uint256 tokens = msg.value * RATE;
        _mint(msg.sender, tokens);
        emit Deposited(msg.sender, msg.value, tokens);
    }

    // ── WITHDRAW: Tokens -> ETH ──────────────────────────────
    function withdraw(uint256 tokenAmount) external {
        require(balanceOf(msg.sender) >= tokenAmount, "Not enough tokens");
        uint256 ethAmount = tokenAmount / RATE;
        require(address(this).balance >= ethAmount, "Not enough ETH in contract");
        _burn(msg.sender, tokenAmount);
        payable(msg.sender).transfer(ethAmount);
        emit Withdrawn(msg.sender, tokenAmount, ethAmount);
    }

    // ── RACE MANAGEMENT (owner only) ─────────────────────────

    // Create a new race and open betting
    function createRace() external onlyOwner returns (uint256) {
        raceCount++;
        races[raceCount].id = raceCount;
        races[raceCount].status = RaceStatus.Open;
        emit RaceCreated(raceCount);
        return raceCount;
    }

    // Close betting for a race (called before race starts)
    function closeRace(uint256 raceId) external onlyOwner raceExists(raceId) {
        require(races[raceId].status == RaceStatus.Open, "Race is not open");
        races[raceId].status = RaceStatus.Closed;
        emit RaceClosed(raceId);
    }

    // Declare the winning horse and finish the race
    function finishRace(uint256 raceId, uint8 winningHorse)
        external
        onlyOwner
        raceExists(raceId)
    {
        require(races[raceId].status == RaceStatus.Closed, "Race is not closed");
        require(winningHorse >= 1 && winningHorse <= MAX_HORSES, "Invalid horse number");
        races[raceId].status = RaceStatus.Finished;
        races[raceId].winningHorse = winningHorse;
        emit RaceFinished(raceId, winningHorse);
    }

    // ── BETTING ─────────────────────────────────────────────
    function placeBet(uint256 raceId, uint8 horse, uint256 tokenAmount)
        external
        raceExists(raceId)
    {
        require(races[raceId].status == RaceStatus.Open, "Betting is closed");
        require(horse >= 1 && horse <= MAX_HORSES, "Invalid horse number");
        require(tokenAmount > 0, "Bet must be greater than zero");
        require(balanceOf(msg.sender) >= tokenAmount, "Not enough tokens");

        // Transfer tokens from player to contract
        _transfer(msg.sender, address(this), tokenAmount);

        // Track if this is a new bettor
        if (bets[raceId][msg.sender][horse] == 0) {
            bettors[raceId].push(msg.sender);
        }

        bets[raceId][msg.sender][horse] += tokenAmount;
        races[raceId].horsePools[horse] += tokenAmount;
        races[raceId].totalPool += tokenAmount;

        emit BetPlaced(raceId, msg.sender, horse, tokenAmount);
    }

    // ── CLAIM WINNINGS ───────────────────────────────────────
    function claimWinnings(uint256 raceId) external raceExists(raceId) {
        require(races[raceId].status == RaceStatus.Finished, "Race not finished");
        require(!claimed[raceId][msg.sender], "Already claimed");

        uint8 winner = races[raceId].winningHorse;
        uint256 playerBet = bets[raceId][msg.sender][winner];
        require(playerBet > 0, "No winning bet");

        claimed[raceId][msg.sender] = true;

        uint256 winningPool = races[raceId].horsePools[winner];
        uint256 totalPool   = races[raceId].totalPool;

        // Payout = (player's bet / total winning pool) * total pool
        uint256 payout = (playerBet * totalPool) / winningPool;

        _transfer(address(this), msg.sender, payout);
        emit WinningsClaimed(raceId, msg.sender, payout);
    }

    // ── VIEW FUNCTIONS ───────────────────────────────────────
    function getRace(uint256 raceId)
        external
        view
        raceExists(raceId)
        returns (
            uint256 id,
            uint8 status,
            uint8 winningHorse,
            uint256 totalPool,
            uint256[7] memory horsePools
        )
    {
        Race storage r = races[raceId];
        return (r.id, uint8(r.status), r.winningHorse, r.totalPool, r.horsePools);
    }

    function getBet(uint256 raceId, address player, uint8 horse)
        external
        view
        returns (uint256)
    {
        return bets[raceId][player][horse];
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ── FUND CONTRACT ────────────────────────────────────────
    function fundContract() external payable onlyOwner {
        require(msg.value > 0, "No ETH sent");
    }

    receive() external payable {}
}