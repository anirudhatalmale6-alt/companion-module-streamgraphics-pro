# companion-module-streamgraphics-pro

Bitfocus Companion module for [StreamGraphics Pro](https://www.streamgraphicspro.com) —
live broadcast graphics for OBS, vMix and any browser source.

Talks to the app over its Control API for commands, and over its live state stream
for feedbacks and variables, so button colours and on-screen numbers track the app
in real time rather than being polled.

## Installing it

There are three routes, in the order you'd actually want them.

### 1. From Companion's module list — the eventual answer for end users

Once this module is accepted into the Bitfocus module repository, users search for
"StreamGraphics Pro" in Companion's Modules page and click install. Nothing to
download, nothing to unzip, and updates arrive on their own. Submitting it is a
pull request against `bitfocus/companion-module-*` plus a review.

Until that's done, use one of the two below.

### 2. The packaged `.tgz` — one file for an end user

`npm run package` produces `streamgraphics-pro-<version>.tgz`. That is Companion's
own package format: bundled code, manifest and help in a single file.

In Companion, open the **Modules** page and use the option to import/install a
module package, then pick the `.tgz`. Newer Companion 3.x builds have this; if
yours doesn't show it, use route 3.

Note it's a `.tgz`, not a `.zip` — don't unzip it first, hand Companion the file
as it is.

### 3. Developer modules path — always works

1. Unzip the source folder somewhere permanent, e.g.
   `C:\companion-modules\streamgraphics-pro`.
2. In Companion, open **Settings → Developer modules path** and point it at the
   **parent** folder — `C:\companion-modules`, *not* the module folder itself.
   This is the step people get wrong.
3. Restart Companion. **StreamGraphics Pro** appears when you add a connection.

This route needs the `node_modules` folder present, which is why the distributed
zip includes it.

## Configuration

| Field | Default | Notes |
|---|---|---|
| Address of the show computer | `127.0.0.1` | Use the show computer's network address if Companion runs elsewhere |
| Port | `4000` | Matches the app |

## What it can do

**Actions** (27) — library presets on/off/toggle/all-off and spreadsheet row
stepping; presenter timer start/pause/reset/on-air/off-air/set/adjust; scoreboard
point/on-air/off-air/next game/restart; baseball run/ball/strike/out/clear
count/advance/on-air/off-air.

**Feedbacks** (6) — preset on air, scoreboard on air, timer on air, timer running,
baseball on air, module connected.

**Variables** — per-scoreboard scores, team names and game number; per-preset row
number, row total and row label; a live presenter clock; baseball count, outs,
inning and runs; connection state.

**Presets** — generated from your actual show. Every saved graphic and every
scoreboard gets its own ready-wired buttons, so a five-court meet produces five
scoring pages you can just drag out.

Everything is addressed by the name you gave it in the app, so buttons survive a
rebuild of the show file.

## Development

```bash
npm install --legacy-peer-deps      # the tools package has a loose eslint peer range
npm run check                       # syntax check + validate companion/manifest.json
npm run test:live -- <host> <port>  # drive the module against a running app
npm run package                     # build streamgraphics-pro-<version>.tgz
npm run package:check               # Companion's own module checker
```

Targets `@companion-module/base` **1.x**, which is what shipping Companion 3.x
runs. 2.x exists but is a breaking rewrite for Companion 4 — it drops
`runEntrypoint` and `parseVariablesInString` among other things, so don't bump it
without reworking `main.js` and `src/actions.js`.

`test-harness.mjs` stands in for Companion: it opens the real state stream, builds
the real actions/feedbacks/presets/variables, then fires commands at a live copy of
StreamGraphics Pro and asserts the state came back changed — scoring, on-air
toggles, the timer ticking, baseball counts, unknown-name handling, that every
variable and every action/feedback a preset button references actually exists, and
that button text uses real newlines rather than a literal `\n`.

## Licence

MIT — see LICENSE.
