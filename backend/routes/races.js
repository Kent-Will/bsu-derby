// routes/races.js — Race management
const express  = require("express");
const router   = express.Router();
const db       = require("../db");
const { contract } = require("../contract");

// Get all races
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM races ORDER BY created_at DESC LIMIT 20"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Get a single race with its horses
router.get("/:id", async (req, res) => {
  try {
    const [races] = await db.query(
      "SELECT * FROM races WHERE id = ?",
      [req.params.id]
    );
    if (races.length === 0) {
      return res.status(404).json({ error: "Race not found" });
    }
    const [horses] = await db.query(
      "SELECT * FROM horses WHERE race_id = ? ORDER BY horse_number",
      [req.params.id]
    );
    res.json({ race: races[0], horses });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Get current open race
router.get("/current/open", async (req, res) => {
  try {
    const [races] = await db.query(
      "SELECT * FROM races WHERE status = 'open' ORDER BY created_at DESC LIMIT 1"
    );
    if (races.length === 0) {
      return res.json({ race: null });
    }
    const [horses] = await db.query(
      "SELECT * FROM horses WHERE race_id = ? ORDER BY horse_number",
      [races[0].id]
    );
    res.json({ race: races[0], horses });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;