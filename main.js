import { InstanceBase, InstanceStatus, runEntrypoint } from '@companion-module/base'
import { SgpApi } from './src/api.js'
import { updateActions } from './src/actions.js'
import { updateFeedbacks } from './src/feedbacks.js'
import { updatePresets } from './src/presets.js'
import { updateVariableDefinitions, updateVariableValues } from './src/variables.js'

class StreamGraphicsProInstance extends InstanceBase {
	async init(config) {
		this.config = config
		this.state = {}
		this.choices = { presets: [], scoreboards: [] }
		this.connected = false
		this.appVersion = ''
		this.clockOffset = 0
		this.namesKey = ''

		this.api = new SgpApi(this)
		this.rebuildDefinitions()
		this.updateStatus(InstanceStatus.Connecting)
		this.api.connect()

		// The clock has to move between state pushes, or a timer variable on a button
		// would sit frozen until something else in the app changed.
		this.ticker = setInterval(() => {
			if (this.connected) updateVariableValues(this)
		}, 250)
	}

	async destroy() {
		if (this.ticker) clearInterval(this.ticker)
		this.api?.close()
	}

	async configUpdated(config) {
		this.config = config
		this.api.close()
		this.connected = false
		this.updateStatus(InstanceStatus.Connecting)
		this.api.connect()
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'StreamGraphics Pro',
				value:
					'Point this at the computer running StreamGraphics Pro. If Companion is on that same computer, leave the address as 127.0.0.1.<br>' +
					'On a different computer, use the show computer\'s network address — the app shows it on its home page. Windows may ask to allow network access the first time.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Address of the show computer',
				width: 8,
				default: '127.0.0.1',
				regex: '/^[a-zA-Z0-9._-]+$/',
			},
			{
				type: 'number',
				id: 'port',
				label: 'Port',
				width: 4,
				default: 4000,
				min: 1,
				max: 65535,
			},
		]
	}

	/** One place that fires a command and reports failures where the operator can see them. */
	async command(path) {
		try {
			await this.api.send(path)
		} catch (err) {
			this.log('warn', `Command failed (${path}): ${err.message}`)
			// A refused command usually means the name no longer matches something in the app.
			if (/not found/i.test(err.message)) {
				this.updateStatus(InstanceStatus.UnknownWarning, err.message)
			}
		}
	}

	/** Called for every state push from the app. */
	onState(state, version) {
		const first = !this.connected
		this.connected = true
		this.state = state
		this.appVersion = version || ''
		if (first) {
			this.updateStatus(InstanceStatus.Ok)
			this.log('info', `Connected to StreamGraphics Pro ${version || ''} at ${this.config.host}:${this.config.port}`)
		}

		// Presets, scoreboards and their names can change while a show is running.
		// Only rebuild the definitions when the NAMES actually change — rebuilding on
		// every score would throw away the operator's dropdown selections mid-match.
		const key = JSON.stringify([
			(state.shows ?? []).map((s) => s.name),
			(state.scoreboards ?? []).map((b) => b.name),
		])
		if (key !== this.namesKey) {
			this.namesKey = key
			this.rebuildDefinitions()
		}

		updateVariableValues(this)
		this.checkFeedbacks()
	}

	onDisconnected(why) {
		if (this.connected) this.log('warn', `Lost the connection to StreamGraphics Pro: ${why}`)
		this.connected = false
		this.updateStatus(InstanceStatus.ConnectionFailure, why)
		updateVariableValues(this)
		this.checkFeedbacks()
	}

	rebuildDefinitions() {
		this.choices = {
			presets: (this.state.shows ?? []).map((s) => ({ id: s.name, label: s.name })),
			scoreboards: (this.state.scoreboards ?? []).map((b) => ({ id: b.name, label: b.name })),
		}
		updateActions(this)
		updateFeedbacks(this)
		updatePresets(this)
		updateVariableDefinitions(this)
		updateVariableValues(this)
	}
}

runEntrypoint(StreamGraphicsProInstance, [])
