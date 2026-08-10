import { combineRgb } from '@companion-module/base'
import { slug } from './variables.js'

/**
 * Ready-made buttons. These are what you drag onto a Stream Deck page — they arrive
 * already wired to the right preset or scoreboard, with the feedback attached, so a
 * volunteer operator never has to build a button from scratch.
 */

const BLACK = combineRgb(0, 0, 0)
const WHITE = combineRgb(255, 255, 255)
const DARK = combineRgb(20, 26, 36)
const RED = combineRgb(224, 49, 49)
const GREEN = combineRgb(18, 184, 134)
const BLUE = combineRgb(59, 130, 246)
const AMBER = combineRgb(234, 179, 8)

const style = (text, bg = DARK, color = WHITE, size = '14') => ({
	text,
	size,
	color,
	bgcolor: bg,
})

export function updatePresets(self) {
	const presets = {}

	// ---- status ----
	presets['status'] = {
		type: 'button',
		category: 'Status',
		name: 'Connection status',
		style: style('SGP\nOFFLINE', combineRgb(80, 20, 20)),
		steps: [{ down: [], up: [] }],
		feedbacks: [
			{
				feedbackId: 'connected',
				options: {},
				style: { bgcolor: GREEN, color: BLACK, text: 'SGP\nREADY' },
			},
		],
	}

	// ---- library presets, one set per saved graphic ----
	for (const s of self.state.shows ?? []) {
		const k = slug(s.name)
		presets[`preset_toggle_${k}`] = {
			type: 'button',
			category: 'Library presets',
			name: `${s.name} — toggle on/off air`,
			style: style(s.name, DARK),
			steps: [{ down: [{ actionId: 'preset_toggle', options: { name: s.name } }], up: [] }],
			feedbacks: [{ feedbackId: 'preset_on', options: { name: s.name }, style: { bgcolor: RED, color: WHITE } }],
		}

		if ((s.rowCount ?? 0) > 0) {
			presets[`preset_next_${k}`] = {
				type: 'button',
				category: 'Library presets',
				name: `${s.name} — next row`,
				style: style(`${s.name}\n▶ NEXT\n$(streamgraphics-pro:preset_${k}_row)/$(streamgraphics-pro:preset_${k}_rows)`, DARK, WHITE, '7'),
				steps: [{ down: [{ actionId: 'preset_next', options: { name: s.name } }], up: [] }],
				feedbacks: [],
			}
			presets[`preset_prev_${k}`] = {
				type: 'button',
				category: 'Library presets',
				name: `${s.name} — previous row`,
				style: style(`${s.name}\n◀ PREV`, DARK, WHITE, '7'),
				steps: [{ down: [{ actionId: 'preset_prev', options: { name: s.name } }], up: [] }],
				feedbacks: [],
			}
		}

		// A graphic that builds gets its own ready-made transport: the Next key carries the
		// count so the operator can see where they are in the list without looking away.
		if ((s.reveals ?? []).length) {
			const cat = `Bullets — ${s.name}`
			presets[`bul_next_${k}`] = {
				type: 'button',
				category: cat,
				name: `${s.name} — next bullet`,
				style: style(
					`${s.name}\n▶ NEXT\n$(streamgraphics-pro:preset_${k}_bullet)/$(streamgraphics-pro:preset_${k}_bullets)`,
					GREEN,
					BLACK,
					'7'
				),
				steps: [{ down: [{ actionId: 'bullets_next', options: { name: s.name, layer: '' } }], up: [] }],
				feedbacks: [],
			}
			presets[`bul_prev_${k}`] = {
				type: 'button',
				category: cat,
				name: `${s.name} — take the last bullet back`,
				style: style(`${s.name}\n◀ BACK`, DARK, WHITE, '7'),
				steps: [{ down: [{ actionId: 'bullets_prev', options: { name: s.name, layer: '' } }], up: [] }],
				feedbacks: [],
			}
			presets[`bul_all_${k}`] = {
				type: 'button',
				category: cat,
				name: `${s.name} — reveal every bullet`,
				style: style(`${s.name}\nALL`, BLUE, WHITE, '7'),
				steps: [{ down: [{ actionId: 'bullets_all', options: { name: s.name, layer: '' } }], up: [] }],
				feedbacks: [],
			}
			presets[`bul_blank_${k}`] = {
				type: 'button',
				category: cat,
				name: `${s.name} — back to nothing revealed`,
				style: style(`${s.name}\nBLANK`, DARK, AMBER, '7'),
				steps: [{ down: [{ actionId: 'bullets_blank', options: { name: s.name, layer: '' } }], up: [] }],
				feedbacks: [],
			}
		}
	}

	presets['preset_alloff'] = {
		type: 'button',
		category: 'Library presets',
		name: 'ALL graphics off air',
		style: style('ALL\nOFF', combineRgb(90, 20, 20)),
		steps: [{ down: [{ actionId: 'preset_alloff', options: {} }], up: [] }],
		feedbacks: [],
	}

	// ---- one scoring set per scoreboard, so a 5-court meet is 5 ready pages ----
	for (const b of self.state.scoreboards ?? []) {
		const k = slug(b.name)
		const cat = `Scoreboard — ${b.name}`

		presets[`sb_air_${k}`] = {
			type: 'button',
			category: cat,
			name: `${b.name} — on/off air`,
			style: style(`${b.name}\nAIR`, DARK),
			steps: [
				{ down: [{ actionId: 'sb_show', options: { name: b.name } }], up: [] },
				{ down: [{ actionId: 'sb_hide', options: { name: b.name } }], up: [] },
			],
			feedbacks: [{ feedbackId: 'scoreboard_visible', options: { name: b.name }, style: { bgcolor: RED, color: WHITE } }],
		}
		presets[`sb_p1_${k}`] = {
			type: 'button',
			category: cat,
			name: `${b.name} — point team 1`,
			style: style(`$(streamgraphics-pro:sb_${k}_team1)\n+1\n$(streamgraphics-pro:sb_${k}_score1)`, BLUE, WHITE, '7'),
			steps: [{ down: [{ actionId: 'sb_point', options: { name: b.name, team: '1', delta: '1' } }], up: [] }],
			feedbacks: [],
		}
		presets[`sb_p2_${k}`] = {
			type: 'button',
			category: cat,
			name: `${b.name} — point team 2`,
			style: style(`$(streamgraphics-pro:sb_${k}_team2)\n+1\n$(streamgraphics-pro:sb_${k}_score2)`, BLUE, WHITE, '7'),
			steps: [{ down: [{ actionId: 'sb_point', options: { name: b.name, team: '2', delta: '1' } }], up: [] }],
			feedbacks: [],
		}
		presets[`sb_m1_${k}`] = {
			type: 'button',
			category: cat,
			name: `${b.name} — take a point back, team 1`,
			style: style(`T1\n−1`, combineRgb(60, 60, 70), WHITE, '14'),
			steps: [{ down: [{ actionId: 'sb_point', options: { name: b.name, team: '1', delta: '-1' } }], up: [] }],
			feedbacks: [],
		}
		presets[`sb_m2_${k}`] = {
			type: 'button',
			category: cat,
			name: `${b.name} — take a point back, team 2`,
			style: style(`T2\n−1`, combineRgb(60, 60, 70), WHITE, '14'),
			steps: [{ down: [{ actionId: 'sb_point', options: { name: b.name, team: '2', delta: '-1' } }], up: [] }],
			feedbacks: [],
		}
		presets[`sb_next_${k}`] = {
			type: 'button',
			category: cat,
			name: `${b.name} — next game/set`,
			style: style(`NEXT\nGAME\n$(streamgraphics-pro:sb_${k}_game)`, DARK, WHITE, '7'),
			steps: [{ down: [{ actionId: 'sb_nextgame', options: { name: b.name } }], up: [] }],
			feedbacks: [],
		}
	}

	// ---- presenter timer ----
	presets['timer_air'] = {
		type: 'button',
		category: 'Presenter timer',
		name: 'Timer on/off air',
		style: style('TIMER\nAIR', DARK),
		steps: [
			{ down: [{ actionId: 'timer_air', options: {} }], up: [] },
			{ down: [{ actionId: 'timer_off', options: {} }], up: [] },
		],
		feedbacks: [{ feedbackId: 'timer_visible', options: {}, style: { bgcolor: RED, color: WHITE } }],
	}
	presets['timer_startpause'] = {
		type: 'button',
		category: 'Presenter timer',
		name: 'Timer start / pause',
		style: style('START\n$(streamgraphics-pro:timer_time)', DARK, WHITE, '14'),
		steps: [
			{ down: [{ actionId: 'timer_start', options: {} }], up: [] },
			{ down: [{ actionId: 'timer_pause', options: {} }], up: [] },
		],
		feedbacks: [{ feedbackId: 'timer_running', options: {}, style: { bgcolor: GREEN, color: BLACK } }],
	}
	presets['timer_reset'] = {
		type: 'button',
		category: 'Presenter timer',
		name: 'Timer reset',
		style: style('RESET', DARK),
		steps: [{ down: [{ actionId: 'timer_reset', options: {} }], up: [] }],
		feedbacks: [],
	}
	presets['timer_plus'] = {
		type: 'button',
		category: 'Presenter timer',
		name: 'Timer +30 seconds',
		style: style('+30s', AMBER, BLACK),
		steps: [{ down: [{ actionId: 'timer_adjust', options: { seconds: '30' } }], up: [] }],
		feedbacks: [],
	}
	presets['timer_minus'] = {
		type: 'button',
		category: 'Presenter timer',
		name: 'Timer −30 seconds',
		style: style('−30s', AMBER, BLACK),
		steps: [{ down: [{ actionId: 'timer_adjust', options: { seconds: '-30' } }], up: [] }],
		feedbacks: [],
	}

	// ---- baseball / softball ----
	presets['bl_air'] = {
		type: 'button',
		category: 'Baseball / softball',
		name: 'Board on/off air',
		style: style('BALL\nAIR', DARK),
		steps: [
			{ down: [{ actionId: 'bl_show', options: {} }], up: [] },
			{ down: [{ actionId: 'bl_hide', options: {} }], up: [] },
		],
		feedbacks: [{ feedbackId: 'baseball_visible', options: {}, style: { bgcolor: RED, color: WHITE } }],
	}
	presets['bl_ball'] = {
		type: 'button',
		category: 'Baseball / softball',
		name: 'Ball',
		style: style('BALL\n$(streamgraphics-pro:bl_count)', GREEN, BLACK, '14'),
		steps: [{ down: [{ actionId: 'bl_ball', options: {} }], up: [] }],
		feedbacks: [],
	}
	presets['bl_strike'] = {
		type: 'button',
		category: 'Baseball / softball',
		name: 'Strike',
		style: style('STRIKE\n$(streamgraphics-pro:bl_count)', combineRgb(180, 60, 20), WHITE, '14'),
		steps: [{ down: [{ actionId: 'bl_strike', options: {} }], up: [] }],
		feedbacks: [],
	}
	presets['bl_out'] = {
		type: 'button',
		category: 'Baseball / softball',
		name: 'Out',
		style: style('OUT\n$(streamgraphics-pro:bl_outs)', RED, WHITE, '14'),
		steps: [{ down: [{ actionId: 'bl_out', options: {} }], up: [] }],
		feedbacks: [],
	}
	presets['bl_advance'] = {
		type: 'button',
		category: 'Baseball / softball',
		name: 'Next half-inning',
		style: style('NEXT\n$(streamgraphics-pro:bl_inning)', DARK, WHITE, '7'),
		steps: [{ down: [{ actionId: 'bl_advance', options: {} }], up: [] }],
		feedbacks: [],
	}
	presets['bl_run1'] = {
		type: 'button',
		category: 'Baseball / softball',
		name: 'Run — away',
		style: style('AWAY\n+1\n$(streamgraphics-pro:bl_score1)', BLUE, WHITE, '7'),
		steps: [{ down: [{ actionId: 'bl_run', options: { team: '1', delta: '1' } }], up: [] }],
		feedbacks: [],
	}
	presets['bl_run2'] = {
		type: 'button',
		category: 'Baseball / softball',
		name: 'Run — home',
		style: style('HOME\n+1\n$(streamgraphics-pro:bl_score2)', BLUE, WHITE, '7'),
		steps: [{ down: [{ actionId: 'bl_run', options: { team: '2', delta: '1' } }], up: [] }],
		feedbacks: [],
	}

	self.setPresetDefinitions(presets)
}
