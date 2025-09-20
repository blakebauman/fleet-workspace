import { AIService } from '../services/ai-service'
import {
	AgentNameSchema,
	BaseFleetManager,
	InventoryError,
	StockUpdateSchema,
} from '../services/base-fleet-manager'
import { InventoryService } from '../services/inventory-service'
import { QueueService } from '../services/queue-service'
import { createAgentSDK } from '../services/real-agent-sdk'
import { VectorizeService } from '../services/vectorize-service'
import { WorkflowService } from '../services/workflow-service'

import type { DemandForecast, InventoryInsights } from '../services/ai-service'
import type {
	Env,
	FleetMessage,
	InventoryUpdate,
	StoredMessage,
} from '../services/base-fleet-manager'
import type { RealAgentSDK } from '../services/real-agent-sdk'

// Enhanced InventoryAgent using service architecture
export class InventoryAgent extends BaseFleetManager {
	private agentSDK: RealAgentSDK
	private tenantId: string = 'demo'
	private aiService: AIService
	private inventoryService: InventoryService
	private queueService: QueueService
	private vectorizeService: VectorizeService
	private workflowService: WorkflowService

	// Chat statistics tracking
	private chatStats = {
		messagesToday: 0,
		actionsExecuted: 0,
		successfulActions: 0,
		successRate: 0.0,
	}

	constructor(state: DurableObjectState, env: Env) {
		super(state, env)
		console.log('InventoryAgent constructor called')

		// Initialize real AgentSDK (will be updated when tenant is determined)
		this.agentSDK = createAgentSDK(this.env, this.tenantId, this.currentPath)

		// Initialize services
		this.aiService = new AIService(env)
		this.inventoryService = new InventoryService(env)
		this.queueService = new QueueService(env)
		this.vectorizeService = new VectorizeService(env)
		this.workflowService = new WorkflowService(env)

		// Override the initialization to include chat history loading
		void state.blockConcurrencyWhile(async () => {
			console.log('[INIT] Initializing InventoryAgent from storage...')
			// Load state for the default path - will be updated when fetch() sets currentPath
			await this.loadStateFromStorage()

			// Load chat history
			await this.loadChatHistory()

			// Load chat statistics
			await this.loadChatStatistics()

			// Clean up old chat messages
			await this.cleanupOldChatMessages()

			this.initializationComplete = true
			console.log('[INIT] InventoryAgent initialization complete - ready to handle requests')

			// ✅ Broadcast initial state to any connected clients
			this.broadcastState()
		})

		console.log('InventoryAgent constructor completed')
	}

	// Update tenant and path for this agent instance
	private async updateTenantAndPath(tenantId: string, path: string) {
		this.tenantId = tenantId
		this.currentPath = path
		// Recreate AgentSDK with new tenant and path
		this.agentSDK = createAgentSDK(this.env, this.tenantId, this.currentPath)

		// Reload chat history for the new path
		await this.loadChatHistory()
	}

	// Real AI integration using AgentSDK
	async aiRun(
		model: string,
		messages: Array<{ role: string; content: string }>
	): Promise<{ response: string }> {
		try {
			const result = await this.agentSDK.ai.run(model, messages)
			return { response: result.response }
		} catch (error) {
			console.error('AI call failed:', error)
			// Fallback to mock for development if AI binding fails
			console.warn('Falling back to mock AI response due to error')
			return {
				response: JSON.stringify(
					this.generateMockAIResponse(messages[messages.length - 1]?.content || '')
				),
			}
		}
	}

	async sql(query: string, params?: any[]): Promise<{ results?: any[] }> {
		try {
			console.log(`SQL Query: ${query}`, params)

			// Use real SQLite backend
			const result = this.sqlStorage.exec(query, ...(params || []))

			return { results: result.toArray() }
		} catch (error) {
			console.error('SQL query failed:', error)
			return { results: [] }
		}
	}

	async schedule(name: string, data: any, options?: { delay?: number }): Promise<void> {
		try {
			// Use real AgentSDK for workflow scheduling
			await this.agentSDK.schedule.create(name, data, options)
			console.log(`Workflow scheduled: ${name}`, data)
		} catch (error) {
			console.error('Scheduling failed:', error)
			// Fallback to immediate execution if scheduling fails
			console.log(`Executing workflow immediately: ${name}`, data)
			await this.executeWorkflow(name, data)
		}
	}

	// Execute workflow logic
	private async executeWorkflow(name: string, data: any): Promise<void> {
		switch (name) {
			case 'reorderWorkflow':
				await this.executeReorderWorkflow(data)
				break
			case 'demandForecastWorkflow':
				await this.runDemandForecastWorkflow()
				break
			default:
				console.log(`Unknown workflow: ${name}`)
		}
	}

	// Execute reorder workflow
	private async executeReorderWorkflow(data: any): Promise<void> {
		try {
			console.log(`Executing reorder workflow: ${data.quantity} units of ${data.sku}`)

			// Simulate reorder process
			await new Promise((resolve) => setTimeout(resolve, 2000))

			// Update inventory with reorder
			await this.processStockUpdate({
				sku: data.sku,
				quantity: data.quantity,
				operation: 'increment',
				timestamp: new Date().toISOString(),
				location: this.currentPath,
			})

			this.broadcastToWebSockets({
				type: 'message',
				from: 'Reorder System',
				content: `✅ Reorder completed: ${data.quantity} units of ${data.sku} ordered with ${data.urgency} priority`,
			})
		} catch (error) {
			console.error('Reorder workflow failed:', error)
		}
	}

	// Mock AI response generator for POC
	private generateMockAIResponse(prompt: string): any {
		if (prompt.includes('shouldReorder')) {
			return {
				shouldReorder: true,
				reorderQuantity: 50,
				urgency: 'medium',
				leadTimeMs: 7 * 24 * 60 * 60 * 1000,
				reasoning: 'Current stock below threshold. Historical data suggests moderate demand.',
				confidence: 0.8,
			}
		} else if (prompt.includes('forecast')) {
			return [
				{
					sku: 'MOCK-SKU',
					predictedDemand: 30,
					confidence: 0.75,
					trendDirection: 'stable',
					reasoning: 'Steady demand pattern observed over past 30 days',
				},
			]
		}
		return { message: 'Mock AI response for POC demonstration' }
	}

	// Initialize state from storage
	async fetch(request: Request): Promise<Response> {
		try {
			const url = new URL(request.url)
			console.log(`[DO] Received request: ${request.method} ${url.pathname}${url.search}`)

			// Extract tenant and path from headers
			const tenantId = request.headers.get('x-tenant-id') || 'demo'
			const fleetPath = request.headers.get('x-fleet-path')
			console.log(`[DO] x-tenant-id header: "${tenantId}"`)
			console.log(`[DO] x-fleet-path header: "${fleetPath}"`)

			// Update tenant and path if they've changed
			if (tenantId !== this.tenantId || fleetPath !== this.currentPath) {
				await this.updateTenantAndPath(tenantId, fleetPath || '/')
				console.log(`[DO] Updated tenant: "${this.tenantId}", path: "${this.currentPath}"`)
			}

			// Only load state once per request cycle, and reload if path changed
			const stateKey = `loaded:${this.currentPath}`
			if (!this.stateLoaded || !this.cache.has(stateKey)) {
				console.log(`Loading state for path: ${this.currentPath}`)
				await this.loadState()
				this.stateLoaded = true
				this.cache.set(stateKey, { data: true, expires: Date.now() + 60000 }) // Cache for 1 minute
			}

			// Periodically clean up old messages (only do this occasionally to avoid performance impact)
			if (Math.random() < 0.01) {
				// 1% chance on each request
				this.cleanupOldMessages()
			}

			// Handle WebSocket upgrade
			if (request.headers.get('upgrade') === 'websocket') {
				return this.handleWebSocket(request)
			}

			// Handle HTTP requests
			console.log(
				`FleetManager handling request: ${request.method} ${url.pathname} from path: ${this.currentPath}`
			)

			switch (url.pathname) {
				case '/state':
					return this.getState()
				case '/debug/db': {
					// Check what's actually in the database
					const dbState = this.sqlStorage.exec(
						`
					SELECT * FROM fleet_state WHERE id = ?
				`,
						this.currentPath
					)
					const dbResult = dbState.toArray()[0] as any
					return Response.json({
						currentPath: this.currentPath,
						inMemoryAgents: Array.from(this.state.agents),
						inMemoryCounter: this.state.counter,
						dbState: dbResult || null,
						dbAgents: dbResult ? JSON.parse(dbResult.agents || '[]') : null,
						stateLoaded: this.stateLoaded,
					})
				}
				case '/increment':
					return this.increment()
				case '/message':
					return this.handleMessage(request)
				case '/messages':
					return this.getMessages(request)
				case '/delete-subtree':
					return this.handleDeleteSubtree()
				// INVENTORY POC API ENDPOINTS
				case '/inventory/stock':
					return this.handleStockOperation(request)
				case '/inventory/query':
					return this.handleInventoryQuery(request)
				case '/inventory/sync':
					return this.handleInventorySync(request)
				case '/inventory/alerts':
					return this.getInventoryAlerts(request)
				// AI-POWERED AGENTIC ENDPOINTS
				case '/ai/analyze':
					return this.handleAIAnalysis(request)
				case '/ai/forecast':
					return this.handleDemandForecast(request)
				case '/ai/insights':
					return this.getAIInsights(request)
				case '/debug/locations':
					return this.getDebugLocations()
				default:
					console.log(`No route matched for: ${url.pathname}`)
					return new Response('Not found', { status: 404 })
			}
		} catch (error) {
			return this.handleError(error)
		}
	}

	private async handleWebSocket(_request: Request): Promise<Response> {
		const webSocketPair = new WebSocketPair()
		const client = webSocketPair[0]
		const server = webSocketPair[1]

		// Accept the WebSocket connection using Hibernation API
		this.ctx.acceptWebSocket(server)
		this.state.websockets.add(server)

		console.log(
			`WebSocket connected to path: ${this.currentPath}, agents: ${Array.from(this.state.agents).join(', ')}, counter: ${this.state.counter}`
		)

		// ✅ Send current state to new client (only if initialization is complete)
		if (this.initializationComplete) {
			this.sendToWebSocket(server, {
				type: 'state',
				counter: this.state.counter,
				agents: Array.from(this.state.agents),
			})
		} else {
			console.log('[INIT] Delaying state broadcast until initialization completes')
		}

		// Send chat history to new client (this includes all relevant messages)
		await this.sendChatHistory(server)

		// Send current chat statistics to new client
		this.broadcastChatStats()

		return new Response(null, {
			status: 101,
			// @ts-ignore - webSocket is a valid property for WebSocket upgrade responses
			webSocket: client,
		})
	}

	// Handle WebSocket messages
	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
		try {
			const data = JSON.parse(message as string) as FleetMessage
			console.log(
				`[DO ${this.currentPath}] Received WebSocket message:`,
				data.type,
				new Date().toISOString()
			)

			switch (data.type) {
				case 'increment':
					await this.incrementCounter()
					break
				case 'createAgent':
					await this.createAgent(String((data as any).name))
					break
				case 'deleteAgent':
					await this.deleteAgent(String((data as any).name))
					break
				case 'directMessage':
					await this.sendDirectMessage(
						String((data as any).agentName),
						String((data as any).message)
					)
					break
				case 'broadcast':
					await this.broadcastMessage(String((data as any).message))
					break
				case 'ping':
					// Respond to ping with pong to keep connection alive
					console.log(
						`[DO ${this.currentPath}] Responding to ping with pong and state`,
						new Date().toISOString()
					)
					this.sendToWebSocket(ws, { type: 'pong' })
					// Also send current state to ensure UI is up to date
					this.sendToWebSocket(ws, {
						type: 'state',
						counter: this.state.counter,
						agents: Array.from(this.state.agents),
					})
					break
				case 'pong':
					// Pong received, connection is alive
					console.log('Received pong from client')
					break
				// INVENTORY POC MESSAGE HANDLERS
				case 'stockUpdate':
					await this.processStockUpdate(data)
					break
				case 'stockQuery':
					await this.processStockQuery(ws, data)
					break
				case 'inventorySync':
					await this.processInventorySync(data)
					break
				case 'chatMessage':
					await this.processChatMessage(ws, data)
					break
				case 'testPersistence':
					// Test command to verify chat statistics persistence
					console.log(`[CHAT] Received test persistence command`)
					await this.testChatStatsPersistence()
					this.sendToWebSocket(ws, {
						type: 'message',
						from: 'system',
						content: 'Persistence test completed. Check console logs for results.',
					})
					break
				case 'testPersistence25s':
					// Test command to verify persistence over 25 seconds
					console.log(`[CHAT] Received 25-second persistence test command`)
					this.sendToWebSocket(ws, {
						type: 'message',
						from: 'system',
						content: 'Starting 25-second persistence test. Check console logs for results.',
					})
					// Run test in background
					// eslint-disable-next-line @typescript-eslint/no-floating-promises
					this.testPersistenceOverTime()
					break
				default:
					this.sendToWebSocket(ws, {
						type: 'error',
						message: `Unknown message type: ${(data as any).type}`,
					})
			}
		} catch (error) {
			this.sendToWebSocket(ws, {
				type: 'error',
				message: `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`,
			})
		}
	}

	// Handle WebSocket close
	async webSocketClose(
		ws: WebSocket,
		code: number,
		reason: string,
		wasClean: boolean
	): Promise<void> {
		console.log(
			`[DO ${this.currentPath}] WebSocket closed: ${code} ${reason} (clean: ${wasClean}) at ${new Date().toISOString()}. Remaining connections: ${this.state.websockets.size - 1}`
		)
		this.state.websockets.delete(ws)
	}

	// Handle WebSocket errors
	async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
		console.error('WebSocket error:', error)
		console.log(
			`WebSocket error for path: ${this.currentPath}. Removing connection. Remaining: ${this.state.websockets.size - 1}`
		)
		this.state.websockets.delete(ws)
		// Close the connection with error code
		ws.close(1011, 'Internal error')
	}

	// Load state from SQLite storage
	private async loadState(): Promise<void> {
		// If state is already loaded and we're just changing paths, reload from storage
		if (this.stateLoaded) {
			console.log(`[RELOAD] Reloading state for new location: ${this.currentPath}`)
			await this.loadStateFromStorage()
			return
		}

		// This should not happen since blockConcurrencyWhile handles initial loading
		console.log(`[FALLBACK] Loading state for location: ${this.currentPath}`)
		try {
			await this.loadStateFromStorage()
		} catch (error) {
			console.error('[FALLBACK] Failed to load state:', error)
		}
	}

	// Save state to SQLite storage
	// saveState is now handled by BaseFleetManager

	// Increment counter
	private async incrementCounter(): Promise<void> {
		this.state.counter++
		await this.saveState()
		this.broadcastState()
	}

	// Create a new agent
	private async createAgent(name: string): Promise<void> {
		try {
			console.log(`Creating agent "${name}" at path: ${this.currentPath}`)

			// Validate agent name
			const trimmedName = this.validateInput(AgentNameSchema, name.trim())

			if (this.state.agents.has(trimmedName)) {
				throw new InventoryError('AGENT_EXISTS', `Agent "${trimmedName}" already exists`, 409)
			}

			this.state.agents.add(trimmedName)
			await this.saveState()

			// Clear state cache since agents changed
			this.cache.delete(`state:${this.currentPath}`)
			this.cache.delete(`loaded:${this.currentPath}`)

			console.log(
				`Agent "${trimmedName}" created successfully. Current agents: ${Array.from(this.state.agents).join(', ')}`
			)

			// Verify the agent was saved by reading it back
			const verifyResult = this.sqlStorage.exec(
				`
			SELECT agents FROM fleet_state WHERE id = ?
		`,
				this.currentPath
			)
			const savedAgents = verifyResult.toArray()[0] as any
			console.log(`Verification - saved agents in DB: ${savedAgents?.agents || 'none'}`)

			console.log(`Broadcasting agentCreated message for ${trimmedName}`)
			this.broadcastToWebSockets({
				type: 'agentCreated',
				name: trimmedName,
			})

			console.log(`Broadcasting state update with ${this.state.agents.size} agents`)
			this.broadcastState()
		} catch (error) {
			if (error instanceof InventoryError) {
				this.broadcastToWebSockets({
					type: 'error',
					message: error.message,
				})
			} else {
				console.error('Failed to create agent:', error)
				this.broadcastToWebSockets({
					type: 'error',
					message: 'Failed to create agent due to an unexpected error',
				})
			}
		}
	}

	// Delete an agent and all its children
	private async deleteAgent(name: string): Promise<void> {
		if (!this.state.agents.has(name)) {
			this.broadcastToWebSockets({
				type: 'error',
				message: `Agent "${name}" does not exist`,
			})
			return
		}

		try {
			// First, recursively delete the child agent's entire subtree
			const encodedName = encodeURIComponent(name)
			const childPath =
				this.currentPath === '/' ? `/${encodedName}` : `${this.currentPath}/${encodedName}`
			const childId = this.env.FLEET_MANAGER.idFromName(childPath)
			const childStub = this.env.FLEET_MANAGER.get(childId)

			// Tell the child to delete itself and all its descendants
			await childStub.fetch(
				new Request('http://internal/delete-subtree', {
					method: 'POST',
				})
			)

			// Remove from our local state
			this.state.agents.delete(name)
			await this.saveState()

			// Clear state cache since agents changed
			this.cache.delete(`state:${this.currentPath}`)

			this.broadcastToWebSockets({
				type: 'agentDeleted',
				name,
			})

			this.broadcastState()
		} catch (error) {
			console.error(`Error deleting agent ${name}:`, error)
			// Still remove from local state even if cascade fails
			this.state.agents.delete(name)
			await this.saveState()

			this.broadcastToWebSockets({
				type: 'message',
				from: 'system',
				content: `Deleted ${name} (cascade may have failed)`,
			})

			this.broadcastState()
		}
	}

	// Send direct message to a specific agent
	private async sendDirectMessage(agentName: string, message: string): Promise<void> {
		if (!this.state.agents.has(agentName)) {
			this.broadcastToWebSockets({
				type: 'error',
				message: `Agent "${agentName}" does not exist`,
			})
			return
		}

		try {
			// Store the outgoing message in memory
			this.storeMessage(this.currentPath || 'root', agentName, message, 'direct')

			// Get the child agent's DO and send the message
			const encodedName = encodeURIComponent(agentName)
			const childPath =
				this.currentPath === '/' ? `/${encodedName}` : `${this.currentPath}/${encodedName}`
			const childId = this.env.FLEET_MANAGER.idFromName(childPath)
			const childStub = this.env.FLEET_MANAGER.get(childId)

			// Send message to child DO
			await childStub.fetch(
				new Request('http://internal/message', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						from: this.currentPath || 'root',
						content: message,
						type: 'direct',
					}),
				})
			)

			const systemMessage = `Message sent to ${agentName}: ${message}`

			// Store the system confirmation message in memory
			this.storeMessage('system', null, systemMessage, 'system')

			this.broadcastToWebSockets({
				type: 'message',
				from: 'system',
				content: systemMessage,
			})
		} catch (error) {
			const errorMessage = `Failed to send message to ${agentName}: ${error instanceof Error ? error.message : 'Unknown error'}`

			// Store the error message in memory
			this.storeMessage('system', null, errorMessage, 'system')

			this.broadcastToWebSockets({
				type: 'error',
				message: errorMessage,
			})
		}
	}

	// Broadcast message to all child agents
	private async broadcastMessage(message: string): Promise<void> {
		console.log(
			`Broadcasting message "${message}" from path: ${this.currentPath} to agents: ${Array.from(this.state.agents).join(', ')}`
		)

		// Store the broadcast message in memory
		this.storeMessage(
			this.currentPath || 'root',
			null, // null for broadcast
			message,
			'broadcast'
		)

		// Send to all child agent DOs
		const promises = Array.from(this.state.agents).map(async (agentName) => {
			try {
				const encodedName = encodeURIComponent(agentName)
				const childPath =
					this.currentPath === '/' ? `/${encodedName}` : `${this.currentPath}/${encodedName}`
				const childId = this.env.FLEET_MANAGER.idFromName(childPath)
				const childStub = this.env.FLEET_MANAGER.get(childId)

				await childStub.fetch(
					new Request('http://internal/message', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							from: this.currentPath || 'root',
							content: message,
							type: 'broadcast',
						}),
					})
				)
			} catch (error) {
				console.error(`Failed to send broadcast to ${agentName}:`, error)
			}
		})

		await Promise.allSettled(promises)

		// Also broadcast to connected clients in the current instance
		console.log(`Broadcasting to local WebSockets: ${this.state.websockets.size} connections`)
		this.broadcastToWebSockets({
			type: 'message',
			from: `📢 ${this.currentPath || 'root'}`,
			content: message,
		})
	}

	// Get current state with caching
	private async getState(): Promise<Response> {
		const cacheKey = `state:${this.currentPath}`
		const cached = this.getCached<{ counter: number; agents: string[] }>(cacheKey)

		if (cached) {
			return Response.json(cached)
		}

		const state = {
			counter: this.state.counter,
			agents: Array.from(this.state.agents),
		}

		// Cache for 30 seconds
		this.setCache(cacheKey, state, 30000)

		return Response.json(state)
	}

	// Increment counter via HTTP
	private async increment(): Promise<Response> {
		await this.incrementCounter()
		return Response.json({ success: true, counter: this.state.counter })
	}

	// Handle incoming messages from other DOs
	private async handleMessage(request: Request): Promise<Response> {
		try {
			const messageData = (await request.json()) as {
				from: string
				content: string
				type: 'direct' | 'broadcast'
			}

			// Store the received message in memory
			this.storeMessage(
				messageData.from,
				messageData.type === 'direct' ? this.currentPath || 'root' : null,
				messageData.content,
				messageData.type
			)

			// Broadcast the received message to all connected clients
			this.broadcastToWebSockets({
				type: 'message',
				from: `${messageData.type === 'direct' ? '📨' : '📢'} ${messageData.from}`,
				content: messageData.content,
			})

			return new Response('Message received', { status: 200 })
		} catch {
			return new Response('Invalid message format', { status: 400 })
		}
	}

	// Handle deletion of entire subtree
	private async handleDeleteSubtree(): Promise<Response> {
		try {
			// First delete all our children
			const deletePromises = Array.from(this.state.agents).map(async (agentName) => {
				try {
					const encodedName = encodeURIComponent(agentName)
					const childPath =
						this.currentPath === '/' ? `/${encodedName}` : `${this.currentPath}/${encodedName}`
					const childId = this.env.FLEET_MANAGER.idFromName(childPath)
					const childStub = this.env.FLEET_MANAGER.get(childId)

					await childStub.fetch(
						new Request('http://internal/delete-subtree', {
							method: 'POST',
						})
					)
				} catch (error) {
					console.error(`Failed to delete child ${agentName}:`, error)
				}
			})

			await Promise.allSettled(deletePromises)

			// Clear our own state
			this.state.agents.clear()
			this.state.counter = 0
			this.state.messages = []
			await this.saveState()

			// Close all WebSocket connections
			for (const ws of this.state.websockets) {
				try {
					ws.close()
				} catch (error) {
					console.error('Error closing WebSocket:', error)
				}
			}
			this.state.websockets.clear()

			return new Response('Subtree deleted', { status: 200 })
		} catch (error) {
			console.error('Error in handleDeleteSubtree:', error)
			return new Response('Error deleting subtree', { status: 500 })
		}
	}

	// Broadcast current state to all connected WebSockets
	// broadcastState is now handled by BaseFleetManager

	// broadcastToWebSockets is now handled by BaseFleetManager

	// sendToWebSocket is now handled by BaseFleetManager

	// Removed isValidAgentName method - now using Zod validation

	// Store a message in SQLite
	// storeMessage is now handled by BaseFleetManager

	// Get message history from SQLite
	private async getMessages(request: Request): Promise<Response> {
		try {
			console.log('Getting messages from SQLite...')
			console.log('Current path:', this.currentPath)

			// Check if sqlStorage is available
			if (!this.sqlStorage) {
				console.error('SQLite storage not available')
				return Response.json(
					{
						error: 'Database not available',
						details: 'SQLite storage not initialized',
					},
					{ status: 500 }
				)
			}

			const url = new URL(request.url)
			const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
			const offset = parseInt(url.searchParams.get('offset') || '0')

			console.log(`Querying messages with limit=${limit}, offset=${offset}`)

			// Check if table exists and reinitialize if needed
			try {
				const tableCheck = this.sqlStorage.exec(`
					SELECT name FROM sqlite_master WHERE type='table' AND name='stored_messages'
				`)
				const tableExists = tableCheck.toArray().length > 0
				console.log('stored_messages table exists:', tableExists)

				if (!tableExists) {
					console.log('Table does not exist, reinitializing schema...')
					this.initializeSchema()

					// Verify table was created
					const verifyCheck = this.sqlStorage.exec(`
						SELECT name FROM sqlite_master WHERE type='table' AND name='stored_messages'
					`)
					const nowExists = verifyCheck.toArray().length > 0
					console.log('stored_messages table created successfully:', nowExists)

					if (!nowExists) {
						throw new Error('Failed to create stored_messages table')
					}
				}
			} catch (tableError) {
				console.error('Error checking/creating table:', tableError)
				return Response.json(
					{
						error: 'Database table initialization failed',
						details: tableError instanceof Error ? tableError.message : 'Unknown error',
					},
					{ status: 500 }
				)
			}

			// Get total count
			const countResult = this.sqlStorage.exec(
				`
			SELECT COUNT(*) as total FROM stored_messages WHERE location = ?
		`,
				this.currentPath
			)
			const totalCount = (countResult.toArray()[0] as any)?.total || 0
			console.log('Total message count:', totalCount)

			// Get paginated messages
			const messagesResult = this.sqlStorage.exec(
				`
			SELECT * FROM stored_messages
			WHERE location = ?
			ORDER BY timestamp DESC
			LIMIT ${limit} OFFSET ${offset}
		`,
				this.currentPath
			)

			const messages = (messagesResult.toArray() as any[]).map((msg) => ({
				id: msg.id,
				timestamp: msg.timestamp,
				from_agent: msg.from_agent,
				to_agent: msg.to_agent,
				content: msg.content,
				message_type: msg.message_type,
			}))

			console.log(`Found ${messages.length} messages`)

			return Response.json({
				messages: messages.reverse(), // Return in chronological order
				totalCount,
				hasMore: offset + limit < totalCount,
			})
		} catch (error) {
			console.error('Failed to retrieve messages:', error)
			console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
			console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
			return Response.json(
				{
					error: 'Failed to retrieve messages',
					details: error instanceof Error ? error.message : 'Unknown error',
				},
				{ status: 500 }
			)
		}
	}

	// Debug endpoint to show all locations and their agents
	private getDebugLocations(): Response {
		try {
			const locationsResult = this.sqlStorage.exec(`
				SELECT id, counter, agents, agent_type, updated_at
				FROM fleet_state
				ORDER BY updated_at DESC
			`)

			const locations = locationsResult.toArray().map((row: any) => ({
				location: row.id,
				counter: row.counter,
				agents: JSON.parse(row.agents || '[]'),
				agentType: row.agent_type,
				lastUpdated: new Date(row.updated_at * 1000).toISOString(),
			}))

			return Response.json({
				currentPath: this.currentPath,
				currentStateAgents: Array.from(this.state.agents),
				allLocations: locations,
				timestamp: new Date().toISOString(),
			})
		} catch (error) {
			return Response.json(
				{
					error: 'Failed to get debug info',
					details: error instanceof Error ? error.message : 'Unknown error',
				},
				{ status: 500 }
			)
		}
	}

	// Clean up old messages (retention policy)
	private cleanupOldMessages(retentionDays: number = 30): void {
		try {
			const cutoffDate = new Date()
			cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
			const cutoffTimestamp = cutoffDate.toISOString()

			// Delete old messages from SQLite (timestamp is stored as TEXT in ISO format)
			const deleteResult = this.sqlStorage.exec(
				`
			DELETE FROM stored_messages
			WHERE location = ? AND timestamp < ?
		`,
				this.currentPath,
				cutoffTimestamp
			)

			const deletedCount = (deleteResult as any).meta?.changes || 0
			if (deletedCount > 0) {
				console.log(`Cleaned up ${deletedCount} old messages older than ${retentionDays} days`)
			}

			// Also clean up in-memory cache
			this.state.messages = this.state.messages.filter(
				(msg) => new Date(msg.timestamp) >= cutoffDate
			)
		} catch (error) {
			console.error('Failed to cleanup old messages:', error)
		}
	}

	// Send recent message history to a specific client
	private async sendMessageHistoryToClient(ws: WebSocket, limit: number = 20): Promise<void> {
		try {
			// Get recent messages, sorted by timestamp (newest first), then reverse for chronological order
			const recentMessages = [...this.state.messages]
				.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
				.slice(0, limit)
				.reverse() // Send in chronological order

			// Send each message as a separate WebSocket message to maintain the chat flow
			for (const msg of recentMessages) {
				const fromDisplay =
					msg.message_type === 'direct'
						? `📨 ${msg.from_agent}`
						: msg.message_type === 'broadcast'
							? `📢 ${msg.from_agent}`
							: msg.from_agent

				this.sendToWebSocket(ws, {
					type: 'message',
					from: fromDisplay,
					content: msg.content,
				})

				// Small delay to prevent overwhelming the client
				await new Promise((resolve) => setTimeout(resolve, 10))
			}

			console.log(`Sent ${recentMessages.length} historical messages to client`)
		} catch (error) {
			console.error('Failed to send message history to client:', error)
		}
	}

	// ==============================================
	// AI-POWERED AGENTIC WORKFLOWS
	// ==============================================

	// AI-powered inventory analysis using Agents SDK with structured outputs
	// Use AIService for inventory analysis
	async analyzeInventoryTrends(sku: string): Promise<any> {
		try {
			const item = this.state.inventory.get(sku)
			if (!item) {
				throw new Error(`SKU ${sku} not found in inventory`)
			}

			// Gather historical data from agent's SQL database
			const salesHistory = await this.sql(
				`
				SELECT * FROM inventory_transactions
				WHERE sku = ? AND location = ?
				ORDER BY timestamp DESC
				LIMIT 30
			`,
				[sku, this.currentPath]
			)

			// Get seasonal patterns and trends
			const seasonalData = await this.getSeasonalityData(sku)
			const salesVelocity = await this.getSalesVelocity(sku)

			// Use AIService for analysis
			const insights = await this.aiService.analyzeInventoryTrends(
				sku,
				item,
				this.currentPath,
				salesHistory.results || [],
				salesVelocity,
				seasonalData.seasonalityFactor
			)

			// Store analysis in agent's database
			await this.sql(
				`
				INSERT INTO inventory_analysis (sku, location, analysis, confidence, timestamp)
				VALUES (?, ?, ?, ?, ?)
			`,
				[
					sku,
					this.currentPath,
					JSON.stringify(insights),
					insights.confidence,
					new Date().toISOString(),
				]
			)

			console.log(`AI Analysis for ${sku}:`, insights)
			return insights
		} catch (error) {
			console.error(`Failed to analyze inventory trends for ${sku}:`, error)
			// Return conservative fallback analysis
			const item = this.state.inventory.get(sku)
			return {
				sku,
				shouldReorder: (item?.currentStock || 0) <= (item?.lowStockThreshold || 10),
				reorderQuantity: (item?.lowStockThreshold || 10) * 2,
				urgency: 'medium',
				leadTimeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
				reasoning: 'Fallback analysis due to AI processing error',
				confidence: 0.5,
			}
		}
	}

	// Autonomous reorder workflow
	async processLowStockAlert(sku: string, currentStock: number): Promise<void> {
		try {
			console.log(`Processing low stock alert for ${sku} (${currentStock} units)`)

			// AI-powered analysis
			const insights = await this.analyzeInventoryTrends(sku)

			if (insights.shouldReorder) {
				// For high-value or critical items, use human-in-the-loop
				if (insights.urgency === 'critical' || insights.reorderQuantity > 1000) {
					const approved = await this.requestHumanApproval({
						type: 'reorder_approval',
						sku,
						currentStock,
						recommendedQuantity: insights.reorderQuantity,
						urgency: insights.urgency,
						reasoning: insights.reasoning,
						estimatedCost: insights.reorderQuantity * 10, // Mock cost calculation
					})

					if (!approved) {
						console.log(`Reorder for ${sku} rejected by human operator`)
						return
					}
				}

				// Schedule the reorder workflow
				await this.schedule(
					'reorderWorkflow',
					{
						sku,
						quantity: insights.reorderQuantity,
						urgency: insights.urgency,
						reasoning: insights.reasoning,
					},
					{
						delay: insights.urgency === 'critical' ? 0 : insights.leadTimeMs / 10, // Immediate for critical, otherwise delayed
					}
				)

				// Propagate reorder decision to parent agents
				await this.propagateReorderDecision(sku, insights)

				// Broadcast to connected clients
				this.broadcastToWebSockets({
					type: 'message',
					from: 'AI Inventory Agent',
					content: `🤖 Auto-reorder initiated: ${insights.reorderQuantity} units of ${sku} (${insights.urgency} priority)`,
				})
			}

			// Store decision in audit trail
			await this.sql(
				`
				INSERT INTO inventory_decisions (sku, location, decision_type, reasoning, timestamp)
				VALUES (?, ?, ?, ?, ?)
			`,
				[sku, this.currentPath, 'reorder_analysis', insights.reasoning, new Date().toISOString()]
			)
		} catch (error) {
			console.error(`Failed to process low stock alert for ${sku}:`, error)
		}
	}

	// Human-in-the-loop approval for critical decisions
	async requestHumanApproval(decision: any): Promise<boolean> {
		try {
			// Broadcast approval request to connected clients
			this.broadcastToWebSockets({
				type: 'message',
				from: 'System',
				content: `🚨 APPROVAL NEEDED: ${decision.type} for ${decision.sku} - ${decision.recommendedQuantity} units (${decision.urgency} priority). Estimated cost: $${decision.estimatedCost}. Reason: ${decision.reasoning}`,
			})

			// For POC, auto-approve after short delay (in production, this would wait for human input)
			await new Promise((resolve) => setTimeout(resolve, 2000))

			console.log(`Auto-approved ${decision.type} for ${decision.sku} (POC mode)`)
			return true
		} catch (error) {
			console.error('Failed to request human approval:', error)
			return false // Fail safe
		}
	}

	// Daily demand forecasting workflow
	async runDemandForecastWorkflow(): Promise<void> {
		try {
			console.log(`Running demand forecast for location: ${this.currentPath}`)

			// Gather inventory data
			const inventoryData = Array.from(this.state.inventory.entries()).map(([sku, item]) => ({
				sku,
				currentStock: item.currentStock,
				lowThreshold: item.lowStockThreshold,
			}))

			if (inventoryData.length === 0) {
				console.log('No inventory items to forecast')
				return
			}

			// Define structured output schema for demand forecasts
			const _DemandForecastSchema = {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						sku: { type: 'string' },
						predictedDemand: { type: 'number', minimum: 0 },
						confidence: { type: 'number', minimum: 0, maximum: 1 },
						trendDirection: { type: 'string', enum: ['increasing', 'decreasing', 'stable'] },
						reasoning: { type: 'string' },
					},
					required: ['sku', 'predictedDemand', 'confidence', 'trendDirection', 'reasoning'],
				},
			}

			// AI-powered demand forecasting
			const forecastPrompt = `Analyze inventory patterns and predict 30-day demand:

CURRENT INVENTORY:
${JSON.stringify(inventoryData, null, 2)}

LOCATION: ${this.currentPath}
DATE: ${new Date().toISOString()}

For each SKU, predict demand and provide reasoning. Respond with JSON array matching the exact schema provided.`

			const aiResponse = await this.aiRun('@cf/meta/llama-3.1-8b-instruct', [
				{
					role: 'system',
					content:
						'You are a demand forecasting expert. Always respond with valid JSON array matching the exact schema provided.',
				},
				{
					role: 'user',
					content: forecastPrompt,
				},
			])

			const forecasts = JSON.parse(aiResponse.response) as DemandForecast[]

			// Store forecasts and trigger actions
			for (const forecast of forecasts) {
				// Store in database
				await this.sql(
					`
					INSERT INTO demand_forecasts (sku, location, predicted_demand, confidence, trend_direction, reasoning, forecast_date)
					VALUES (?, ?, ?, ?, ?, ?, ?)
				`,
					[
						forecast.sku,
						this.currentPath,
						forecast.predictedDemand,
						forecast.confidence,
						forecast.trendDirection,
						forecast.reasoning,
						new Date().toISOString(),
					]
				)

				// Check if forecast indicates potential stockout
				const currentItem = this.state.inventory.get(forecast.sku)
				if (currentItem && forecast.predictedDemand > currentItem.currentStock * 0.8) {
					await this.processLowStockAlert(forecast.sku, currentItem.currentStock)
				}
			}

			// Broadcast forecast summary
			this.broadcastToWebSockets({
				type: 'message',
				from: 'AI Forecast Engine',
				content: `📊 30-day demand forecast complete: ${forecasts.length} SKUs analyzed. High-demand items: ${forecasts.filter((f) => f.trendDirection === 'increasing').length}`,
			})

			console.log(`Demand forecast completed for ${forecasts.length} SKUs`)
		} catch (error) {
			console.error('Failed to run demand forecast workflow:', error)
		}
	}

	// Helper methods for AI workflows
	private async getSalesVelocity(sku: string): Promise<number> {
		try {
			const result = await this.sql(
				`
				SELECT AVG(quantity) as avg_sales
				FROM inventory_transactions
				WHERE sku = ? AND operation = 'decrement'
				AND timestamp > datetime('now', '-7 days')
			`,
				[sku]
			)

			return result.results?.[0]?.avg_sales || 0
		} catch {
			return 0
		}
	}

	// Vectorize integration for product similarity and recommendations
	async getSimilarProducts(
		sku: string,
		limit: number = 5
	): Promise<Array<{ sku: string; similarity: number; name: string }>> {
		try {
			if (!this.env.INVENTORY_VECTORS) {
				console.warn('Vectorize not available, returning empty similar products')
				return []
			}

			// Get product embedding (in real implementation, this would be pre-computed)
			const productEmbedding = await this.getProductEmbedding(sku)
			if (!productEmbedding) {
				return []
			}

			// Query similar products using Vectorize
			const results = await this.env.INVENTORY_VECTORS.query(productEmbedding, {
				topK: limit,
				returnValues: true,
				returnMetadata: true,
			})

			return results.matches.map((match: any) => ({
				sku: match.metadata?.sku || 'unknown',
				similarity: match.score || 0,
				name: match.metadata?.name || 'Unknown Product',
			}))
		} catch (error) {
			console.error('Failed to get similar products:', error)
			return []
		}
	}

	// Generate product embedding for Vectorize
	private async getProductEmbedding(sku: string): Promise<number[] | null> {
		try {
			const item = this.state.inventory.get(sku)
			if (!item) return null

			// Create product description for embedding
			const productDescription = `Product ${item.sku}: ${item.name}, Stock: ${item.currentStock}, Threshold: ${item.lowStockThreshold}`

			// Use Workers AI to generate embedding
			const embedding = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
				text: productDescription,
			})

			return embedding.data[0]
		} catch (error) {
			console.error('Failed to generate product embedding:', error)
			return null
		}
	}

	// Store product embedding in Vectorize
	async storeProductEmbedding(sku: string): Promise<void> {
		try {
			if (!this.env.INVENTORY_VECTORS) {
				console.warn('Vectorize not available, skipping embedding storage')
				return
			}

			const item = this.state.inventory.get(sku)
			if (!item) return

			const embedding = await this.getProductEmbedding(sku)
			if (!embedding) return

			// Store in Vectorize
			await this.env.INVENTORY_VECTORS.insert([
				{
					id: sku,
					values: embedding,
					metadata: {
						sku: item.sku,
						name: item.name,
						location: this.currentPath,
						stock: item.currentStock,
						threshold: item.lowStockThreshold,
					},
				},
			])

			console.log(`Stored embedding for product: ${sku}`)
		} catch (error) {
			console.error('Failed to store product embedding:', error)
		}
	}

	private async getSeasonalityData(_sku: string): Promise<{ seasonalityFactor: number }> {
		// Mock seasonality calculation - in production this would analyze historical patterns
		const month = new Date().getMonth()
		const seasonalityFactor = Math.sin((month / 12) * 2 * Math.PI) * 0.3 + 1.0 // Seasonal variation
		return { seasonalityFactor }
	}

	// Removed parseAIResponse method - now using structured outputs with json_schema

	private async propagateReorderDecision(sku: string, insights: InventoryInsights): Promise<void> {
		// Only propagate if we're not at root
		if (this.currentPath === '/') return

		try {
			const pathParts = this.currentPath.split('/').filter((p) => p.length > 0)
			if (pathParts.length === 0) return

			const parentPath = pathParts.length === 1 ? '/' : '/' + pathParts.slice(0, -1).join('/')

			// Get parent agent
			const parentId = this.env.FLEET_MANAGER.idFromName(parentPath)
			const parentStub = this.env.FLEET_MANAGER.get(parentId)

			// Send reorder decision to parent
			await parentStub.fetch(
				new Request('http://internal/message', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-fleet-path': parentPath,
					},
					body: JSON.stringify({
						from: this.currentPath,
						content: `🤖 Child agent ${this.currentPath} initiated reorder: ${insights.reorderQuantity} units of ${sku} (${insights.urgency} priority)`,
						type: 'system',
					}),
				})
			)
		} catch (error) {
			console.error('Failed to propagate reorder decision:', error)
		}
	}

	// Initialize agent's database schema
	async initializeAgentDatabase(): Promise<void> {
		try {
			// Create tables for inventory analytics
			await this.sql(`
				CREATE TABLE IF NOT EXISTS inventory_transactions (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					sku TEXT NOT NULL,
					operation TEXT NOT NULL,
					quantity INTEGER NOT NULL,
					timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
				)
			`)

			await this.sql(`
				CREATE TABLE IF NOT EXISTS inventory_analysis (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					sku TEXT NOT NULL,
					location TEXT NOT NULL,
					analysis TEXT NOT NULL,
					confidence REAL NOT NULL,
					timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
				)
			`)

			await this.sql(`
				CREATE TABLE IF NOT EXISTS inventory_decisions (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					sku TEXT NOT NULL,
					location TEXT NOT NULL,
					decision_type TEXT NOT NULL,
					reasoning TEXT NOT NULL,
					timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
				)
			`)

			await this.sql(`
				CREATE TABLE IF NOT EXISTS demand_forecasts (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					sku TEXT NOT NULL,
					location TEXT NOT NULL,
					predicted_demand REAL NOT NULL,
					confidence REAL NOT NULL,
					trend_direction TEXT NOT NULL,
					reasoning TEXT NOT NULL,
					forecast_date DATETIME DEFAULT CURRENT_TIMESTAMP
				)
			`)

			await this.sql(`
				CREATE TABLE IF NOT EXISTS chat_statistics (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					location TEXT NOT NULL,
					date TEXT NOT NULL,
					messages_today INTEGER DEFAULT 0,
					actions_executed INTEGER DEFAULT 0,
					successful_actions INTEGER DEFAULT 0,
					success_rate REAL DEFAULT 0.0,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					UNIQUE(location, date)
				)
			`)

			console.log('Agent database schema initialized')
		} catch (error) {
			console.error('Failed to initialize agent database:', error)
		}
	}

	// ==============================================
	// AI API ENDPOINTS
	// ==============================================

	// Handle AI analysis requests
	private async handleAIAnalysis(request: Request): Promise<Response> {
		try {
			const url = new URL(request.url)
			const sku = url.searchParams.get('sku')

			if (!sku) {
				return Response.json(
					{
						error: 'SKU parameter required',
					},
					{ status: 400 }
				)
			}

			if (!this.state.inventory.has(sku)) {
				return Response.json(
					{
						error: `SKU ${sku} not found in inventory`,
					},
					{ status: 404 }
				)
			}

			// Run AI analysis
			const insights = await this.analyzeInventoryTrends(sku)

			return Response.json({
				sku,
				location: this.currentPath,
				insights,
				timestamp: new Date().toISOString(),
			})
		} catch (error) {
			return Response.json(
				{
					error: 'AI analysis failed',
					details: error instanceof Error ? error.message : 'Unknown error',
				},
				{ status: 500 }
			)
		}
	}

	// Handle demand forecasting requests
	private async handleDemandForecast(_request: Request): Promise<Response> {
		try {
			// Run demand forecast workflow
			await this.runDemandForecastWorkflow()

			// Return recent forecasts from database
			const forecasts = await this.sql(
				`
				SELECT * FROM demand_forecasts
				WHERE location = ?
				ORDER BY forecast_date DESC
				LIMIT 20
			`,
				[this.currentPath]
			)

			return Response.json({
				location: this.currentPath,
				forecasts: forecasts.results || [],
				totalForecasts: forecasts.results?.length || 0,
				lastRun: new Date().toISOString(),
			})
		} catch (error) {
			return Response.json(
				{
					error: 'Demand forecast failed',
					details: error instanceof Error ? error.message : 'Unknown error',
				},
				{ status: 500 }
			)
		}
	}

	// Get AI insights and analytics
	private async getAIInsights(_request: Request): Promise<Response> {
		try {
			// Get recent AI analyses
			const analyses = await this.sql(
				`
				SELECT * FROM inventory_analysis
				WHERE location = ?
				ORDER BY timestamp DESC
				LIMIT 10
			`,
				[this.currentPath]
			)

			// Get recent decisions
			const decisions = await this.sql(
				`
				SELECT * FROM inventory_decisions
				WHERE location = ?
				ORDER BY timestamp DESC
				LIMIT 10
			`,
				[this.currentPath]
			)

			// Get recent forecasts
			const forecasts = await this.sql(
				`
				SELECT * FROM demand_forecasts
				WHERE location = ?
				ORDER BY forecast_date DESC
				LIMIT 5
			`,
				[this.currentPath]
			)

			return Response.json({
				location: this.currentPath,
				agentType: this.state.agentType,
				insights: {
					recentAnalyses: analyses.results || [],
					recentDecisions: decisions.results || [],
					recentForecasts: forecasts.results || [],
				},
				summary: {
					totalAnalyses: analyses.results?.length || 0,
					totalDecisions: decisions.results?.length || 0,
					totalForecasts: forecasts.results?.length || 0,
					avgConfidence: this.calculateAverageConfidence(analyses.results || []),
				},
				timestamp: new Date().toISOString(),
			})
		} catch (error) {
			return Response.json(
				{
					error: 'Failed to get AI insights',
					details: error instanceof Error ? error.message : 'Unknown error',
				},
				{ status: 500 }
			)
		}
	}

	private calculateAverageConfidence(analyses: any[]): number {
		if (analyses.length === 0) return 0
		const totalConfidence = analyses.reduce((sum, analysis) => sum + (analysis.confidence || 0), 0)
		return totalConfidence / analyses.length
	}

	// ==============================================
	// QUEUE CONSUMER FOR ASYNCHRONOUS PROCESSING
	// ==============================================

	// Handle queue messages for asynchronous processing
	async handleQueueMessage(batch: MessageBatch<any>): Promise<void> {
		console.log(`Processing ${batch.messages.length} queue messages`)

		for (const message of batch.messages) {
			try {
				const data = message.body as {
					workflow: string
					data: any
					location: string
					timestamp: string
					delay?: number
				}

				console.log(`Processing workflow: ${data.workflow} for location: ${data.location}`)

				// Set the current path for this message
				const originalPath = this.currentPath
				this.currentPath = data.location

				// Load state for the target location
				await this.loadStateFromStorage()

				// Execute the workflow
				await this.executeWorkflow(data.workflow, data.data)

				// Restore original path
				this.currentPath = originalPath

				// Acknowledge the message
				message.ack()
			} catch (error) {
				console.error('Failed to process queue message:', error)
				// Retry the message
				message.retry()
			}
		}
	}

	// ==============================================
	// INVENTORY POC METHODS
	// ==============================================

	// Handle stock operations (GET/POST to /inventory/stock)
	private async handleStockOperation(request: Request): Promise<Response> {
		try {
			if (request.method === 'GET') {
				// Check cache first
				const cacheKey = `inventory:${this.currentPath}`
				const cached = this.getCached<any>(cacheKey)

				if (cached) {
					return Response.json(cached)
				}

				// Return all inventory for this location
				const inventory = Array.from(this.state.inventory.values())
				const response = {
					location: this.currentPath,
					agentType: this.state.agentType,
					inventory,
					totalItems: inventory.length,
					lastUpdated: new Date().toISOString(),
				}

				// Cache for 60 seconds
				this.setCache(cacheKey, response, 60000)

				return Response.json(response)
			}

			if (request.method === 'POST') {
				// Validate input
				const body = await request.json()
				const update = this.validateInput(StockUpdateSchema, body)

				await this.processStockUpdate(update as InventoryUpdate)
				return Response.json({ success: true, update })
			}

			throw new InventoryError('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
		} catch (error) {
			return this.handleError(error)
		}
	}

	// Handle inventory queries
	private async handleInventoryQuery(request: Request): Promise<Response> {
		try {
			const url = new URL(request.url)
			const sku = url.searchParams.get('sku')

			if (sku) {
				// Query specific SKU
				const item = this.state.inventory.get(sku)
				if (item) {
					return Response.json({
						location: this.currentPath,
						item,
						available: item.currentStock > 0,
					})
				} else {
					return Response.json(
						{
							location: this.currentPath,
							sku,
							available: false,
							message: 'SKU not found',
						},
						{ status: 404 }
					)
				}
			} else {
				// Query all inventory
				return this.handleStockOperation(request)
			}
		} catch (error) {
			return Response.json(
				{
					error: 'Query failed',
					details: error instanceof Error ? error.message : 'Unknown error',
				},
				{ status: 500 }
			)
		}
	}

	// Handle inventory sync from external systems
	private async handleInventorySync(request: Request): Promise<Response> {
		try {
			const syncData = (await request.json()) as { updates: InventoryUpdate[] }

			let successCount = 0
			let errorCount = 0
			const errors: string[] = []

			for (const update of syncData.updates) {
				try {
					await this.processStockUpdate({ ...update, type: 'stockUpdate' } as any)
					successCount++
				} catch (error) {
					errorCount++
					errors.push(`${update.sku}: ${error instanceof Error ? error.message : 'Unknown error'}`)
				}
			}

			return Response.json({
				syncResult: {
					totalUpdates: syncData.updates.length,
					successful: successCount,
					failed: errorCount,
					errors: errors.slice(0, 10), // Limit error details
				},
				location: this.currentPath,
			})
		} catch (error) {
			return Response.json(
				{
					error: 'Sync failed',
					details: error instanceof Error ? error.message : 'Unknown error',
				},
				{ status: 500 }
			)
		}
	}

	// Get inventory alerts (low stock, etc.)
	private async getInventoryAlerts(_request: Request): Promise<Response> {
		try {
			const alerts = []

			for (const [sku, item] of this.state.inventory) {
				if (item.currentStock <= item.lowStockThreshold) {
					alerts.push({
						type: 'low_stock',
						sku,
						name: item.name,
						currentStock: item.currentStock,
						threshold: item.lowStockThreshold,
						location: this.currentPath,
						severity: item.currentStock === 0 ? 'critical' : 'warning',
					})
				}
			}

			return Response.json({
				location: this.currentPath,
				alerts,
				totalAlerts: alerts.length,
				criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
			})
		} catch (error) {
			return Response.json(
				{
					error: 'Failed to get alerts',
					details: error instanceof Error ? error.message : 'Unknown error',
				},
				{ status: 500 }
			)
		}
	}

	// Process stock updates (core inventory logic with AI enhancement)
	// Process stock updates using InventoryService
	private async processStockUpdate(
		update:
			| InventoryUpdate
			| {
					type: 'stockUpdate'
					sku: string
					quantity: number
					operation: 'set' | 'increment' | 'decrement'
			  }
	): Promise<void> {
		// Convert to InventoryUpdate format
		const inventoryUpdate: InventoryUpdate = {
			sku: update.sku,
			quantity: update.quantity,
			operation: update.operation,
			timestamp: new Date().toISOString(),
			location: this.currentPath,
		}

		// Use InventoryService to process the update
		await this.inventoryService.processStockUpdate(
			inventoryUpdate,
			this.currentPath,
			this.sqlStorage,
			this.state.inventory,
			(message: any) => this.broadcastToWebSockets(message)
		)

		// Save state after update
		await this.saveState()

		// Propagate to parent agents (hierarchical coordination)
		await this.propagateStockUpdate(update)
	}

	// Process stock queries via WebSocket
	private async processStockQuery(
		ws: WebSocket,
		query: { type: 'stockQuery'; sku: string }
	): Promise<void> {
		const item = this.state.inventory.get(query.sku)

		this.sendToWebSocket(ws, {
			type: 'stockResponse',
			sku: query.sku,
			quantity: item ? item.currentStock : 0,
			location: this.currentPath,
		})
	}

	// Process inventory sync via WebSocket
	private async processInventorySync(sync: {
		type: 'inventorySync'
		updates: InventoryUpdate[]
	}): Promise<void> {
		for (const update of sync.updates) {
			await this.processStockUpdate(update)
		}
	}

	// Process chat messages with AI-powered responses
	private async processChatMessage(
		ws: WebSocket,
		message: { type: 'chatMessage'; content: string; userId?: string }
	): Promise<void> {
		try {
			console.log(`[CHAT] Processing message: "${message.content}"`)

			// Update message count
			await this.updateChatStats('message')

			// Store user message
			this.storeMessage('user', null, message.content, 'direct')

			// Send user message to client
			this.sendToWebSocket(ws, {
				type: 'chatResponse',
				role: 'user',
				content: message.content,
				timestamp: new Date().toISOString(),
			})

			// Process with AI service for intelligent response
			const aiResponse = await this.processChatWithAI(message.content, message.userId)

			// Store AI response
			this.storeMessage('ai-assistant', null, aiResponse.content, 'direct')

			// Send AI response to client
			this.sendToWebSocket(ws, {
				type: 'chatResponse',
				role: 'assistant',
				content: aiResponse.content,
				timestamp: new Date().toISOString(),
				metadata: aiResponse.metadata,
			})

			// Execute any actions if specified
			if (aiResponse.actions && aiResponse.actions.length > 0) {
				await this.executeChatActions(aiResponse.actions, ws)
			}
		} catch (error) {
			console.error('[CHAT] Error processing chat message:', error)
			this.sendToWebSocket(ws, {
				type: 'chatResponse',
				role: 'assistant',
				content:
					'I apologize, but I encountered an error processing your request. Please try again.',
				timestamp: new Date().toISOString(),
				metadata: { error: true },
			})
		}
	}

	// Load chat history from SQLite storage
	private async loadChatHistory(): Promise<void> {
		try {
			console.log(`[CHAT] Loading chat history for location: ${this.currentPath}`)

			// Load chat messages from SQLite
			const result = this.sqlStorage.exec(
				`
				SELECT * FROM stored_messages
				WHERE location = ?
				AND (from_agent = 'user' OR from_agent = 'ai-assistant')
				ORDER BY timestamp ASC
				LIMIT 100
			`,
				[this.currentPath]
			)

			const messages = result.toArray()
			console.log(`[CHAT] Loaded ${messages.length} chat messages from storage`)

			// Store in memory for quick access
			for (const row of messages) {
				const message: StoredMessage = {
					id: row.id as string,
					timestamp: row.timestamp as string,
					from_agent: row.from_agent as string,
					to_agent: row.to_agent as string | null,
					content: row.content as string,
					message_type: row.message_type as 'direct' | 'broadcast' | 'system',
				}
				this.state.messages.push(message)
			}

			// Keep only the last 100 messages in memory
			if (this.state.messages.length > 100) {
				this.state.messages = this.state.messages.slice(-100)
			}
		} catch (error) {
			console.error('[CHAT] Failed to load chat history:', error)
		}
	}

	// Send chat history to a specific WebSocket connection
	private async sendChatHistory(ws: WebSocket): Promise<void> {
		try {
			console.log(`[CHAT] Sending chat history to WebSocket`)

			// Send all stored messages to the client
			for (const message of this.state.messages) {
				// Only send chat messages (user and ai-assistant)
				if (message.from_agent === 'user' || message.from_agent === 'ai-assistant') {
					this.sendToWebSocket(ws, {
						type: 'chatResponse',
						role: message.from_agent === 'user' ? 'user' : 'assistant',
						content: message.content,
						timestamp: message.timestamp,
						metadata: message.from_agent === 'ai-assistant' ? { loaded: true } : undefined,
					})
				}
			}

			console.log(`[CHAT] Sent ${this.state.messages.length} chat messages to client`)
		} catch (error) {
			console.error('[CHAT] Failed to send chat history:', error)
		}
	}

	// Clean up old chat messages to prevent database bloat
	private async cleanupOldChatMessages(): Promise<void> {
		try {
			console.log(`[CHAT] Cleaning up old chat messages for location: ${this.currentPath}`)

			// Delete messages older than 30 days
			const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

			this.sqlStorage.exec(
				`
				DELETE FROM stored_messages
				WHERE location = ?
				AND (from_agent = 'user' OR from_agent = 'ai-assistant')
				AND timestamp < ?
			`,
				this.currentPath,
				thirtyDaysAgo
			)

			console.log(`[CHAT] Cleaned up old chat messages`)
		} catch (error) {
			console.error('[CHAT] Failed to cleanup old chat messages:', error)
		}
	}

	// Load chat statistics from SQLite storage
	private async loadChatStatistics(): Promise<void> {
		try {
			console.log(`[CHAT] Loading chat statistics for location: ${this.currentPath}`)

			const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

			const result = this.sqlStorage.exec(
				`
				SELECT * FROM chat_statistics
				WHERE location = ? AND date = ?
			`,
				[this.currentPath, today]
			)

			const stats = result.toArray()[0] as any
			if (stats) {
				this.chatStats = {
					messagesToday: stats.messages_today || 0,
					actionsExecuted: stats.actions_executed || 0,
					successfulActions: stats.successful_actions || 0,
					successRate: stats.success_rate || 0.0,
				}
				console.log(`[CHAT] Loaded chat statistics:`, this.chatStats)
			} else {
				console.log(`[CHAT] No existing statistics for today, starting fresh`)
			}
		} catch (error) {
			console.error('[CHAT] Failed to load chat statistics:', error)
		}
	}

	// Save chat statistics to SQLite storage
	private async saveChatStatistics(): Promise<void> {
		try {
			const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
			const now = new Date().toISOString()

			// Calculate success rate
			this.chatStats.successRate =
				this.chatStats.actionsExecuted > 0
					? (this.chatStats.successfulActions / this.chatStats.actionsExecuted) * 100
					: 0

			console.log(`[CHAT] Saving chat statistics to database:`, {
				location: this.currentPath,
				date: today,
				stats: this.chatStats,
				timestamp: now,
			})

			this.sqlStorage.exec(
				`
				INSERT OR REPLACE INTO chat_statistics
				(location, date, messages_today, actions_executed, successful_actions, success_rate, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?,
					COALESCE((SELECT created_at FROM chat_statistics WHERE location = ? AND date = ?), ?),
					?)
			`,
				[
					this.currentPath,
					today,
					this.chatStats.messagesToday,
					this.chatStats.actionsExecuted,
					this.chatStats.successfulActions,
					this.chatStats.successRate,
					this.currentPath,
					today,
					now, // for created_at fallback
					now, // updated_at
				]
			)

			console.log(`[CHAT] Successfully saved chat statistics to database`)

			// Run persistence test after saving
			await this.testChatStatsPersistence()
		} catch (error) {
			console.error('[CHAT] Failed to save chat statistics:', error)
		}
	}

	// Update chat statistics
	private async updateChatStats(type: 'message' | 'action' | 'success' | 'failure'): Promise<void> {
		try {
			switch (type) {
				case 'message':
					this.chatStats.messagesToday++
					break
				case 'action':
					this.chatStats.actionsExecuted++
					break
				case 'success':
					this.chatStats.successfulActions++
					break
				case 'failure':
					// Don't increment actionsExecuted here as it's already counted
					break
			}

			// Save to database
			await this.saveChatStatistics()

			// Broadcast updated stats to all connected clients
			this.broadcastChatStats()
		} catch (error) {
			console.error('[CHAT] Failed to update chat statistics:', error)
		}
	}

	// Broadcast chat statistics to all connected WebSockets
	private broadcastChatStats(): void {
		this.broadcastToWebSockets({
			type: 'chatStats',
			messagesToday: this.chatStats.messagesToday,
			actionsExecuted: this.chatStats.actionsExecuted,
			successRate: Math.round(this.chatStats.successRate * 100) / 100, // Round to 2 decimal places
		})
	}

	// Test method to verify chat statistics persistence
	private async testChatStatsPersistence(): Promise<void> {
		try {
			console.log(`[CHAT] Testing chat statistics persistence for location: ${this.currentPath}`)

			// Get current stats from database
			const today = new Date().toISOString().split('T')[0]
			const result = this.sqlStorage.exec(
				`
				SELECT * FROM chat_statistics
				WHERE location = ? AND date = ?
			`,
				[this.currentPath, today]
			)

			const dbStats = result.toArray()[0] as any
			const memoryStats = this.chatStats

			console.log(`[CHAT] Memory stats:`, memoryStats)
			console.log(`[CHAT] Database stats:`, dbStats)

			// Verify they match
			if (dbStats) {
				const matches =
					dbStats.messages_today === memoryStats.messagesToday &&
					dbStats.actions_executed === memoryStats.actionsExecuted &&
					dbStats.successful_actions === memoryStats.successfulActions

				console.log(`[CHAT] Stats persistence test: ${matches ? 'PASSED' : 'FAILED'}`)

				if (!matches) {
					console.error(`[CHAT] Stats mismatch detected!`)
					console.error(
						`[CHAT] Memory: messages=${memoryStats.messagesToday}, actions=${memoryStats.actionsExecuted}, success=${memoryStats.successfulActions}`
					)
					console.error(
						`[CHAT] Database: messages=${dbStats.messages_today}, actions=${dbStats.actions_executed}, success=${dbStats.successful_actions}`
					)
				}
			} else {
				console.log(`[CHAT] No database stats found for today`)
			}
		} catch (error) {
			console.error('[CHAT] Failed to test chat statistics persistence:', error)
		}
	}

	// Test persistence over time (for 20+ second verification)
	private async testPersistenceOverTime(): Promise<void> {
		try {
			console.log(`[CHAT] Starting 25-second persistence test...`)

			// Record initial stats
			const initialStats = { ...this.chatStats }
			console.log(`[CHAT] Initial stats:`, initialStats)

			// Wait 25 seconds
			await new Promise((resolve) => setTimeout(resolve, 25000))

			// Check if stats are still persisted
			await this.testChatStatsPersistence()

			// Verify stats haven't changed
			const currentStats = { ...this.chatStats }
			const statsUnchanged =
				initialStats.messagesToday === currentStats.messagesToday &&
				initialStats.actionsExecuted === currentStats.actionsExecuted &&
				initialStats.successfulActions === currentStats.successfulActions

			console.log(`[CHAT] 25-second persistence test: ${statsUnchanged ? 'PASSED' : 'FAILED'}`)

			if (!statsUnchanged) {
				console.error(`[CHAT] Stats changed during 25-second test!`)
				console.error(`[CHAT] Initial:`, initialStats)
				console.error(`[CHAT] Current:`, currentStats)
			}
		} catch (error) {
			console.error('[CHAT] Failed to test persistence over time:', error)
		}
	}

	// Process chat message with AI service
	private async processChatWithAI(
		message: string,
		userId?: string
	): Promise<{
		content: string
		metadata?: any
		actions?: Array<{ type: string; data: any }>
	}> {
		try {
			// First, try simple intent recognition for common queries
			const intentResponse = this.processSimpleIntent(message)
			if (intentResponse) {
				return intentResponse
			}

			// Use AI service to process the chat message
			const aiResponse = await this.agentSDK.ai.run('@cf/meta/llama-3.1-8b-instruct', [
				{
					role: 'system',
					content: `You are an AI inventory management assistant. You help users manage their inventory through natural language conversations.

Current context:
- Location: ${this.currentPath}
- Tenant: ${this.tenantId}
- Available inventory items: ${Array.from(this.state.inventory.keys()).join(', ')}

You can help with:
1. Checking stock levels and inventory status
2. Analyzing trends and forecasting demand
3. Suggesting reorder quantities and timing
4. Finding similar products and recommendations
5. Managing inventory across multiple locations
6. Executing inventory actions (updates, reorders, etc.)

When responding:
- Be helpful and conversational
- Provide specific, actionable information
- If you need to execute actions, specify them clearly
- Always confirm what actions you're taking
- Use the available inventory data to give accurate responses

Respond in JSON format with:
{
  "content": "Your response to the user",
  "actions": [{"type": "action_type", "data": {...}}] // optional
}`,
				},
				{
					role: 'user',
					content: message,
				},
			])

			// Parse AI response - handle both JSON and plain text responses
			let response
			try {
				// Ensure we have a string to parse
				const responseText =
					typeof aiResponse.response === 'string'
						? aiResponse.response
						: JSON.stringify(aiResponse.response)
				response = JSON.parse(responseText)
			} catch (parseError) {
				// If parsing fails, treat as plain text response
				console.log(
					'[CHAT] AI returned plain text response, wrapping in JSON structure:',
					parseError instanceof Error ? parseError.message : 'Unknown parse error'
				)
				const responseText =
					typeof aiResponse.response === 'string'
						? aiResponse.response
						: JSON.stringify(aiResponse.response)
				response = {
					content: responseText,
					actions: [],
				}
			}

			// Add metadata
			response.metadata = {
				confidence: 0.9,
				processingTime: Date.now(),
				userId: userId || 'anonymous',
			}

			return response
		} catch (error) {
			console.error('[CHAT] AI processing failed:', error)

			// Fallback response
			return {
				content: `I understand you're asking about: "${message}". I can help you with inventory management tasks like checking stock levels, analyzing trends, or suggesting reorders. Could you be more specific about what you'd like to know?`,
				metadata: {
					confidence: 0.5,
					fallback: true,
					error: error instanceof Error ? error.message : 'Unknown error',
				},
			}
		}
	}

	// Simple intent recognition for common queries
	private processSimpleIntent(message: string): {
		content: string
		metadata?: any
		actions?: Array<{ type: string; data: any }>
	} | null {
		const lowerMessage = message.toLowerCase()

		// Low stock queries
		if (lowerMessage.includes('low stock') || lowerMessage.includes('low inventory')) {
			const lowStockItems = Array.from(this.state.inventory.values()).filter(
				(item) => item.currentStock <= item.lowStockThreshold
			)

			if (lowStockItems.length === 0) {
				return {
					content: 'Great news! No items are currently low on stock.',
					metadata: { action: 'show_low_stock', count: 0 },
					actions: [{ type: 'show_low_stock', data: {} }],
				}
			} else {
				const itemList = lowStockItems
					.map((item) => `• ${item.sku}: ${item.currentStock}/${item.lowStockThreshold} units`)
					.join('\n')

				return {
					content: `I found ${lowStockItems.length} items that are low on stock:\n\n${itemList}`,
					metadata: { action: 'show_low_stock', count: lowStockItems.length },
					actions: [{ type: 'show_low_stock', data: {} }],
				}
			}
		}

		// Summary queries
		if (
			lowerMessage.includes('summary') ||
			lowerMessage.includes('overview') ||
			lowerMessage.includes('status')
		) {
			const totalItems = this.state.inventory.size
			const totalStock = Array.from(this.state.inventory.values()).reduce(
				(sum, item) => sum + item.currentStock,
				0
			)
			const lowStockCount = Array.from(this.state.inventory.values()).filter(
				(item) => item.currentStock <= item.lowStockThreshold
			).length

			return {
				content: `Inventory Summary for ${this.currentPath}:
• Total items: ${totalItems}
• Total stock: ${totalStock} units
• Low stock items: ${lowStockCount}
• Active agents: ${this.state.agents.size}`,
				metadata: { action: 'show_summary', totalItems, totalStock, lowStockCount },
				actions: [{ type: 'show_summary', data: {} }],
			}
		}

		// Help queries
		if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
			return {
				content: `I can help you with inventory management! Here's what I can do:

• **Check stock levels** - "Show me low stock items" or "What's the status of SKU ABC123?"
• **Generate forecasts** - "Create a demand forecast" or "Predict next month's needs"
• **Reorder suggestions** - "What needs reordering?" or "Suggest reorder quantities"
• **Inventory updates** - "Update stock for XYZ789 to 100 units"
• **Summary reports** - "Show inventory summary" or "Give me an overview"

Just ask me in natural language and I'll help you manage your inventory!`,
				metadata: { action: 'help' },
			}
		}

		// Stock check queries (look for SKU patterns)
		const skuMatch = message.match(/\b[A-Z0-9]{3,}\b/g)
		if (skuMatch && skuMatch.length > 0) {
			const sku = skuMatch[0]
			const item = this.state.inventory.get(sku)

			if (item) {
				return {
					content: `Stock level for ${sku}: ${item.currentStock} units (threshold: ${item.lowStockThreshold})`,
					metadata: {
						action: 'check_stock',
						sku,
						stock: item.currentStock,
						threshold: item.lowStockThreshold,
					},
					actions: [{ type: 'check_stock', data: { sku } }],
				}
			} else {
				return {
					content: `I couldn't find SKU "${sku}" in the current inventory. Available SKUs: ${Array.from(this.state.inventory.keys()).join(', ')}`,
					metadata: { action: 'check_stock', sku, found: false },
				}
			}
		}

		return null // No simple intent matched
	}

	// Execute actions from chat responses
	private async executeChatActions(
		actions: Array<{ type: string; data: any }>,
		ws: WebSocket
	): Promise<void> {
		for (const action of actions) {
			try {
				// Track action execution
				await this.updateChatStats('action')

				switch (action.type) {
					case 'check_stock':
						await this.executeCheckStock(action.data, ws)
						break
					case 'update_stock':
						await this.executeUpdateStock(action.data, ws)
						break
					case 'generate_forecast':
						await this.executeGenerateForecast(action.data, ws)
						break
					case 'show_low_stock':
						await this.executeShowLowStock(ws)
						break
					case 'show_summary':
						await this.executeShowSummary(ws)
						break
					default:
						console.log(`[CHAT] Unknown action type: ${action.type}`)
				}

				// Track successful action
				await this.updateChatStats('success')
			} catch (error) {
				console.error(`[CHAT] Error executing action ${action.type}:`, error)
				// Track failed action
				await this.updateChatStats('failure')
			}
		}
	}

	// Action implementations
	private async executeCheckStock(data: { sku: string }, ws: WebSocket): Promise<void> {
		const item = this.state.inventory.get(data.sku)
		const stockLevel = item ? item.currentStock : 0
		const threshold = item ? item.lowStockThreshold : 0

		this.sendToWebSocket(ws, {
			type: 'chatResponse',
			role: 'assistant',
			content: `Stock level for ${data.sku}: ${stockLevel} units (threshold: ${threshold})`,
			timestamp: new Date().toISOString(),
			metadata: {
				action: 'check_stock',
				sku: data.sku,
				stock: stockLevel,
				threshold: threshold,
				status: stockLevel <= threshold ? 'low' : 'normal',
			},
		})
	}

	private async executeUpdateStock(
		data: { sku: string; quantity: number; operation: string },
		ws: WebSocket
	): Promise<void> {
		await this.processStockUpdate({
			type: 'stockUpdate',
			sku: data.sku,
			quantity: data.quantity,
			operation: data.operation as 'set' | 'increment' | 'decrement',
			timestamp: new Date().toISOString(),
			location: this.currentPath,
		})

		this.sendToWebSocket(ws, {
			type: 'chatResponse',
			role: 'assistant',
			content: `Updated stock for ${data.sku}: ${data.operation} by ${data.quantity} units`,
			timestamp: new Date().toISOString(),
			metadata: {
				action: 'update_stock',
				sku: data.sku,
				operation: data.operation,
				quantity: data.quantity,
			},
		})
	}

	private async executeGenerateForecast(data: { period?: number }, ws: WebSocket): Promise<void> {
		try {
			const forecast = await this.workflowService.triggerForecastWorkflow({
				location: this.currentPath,
				forecastPeriod: data.period || 30,
				forceRefresh: true,
			})

			this.sendToWebSocket(ws, {
				type: 'chatResponse',
				role: 'assistant',
				content: `Demand forecast workflow triggered for ${data.period || 30} days. Workflow ID: ${forecast}`,
				timestamp: new Date().toISOString(),
				metadata: {
					action: 'generate_forecast',
					workflowId: forecast,
					period: data.period || 30,
				},
			})
		} catch (error) {
			this.sendToWebSocket(ws, {
				type: 'chatResponse',
				role: 'assistant',
				content: `Failed to generate forecast: ${error instanceof Error ? error.message : 'Unknown error'}`,
				timestamp: new Date().toISOString(),
				metadata: { error: true },
			})
		}
	}

	private async executeShowLowStock(ws: WebSocket): Promise<void> {
		const lowStockItems = Array.from(this.state.inventory.values())
			.filter((item) => item.currentStock <= item.lowStockThreshold)
			.map((item) => `${item.sku}: ${item.currentStock}/${item.lowStockThreshold}`)

		this.sendToWebSocket(ws, {
			type: 'chatResponse',
			role: 'assistant',
			content:
				lowStockItems.length > 0
					? `Low stock items:\n${lowStockItems.join('\n')}`
					: 'No items are currently low on stock.',
			timestamp: new Date().toISOString(),
			metadata: {
				action: 'show_low_stock',
				items: lowStockItems,
				count: lowStockItems.length,
			},
		})
	}

	private async executeShowSummary(ws: WebSocket): Promise<void> {
		const totalItems = this.state.inventory.size
		const totalStock = Array.from(this.state.inventory.values()).reduce(
			(sum, item) => sum + item.currentStock,
			0
		)
		const lowStockCount = Array.from(this.state.inventory.values()).filter(
			(item) => item.currentStock <= item.lowStockThreshold
		).length

		this.sendToWebSocket(ws, {
			type: 'chatResponse',
			role: 'assistant',
			content: `Inventory Summary for ${this.currentPath}:
• Total items: ${totalItems}
• Total stock: ${totalStock} units
• Low stock items: ${lowStockCount}
• Agents: ${this.state.agents.size}`,
			timestamp: new Date().toISOString(),
			metadata: {
				action: 'show_summary',
				totalItems,
				totalStock,
				lowStockCount,
				agentCount: this.state.agents.size,
			},
		})
	}

	// Propagate stock updates to parent agents (agentic coordination)
	private async propagateStockUpdate(
		update: InventoryUpdate | { sku: string; quantity: number; operation: string }
	): Promise<void> {
		// Only propagate if we're not at root
		if (this.currentPath === '/') return

		try {
			// Find parent path
			const pathParts = this.currentPath.split('/').filter((p) => p.length > 0)
			if (pathParts.length === 0) return

			const parentPath = pathParts.length === 1 ? '/' : '/' + pathParts.slice(0, -1).join('/')

			// Get parent agent
			const parentId = this.env.FLEET_MANAGER.idFromName(parentPath)
			const parentStub = this.env.FLEET_MANAGER.get(parentId)

			// Send update to parent
			await parentStub.fetch(
				new Request('http://internal/inventory/stock', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-fleet-path': parentPath,
					},
					body: JSON.stringify({
						...update,
						timestamp: new Date().toISOString(),
						location: this.currentPath,
						source: 'child_agent',
					}),
				})
			)

			console.log(`Propagated stock update to parent: ${parentPath}`)
		} catch (error) {
			console.error('Failed to propagate stock update:', error)
			// Don't fail the main operation if propagation fails
		}
	}
}
