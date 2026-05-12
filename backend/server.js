// server.js — Main backend server
const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const cors       = require("cors");
require("dotenv").config();

const db                = require("./db");
const { contract }      = require("./contract");
const playersRouter     = require("./routes/players");
const racesRouter       = require("./routes/races");
const leaderboardRouter = require("./routes/leaderboard");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

// ── ROUTES ───────────────────────────────────────────────────
app.use("/api/players",     playersRouter);
app.use("/api/races",       racesRouter);
app.use("/api/leaderboard", leaderboardRouter);

app.get("/", (req, res) => {
  res.json({ status: "BSU Derby backend is running 🏇" });
});

// ── RACE ENGINE ──────────────────────────────────────────────
async function getRandomHorseNames() {
  const [rows] = await db.query(
    "SELECT name FROM horse_names ORDER BY RAND() LIMIT 6"
  );
  return rows.map(r => r.name);
}

const HORSE_COLORS = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
];

async function createNewRace() {
  try {
    console.log("Creating new race...");

    // Create race on smart contract
    const tx      = await contract.createRace();
    const receipt = await tx.wait();

    // Get raceId from event
    const event = receipt.logs
      .map(log => {
        try { return contract.interface.parseLog(log); }
        catch { return null; }
      })
      .find(e => e && e.name === "RaceCreated");

    const contractRaceId = event ? Number(event.args.raceId) : Date.now();

    // Get random horse names
    const horseNames = await getRandomHorseNames();

    // Insert race into MySQL
    const [result] = await db.query(
      "INSERT INTO races (contract_race_id, status, race_name) VALUES (?, 'open', ?)",
      [contractRaceId, `BSU Derby Race #${contractRaceId}`]
    );
    const raceId = result.insertId;

    // Insert horses into MySQL
    for (let i = 0; i < 6; i++) {
      await db.query(
        "INSERT INTO horses (race_id, horse_number, name, color, odds) VALUES (?, ?, ?, ?, ?)",
        [raceId, i + 1, horseNames[i], HORSE_COLORS[i], (Math.random() * 3 + 1.5).toFixed(2)]
      );
    }

    // Get full race with horses
    const [races]  = await db.query("SELECT * FROM races WHERE id = ?", [raceId]);
    const [horses] = await db.query(
      "SELECT * FROM horses WHERE race_id = ? ORDER BY horse_number",
      [raceId]
    );

    console.log(`Race #${contractRaceId} created!`);

    // Notify all connected players
    io.emit("race:new", { race: races[0], horses });

    return { race: races[0], horses, contractRaceId };
  } catch (err) {
    console.error("Error creating race:", err);
  }
}

async function runRace(raceId, contractRaceId) {
  try {
    console.log(`Running race ${raceId}...`);

    // Close betting on-chain
    const closeTx = await contract.closeRace(contractRaceId);
    await closeTx.wait();

    // Update MySQL
    await db.query(
      "UPDATE races SET status = 'closed', started_at = NOW() WHERE id = ?",
      [raceId]
    );

    // Notify players betting is closed
    io.emit("race:started", { raceId });

    // Race simulation
    const positions = [0, 0, 0, 0, 0, 0];
    const speeds    = Array.from({ length: 6 }, () => Math.random() * 2 + 1);

    const raceInterval = setInterval(async () => {
      for (let i = 0; i < 6; i++) {
        const variation = (Math.random() - 0.4) * 2;
        positions[i] = Math.min(100, positions[i] + speeds[i] + variation);
      }

      // Send positions to all players
      io.emit("race:update", { raceId, positions: [...positions] });

      // Check if any horse finished
      if (positions.some(p => p >= 100)) {
        clearInterval(raceInterval);

        let winnerIndex   = positions.indexOf(Math.max(...positions));
        const winningHorse = winnerIndex + 1;

        const finalPositions = positions.map(p => Math.min(100, p));
        finalPositions[winnerIndex] = 100;

        // Finish race on-chain
        const finishTx = await contract.finishRace(contractRaceId, winningHorse);
        await finishTx.wait();

        // Update MySQL race
        await db.query(
          "UPDATE races SET status = 'finished', winning_horse = ?, finished_at = NOW() WHERE id = ?",
          [winningHorse, raceId]
        );

        // Update winning bets
        await db.query(
          "UPDATE bets SET won = TRUE WHERE race_id = ? AND horse_number = ?",
          [raceId, winningHorse]
        );

        // Update player stats for winners
        const [winningBets] = await db.query(
          "SELECT * FROM bets WHERE race_id = ? AND won = TRUE",
          [raceId]
        );
        for (const bet of winningBets) {
          await db.query(
            "UPDATE players SET total_wins = total_wins + 1 WHERE id = ?",
            [bet.player_id]
          );
        }

        // Update player stats for losers
        const [losingBets] = await db.query(
          "SELECT * FROM bets WHERE race_id = ? AND won = FALSE",
          [raceId]
        );
        for (const bet of losingBets) {
          await db.query(
            "UPDATE players SET total_lost = total_lost + ? WHERE id = ?",
            [bet.amount, bet.player_id]
          );
        }

        const [horses] = await db.query(
          "SELECT * FROM horses WHERE race_id = ?",
          [raceId]
        );

        console.log(`Race ${raceId} finished! Winner: Horse #${winningHorse}`);

        // Notify all players
        io.emit("race:finished", {
          raceId,
          winningHorse,
          positions: finalPositions,
          horses,
        });

        // Start new race after 30 seconds
        setTimeout(async () => {
          const result = await createNewRace();
          if (result) startRaceCycle(result.race.id, result.contractRaceId);
        }, 30000);
      }
    }, 500);

  } catch (err) {
    console.error("Error running race:", err);
  }
}

function startRaceCycle(raceId, contractRaceId) {
  console.log(`Betting open for race ${raceId} — 30 seconds...`);
  io.emit("race:betting", { raceId, timeLeft: 30 });

  let timeLeft = 30;
  const countdown = setInterval(() => {
    timeLeft--;
    io.emit("race:countdown", { raceId, timeLeft });
    if (timeLeft <= 0) {
      clearInterval(countdown);
      runRace(raceId, contractRaceId);
    }
  }, 1000);
}

// ── SOCKET.IO ────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // Send current open race to newly connected player
  db.query(
    "SELECT * FROM races WHERE status = 'open' ORDER BY created_at DESC LIMIT 1"
  ).then(([races]) => {
    if (races.length > 0) {
      db.query(
        "SELECT * FROM horses WHERE race_id = ? ORDER BY horse_number",
        [races[0].id]
      ).then(([horses]) => {
        socket.emit("race:current", { race: races[0], horses });
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
  });
});

// ── START SERVER ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  console.log(`BSU Derby backend running on port ${PORT} 🏇`);

  try {
    const [openRaces] = await db.query(
      "SELECT * FROM races WHERE status = 'open' ORDER BY created_at DESC LIMIT 1"
    );
    if (openRaces.length === 0) {
      const result = await createNewRace();
      if (result) startRaceCycle(result.race.id, result.contractRaceId);
    } else {
      console.log("Existing open race found, restarting cycle...");
      const race     = openRaces[0];
      const [horses] = await db.query(
        "SELECT * FROM horses WHERE race_id = ? ORDER BY horse_number",
        [race.id]
      );
      io.emit("race:current", { race, horses });
      startRaceCycle(race.id, race.contract_race_id);
    }
  } catch (err) {
    console.error("Startup error:", err);
  }
});