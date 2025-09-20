import { Hono } from 'hono'
import { useWorkersLogger } from 'workers-tagged-logger'

import { useNotFound, useOnError } from '@repo/hono-helpers'

import type { App } from './context'
import { InventoryAgent } from './durable-objects/fleet-manager'
import { FleetManagerPage } from './components/FleetManagerPage'

// Export for Durable Object binding
export { InventoryAgent }

const app = new Hono<App>()
	.use(
		'*',
		// middleware
		(c, next) =>
			useWorkersLogger(c.env.NAME, {
				environment: c.env.ENVIRONMENT,
				release: c.env.SENTRY_RELEASE,
			})(c, next)
	)

	.onError(useOnError())
	.notFound(useNotFound())


	// Root fleet manager UI
	.get('/', async (c) => {
		// Extract tenant from subdomain or use default
		const host = c.req.header('host') || ''
		const hostParts = host.split('.')
		let tenantId = 'demo'

		// Check for subdomain pattern (tenant.domain.com)
		if (hostParts.length >= 3 && hostParts[0] !== 'www') {
			tenantId = hostParts[0]
		}

		console.log(`[BREADCRUMB] Root path: /, Tenant: ${tenantId}`)
		return c.html(<FleetManagerPage path="/" tenantId={tenantId} />)
	})

	// Handle hierarchical paths for fleet management
	.all('/*', async (c) => {
		const path = c.req.path

		// Extract tenant from subdomain or path
		const host = c.req.header('host') || ''
		const hostParts = host.split('.')
		let tenantId: string | null = null
		let tenantPath = path

		// Check for subdomain pattern (tenant.domain.com)
		if (hostParts.length >= 3 && hostParts[0] !== 'www') {
			tenantId = hostParts[0]
			console.log(`[TENANT] Detected subdomain tenant: ${tenantId}`)
		}
		// Check for path-based tenant (/tenant/{tenant-id}/...)
		else if (path.startsWith('/tenant/')) {
			const pathParts = path.split('/').filter(Boolean)
			if (pathParts.length >= 2) {
				tenantId = pathParts[1]
				tenantPath = '/' + pathParts.slice(2).join('/')
				console.log(`[TENANT] Detected path-based tenant: ${tenantId}, path: ${tenantPath}`)
			}
		}
		// Check for single-level path as tenant (/{tenant-id} or /{tenant-id}/...)
		else {
			const pathParts = path.split('/').filter(Boolean)
			if (pathParts.length >= 1) {
				tenantId = pathParts[0]
				tenantPath = '/' + pathParts.slice(1).join('/')
				console.log(`[TENANT] Detected single-level tenant: ${tenantId}, path: ${tenantPath}`)
			}
		}

		// If no tenant specified, use 'demo' for development
		if (!tenantId) {
			tenantId = 'demo'
			console.log(`[TENANT] Using default tenant: ${tenantId}`)
		}

		// Handle WebSocket upgrade requests
		if (c.req.header('upgrade') === 'websocket') {
			return handleWebSocketUpgrade(c, tenantPath, tenantId)
		}

		// For UI requests, serve the HTML directly
		// Exclude API endpoints like /messages, /state, /increment, etc.
		const url = new URL(c.req.url)
		const pathWithoutQuery = tenantPath || url.pathname
		const isApiRequest = pathWithoutQuery.includes('/api/') ||
			pathWithoutQuery.endsWith('/messages') ||
			pathWithoutQuery.endsWith('/state') ||
			pathWithoutQuery.endsWith('/increment') ||
			pathWithoutQuery.endsWith('/delete-subtree') ||
			pathWithoutQuery.endsWith('/inventory/stock') ||
			pathWithoutQuery.endsWith('/inventory/query') ||
			pathWithoutQuery.endsWith('/inventory/sync') ||
			pathWithoutQuery.endsWith('/inventory/alerts') ||
			pathWithoutQuery.endsWith('/ai/analyze') ||
			pathWithoutQuery.endsWith('/ai/forecast') ||
			pathWithoutQuery.endsWith('/ai/insights') ||
			c.req.method !== 'GET'

		if (c.req.method === 'GET' && !isApiRequest) {
			const uiPath = tenantPath.endsWith('/ws') ? tenantPath.slice(0, -3) : tenantPath
			console.log(`[BREADCRUMB] Original path: ${path}, Tenant: ${tenantId}, UI path: ${uiPath}`)
			return c.html(<FleetManagerPage path={uiPath} tenantId={tenantId} />)
		}

		// For any other requests, forward to the appropriate DO
		// Find the fleet path by finding the longest path that doesn't end with known API endpoints
		let fleetPath = pathWithoutQuery
		let apiEndpoint = '/'

		// Check if this is an API call by looking for known endpoints
		const apiEndpoints = ['/messages', '/state', '/increment', '/delete-subtree', '/message', '/inventory/stock', '/inventory/query', '/inventory/sync', '/inventory/alerts', '/ai/analyze', '/ai/forecast', '/ai/insights', '/debug/locations', '/debug/db']
		for (const endpoint of apiEndpoints) {
			if (pathWithoutQuery.endsWith(endpoint)) {
				fleetPath = pathWithoutQuery.substring(0, pathWithoutQuery.length - endpoint.length)
				apiEndpoint = endpoint
				break
			}
		}

		// Special handling for inventory API paths that might be nested
		if (pathWithoutQuery.includes('/inventory/')) {
			const inventoryIndex = pathWithoutQuery.indexOf('/inventory/')
			fleetPath = pathWithoutQuery.substring(0, inventoryIndex) || '/'
			apiEndpoint = pathWithoutQuery.substring(inventoryIndex)
		}

		// Handle WebSocket paths
		if (tenantPath.endsWith('/ws')) {
			fleetPath = tenantPath.slice(0, -3)
			apiEndpoint = '/'
		}

		// Default fleetPath to root if empty
		if (!fleetPath) {
			fleetPath = '/'
		}

		// Create tenant-specific Durable Object ID for complete isolation
		const tenantFleetId = `${tenantId}:${fleetPath}`
		console.log(`[TENANT] Request: ${pathWithoutQuery} -> Tenant: "${tenantId}", Fleet: "${fleetPath}", API: "${apiEndpoint}"`)
		console.log(`[DO] Creating DO for tenant-fleet: ${tenantFleetId}`)
		console.log(`[HEADERS] Setting x-fleet-path to: "${fleetPath}"`)

		const id = c.env.FLEET_MANAGER.idFromName(tenantFleetId)
		const stub = c.env.FLEET_MANAGER.get(id)

		// Create target URL with just the API endpoint
		const targetUrl = new URL(c.req.url)
		targetUrl.pathname = apiEndpoint

		console.log(`Forwarding ${c.req.method} ${targetUrl.pathname}${targetUrl.search} to DO for fleet path: ${fleetPath}`)

		// Create a new request with path information in headers
		const newRequest = new Request(targetUrl.toString(), {
			method: c.req.method,
			headers: {
				...Object.fromEntries(c.req.raw.headers.entries()),
				'x-fleet-path': fleetPath,
				'x-tenant-id': tenantId || 'demo'
			},
			body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body : undefined
		})

		return stub.fetch(newRequest)
	})

// Helper function to handle WebSocket upgrades
async function handleWebSocketUpgrade(c: any, path: string, tenantId: string): Promise<Response> {
	// Remove /ws suffix to get the fleet path
	const fleetPath = path.endsWith('/ws') ? path.slice(0, -3) : path

	// Create tenant-specific Durable Object ID for complete isolation
	const tenantFleetId = `${tenantId}:${fleetPath}`
	console.log(`[WEBSOCKET] Creating DO for tenant-fleet: ${tenantFleetId}`)

	// Get or create Durable Object for this tenant-specific path
	const id = c.env.FLEET_MANAGER.idFromName(tenantFleetId)
	const stub = c.env.FLEET_MANAGER.get(id)

	// Create a new request with path information in headers
	const newRequest = new Request(c.req.raw, {
		headers: {
			...Object.fromEntries(c.req.raw.headers.entries()),
			'x-fleet-path': fleetPath,
			'x-tenant-id': tenantId
		}
	})

	// Forward the WebSocket upgrade request to the Durable Object
	return stub.fetch(newRequest)
}

// Export Workflows for Cloudflare Workflows binding
export { ReorderWorkflow } from './workflows/reorder-workflow'
export { DemandForecastWorkflow } from './workflows/demand-forecast-workflow'
export { InventorySyncWorkflow } from './workflows/inventory-sync-workflow'

// Default export with Hono app and queue handler
export default {
	fetch: app.fetch,
	async queue(batch: any, env: any) {
		console.log('Processing queue batch:', batch)

		// Handle different queue types based on the queue name
		for (const message of batch.messages) {
			try {
				console.log('Processing message:', message.body)

				// You can add specific logic here based on the queue name
				// The queue name is available in batch.queue
				switch (batch.queue) {
					case 'notifications':
						console.log('Processing notification:', message.body)
						// Add notification processing logic here
						break
					case 'audit-logs':
						console.log('Processing audit log:', message.body)
						// Add audit log processing logic here
						break
					case 'embeddings':
						console.log('Processing embedding:', message.body)
						// Add embedding processing logic here
						break
					default:
						console.log('Unknown queue:', batch.queue)
				}

				// Acknowledge the message
				message.ack()
			} catch (error) {
				console.error('Error processing queue message:', error)
				// Retry the message by not acknowledging it
				// The message will be retried according to the queue configuration
			}
		}
	}
}
