import React from "react";
import { AbsoluteFill } from "remotion";
import { H, W, hashStr, parseScene } from "./lib";
import { renderScene, You } from "./scenes";

// Hintergrund für Thumbnails: nur die Szene (+ Figur), ohne HUD/Untertitel.
export type ThumbProps = { id: string; scene: string; accent: string; you: boolean };

export const ThumbBG: React.FC<ThumbProps> = ({ id, scene, accent, you }) => {
  const { preset, flags } = parseScene(scene);
  const seed = hashStr(id + scene) % 100000;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <g transform="translate(540 960) scale(1.12) translate(-540 -960)">
          {renderScene(preset, { flags, t: 2.5, g: 3, accent, seed })}
        </g>
        {you && <You g={0} accent={accent} x={780} y={1880} s={1.55} shock />}
      </svg>
    </AbsoluteFill>
  );
};
