// routes/players.js — Player registration and profiles
const express = require("express");
const router  = express.Router();
const db      = require("../db");

// Register or login a player by wallet address
router.post("/register", async (req, res) => {
  const { wallet, username } = req.body;
  if (!wallet || !username) {
    return res.status(400).json({ error: "Wallet and username required" });
  }
  try {
    // Check if player already exists
    const [existing] = await db.query(
      "SELECT * FROM players WHERE wallet = ?",
      [wallet.toLowerCase()]
    );
    if (existing.length > 0) {
      // Update last seen and return player
      await db.query(
        "UPDATE players SET last_seen = NOW() WHERE wallet = ?",
        [wallet.toLowerCase()]
      );
      return res.json({ player: existing[0], new: false });
    }
    // Create new player
    const [result] = await db.query(
      "INSERT INTO players (wallet, username) VALUES (?, ?)",
      [wallet.toLowerCase(), username]
    );
    const [newPlayer] = await db.query(
      "SELECT * FROM players WHERE id = ?",
      [result.insertId]
    );
    return res.json({ player: newPlayer[0], new: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get a player by wallet address
router.get("/:wallet", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM players WHERE wallet = ?",
      [req.params.wallet.toLowerCase()]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Player not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Record a bet in MySQL
router.post("/bet", async (req, res) => {
  const { wallet, race_id, horse_number, amount } = req.body;
  if (!wallet || !race_id || !horse_number || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    // Get player id
    const [players] = await db.query(
      "SELECT * FROM players WHERE wallet = ?",
      [wallet.toLowerCase()]
    );
    if (players.length === 0) {
      return res.status(404).json({ error: "Player not found" });
    }
    const player = players[0];

    // Insert bet
    await db.query(
      "INSERT INTO bets (race_id, player_id, horse_number, amount) VALUES (?, ?, ?, ?)",
      [race_id, player.id, horse_number, amount]
    );

    // Update player total bets
    await db.query(
      "UPDATE players SET total_bets = total_bets + 1 WHERE id = ?",
      [player.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Update player stats after race finishes
router.post("/stats", async (req, res) => {
  const { wallet, won, earned, lost } = req.body;
  if (!wallet) {
    return res.status(400).json({ error: "Wallet required" });
  }
  try {
    await db.query(
      `UPDATE players SET
        total_wins    = total_wins + ?,
        total_earned  = total_earned + ?,
        total_lost    = total_lost + ?,
        last_seen     = NOW()
      WHERE wallet = ?`,
      [won ? 1 : 0, earned || 0, lost || 0, wallet.toLowerCase()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;