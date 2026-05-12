// src/App.js
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { CONFIG } from "./config";
import ConnectWallet from "./components/ConnectWallet";
import Dashboard from "./components/Dashboard";
import RaceTrack from "./components/RaceTrack";
import BettingPanel from "./components/BettingPanel";
import Leaderboard from "./components/Leaderboard";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Nunito:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; font-family: 'Nunito', sans-serif; color: #e8e0c8; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0a0a0f; }
  ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 3px; }

  .floaties {
    position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
  }
  .float-icon {
    position: absolute; font-size: 28px; opacity: 0.06;
    animation: floatUpDown 6s ease-in-out infinite;
  }
  @keyframes floatUpDown {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-18px); }
  }

  .tab-btn {
    padding: 8px 18px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(212,175,55,0.15);
    color: #8a7a5a;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Nunito', sans-serif;
  }
  .tab-btn.active {
    background: rgba(212,175,55,0.15);
    border-color: rgba(212,175,55,0.4);
    color: #d4af37;
  }
  .tab-btn:hover { color: #d4af37; }
`;

let socket = null;

export default function App() {
  // Auth state
  const [wallet, setWallet]     = useState(null);
  const [player, setPlayer]     = useState(null);
  const [contract, setContract] = useState(null);

  // Race state
  const [race, setRace]               = useState(null);
  const [horses, setHorses]           = useState([]);
  const [positions, setPositions]     = useState([0, 0, 0, 0, 0, 0]);
  const [countdown, setCountdown]     = useState(0);
  const [winningHorse, setWinningHorse] = useState(null);

  // UI state
  const [tab, setTab]           = useState("race");
  const [connected, setConnected] = useState(false);

  // ── CONNECT ──────────────────────────────────────────────
  function handleConnect({ address, provider, signer, contract, player }) {
    setWallet(address);
    setContract(contract);
    setPlayer(player);
    setConnected(true);
    initSocket();
  }

  // ── SOCKET.IO ─────────────────────────────────────────────
  function initSocket() {
    socket = io(CONFIG.BACKEND_URL);

    socket.on("connect", () => {
      console.log("Connected to BSU Derby server!");
    });

    // New race created
    socket.on("race:new", ({ race, horses }) => {
      setRace(race);
      setHorses(horses);
      setPositions([0, 0, 0, 0, 0, 0]);
      setWinningHorse(null);
      setCountdown(30);
    });

    // Current race on connect
    socket.on("race:current", ({ race, horses }) => {
      setRace(race);
      setHorses(horses);
      setPositions([0, 0, 0, 0, 0, 0]);
    });

    // Betting countdown
    socket.on("race:countdown", ({ timeLeft }) => {
      setCountdown(timeLeft);
    });

    // Race started — betting closed
    socket.on("race:started", () => {
      setRace(prev => prev ? { ...prev, status: "closed" } : prev);
      setCountdown(0);
    });

    // Live position updates
    socket.on("race:update", ({ positions }) => {
      setPositions(positions);
    });

    // Race finished
    socket.on("race:finished", ({ winningHorse, positions, horses }) => {
      setRace(prev => prev ? { ...prev, status: "finished" } : prev);
      setWinningHorse(winningHorse);
      setPositions(positions);
      setHorses(horses);
    });

    return () => socket.disconnect();
  }

  // Cleanup socket on unmount
  useEffect(() => {
    return () => { if (socket) socket.disconnect(); };
  }, []);

  // ── NOT CONNECTED ─────────────────────────────────────────
  if (!connected) {
    return <ConnectWallet onConnect={handleConnect} />;
  }

  // ── MAIN APP ──────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>

      {/* Floating background icons */}
      <div className="floaties">
        {[
          { sym: "🏇", s: "top:8%;left:5%",   d: "0s"   },
          { sym: "🏆", s: "top:20%;left:88%",  d: "1.2s" },
          { sym: "🎯", s: "top:72%;left:7%",   d: "2s"   },
          { sym: "🎲", s: "top:80%;left:84%",  d: "0.7s" },
          { sym: "💰", s: "top:44%;left:92%",  d: "3s"   },
          { sym: "🥇", s: "top:55%;left:2%",   d: "1.8s" },
        ].map(({ sym, s, d }, i) => (
          <span key={i} className="float-icon" style={{
            ...Object.fromEntries(s.split(";").filter(Boolean).map(p => {
              const [k, v] = p.split(":");
              return [k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v.trim()];
            })),
            animationDelay: d
          }}>{sym}</span>
        ))}
      </div>

      <div style={styles.wrap}>
        {/* ── HEADER ── */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🏇</span>
            <div>
              <div style={styles.logoTitle}>BSU Derby</div>
              <div style={styles.logoSub}>BLOCKCHAIN HORSE RACING</div>
            </div>
          </div>

          {/* Live indicator */}
          <div style={styles.liveIndicator}>
            <span style={styles.liveDot} />
            LIVE
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={styles.tabs}>
          {["race", "dashboard", "leaderboard"].map(t => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "race"        ? "🏇 Race"        :
               t === "dashboard"   ? "💰 Dashboard"   :
               "🏆 Leaderboard"}
            </button>
          ))}
        </div>

        {/* ── RACE TAB ── */}
        {tab === "race" && (
          <div style={styles.raceLayout}>
            <div style={styles.raceMain}>
              <RaceTrack
                horses={horses}
                positions={positions}
                status={race?.status}
                winningHorse={winningHorse}
                countdown={countdown}
              />
            </div>
            <div style={styles.raceSide}>
              <BettingPanel
                race={race}
                horses={horses}
                contract={contract}
                player={player}
                address={wallet}
                onBetPlaced={() => {}}
              />
            </div>
          </div>
        )}

        {/* ── DASHBOARD TAB ── */}
        {tab === "dashboard" && (
          <Dashboard
            address={wallet}
            contract={contract}
            player={player}
            onAction={() => {}}
          />
        )}

        {/* ── LEADERBOARD TAB ── */}
        {tab === "leaderboard" && <Leaderboard />}

        {/* ── FOOTER ── */}
        <div style={styles.footer}>
          Bowie State University · COSC Capstone · Sepolia Testnet
        </div>
      </div>
    </>
  );
}

const styles = {
  wrap: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "24px 20px",
    position: "relative",
    zIndex: 2,
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: { display: "flex", alignItems: "center", gap: 12 },
  logoIcon: { fontSize: 40 },
  logoTitle: {
    fontFamily: "'Cinzel Decorative', serif",
    fontSize: 24,
    color: "#d4af37",
    letterSpacing: 1,
  },
  logoSub: {
    fontSize: 10,
    color: "#8a7a5a",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  liveIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    color: "#70e0a0",
    background: "rgba(60,180,100,0.1)",
    border: "1px solid rgba(60,180,100,0.2)",
    borderRadius: 20,
    padding: "6px 14px",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#70e0a0",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
  },
  raceLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: 16,
    alignItems: "start",
  },
  raceMain: { minWidth: 0 },
  raceSide: {},
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: "#3a3020",
    marginTop: 40,
    paddingTop: 20,
    borderTop: "1px solid rgba(212,175,55,0.08)",
  },
};
