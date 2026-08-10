import http from 'http'

/**
 * Talks to StreamGraphics Pro on the show computer.
 *
 * Two channels:
 *   - one-shot HTTP GETs against /api/... to fire commands
 *   - a long-lived SSE stream from /events that pushes the whole app state on
 *     every change, which is what makes button colours and variables live
 *
 * SSE is done by hand on top of http.request rather than pulling in a dependency:
 * the format is three lines and we only care about `data:`.
 */
export class SgpApi {
	constructor(instance) {
		this.instance = instance
		this.req = null
		this.retry = null
		this.stopped = false
		this.buf = ''
	}

	get base() {
		const host = (this.instance.config?.host || '127.0.0.1').trim()
		const port = Number(this.instance.config?.port) || 4000
		return { host, port }
	}

	/** Fire a command. Returns the parsed JSON body, or throws. */
	async send(path) {
		const { host, port } = this.base
		return new Promise((resolve, reject) => {
			const req = http.request(
				{ host, port, path, method: 'GET', timeout: 5000 },
				(res) => {
					let body = ''
					res.setEncoding('utf8')
					res.on('data', (c) => (body += c))
					res.on('end', () => {
						let json = null
						try {
							json = JSON.parse(body)
						} catch (e) {
							/* not JSON — fall through */
						}
						if (res.statusCode >= 200 && res.statusCode < 300 && json?.ok !== false) resolve(json ?? {})
						else reject(new Error(json?.error || `HTTP ${res.statusCode}`))
					})
				}
			)
			req.on('timeout', () => req.destroy(new Error('timed out')))
			req.on('error', reject)
			req.end()
		})
	}

	/** Open the state stream and keep it open. Safe to call repeatedly. */
	connect() {
		this.stopped = false
		this.close(true)
		const { host, port } = this.base

		const req = http.request(
			{ host, port, path: '/events', method: 'GET', headers: { Accept: 'text/event-stream' } },
			(res) => {
				if (res.statusCode !== 200) {
					this.instance.onDisconnected(`the app answered HTTP ${res.statusCode}`)
					res.resume()
					this.scheduleRetry()
					return
				}
				this.buf = ''
				res.setEncoding('utf8')
				res.on('data', (chunk) => this.feed(chunk))
				res.on('end', () => {
					this.instance.onDisconnected('the app closed the connection')
					this.scheduleRetry()
				})
				res.on('error', () => {
					this.instance.onDisconnected('the connection dropped')
					this.scheduleRetry()
				})
			}
		)
		req.on('error', (err) => {
			this.instance.onDisconnected(err.code === 'ECONNREFUSED' ? 'nothing is listening — is StreamGraphics Pro running?' : err.message)
			this.scheduleRetry()
		})
		req.end()
		this.req = req
	}

	/** Accumulate stream text and hand each complete `data:` frame to the instance. */
	feed(chunk) {
		this.buf += chunk
		let i
		while ((i = this.buf.indexOf('\n\n')) >= 0) {
			const frame = this.buf.slice(0, i)
			this.buf = this.buf.slice(i + 2)
			for (const line of frame.split('\n')) {
				if (!line.startsWith('data:')) continue // ': ping' keep-alives and 'retry:' land here
				try {
					const msg = JSON.parse(line.slice(5).trim())
					if (msg?.state) this.instance.onState(msg.state, msg.version)
				} catch (e) {
					/* a partial or non-JSON frame — nothing useful to do but skip it */
				}
			}
		}
		// A wedged stream would otherwise grow this forever.
		if (this.buf.length > 4_000_000) this.buf = ''
	}

	scheduleRetry() {
		if (this.stopped || this.retry) return
		this.retry = setTimeout(() => {
			this.retry = null
			if (!this.stopped) this.connect()
		}, 3000)
	}

	close(keepRetrying = false) {
		if (!keepRetrying) this.stopped = true
		if (this.retry) {
			clearTimeout(this.retry)
			this.retry = null
		}
		if (this.req) {
			try {
				this.req.destroy()
			} catch (e) {
				/* already gone */
			}
			this.req = null
		}
	}
}
