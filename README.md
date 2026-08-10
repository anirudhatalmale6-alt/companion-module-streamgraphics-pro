# companion-module-streamgraphics-pro

Bitfocus Companion module for [StreamGraphics Pro](https://www.streamgraphicspro.com) —
live broadcast graphics for OBS, vMix and any browser source.

Talks to the app over its Control API for commands, and over its live state stream
for feedbacks and variables, so button colours and on-screen numbers track the app
in real time rather than being polled.

## Installing it (before it's in Companion's store)

Companion can load a module straight off disk.

1. Unzip this folder somewhere permanent, e.g. `C:\companion-modules\streamgraphics-pro`.
2. In Companion, open **Settings → Developer modules path** and point it at the
   *parent* folder — `C:\companion-modules`.
3. Restart Companion. **StreamGraphics Pro** now appears when you add a connection.

Once it's accepted into Companion's module list this step goes away and it installs
like any other module.

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
npm install
npm run check                       # syntax check every source file
node test-harness.mjs <host> <port> # drive the module against a running app
```

`test-harness.mjs` stands in for Companion: it opens the real state stream, builds
the real actions/feedbacks/presets/variables, then fires commands at a live copy of
StreamGraphics Pro and asserts the state came back changed — scoring, on-air
toggles, the timer ticking, baseball counts, unknown-name handling, and that every
variable referenced by a preset button actually exists.

## Licence

MIT — see LICENSE.
