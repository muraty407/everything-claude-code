// POV-Story-Format: Ich-Perspektive (eigener Arm im Bild) + Handy mit Nachrichten (z. B. von „Mama“).
import React from "react";
import { clamp, easeOut } from "./lib";

const INTER = "Inter, 'Inter Display', sans-serif";

export type Phone = { from: string; msgs: string[]; battery?: number; net?: string };

// Push-Benachrichtigung oben im Bild – trägt die Nachricht, damit man sie mitliest
export const PhoneBanner: React.FC<{ phone: Phone; t: number; dur: number }> = ({ phone, t, dur }) => {
  if (t < 0) return null;
  const a = easeOut(t / 0.3);
  // mehrere Nachrichten: gleichmäßig über das Segment verteilt einblenden
  const n = phone.msgs.length;
  const shown = phone.msgs.filter((_, i) => t >= (i * dur * 0.8) / Math.max(1, n));
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 440, opacity: a, transform: `translateY(${(1 - a) * -60}px)` }}>
      {shown.map((m, i) => (
        <div key={i} style={{ background: "#f7f7f2", borderRadius: 26, padding: "22px 30px 26px", marginBottom: 16, boxShadow: "0 18px 40px #000b, 0 0 0 3px #0003", transform: `scale(${i === shown.length - 1 ? 0.94 + 0.06 * easeOut((t - (i * dur * 0.8) / n) / 0.2) : 1})` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>💬</div>
            <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 34, color: "#111" }}>{phone.from}</div>
            <div style={{ marginLeft: "auto", fontFamily: INTER, fontWeight: 600, fontSize: 26, color: "#777" }}>jetzt</div>
          </div>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 50, lineHeight: 1.12, color: "#111" }}>{m}</div>
        </div>
      ))}
    </div>
  );
};

const SKIN = "#e0ac80";
const SKIN_D = "#b9835a";
const SLEEVE = "#2f4858";

// Eigener Arm – läuft im Takt mit (Wackeln = Gehen); mit Handy, wenn eine Nachricht kommt
export const PovArm: React.FC<{ g: number; t: number; phone?: Phone; accent: string }> = ({ g, t, phone, accent }) => {
  const bob = Math.sin(g * 6.2) * 10;
  const sway = Math.sin(g * 3.1) * 6;
  if (phone) {
    const up = easeOut(t / 0.35);
    const bat = phone.battery ?? 100;
    const batCol = bat <= 15 ? "#ff3b30" : "#34c759";
    return (
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform={`translate(${sway}, ${(1 - up) * 500 + bob * 0.4})`}>
          {/* Unterarm */}
          <path d="M1080 1920 L1080 1700 Q900 1640 760 1690 L700 1920 Z" fill={SLEEVE} stroke="#000" strokeWidth="8" />
          {/* Handy */}
          <g transform="rotate(-8 640 1560)">
            <rect x="480" y="1330" width="330" height="600" rx="44" fill="#111" stroke="#000" strokeWidth="8" />
            <rect x="500" y="1352" width="290" height="560" rx="30" fill="#ece5dd" />
            <rect x="500" y="1352" width="290" height="70" rx="30" fill="#075e54" />
            <text x="530" y="1398" fontFamily={INTER} fontWeight={800} fontSize="26" fill="#fff">{phone.from}</text>
            {/* Akku + Netz */}
            <rect x="712" y="1374" width="46" height="22" rx="5" fill="none" stroke="#fff" strokeWidth="3" />
            <rect x="715" y="1377" width={Math.max(3, (40 * bat) / 100)} height="16" rx="3" fill={batCol} />
            <text x="700" y="1393" textAnchor="end" fontFamily={INTER} fontWeight={800} fontSize="20" fill={bat <= 15 ? "#ff8a80" : "#fff"}>{bat}%</text>
            {phone.msgs.slice(-3).map((m, i) => (
              <g key={i}>
                <rect x="516" y={1440 + i * 110} width="250" height="92" rx="16" fill="#fff" />
                <text x="530" y={1478 + i * 110} fontFamily={INTER} fontWeight={600} fontSize="20" fill="#222">{m.length > 22 ? m.slice(0, 22) + "…" : m}</text>
                <rect x="530" y={1494 + i * 110} width={120 + (i * 37) % 80} height="10" rx="5" fill="#ccc" />
              </g>
            ))}
            {phone.net && <text x="645" y="1890" textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize="22" fill={accent}>{phone.net}</text>}
          </g>
          {/* Finger um das Handy */}
          <ellipse cx="480" cy="1640" rx="42" ry="30" fill={SKIN} stroke="#000" strokeWidth="7" />
          <ellipse cx="478" cy="1710" rx="42" ry="30" fill={SKIN} stroke="#000" strokeWidth="7" />
          <ellipse cx="482" cy="1780" rx="40" ry="28" fill={SKIN} stroke="#000" strokeWidth="7" />
          <path d="M800 1700 Q880 1650 860 1580 Q835 1560 805 1600 Z" fill={SKIN} stroke="#000" strokeWidth="7" />
          <path d="M700 1920 Q690 1820 760 1760 Q820 1720 860 1760 L900 1920 Z" fill={SKIN} stroke="#000" strokeWidth="8" />
        </g>
      </svg>
    );
  }
  // freie Hand (Faust) unten links, schwingt beim Gehen
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <g transform={`translate(${sway}, ${bob}) rotate(${Math.sin(g * 3.1) * 3} 200 1900)`}>
        <path d="M-40 1920 L-40 1760 Q120 1700 260 1660 L330 1760 Q200 1840 120 1920 Z" fill={SLEEVE} stroke="#000" strokeWidth="8" />
        <path d="M250 1640 Q320 1560 400 1580 Q450 1610 430 1680 Q410 1740 340 1760 Q280 1770 250 1720 Z" fill={SKIN} stroke="#000" strokeWidth="8" />
        <path d="M300 1610 Q330 1640 320 1680 M350 1600 Q380 1630 370 1675 M395 1615 Q415 1640 405 1680" stroke={SKIN_D} strokeWidth="6" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
};

// leichtes Atmen/Kopfbewegung für die ganze Szene (Ich-Perspektive)
export const povCam = (g: number) => ({
  x: Math.sin(g * 3.1) * 8,
  y: Math.abs(Math.sin(g * 3.1)) * 10,
  r: Math.sin(g * 1.7) * 0.6,
  k: clamp(1),
});
