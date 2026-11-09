import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs"; import path from "node:path";
const [entry, propsFile, outDir, ...frames] = process.argv.slice(2);
const base = "/opt/pw-browsers"; const d = fs.readdirSync(base).find((x) => x.startsWith("chromium_headless_shell"));
const sub = fs.readdirSync(path.join(base, d)).find((x) => fs.existsSync(path.join(base, d, x, "chrome-headless-shell")));
const browserExecutable = path.join(base, d, sub, "chrome-headless-shell");
const serveUrl = await bundle({ entryPoint: entry });
const inputProps = JSON.parse(fs.readFileSync(propsFile, "utf8"));
const chromiumOptions={gl:process.env.GL};const composition = await selectComposition({ serveUrl, id: inputProps.__comp || "WasWaereWenn", inputProps, browserExecutable, chromiumOptions });
for (const f of frames) { await renderStill({ composition, serveUrl, output: `${outDir}/s_${f}.png`, inputProps, frame: +f, browserExecutable, scale: 0.4, chromiumOptions }); console.log("ok", f); }
