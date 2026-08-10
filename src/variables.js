/**
 * Variables track live app state so button text can show real numbers —
 * the score, which spreadsheet row is up, the clock — instead of a fixed label.
 *
 * Variable ids are derived from the names you used in the app, lower-cased with
 * anything awkward turned into an underscore. "Court 1" becomes sb_court_1_score1.
 */

export const slug = (s) =>
	String(s ?? '')
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '') || 'unnamed'

const pad = (n) => String(n).padStart(2, '0')

/** Baseball totals are the sum of the per-inning line score. */
const runs = (team) => (team?.line ?? []).reduce((a, n) => a + (Number(n) || 0), 0)

/** ms -> "-MM:SS" or "H:MM:SS", matching how the app itself reads on screen. */
export function fmtTime(ms, showHours) {
	const neg = ms < 0
	let t = Math.floor(Math.abs(ms) / 1000)
	const h = Math.floor(t / 3600)
	t -= h * 3600
	const m = Math.floor(t / 60)
	const s = t - m * 60
	const body = showHours || h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
	return (neg ? '-' : '') + body
}

/** What the presenter timer reads right now, worked out against the show computer's clock. */
export function timerMs(timer, clockOffset) {
	if (!timer) return 0
	const now = Date.now() + (clockOffset || 0)
	const since = timer.running ? now - (timer.anchorServer || 0) : 0
	if (timer.mode === 'up') return (timer.baseMs || 0) + since
	if (timer.mode === 'tod') return (timer.targetEpoch || 0) - now
	return (timer.baseMs || 0) - since
}

export function updateVariableDefinitions(self) {
	const defs = [
		{ variableId: 'connection', name: 'Connection to StreamGraphics Pro' },
		{ variableId: 'app_version', name: 'App version on the show computer' },
		{ variableId: 'timer_time', name: 'Presenter timer — time on the clock' },
		{ variableId: 'timer_mode', name: 'Presenter timer — mode' },
		{ variableId: 'timer_state', name: 'Presenter timer — running / paused' },
		{ variableId: 'presets_on', name: 'How many library presets are on air' },
		{ variableId: 'bl_score1', name: 'Baseball — away runs' },
		{ variableId: 'bl_score2', name: 'Baseball — home runs' },
		{ variableId: 'bl_inning', name: 'Baseball — inning (e.g. Top 3)' },
		{ variableId: 'bl_count', name: 'Baseball — count (e.g. 2-1)' },
		{ variableId: 'bl_outs', name: 'Baseball — outs' },
	]

	for (const b of self.state.scoreboards ?? []) {
		const k = slug(b.name)
		defs.push(
			{ variableId: `sb_${k}_score1`, name: `${b.name} — team 1 score (current game)` },
			{ variableId: `sb_${k}_score2`, name: `${b.name} — team 2 score (current game)` },
			{ variableId: `sb_${k}_team1`, name: `${b.name} — team 1 name` },
			{ variableId: `sb_${k}_team2`, name: `${b.name} — team 2 name` },
			{ variableId: `sb_${k}_game`, name: `${b.name} — current game number` },
			{ variableId: `sb_${k}_onair`, name: `${b.name} — on air?` }
		)
	}

	for (const s of self.state.shows ?? []) {
		const k = slug(s.name)
		defs.push(
			{ variableId: `preset_${k}_onair`, name: `${s.name} — on air?` },
			{ variableId: `preset_${k}_row`, name: `${s.name} — spreadsheet row showing` },
			{ variableId: `preset_${k}_rows`, name: `${s.name} — spreadsheet rows in total` },
			{ variableId: `preset_${k}_label`, name: `${s.name} — label of the row showing` }
		)
		if ((s.reveals ?? []).length) {
			defs.push(
				{ variableId: `preset_${k}_bullet`, name: `${s.name} — bullet showing (0 = none yet)` },
				{ variableId: `preset_${k}_bullets`, name: `${s.name} — bullets in total` }
			)
		}
	}

	self.setVariableDefinitions(defs)
}

export function updateVariableValues(self) {
	const st = self.state
	const v = {
		connection: self.connected ? 'connected' : 'disconnected',
		app_version: self.appVersion || '',
		timer_time: fmtTime(timerMs(st.timer, self.clockOffset), st.timer?.showHours),
		timer_mode: st.timer?.mode === 'up' ? 'count up' : st.timer?.mode === 'tod' ? 'time of day' : 'countdown',
		timer_state: st.timer?.running ? 'running' : 'paused',
		presets_on: (st.shows ?? []).filter((s) => s.on).length,
		// Runs are the sum of the line score — there is no separate total in the app state.
		bl_score1: runs(st.baseball?.teams?.[0]),
		bl_score2: runs(st.baseball?.teams?.[1]),
		bl_inning: st.baseball ? `${st.baseball.half === 'bottom' ? 'Bot' : 'Top'} ${st.baseball.inning ?? ''}`.trim() : '',
		bl_count: st.baseball ? `${st.baseball.balls ?? 0}-${st.baseball.strikes ?? 0}` : '',
		bl_outs: st.baseball?.outs ?? 0,
	}

	for (const b of st.scoreboards ?? []) {
		const k = slug(b.name)
		const g = b.activeGame | 0
		const nm = (t) => [t?.p1, t?.p2].filter(Boolean).join(' / ')
		v[`sb_${k}_score1`] = b.teams?.[0]?.games?.[g] ?? 0
		v[`sb_${k}_score2`] = b.teams?.[1]?.games?.[g] ?? 0
		v[`sb_${k}_team1`] = nm(b.teams?.[0])
		v[`sb_${k}_team2`] = nm(b.teams?.[1])
		v[`sb_${k}_game`] = g + 1
		v[`sb_${k}_onair`] = b.visible ? 'ON AIR' : 'off'
	}

	for (const s of st.shows ?? []) {
		const k = slug(s.name)
		const total = s.rowCount ?? s.rows?.length ?? 0
		const idx = s.rowIndex ?? 0
		v[`preset_${k}_onair`] = s.on ? 'ON AIR' : 'off'
		v[`preset_${k}_row`] = total ? idx + 1 : 0
		v[`preset_${k}_rows`] = total
		v[`preset_${k}_label`] = s.rowLabels?.[idx] ?? ''
		// First bullets/slides layer in the graphic — the one a plain Next button drives.
		const rv = (s.reveals ?? [])[0]
		if (rv) {
			v[`preset_${k}_bullet`] = (rv.index ?? -1) + 1
			v[`preset_${k}_bullets`] = rv.count ?? 0
		}
	}

	self.setVariableValues(v)
}
