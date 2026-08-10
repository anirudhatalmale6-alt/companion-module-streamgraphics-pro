import { combineRgb } from '@companion-module/base'

/**
 * Feedbacks colour a button from live app state, so an operator can see at a glance
 * what is actually on air rather than remembering what they last pressed.
 */

const RED = combineRgb(224, 49, 49)
const WHITE = combineRgb(255, 255, 255)
const GREEN = combineRgb(18, 184, 134)
const BLACK = combineRgb(0, 0, 0)

const eq = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase()

export function updateFeedbacks(self) {
	const presets = self.choices.presets
	const boards = self.choices.scoreboards

	self.setFeedbackDefinitions({
		preset_on: {
			type: 'boolean',
			name: 'Library preset is on air',
			description: 'Turns the button red while this preset is on the Program output',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [
				{
					type: 'dropdown',
					label: 'Library preset',
					id: 'name',
					default: presets[0]?.id ?? '',
					choices: presets,
					allowCustom: true,
				},
			],
			callback: (fb) => !!self.state.shows?.find((s) => eq(s.name, fb.options.name))?.on,
		},

		scoreboard_visible: {
			type: 'boolean',
			name: 'Scoreboard is on air',
			description: 'Turns the button red while this scoreboard is showing',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [
				{
					type: 'dropdown',
					label: 'Scoreboard',
					id: 'name',
					default: boards[0]?.id ?? '',
					choices: boards,
					allowCustom: true,
					tooltip: 'Leave blank for the first scoreboard',
				},
			],
			callback: (fb) => {
				const list = self.state.scoreboards ?? []
				const b = String(fb.options.name ?? '').trim() ? list.find((x) => eq(x.name, fb.options.name)) : list[0]
				return !!b?.visible
			},
		},

		timer_visible: {
			type: 'boolean',
			name: 'Presenter timer is on air',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [],
			callback: () => !!self.state.timer?.visible,
		},

		timer_running: {
			type: 'boolean',
			name: 'Presenter timer is running',
			description: 'Green while the clock is actually ticking',
			defaultStyle: { bgcolor: GREEN, color: BLACK },
			options: [],
			callback: () => !!self.state.timer?.running,
		},

		baseball_visible: {
			type: 'boolean',
			name: 'Baseball board is on air',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [],
			callback: () => !!self.state.baseball?.visible,
		},

		connected: {
			type: 'boolean',
			name: 'Connected to StreamGraphics Pro',
			description: 'Use this on a status button so a dead connection is obvious before you go live',
			defaultStyle: { bgcolor: GREEN, color: BLACK },
			options: [],
			callback: () => self.connected,
		},
	})
}
