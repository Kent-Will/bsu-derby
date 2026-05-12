// src/components/Dashboard.js
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONFIG } from "../config";
import axios from "axios";

export default function Dashboard({ address, contract, player, onAction }) {
  const [balance, setBalance] = useState("0");
  const [amount, setAmount] = useState("");
  const [actionMode, setActionMode] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  function showMsg(text, type = "info") {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  }

  async function fetchBalance() {
    try {
      const raw = await contract.balanceOf(address);
      const formatted = ethers.formatUnits(raw, 18);
      setBalance(Math.floor(Number(formatted)).toLocaleString());
    } catch (err) {
      console.error("Balance fetch error:", err);
    }
  }

  useEffect(() => {
    if (contract && address) fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [contract, address]);

  async function deposit() {
    if (!amount || Number(amount) <= 0) return showMsg("Enter a valid amount!", "error");
    setLoading(true);
    showMsg("Processing deposit... ⏳", "info");
    try {
      const tx = await contract.deposit({ value: ethers.parseEther(amount) });
      await tx.wait();
      showMsg("Deposit successful! 🎉", "success");
      fetchBalance();
    } catch (err) {
      showMsg("Deposit failed ❌", "error");
    }
    setLoading(false);
    setActionMode(null);
    setAmount("");
  }

  async function withdraw() {
    if (!amount || Number(amount) <= 0) return showMsg("Enter a valid amount!", "error");
    setLoading(true);
    showMsg("Processing withdrawal... ⏳", "info");
    try {
      const tx = await contract.withdraw(ethers.parseUnits(amount, 18));
      await tx.wait();
      showMsg("Withdrawal successful! 🎉", "success");
      fetchBalance();
    } catch (err) {
      showMsg("Withdrawal failed ❌", "error");
    }
    setLoading(false);
    setActionMode(null);
    setAmount("");
  }

  return (
    <div style={styles.wrap}>
      {/* Player Info */}
      <div style={styles.playerRow}>
        <span style={styles.avatar}>{player?.avatar || "🏇"}</span>
        <div>
          <div style={styles.username}>{player?.username || "Player"}</div>
          <div style={styles.wallet}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        </div>
      </div>

      <hr style={styles.divider} />

      {/* Balance */}
      <div style={styles.balanceBar}>
        <div>
          <div style={styles.balanceLabel}>Token Balance</div>
          <div style={styles.balanceAmount}>🪙 {balance} BSUD</div>
        </div>
        <button style={styles.refreshBtn} onClick={fetchBalance}>↻</button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statBox}>
          <div style={styles.statVal}>{player?.total_bets || 0}</div>
          <div style={styles.statLbl}>Total Bets</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statVal}>{player?.total_wins || 0}</div>
          <div style={styles.statLbl}>Wins</div>
        </div>
        <div style={styles.statBox}>
          <div style={{
            ...styles.statVal,
            color: (player?.total_earned - player?.total_lost) >= 0
              ? "#70e0a0" : "#e07070"
          }}>
            {((player?.total_earned || 0) - (player?.total_lost || 0)).toLocaleString()}
          </div>
          <div style={styles.statLbl}>Net Profit</div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div style={{ ...styles.msg, ...styles[`msg_${message.type}`] }}>
          {message.text}
        </div>
      )}

      {/* Action Buttons */}
      {!actionMode && (
        <div style={styles.btnRow}>
          <button style={styles.btn} onClick={() => setActionMode("deposit")}>
            ⬇️ Deposit
          </button>
          <button style={styles.btn} onClick={() => setActionMode("withdraw")}>
            ⬆️ Withdraw
          </button>
        </div>
      )}

      {/* Action Panel */}
      {actionMode && (
        <div style={styles.actionPanel}>
          <p style={styles.actionLabel}>
            {actionMode === "deposit" ? "Amount in ETH" : "Amount in BSUD tokens"}
          </p>
          <input
            style={styles.input}
            placeholder={actionMode === "deposit" ? "0.01" : "1000"}
            type="number"
            min="0"
            step={actionMode === "deposit" ? "0.001" : "1"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div style={styles.btnRow}>
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={actionMode === "deposit" ? deposit : withdraw}
              disabled={loading}
            >
              {loading ? "Processing..." : "Confirm"}
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnGhost }}
              onClick={() => { setActionMode(null); setAmount(""); }}
            >
              Cancel
            </button>
          </div>
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
  playerRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatar: { fontSize: 36 },
  username: { fontSize: 18, fontWeight: 700, color: "#d4af37" },
  wallet: { fontSize: 11, color: "#5a5040", fontFamily: "monospace" },
  divider: {
    border: "none",
    borderTop: "1px solid rgba(212,175,55,0.15)",
    margin: "0 0 16px",
  },
  balanceBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(212,175,55,0.07)",
    border: "1px solid rgba(212,175,55,0.15)",
    borderRadius: 10,
    padding: "10px 14px",
    marginBottom: 14,
  },
  balanceLabel: { fontSize: 11, color: "#8a7a5a", letterSpacing: 1, textTransform: "uppercase" },
  balanceAmount: { fontSize: 20, fontWeight: 700, color: "#d4af37" },
  refreshBtn: {
    background: "none",
    border: "1px solid rgba(212,175,55,0.2)",
    color: "#d4af37",
    borderRadius: 8,
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: 16,
  },
  statsRow: {
    display: "flex",
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: "10px 8px",
    textAlign: "center",
  },
  statVal: { fontSize: 18, fontWeight: 700, color: "#d4af37" },
  statLbl: { fontSize: 10, color: "#5a5040", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 },
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
  btnRow: { display: "flex", gap: 8 },
  btn: {
    flex: 1,
    padding: "11px",
    background: "rgba(212,175,55,0.1)",
    border: "1px solid rgba(212,175,55,0.3)",
    color: "#d4af37",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnPrimary: { background: "#d4af37", color: "#0a0a0f", border: "none" },
  btnGhost: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#8a7a5a",
  },
  actionPanel: { marginTop: 8 },
  actionLabel: { fontSize: 12, color: "#8a7a5a", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
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
    marginBottom: 10,
    textAlign: "center",
  },
};