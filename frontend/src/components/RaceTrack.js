// src/components/RaceTrack.js
import { useEffect, useRef } from "react";

const HORSE_EMOJIS = ["🔴", "🔵", "🟢", "🟠", "🟣", "🟦"];

export default function RaceTrack({ horses, positions, status, winningHorse, countdown }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#0f1a0f";
    ctx.fillRect(0, 0, W, H);

    // Track lanes
    const laneH = H / 6;
    horses.forEach((horse, i) => {
      const y = i * laneH;

      // Lane background alternating
      ctx.fillStyle = i % 2 === 0
        ? "rgba(255,255,255,0.03)"
        : "rgba(255,255,255,0.015)";
      ctx.fillRect(0, y, W, laneH);

      // Lane border
      ctx.strokeStyle = "rgba(212,175,55,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + laneH);
      ctx.lineTo(W, y + laneH);
      ctx.stroke();

      // Horse name label on left
      ctx.fillStyle = horse.color || "#d4af37";
      ctx.font = "bold 11px Arial";
      ctx.fillText(`#${horse.horse_number} ${horse.name}`, 8, y + laneH / 2 + 4);

      // Finish line
      ctx.strokeStyle = "rgba(212,175,55,0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(W - 30, y);
      ctx.lineTo(W - 30, y + laneH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Horse position
      const pos = positions ? positions[i] : 0;
      const trackWidth = W - 160; // account for label and finish line
      const horseX = 140 + (trackWidth * pos) / 100;
      const horseY = y + laneH / 2;

      // Horse shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(horseX + 2, horseY + 12, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Horse emoji
      ctx.font = `${laneH * 0.55}px Arial`;
      ctx.fillText("🐴", horseX - 14, horseY + laneH * 0.2);

      // Winner crown
      if (status === "finished" && winningHorse === horse.horse_number) {
        ctx.font = "18px Arial";
        ctx.fillText("👑", horseX - 8, horseY - laneH * 0.15);
      }
    });

    // Finish line label
    ctx.fillStyle = "#d4af37";
    ctx.font = "bold 10px Arial";
    ctx.fillText("FINISH", W - 52, 14);

  }, [horses, positions, status, winningHorse]);

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.title}>🏇 Live Race</span>
        <span style={styles.statusBadge(status)}>
          {status === "open"     ? "🟡 Betting Open" :
           status === "closed"   ? "🔴 Race In Progress" :
           status === "finished" ? "🏁 Finished" : "⏳ Waiting"}
        </span>
      </div>

      {/* Countdown */}
      {status === "open" && countdown > 0 && (
        <div style={styles.countdown}>
          🕐 Race starts in <strong>{countdown}s</strong>
        </div>
      )}

      {/* Winner Banner */}
      {status === "finished" && winningHorse && horses.length > 0 && (
        <div style={styles.winnerBanner}>
          🏆 Winner: <strong>{horses[winningHorse - 1]?.name}</strong> (Horse #{winningHorse})
        </div>
      )}

      {/* Canvas Race Track */}
      <canvas
        ref={canvasRef}
        width={700}
        height={300}
        style={styles.canvas}
      />

      {/* Horse Legend */}
      <div style={styles.legend}>
        {horses.map((horse) => (
          <div key={horse.horse_number} style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: horse.color }} />
            <span style={styles.legendName}>{horse.name}</span>
            <span style={styles.legendOdds}>{horse.odds}x</span>
          </div>
        ))}
      </div>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: "#d4af37",
    letterSpacing: 1,
  },
  statusBadge: (status) => ({
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 20,
    background: status === "open"     ? "rgba(212,175,55,0.15)" :
                status === "closed"   ? "rgba(200,60,60,0.15)"  :
                status === "finished" ? "rgba(60,180,100,0.15)" :
                "rgba(255,255,255,0.05)",
    color: status === "open"     ? "#d4af37" :
           status === "closed"   ? "#e07070" :
           status === "finished" ? "#70e0a0" :
           "#8a7a5a",
  }),
  countdown: {
    textAlign: "center",
    fontSize: 14,
    color: "#d4af37",
    background: "rgba(212,175,55,0.08)",
    border: "1px solid rgba(212,175,55,0.15)",
    borderRadius: 8,
    padding: "8px 12px",
    marginBottom: 12,
  },
  winnerBanner: {
    textAlign: "center",
    fontSize: 16,
    color: "#70e0a0",
    background: "rgba(60,180,100,0.1)",
    border: "1px solid rgba(60,180,100,0.2)",
    borderRadius: 8,
    padding: "10px 12px",
    marginBottom: 12,
  },
  canvas: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid rgba(212,175,55,0.15)",
    display: "block",
  },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "#8a7a5a",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    display: "inline-block",
  },
  legendName: { color: "#e8e0c8", fontWeight: 600 },
  legendOdds: { color: "#8a7a5a" },
};