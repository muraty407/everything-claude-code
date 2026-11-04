import React from "react";
import { Composition } from "remotion";
import { FPS, H, Props, W } from "./lib";
import { WasWaereWenn } from "./Video";
import { ThumbBG } from "./ThumbBG";
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
  </>
);
