// Rendert mehrere Tage mit EINEM Bundle (schneller als die CLI pro Video).
// Aufruf: node render.mjs <props1.json> <out1.mp4> [<props2.json> <out2.mp4> ...]
//         node render.mjs --still <CompositionId> <props.json> <out.png> [...]
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const browserExecutable =
  process.env.REMOTION_BROWSER ||
  (() => {
    const base = "/opt/pw-browsers";
    try {
      const d = fs.readdirSync(base).find((x) => x.startsWith("chromium_headless_shell"));
      const sub = fs.readdirSync(path.join(base, d)).find((x) => fs.existsSync(path.join(base, d, x, "chrome-headless-shell")));
      return path.join(base, d, sub, "chrome-headless-shell");
    } catch {
      return null;
    }
  })();

const args = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.join(here, "src/index.ts"), publicDir: path.join(here, "public") });

if (args[0] === "--still") {
  // --still <comp> <props.json> <out.png> [<props.json> <out.png> ...]
  const comp = args[1];
  for (let i = 2; i < args.length; i += 2) {
    const inputProps = JSON.parse(fs.readFileSync(args[i], "utf8"));
    const composition = await selectComposition({ serveUrl, id: comp, inputProps, browserExecutable });
    await renderStill({ composition, serveUrl, output: args[i + 1], inputProps, frame: 0, browserExecutable, imageFormat: "png" });
    console.log("still", args[i + 1]);
  }
} else {
  for (let i = 0; i < args.length; i += 2) {
    const propsFile = args[i], out = args[i + 1];
    const inputProps = JSON.parse(fs.readFileSync(propsFile, "utf8"));
    const composition = await selectComposition({ serveUrl, id: inputProps.__comp || "WasWaereWenn", inputProps, browserExecutable });
    const t0 = Date.now();
    await renderMedia({
      composition, serveUrl, codec: "h264", outputLocation: out, inputProps, browserExecutable,
      crf: 10, x264Preset: "slow", muted: true, concurrency: 4, imageFormat: "png", // nahezu verlustfreies Zwischenformat
    });
    console.log(`\n${out} fertig in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
}
