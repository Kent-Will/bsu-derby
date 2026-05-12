// src/components/ConnectWallet.js
import { useState } from "react";
import { ethers } from "ethers";
import { CONFIG } from "../config";
import axios from "axios";

export default function ConnectWallet({ onConnect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [step, setStep] = useState("connect"); // connect | username
  const [tempWallet, setTempWallet] = useState(null);

  async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
      setError("MetaMask not detected! Please install MetaMask.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      // Check network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== CONFIG.CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }],
          });
        } catch {
          setError("Please switch to Sepolia Testnet in MetaMask.");
          setLoading(false);
          return;
        }
      }

      const signer   = await provider.getSigner();
      const address  = await signer.getAddress();
      const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONFIG.ABI, signer);

      // Check if player exists in database
      try {
        const res = await axios.get(
          `${CONFIG.BACKEND_URL}/api/players/${address.toLowerCase()}`
        );
        // Player found — go straight in
        onConnect({ address, provider, signer, contract, player: res.data });
      } catch (err) {
        if (err.response && err.response.status === 404) {
          // Player not found — show username screen
          setTempWallet({ address, provider, signer, contract });
          setStep("username");
          setLoading(false);
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error(err);
      setError("Wallet connection rejected or failed.");
      setLoading(false);
    }
  }

  async function saveUsername() {
    if (!username.trim()) return;
    if (!tempWallet) return;
    setLoading(true);
    setError("");
    try {
      const { address, provider, signer, contract } = tempWallet;
      const res = await axios.post(`${CONFIG.BACKEND_URL}/api/players/register`, {
        wallet: address.toLowerCase(),
        username: username.trim(),
      });
      onConnect({ address, provider, signer, contract, player: res.data.player });
    } catch (err) {
      console.error(err);
      setError("Could not save username. Make sure the backend is running.");
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>🏇</div>
        <h1 style={styles.title}>BSU Derby</h1>
        <p style={styles.sub}>BLOCKCHAIN HORSE RACING</p>
        <hr style={styles.divider} />

        {step === "connect" && (
          <>
            <p style={styles.desc}>
              Connect your MetaMask wallet to deposit tokens and bet on live horse races.
            </p>
            {error && <p style={styles.error}>{error}</p>}
            <button style={styles.btn} onClick={connectWallet} disabled={loading}>
              {loading ? "Connecting..." : "🦊 Connect MetaMask"}
            </button>
          </>
        )}

        {step === "username" && (
          <>
            <p style={styles.desc}>Choose a username for the leaderboard:</p>
            {error && <p style={styles.error}>{error}</p>}
            <input
              style={styles.input}
              placeholder="Enter username..."
              maxLength={30}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveUsername()}
              autoFocus
            />
            <button style={styles.btn} onClick={saveUsername} disabled={loading}>
              {loading ? "Saving..." : "Enter the Derby →"}
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnGhost }}
              onClick={() => { setStep("connect"); setError(""); }}
            >
              ← Back
            </button>
          </>
        )}

        <p style={styles.credits}>Bowie State University · COSC Capstone</p>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    background: "#0a0a0f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(212,175,55,0.3)",
    borderRadius: 20,
    padding: "40px 36px",
    maxWidth: 420,
    width: "90%",
    textAlign: "center",
    color: "#e8e0c8",
  },
  logo: { fontSize: 64, marginBottom: 10 },
  title: {
    fontFamily: "Georgia, serif",
    fontSize: 32,
    color: "#d4af37",
    margin: "0 0 6px",
  },
  sub: {
    fontSize: 11,
    letterSpacing: 3,
    color: "#8a7a5a",
    margin: "0 0 20px",
  },
  divider: {
    border: "none",
    borderTop: "1px solid rgba(212,175,55,0.2)",
    margin: "20px 0",
  },
  desc: {
    color: "#8a7a5a",
    fontSize: 14,
    lineHeight: 1.7,
    marginBottom: 20,
  },
  error: {
    background: "rgba(200,60,60,0.1)",
    border: "1px solid rgba(200,60,60,0.3)",
    color: "#e07070",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    marginBottom: 14,
  },
  btn: {
    width: "100%",
    padding: "14px",
    background: "#d4af37",
    color: "#0a0a0f",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: 10,
    fontFamily: "Arial, sans-serif",
  },
  btnGhost: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#8a7a5a",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(212,175,55,0.25)",
    borderRadius: 10,
    color: "#e8e0c8",
    fontSize: 15,
    textAlign: "center",
    outline: "none",
    marginBottom: 12,
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
  },
  credits: {
    fontSize: 11,
    color: "#3a3020",
    marginTop: 20,
  },
};