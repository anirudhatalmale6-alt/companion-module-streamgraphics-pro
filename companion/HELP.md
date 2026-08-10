## StreamGraphics Pro

Drive StreamGraphics Pro from Companion — graphics on and off air, scoreboards,
the presenter timer, and baseball/softball.

### Setting it up

1. Start StreamGraphics Pro on the show computer. It needs to be running before
   this connection can go green.
2. Add this connection in Companion and fill in two fields:

   | Field | What to put |
   |---|---|
   | Address of the show computer | `127.0.0.1` if Companion is on that same computer. Otherwise the show computer's network address — the app prints it on its home page, e.g. `192.168.1.50` |
   | Port | `4000` unless you changed it |

3. The connection turns green when it's talking to the app. If it doesn't, check
   the app is actually running, and that Windows didn't block network access the
   first time it asked.

### Getting buttons fast

Don't build buttons by hand. Open the **Presets** tab and drag them across — the
module reads your app and generates buttons that are already wired up:

- one **Scoreboard — <name>** category per scoreboard, so a five-court meet gives
  you five ready-made scoring pages
- a **Library presets** category with a toggle for every saved graphic, plus
  next/previous row buttons for any preset with a spreadsheet attached
- **Presenter timer** and **Baseball / softball** categories

If you rename something in the app, or add a court, the actions, buttons and
variables follow automatically — no reconnect needed.

### Everything is addressed by name

Actions refer to graphics and scoreboards by the **name you gave them in the
app**, not by a hidden id. A button built today keeps working after you rebuild
the show file, as long as the name still matches.

Every dropdown also accepts a typed value, so you can drive it from a variable —
handy for "current court" style setups.

### Button colours that mean something

Add a feedback so a button shows what's actually happening rather than what you
last pressed:

- **Library preset is on air** — red while it's on the Program output
- **Scoreboard is on air** — red while that board is showing
- **Presenter timer is on air / is running**
- **Baseball board is on air**
- **Connected to StreamGraphics Pro** — put this on a spare button. It goes green
  when the link is healthy. Worth a glance before you go live.

### Variables

Put live numbers on a button instead of a fixed label:

| Variable | What it is |
|---|---|
| `$(streamgraphics-pro:sb_court_1_score1)` | team 1's score in the current game on Court 1 |
| `$(streamgraphics-pro:sb_court_1_team1)` | team 1's name |
| `$(streamgraphics-pro:sb_court_1_game)` | which game/set is up |
| `$(streamgraphics-pro:timer_time)` | the presenter clock, ticking |
| `$(streamgraphics-pro:preset_<name>_row)` | which spreadsheet row is showing |
| `$(streamgraphics-pro:preset_<name>_label)` | that row's label |
| `$(streamgraphics-pro:bl_count)` | baseball count, e.g. `2-1` |
| `$(streamgraphics-pro:connection)` | connected / disconnected |

Names become variable ids in lower case with anything awkward turned into an
underscore — `Court 1` becomes `court_1`, `Marcus Bell — Head Coach` becomes
`marcus_bell_head_coach`. The full list is in Companion's variables panel.

### If it stops working mid-show

The module reconnects on its own every few seconds, and picks straight back up
when the app comes back. Nothing needs restarting. If the app itself was closed
and reopened, your buttons keep working — they're matched by name.

### Support

mark@streamgraphicspro.com · www.streamgraphicspro.com
