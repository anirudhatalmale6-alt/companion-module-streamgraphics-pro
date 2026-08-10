/**
 * Every action is one URL against the app's Control API.
 *
 * Things are addressed by the NAME you gave them in StreamGraphics Pro, not by an
 * internal id, so a button keeps working after the show file is rebuilt. The
 * dropdowns are filled from live state, and every one of them also accepts a typed
 * value so variables like $(internal:custom_court) work.
 */

const q = (s) => encodeURIComponent(String(s ?? ''))

export function updateActions(self) {
	const presets = self.choices.presets
	const boards = self.choices.scoreboards

	const presetField = {
		type: 'dropdown',
		label: 'Library preset',
		id: 'name',
		default: presets[0]?.id ?? '',
		choices: presets,
		allowCustom: true,
		tooltip: 'The name as it appears in the Show Library',
	}
	const boardField = {
		type: 'dropdown',
		label: 'Scoreboard',
		id: 'name',
		default: boards[0]?.id ?? '',
		choices: boards,
		allowCustom: true,
		tooltip: 'Leave blank to use the first scoreboard',
	}
	const teamField = {
		type: 'dropdown',
		label: 'Team',
		id: 'team',
		default: '1',
		choices: [
			{ id: '1', label: 'Team 1 (top row)' },
			{ id: '2', label: 'Team 2 (bottom row)' },
		],
	}

	const layerField = {
		type: 'textinput',
		label: 'Bullets layer (optional)',
		id: 'layer',
		default: '',
		useVariables: true,
		tooltip: 'Only needed when one graphic holds more than one bullet list — type the layer name. Blank = the first one.',
	}

	// Resolve a dropdown that may hold a variable expression.
	const name = async (opt) => (await self.parseVariablesInString(String(opt ?? ''))).trim()
	const revealUrl = (cmd, preset, layer) =>
		`/api/bullets/${cmd}?preset=${q(preset)}` + (layer ? `&layer=${q(layer)}` : '')

	self.setActionDefinitions({
		// ---- Show Library ----
		preset_on: {
			name: 'Library preset: on air',
			options: [presetField],
			callback: async (a) => self.command(`/api/preset/on?name=${q(await name(a.options.name))}`),
		},
		preset_off: {
			name: 'Library preset: off air',
			options: [presetField],
			callback: async (a) => self.command(`/api/preset/off?name=${q(await name(a.options.name))}`),
		},
		preset_toggle: {
			name: 'Library preset: toggle',
			options: [presetField],
			callback: async (a) => self.command(`/api/preset/toggle?name=${q(await name(a.options.name))}`),
		},
		preset_alloff: {
			name: 'Library preset: ALL off air',
			options: [],
			callback: async () => self.command('/api/preset/alloff'),
		},
		preset_next: {
			name: 'Library preset: next spreadsheet row',
			options: [presetField],
			callback: async (a) => self.command(`/api/preset/next?name=${q(await name(a.options.name))}`),
		},
		preset_prev: {
			name: 'Library preset: previous spreadsheet row',
			options: [presetField],
			callback: async (a) => self.command(`/api/preset/prev?name=${q(await name(a.options.name))}`),
		},
		preset_row: {
			name: 'Library preset: go to spreadsheet row',
			options: [
				presetField,
				{ type: 'textinput', label: 'Row number (1 = first)', id: 'n', default: '1', useVariables: true },
			],
			callback: async (a) => {
				const n = parseInt(await self.parseVariablesInString(String(a.options.n ?? '1')), 10) || 1
				return self.command(`/api/preset/row?name=${q(await name(a.options.name))}&n=${n}`)
			},
		},

		// ---- Bullet builds / slide decks inside a preset ----
		// The layer box is optional: leave it blank and the first bullets (or slides) layer in
		// the graphic is the one that steps, which is what a one-list graphic always wants.
		bullets_next: {
			name: 'Bullets: reveal the next point',
			options: [presetField, layerField],
			callback: async (a) => self.command(revealUrl('next', await name(a.options.name), await name(a.options.layer))),
		},
		bullets_prev: {
			name: 'Bullets: take the last point back',
			options: [presetField, layerField],
			callback: async (a) => self.command(revealUrl('prev', await name(a.options.name), await name(a.options.layer))),
		},
		bullets_first: {
			name: 'Bullets: back to the first point',
			options: [presetField, layerField],
			callback: async (a) => self.command(revealUrl('first', await name(a.options.name), await name(a.options.layer))),
		},
		bullets_all: {
			name: 'Bullets: reveal every point',
			options: [presetField, layerField],
			callback: async (a) => self.command(revealUrl('all', await name(a.options.name), await name(a.options.layer))),
		},
		bullets_blank: {
			name: 'Bullets: back to nothing revealed',
			options: [presetField, layerField],
			callback: async (a) => self.command(revealUrl('blank', await name(a.options.name), await name(a.options.layer))),
		},
		bullets_goto: {
			name: 'Bullets: jump to a point',
			options: [
				presetField,
				layerField,
				{ type: 'textinput', label: 'Point number (1 = first, 0 = blank)', id: 'n', default: '1', useVariables: true },
			],
			callback: async (a) => {
				const n = parseInt(await self.parseVariablesInString(String(a.options.n ?? '1')), 10)
				return self.command(
					revealUrl('goto', await name(a.options.name), await name(a.options.layer)) + `&n=${isNaN(n) ? 1 : n}`
				)
			},
		},

		// ---- Presenter timer ----
		timer_start: { name: 'Timer: start', options: [], callback: async () => self.command('/api/timer/start') },
		timer_pause: { name: 'Timer: pause', options: [], callback: async () => self.command('/api/timer/pause') },
		timer_reset: { name: 'Timer: reset', options: [], callback: async () => self.command('/api/timer/reset') },
		timer_air: { name: 'Timer: on air', options: [], callback: async () => self.command('/api/timer/air') },
		timer_off: { name: 'Timer: off air', options: [], callback: async () => self.command('/api/timer/off') },
		timer_set: {
			name: 'Timer: set countdown',
			options: [
				{
					type: 'textinput',
					label: 'Time as MM:SS (or HH:MM:SS)',
					id: 'mmss',
					default: '05:00',
					useVariables: true,
					tooltip: 'Sets the timer to count down from this',
				},
			],
			callback: async (a) => {
				const v = (await self.parseVariablesInString(String(a.options.mmss ?? ''))).trim()
				return self.command(`/api/timer/set?mmss=${q(v)}`)
			},
		},
		timer_adjust: {
			name: 'Timer: add or remove time',
			options: [
				{
					type: 'textinput',
					label: 'Seconds (negative to take time away)',
					id: 'seconds',
					default: '30',
					useVariables: true,
				},
			],
			callback: async (a) => {
				const v = parseFloat(await self.parseVariablesInString(String(a.options.seconds ?? '0'))) || 0
				return self.command(`/api/timer/adjust?seconds=${v}`)
			},
		},

		// ---- Scoreboards ----
		sb_point: {
			name: 'Scoreboard: score a point',
			options: [
				boardField,
				teamField,
				{
					type: 'textinput',
					label: 'Points (use -1 to take one back)',
					id: 'delta',
					default: '1',
					useVariables: true,
				},
			],
			callback: async (a) => {
				const d = parseInt(await self.parseVariablesInString(String(a.options.delta ?? '1')), 10)
				return self.command(
					`/api/scoreboard/point?name=${q(await name(a.options.name))}&team=${a.options.team}&delta=${isNaN(d) ? 1 : d}`
				)
			},
		},
		sb_show: {
			name: 'Scoreboard: on air',
			options: [boardField],
			callback: async (a) => self.command(`/api/scoreboard/show?name=${q(await name(a.options.name))}`),
		},
		sb_hide: {
			name: 'Scoreboard: off air',
			options: [boardField],
			callback: async (a) => self.command(`/api/scoreboard/hide?name=${q(await name(a.options.name))}`),
		},
		sb_nextgame: {
			name: 'Scoreboard: start next game / set',
			options: [boardField],
			callback: async (a) => self.command(`/api/scoreboard/nextgame?name=${q(await name(a.options.name))}`),
		},
		sb_restart: {
			name: 'Scoreboard: restart the match',
			options: [boardField],
			callback: async (a) => self.command(`/api/scoreboard/restart?name=${q(await name(a.options.name))}`),
		},

		// ---- Baseball / softball ----
		bl_run: {
			name: 'Baseball: score a run',
			options: [
				teamField,
				{ type: 'textinput', label: 'Runs', id: 'delta', default: '1', useVariables: true },
			],
			callback: async (a) => {
				const d = parseInt(await self.parseVariablesInString(String(a.options.delta ?? '1')), 10)
				return self.command(`/api/baseball/run?team=${a.options.team}&delta=${isNaN(d) ? 1 : d}`)
			},
		},
		bl_ball: { name: 'Baseball: ball', options: [], callback: async () => self.command('/api/baseball/ball') },
		bl_strike: { name: 'Baseball: strike', options: [], callback: async () => self.command('/api/baseball/strike') },
		bl_out: { name: 'Baseball: out', options: [], callback: async () => self.command('/api/baseball/out') },
		bl_clearcount: {
			name: 'Baseball: clear the count',
			options: [],
			callback: async () => self.command('/api/baseball/clearcount'),
		},
		bl_advance: {
			name: 'Baseball: advance half-inning',
			options: [],
			callback: async () => self.command('/api/baseball/advance'),
		},
		bl_show: { name: 'Baseball: on air', options: [], callback: async () => self.command('/api/baseball/show') },
		bl_hide: { name: 'Baseball: off air', options: [], callback: async () => self.command('/api/baseball/hide') },
	})
}
