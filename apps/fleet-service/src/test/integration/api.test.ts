import { describe, expect, it } from 'vitest'

// Mock SELF for testing
const SELF = {
	fetch: (url: string) => fetch(url),
}

describe('Fleet Service', () => {
	it('serves the fleet UI on root path', async () => {
		const res = await SELF.fetch('https://example.com/')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('text/html')

		const html = await res.text()
		expect(html).toContain('Fleet Manager')
		expect(html).toContain('Hierarchical Durable Objects Management')
	})

	it('serves the fleet UI on nested paths', async () => {
		const res = await SELF.fetch('https://example.com/agent1/subagent1')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('text/html')

		const html = await res.text()
		expect(html).toContain('Fleet Manager')
		expect(html).toContain('Manager: subagent1')
	})

	it('handles breadcrumb navigation correctly', async () => {
		const res = await SELF.fetch('https://example.com/team1/project1')
		expect(res.status).toBe(200)

		const html = await res.text()
		expect(html).toContain('Root')
		expect(html).toContain('team1')
		expect(html).toContain('project1')
	})
})
