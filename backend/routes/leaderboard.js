// routes/leaderboard.js — Leaderboard
const express = require("express");
const router  = express.Router();
const db      = require("../db");

// Get top 10 players by net profit
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM leaderboard LIMIT 10"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;