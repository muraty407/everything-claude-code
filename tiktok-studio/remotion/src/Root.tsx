import React from "react";
import { Composition } from "remotion";
import { FPS, H, Props, W } from "./lib";
import { WasWaereWenn } from "./Video";
import { ThumbBG } from "./ThumbBG";
import { MergeProps, MergeSim } from "./MergeSim";
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
  </>
);
