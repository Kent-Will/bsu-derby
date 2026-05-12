// src/components/Leaderboard.js
import { useState, useEffect } from "react";
import axios from "axios";
import { CONFIG } from "../config";

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchLeaderboard() {
    try {
      const res = await axios.get(`${CONFIG.BACKEND_URL}/api/leaderboard`);
      setPlayers(res.data);
    } catch (err) {
      console.error("Could not fetch leaderboard:", err);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchLeaderboard();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.title}>🏆 Leaderboard</span>
        <button style={styles.refreshBtn} onClick={fetchLeaderboard}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p style={styles.empty}>Loading...</p>
      ) : players.length === 0 ? (
        <p style={styles.empty}>No players yet — be the first to bet!</p>
      ) : (
        <div style={styles.list}>
          {players.map((player, index) => (
            <div
              key={player.id}
              style={{
                ...styles.row,
                background: index === 0
                  ? "rgba(212,175,55,0.08)"
                  : "rgba(255,255,255,0.02)",
                borderColor: index === 0
                  ? "rgba(212,175,55,0.3)"
                  : "rgba(255,255,255,0.06)",
              }}
            >
              {/* Rank */}
              <span style={styles.rank}>
                {index < 3 ? medals[index] : `#${index + 1}`}
              </span>

              {/* Avatar + Name */}
              <div style={styles.playerInfo}>
                <span style={styles.avatar}>{player.avatar || "🏇"}</span>
                <div>
                  <div style={styles.username}>{player.username}</div>
                  <div style={styles.wallet}>
                    {player.wallet.slice(0, 6)}...{player.wallet.slice(-4)}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div style={styles.stats}>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Net</span>
                  <span style={{
                    ...styles.statValue,
                    color: player.net_profit >= 0 ? "#70e0a0" : "#e07070",
                  }}>
                    {player.net_profit >= 0 ? "+" : ""}{Number(player.net_profit).toLocaleString()}
                  </span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Win %</span>
                  <span style={styles.statValue}>{player.win_rate}%</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Bets</span>
                  <span style={styles.statValue}>{player.total_bets}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(212,175,55,0.2)",
    borderRadius: 16,
    padding: 20,
    color: "#e8e0c8",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: "#d4af37",
    letterSpacing: 1,
  },
  refreshBtn: {
    background: "rgba(212,175,55,0.1)",
    border: "1px solid rgba(212,175,55,0.3)",
    color: "#d4af37",
    borderRadius: 8,
    padding: "4px 12px",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 700,
  },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid",
  },
  rank: { fontSize: 18, minWidth: 28, textAlign: "center" },
  playerInfo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatar: { fontSize: 24 },
  username: { fontSize: 14, fontWeight: 700, color: "#e8e0c8" },
  wallet: { fontSize: 11, color: "#5a5040", fontFamily: "monospace" },
  stats: { display: "flex", gap: 16 },
  statItem: { textAlign: "center" },
  statLabel: {
    display: "block",
    fontSize: 10,
    color: "#5a5040",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statValue: { fontSize: 13, fontWeight: 700, color: "#d4af37" },
  empty: { color: "#5a5040", textAlign: "center", padding: "20px 0", fontSize: 14 },
};