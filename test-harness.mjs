/**
 * Drives the module's real code against a running copy of StreamGraphics Pro,
 * standing in for Companion. Not shipped — this is how I verify a build.
 *
 *   node test-harness.mjs [host] [port]
 */
import { SgpApi } from './src/api.js'
import { updateActions } from './src/actions.js'
import { updateFeedbacks } from './src/feedbacks.js'
import { updatePresets } from './src/presets.js'
import { updateVariableDefinitions, updateVariableValues } from './src/variables.js'

const host = process.argv[2] || '127.0.0.1'
const port = Number(process.argv[3] || 4000)

let fails = 0
const ok = (label, cond, extra = '') => {
	if (!cond) fails++
	console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`)
}

const self = {
	config: { host, port },
	state: {},
	choices: { presets: [], scoreboards: [] },
	connected: false,
	appVersion: '',
	clockOffset: 0,
	actions: {},
	feedbacks: {},
	presets: {},
	varDefs: [],
	vars: {},
	setActionDefinitions(d) { this.actions = d },
	setFeedbackDefinitions(d) { this.feedbacks = d },
	setPresetDefinitions(d) { this.presets = d },
	setVariableDefinitions(d) { this.varDefs = d },
	setVariableValues(v) { Object.assign(this.vars, v) },
	checkFeedbacks() {},
	log(lvl, m) { console.log(`   [${lvl}] ${m}`) },
	async parseVariablesInString(s) { return s },
	async command(path) {
		try { await this.api.send(path); return true } catch (e) { console.log(`   command FAILED ${path}: ${e.message}`); return false }
	},
	onDisconnected(why) { this.connected = false; console.log(`   disconnected: ${why}`) },
	onState(state, version) {
		this.connected = true
		this.state = state
		this.appVersion = version || ''
		this.choices = {
			presets: (state.shows ?? []).map((s) => ({ id: s.name, label: s.name })),
			scoreboards: (state.scoreboards ?? []).map((b) => ({ id: b.name, label: b.name })),
		}
		if (!this.built) {
			this.built = true
			updateActions(this); updateFeedbacks(this); updatePresets(this); updateVariableDefinitions(this)
		}
		updateVariableValues(this)
		if (this.waiter) { const w = this.waiter; this.waiter = null; w() }
	},
}
self.api = new SgpApi(self)

const nextState = () => new Promise((r) => { self.waiter = r; setTimeout(r, 4000) })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

console.log(`\n--- StreamGraphics Pro module harness -> ${host}:${port} ---\n`)
self.api.connect()
await nextState()

ok('SSE connected and state received', self.connected)
ok('app version reported', !!self.appVersion, self.appVersion)
ok('actions built', Object.keys(self.actions).length >= 25, `${Object.keys(self.actions).length} actions`)
ok('feedbacks built', Object.keys(self.feedbacks).length >= 6, `${Object.keys(self.feedbacks).length} feedbacks`)
ok('presets built', Object.keys(self.presets).length >= 10, `${Object.keys(self.presets).length} buttons`)
ok('variables defined', self.varDefs.length >= 15, `${self.varDefs.length} variables`)
ok('scoreboard choices found', self.choices.scoreboards.length > 0, JSON.stringify(self.choices.scoreboards.map((c) => c.id)))
ok('preset choices found', self.choices.presets.length > 0, `${self.choices.presets.length} presets`)

const board = self.state.scoreboards[0]
const bk = board.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

// --- scoring round trip -------------------------------------------------
const before = Number(self.vars[`sb_${bk}_score1`] ?? 0)
await self.actions.sb_point.callback({ options: { name: board.name, team: '1', delta: '1' } })
await nextState()
ok('scoring a point moves the score variable', Number(self.vars[`sb_${bk}_score1`]) === before + 1,
	`${before} -> ${self.vars[`sb_${bk}_score1`]}`)

await self.actions.sb_point.callback({ options: { name: board.name, team: '1', delta: '-1' } })
await nextState()
ok('taking a point back works', Number(self.vars[`sb_${bk}_score1`]) === before)

// --- on air / off air + feedback ----------------------------------------
await self.actions.sb_show.callback({ options: { name: board.name } })
await nextState()
ok('scoreboard on air', self.vars[`sb_${bk}_onair`] === 'ON AIR')
ok('scoreboard feedback true when on air', self.feedbacks.scoreboard_visible.callback({ options: { name: board.name } }) === true)
await self.actions.sb_hide.callback({ options: { name: board.name } })
await nextState()
ok('scoreboard off air', self.vars[`sb_${bk}_onair`] === 'off')
ok('scoreboard feedback false when off air', self.feedbacks.scoreboard_visible.callback({ options: { name: board.name } }) === false)
ok('blank scoreboard name falls back to the first board',
	self.feedbacks.scoreboard_visible.callback({ options: { name: '' } }) === false)

// --- library preset ------------------------------------------------------
const show = self.state.shows[0]
const sk = show.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
await self.actions.preset_on.callback({ options: { name: show.name } })
await nextState()
ok('preset on air', self.vars[`preset_${sk}_onair`] === 'ON AIR', show.name)
ok('preset feedback true', self.feedbacks.preset_on.callback({ options: { name: show.name } }) === true)
ok('preset feedback is case-insensitive', self.feedbacks.preset_on.callback({ options: { name: show.name.toUpperCase() } }) === true)
ok('presets_on counter moved', Number(self.vars.presets_on) >= 1)
await self.actions.preset_alloff.callback({ options: {} })
await nextState()
ok('all off clears everything', Number(self.vars.presets_on) === 0)

// --- timer ---------------------------------------------------------------
await self.actions.timer_set.callback({ options: { mmss: '02:30' } })
await nextState()
ok('timer set to 02:30', self.vars.timer_time === '02:30', String(self.vars.timer_time))
await self.actions.timer_start.callback({ options: {} })
await nextState()
ok('timer reports running', self.vars.timer_state === 'running')
ok('timer_running feedback true', self.feedbacks.timer_running.callback({}) === true)
await sleep(1300)
updateVariableValues(self)
ok('clock actually ticks down between pushes', self.vars.timer_time !== '02:30', String(self.vars.timer_time))
await self.actions.timer_adjust.callback({ options: { seconds: '30' } })
await nextState()
await self.actions.timer_pause.callback({ options: {} })
await nextState()
ok('timer pauses', self.vars.timer_state === 'paused')
await self.actions.timer_reset.callback({ options: {} })
await nextState()

// --- baseball ------------------------------------------------------------
await self.actions.bl_ball.callback({ options: {} })
await self.actions.bl_strike.callback({ options: {} })
await nextState()
ok('baseball count variable reads right', self.vars.bl_count === '1-1', String(self.vars.bl_count))
await self.actions.bl_clearcount.callback({ options: {} })
await nextState()
ok('clear count works', self.vars.bl_count === '0-0')
const r0 = Number(self.vars.bl_score1)
await self.actions.bl_run.callback({ options: { team: '1', delta: '2' } })
await nextState()
ok('baseball runs add up from the line score', Number(self.vars.bl_score1) === r0 + 2, `${r0} -> ${self.vars.bl_score1}`)
await self.actions.bl_run.callback({ options: { team: '1', delta: '-2' } })
await nextState()

// --- bad input should be handled, not thrown ----------------------------
const badOk = await self.command('/api/preset/on?name=' + encodeURIComponent('does not exist at all'))
ok('unknown name fails cleanly instead of throwing', badOk === false)
ok('connected feedback true', self.feedbacks.connected.callback({}) === true)

// --- preset buttons reference variables that really exist ---------------
const known = new Set(self.varDefs.map((d) => d.variableId))
let bad = []
for (const [id, p] of Object.entries(self.presets)) {
	for (const m of String(p.style?.text ?? '').matchAll(/\$\(streamgraphics-pro:([a-z0-9_]+)\)/g)) {
		if (!known.has(m[1])) bad.push(`${id} -> ${m[1]}`)
	}
}
ok('every variable used on a preset button is defined', bad.length === 0, bad.join(', '))

self.api.close()
console.log(`\n${fails === 0 ? 'ALL PASS' : fails + ' FAILED'}\n`)
process.exit(fails === 0 ? 0 : 1)
