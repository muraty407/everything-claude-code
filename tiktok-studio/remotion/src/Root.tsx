import React from "react";
import { Composition } from "remotion";
import { FPS, H, Props, W } from "./lib";
import { WasWaereWenn } from "./Video";
import { ThumbBG } from "./ThumbBG";
import { MergeProps, MergeSim } from "./MergeSim";
import { MetProps, Metronome } from "./Metronome";
import { SyncGrid, SyncProps } from "./SyncGrid";
import sample from "./sample.json";

export const Root: React.FC = () => (
  <>
  <Composition
    id="WasWaereWenn"
    component={WasWaereWenn}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={FPS * 60}
    defaultProps={sample as unknown as Props}
    calculateMetadata={({ props }) => ({
      durationInFrames: Math.ceil((props as Props).timeline.duration * FPS),
    })}
  />
  <Composition id="ThumbBG" component={ThumbBG} width={W} height={H} fps={FPS} durationInFrames={1}
    defaultProps={{ id: "x", scene: "volcano:plume", accent: "#ff5a1f", you: true }} />
  <Composition id="MergeSim" component={MergeSim} width={W} height={H} fps={FPS} durationInFrames={FPS * 10}
    defaultProps={{ fps: 30, duration: 1, topAt: 9999, flask: { cx: 540, cy: 1080, r: 420, neck: 64, neckTop: 170 },
      theme: { slug: "x", tiers: [{ key: "moon", name: "Moon", r: 30 }] }, frames: [[[1, 0, 540, 900, 0]]], events: [] } as MergeProps}
    calculateMetadata={({ props }) => ({ durationInFrames: (props as MergeProps).frames.length })}
  />
  <Composition id="Metronome" component={Metronome} width={W} height={H} fps={FPS} durationInFrames={FPS * 10}
    defaultProps={{ fps: 30, n: 1, frames: [{ a: [0], x: 0, r: 0, d: [0] }] } as MetProps}
    calculateMetadata={({ props }) => ({ durationInFrames: (props as MetProps).frames.length })}
  />
  <Composition id="SyncGrid" component={SyncGrid} width={W} height={H} fps={FPS} durationInFrames={FPS * 10}
    defaultProps={{ fps: 30, n: 1, kind: "washer", title: ["X", "y"], rebel: 0, events: [], frames: [{ p: [0], d: [0], r: 0, m: 0, s: 0, on: true }] } as SyncProps}
    calculateMetadata={({ props }) => ({ durationInFrames: (props as SyncProps).frames.length })}
  />
  </>
);
