// src/components/BettingPanel.js
import { useState } from "react";
import { ethers } from "ethers";
import { CONFIG } from "../config";
import axios from "axios";

export default function BettingPanel({ race, horses, contract, player, address, onBetPlaced }) {
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [betAmount, setBetAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  function showMsg(text, type = "info") {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  }

  async function placeBet() {
    if (!selectedHorse) return showMsg("Select a horse first!", "error");
    if (!betAmount || Number(betAmount) <= 0) return showMsg("Enter a valid bet amount!", "error");
    if (!race) return showMsg("No active race!", "error");

    setLoading(true);
    try {
      const tokenAmount = ethers.parseUnits(betAmount, 18);

      // Place bet on smart contract
      const tx = await contract.placeBet(
        race.contract_race_id,
        selectedHorse,
        tokenAmount
      );
      showMsg("Transaction submitted... ⏳", "info");
      await tx.wait();

      // Record bet in MySQL
      await axios.post(`${CONFIG.BACKEND_URL}/api/players/bet`, {
        wallet: address,
        race_id: race.id,
        horse_number: selectedHorse,
        amount: betAmount,
      });

      showMsg(`Bet placed on ${horses[selectedHorse - 1]?.name}! 🎉`, "success");
      setBetAmount("");
      setSelectedHorse(null);
      if (onBetPlaced) onBetPlaced();
    } catch (err) {
      showMsg("Bet failed — " + (err.reason || err.message), "error");
    }
    setLoading(false);
  }

  if (!race || race.status !== "open") {
    return (
      <div style={styles.wrap}>
        <div style={styles.header}>🎯 Betting</div>
        <p style={styles.closed}>
          {race?.status === "closed" ? "🔒 Betting is closed — race starting!" :
           race?.status === "finished" ? "🏁 Race finished!" :
           "⏳ Waiting for next race..."}
        </p>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>🎯 Place Your Bet</div>

      {/* Horse Selection */}
      <p style={styles.label}>Select a Horse:</p>
      <div style={styles.horseGrid}>
        {horses.map((horse) => (
          <div
            key={horse.horse_number}
            style={{
              ...styles.horseTile,
              borderColor: selectedHorse === horse.horse_number
                ? horse.color
                : "rgba(212,175,55,0.15)",
              background: selectedHorse === horse.horse_number
                ? `${horse.color}22`
                : "rgba(255,255,255,0.03)",
            }}
            onClick={() => setSelectedHorse(horse.horse_number)}
          >
            <span style={{ fontSize: 24 }}>🐴</span>
            <span style={{ ...styles.horseName, color: horse.color }}>
              {horse.name}
            </span>
            <span style={styles.horseOdds}>{horse.odds}x</span>
          </div>
        ))}
      </div>

      {/* Bet Amount */}
      <p style={styles.label}>Bet Amount (BSUD tokens):</p>
      <input
        style={styles.input}
        placeholder="Enter token amount..."
        type="number"
        min="1"
        value={betAmount}
        onChange={(e) => setBetAmount(e.target.value)}
      />

      {/* Message */}
      {message.text && (
        <div style={{ ...styles.msg, ...styles[`msg_${message.type}`] }}>
          {message.text}
        </div>
      )}

      {/* Place Bet Button */}
      <button
        style={{
          ...styles.btn,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
        onClick={placeBet}
        disabled={loading}
      >
        {loading ? "Processing..." : "Place Bet 🏇"}
      </button>
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
    fontSize: 16,
    fontWeight: 700,
    color: "#d4af37",
    marginBottom: 16,
    letterSpacing: 1,
  },
  label: {
    fontSize: 12,
    color: "#8a7a5a",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  horseGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 16,
  },
  horseTile: {
    border: "1px solid",
    borderRadius: 10,
    padding: "10px 8px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  horseName: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  horseOdds: {
    fontSize: 11,
    color: "#8a7a5a",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(212,175,55,0.25)",
    borderRadius: 10,
    color: "#e8e0c8",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 12,
  },
  btn: {
    width: "100%",
    padding: "13px",
    background: "#d4af37",
    color: "#0a0a0f",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  msg: {
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  msg_success: {
    background: "rgba(60,180,100,0.1)",
    border: "1px solid rgba(60,180,100,0.2)",
    color: "#70e0a0",
  },
  msg_error: {
    background: "rgba(200,60,60,0.1)",
    border: "1px solid rgba(200,60,60,0.2)",
    color: "#e07070",
  },
  msg_info: {
    background: "rgba(212,175,55,0.08)",
    border: "1px solid rgba(212,175,55,0.15)",
    color: "#d4af37",
  },
  closed: {
    color: "#8a7a5a",
    textAlign: "center",
    fontSize: 14,
    padding: "20px 0",
  },
};