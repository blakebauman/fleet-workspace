// Base FleetManager class with core fleet management functionality
import { z } from 'zod'

import type { SharedHonoEnv } from '@repo/hono-helpers/src/types'

// Error handling types
interface APIError {
	code: string
	message: string
	details?: unknown
	timestamp: string
}

export class InventoryError extends Error {
	constructor(
		public code: string,
		message: string,
		public statusCode: number = 500,
		public details?: unknown
	) {
		super(message)
		this.name = 'InventoryError'
	}
}

// Input validation schemas
export const StockUpdateSchema = z.object({
	sku: z.string().min(1).max(50),
	quantity: z.number().int().min(0),
	operation: z.enum(['set', 'increment', 'decrement']),
})

export const AgentNameSchema = z
	.string()
	.min(1)
	.max(32)
	.regex(
		/^[a-zA-Z0-9\s_-]+$/,
		'Agent name can only contain alphanumeric characters, spaces, dashes, and underscores'
	)

// Message types for WebSocket communication
export type FleetMessage =
	| { type: 'increment' }
	| { type: 'createAgent'; name: string }
	| { type: 'deleteAgent'; name: string }
	| { type: 'directMessage'; agentName: string; message: string }
	| { type: 'broadcast'; message: string }
	| { type: 'ping' }
	| { type: 'pong' }
	| { type: 'state'; counter: number; agents: string[] }
	| { type: 'error'; message: string }
	| { type: 'agentCreated'; name: string }
	| { type: 'agentDeleted'; name: string }
	| { type: 'message'; from: string; content: string }
	// INVENTORY POC EXTENSIONS
	| {
			type: 'stockUpdate'
			sku: string
			quantity: number
			operation: 'set' | 'increment' | 'decrement'
	  }
	| { type: 'stockQuery'; sku: string }
	| { type: 'stockResponse'; sku: string; quantity: number; location: string }
	| {
			type: 'lowStockAlert'
			sku: string
			currentStock: number
			threshold: number
			location: string
	  }
	| { type: 'inventorySync'; updates: InventoryUpdate[] }
	| { type: 'chatMessage'; content: string; userId?: string }
	| {
			type: 'chatResponse'
			role: 'user' | 'assistant' | 'system'
			content: string
			timestamp: string
			metadata?: any
	  }
	| { type: 'chatStats'; messagesToday: number; actionsExecuted: number; successRate: number }
	| { type: 'testPersistence' }
	| { type: 'testPersistence25s' }

// Inventory types for POC
export interface InventoryUpdate {
	sku: string
	quantity: number
	operation: 'set' | 'increment' | 'decrement'
	timestamp: string
	location: string
}

export interface InventoryItem {
	sku: string
	name: string
	currentStock: number
	lowStockThreshold: number
	lastUpdated: string
}

// In-memory message storage interface
export interface StoredMessage {
	id: string
	timestamp: string
	from_agent: string
	to_agent: string | null // null for broadcast messages
	content: string
	message_type: 'direct' | 'broadcast' | 'system'
}

// State structure for each FleetManager instance
export interface FleetState {
	counter: number
	agents: Set<string>
	websockets: Set<WebSocket>
	messages: StoredMessage[] // In-memory message buffer
	// INVENTORY POC EXTENSIONS
	inventory: Map<string, InventoryItem> // SKU -> Item details
	agentType: 'orchestrator' | 'warehouse' | 'retail' | 'fulfillment' // Agent specialization
}

// Environment interface
export interface Env extends SharedHonoEnv {
	FLEET_MANAGER: DurableObjectNamespace
	AI?: any
	INVENTORY_VECTORS?: any
	// Workflow bindings
	REORDER_WORKFLOW?: any
	FORECAST_WORKFLOW?: any
	SYNC_WORKFLOW?: any
	// Queue bindings
	NOTIFICATION_QUEUE?: any
	AUDIT_QUEUE?: any
	EMBEDDING_QUEUE?: any
}

export abstract class BaseFleetManager implements DurableObject {
	protected storage: DurableObjectStorage
	protected sqlStorage: SqlStorage
	protected state: FleetState
	protected currentPath: string = '/'
	protected stateLoaded = false
	protected cache = new Map<string, { data: any; expires: number }>()
	protected initializationComplete = false

	constructor(
		protected ctx: DurableObjectState,
		protected env: Env
	) {
		console.log('BaseFleetManager constructor called')
		this.storage = ctx.storage
		this.sqlStorage = ctx.storage.sql
		this.state = {
			counter: 0,
			agents: new Set(),
			websockets: new Set(),
			messages: [],
			// INVENTORY POC EXTENSIONS
			inventory: new Map(),
			agentType: 'orchestrator', // Default type
		}
		// Initialize schema on first run
		this.initializeSchema()

		// ✅ Use blockConcurrencyWhile to initialize from storage
		// This ensures no requests are delivered until initialization completes
		void ctx.blockConcurrencyWhile(async () => {
			console.log('[INIT] Initializing Durable Object from storage...')
			// Load state for the default path - will be updated when fetch() sets currentPath
			await this.loadStateFromStorage()
			this.initializationComplete = true
			console.log('[INIT] Initialization complete - ready to handle requests')

			// ✅ Broadcast initial state to any connected clients
			this.broadcastState()
		})

		console.log('BaseFleetManager constructor completed')
	}

	// Abstract methods to be implemented by subclasses
	abstract fetch(request: Request): Promise<Response>
	abstract webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void>
	abstract webSocketClose(
		ws: WebSocket,
		code: number,
		reason: string,
		wasClean: boolean
	): Promise<void>
	abstract webSocketError(ws: WebSocket, error: unknown): Promise<void>

	// Error handling methods
	protected handleError(error: unknown): Response {
		if (error instanceof InventoryError) {
			return Response.json(
				{
					code: error.code,
					message: error.message,
					details: error.details,
					timestamp: new Date().toISOString(),
				} as APIError,
				{ status: error.statusCode }
			)
		}

		console.error('Unexpected error:', error)
		return Response.json(
			{
				code: 'INTERNAL_ERROR',
				message: 'An unexpected error occurred',
				timestamp: new Date().toISOString(),
			} as APIError,
			{ status: 500 }
		)
	}

	protected validateInput<T>(schema: z.ZodType<T>, data: unknown): T {
		try {
			return schema.parse(data)
		} catch (error: unknown) {
			if (error instanceof z.ZodError) {
				throw new InventoryError('VALIDATION_ERROR', 'Invalid input', 400, error.issues)
			}
			throw error
		}
	}

	// Caching methods
	protected getCached<T>(key: string): T | null {
		const cached = this.cache.get(key)
		if (cached && cached.expires > Date.now()) {
			return cached.data
		}
		this.cache.delete(key)
		return null
	}

	protected setCache<T>(key: string, data: T, ttlMs: number = 300000): void {
		this.cache.set(key, {
			data,
			expires: Date.now() + ttlMs,
		})
	}

	protected clearCache(): void {
		this.cache.clear()
	}

	// Initialize SQLite schema
	protected initializeSchema(): void {
		try {
			console.log('Initializing SQLite schema...')

			// Create base tables
			this.sqlStorage.exec(`
				CREATE TABLE IF NOT EXISTS schema_version (
					version INTEGER PRIMARY KEY
				);
			`)

			// Check current schema version
			const versionResult = this.sqlStorage.exec(
				'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
			)
			const currentVersion = (versionResult.toArray()[0] as any)?.version || 0
			console.log('Current schema version:', currentVersion)

			// Apply migrations incrementally
			if (currentVersion < 1) {
				this.sqlStorage.exec(`
					CREATE TABLE IF NOT EXISTS fleet_state (
						id TEXT PRIMARY KEY,
						counter INTEGER NOT NULL DEFAULT 0,
						agents TEXT NOT NULL DEFAULT '[]',
						agent_type TEXT NOT NULL DEFAULT 'orchestrator',
						created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
						updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
					);

					CREATE TABLE IF NOT EXISTS inventory_items (
						sku TEXT PRIMARY KEY,
						name TEXT NOT NULL,
						current_stock INTEGER NOT NULL DEFAULT 0,
						low_stock_threshold INTEGER NOT NULL DEFAULT 10,
						location TEXT NOT NULL,
						created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
						updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
					);

					CREATE TABLE IF NOT EXISTS stored_messages (
						id TEXT PRIMARY KEY,
						timestamp TEXT NOT NULL,
						from_agent TEXT NOT NULL,
						to_agent TEXT,
						content TEXT NOT NULL,
						message_type TEXT NOT NULL,
						location TEXT NOT NULL
					);

					CREATE TABLE IF NOT EXISTS inventory_transactions (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						sku TEXT NOT NULL,
						operation TEXT NOT NULL,
						quantity INTEGER NOT NULL,
						location TEXT NOT NULL,
						timestamp TEXT DEFAULT (datetime('now')) NOT NULL
					);

					CREATE TABLE IF NOT EXISTS inventory_analysis (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						sku TEXT NOT NULL,
						location TEXT NOT NULL,
						analysis TEXT NOT NULL,
						confidence REAL NOT NULL,
						timestamp TEXT DEFAULT (datetime('now')) NOT NULL
					);

					CREATE TABLE IF NOT EXISTS inventory_decisions (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						sku TEXT NOT NULL,
						location TEXT NOT NULL,
						decision_type TEXT NOT NULL,
						reasoning TEXT NOT NULL,
						timestamp TEXT DEFAULT (datetime('now')) NOT NULL
					);

					CREATE TABLE IF NOT EXISTS demand_forecasts (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						sku TEXT NOT NULL,
						location TEXT NOT NULL,
						predicted_demand REAL NOT NULL,
						confidence REAL NOT NULL,
						trend_direction TEXT NOT NULL,
						reasoning TEXT NOT NULL,
						forecast_date TEXT DEFAULT (datetime('now')) NOT NULL
					);

					CREATE TABLE IF NOT EXISTS chat_statistics (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						location TEXT NOT NULL,
						date TEXT NOT NULL,
						messages_today INTEGER NOT NULL DEFAULT 0,
						actions_executed INTEGER NOT NULL DEFAULT 0,
						successful_actions INTEGER NOT NULL DEFAULT 0,
						success_rate REAL NOT NULL DEFAULT 0.0,
						created_at TEXT DEFAULT (datetime('now')) NOT NULL,
						updated_at TEXT DEFAULT (datetime('now')) NOT NULL,
						UNIQUE(location, date)
					);

					-- Create indexes for performance
					CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory_items(location);
					CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory_items(current_stock, low_stock_threshold);
					CREATE INDEX IF NOT EXISTS idx_messages_location ON stored_messages(location, timestamp);
					CREATE INDEX IF NOT EXISTS idx_transactions_sku ON inventory_transactions(sku, timestamp);
					CREATE INDEX IF NOT EXISTS idx_analysis_location ON inventory_analysis(location, timestamp);
					CREATE INDEX IF NOT EXISTS idx_forecasts_location ON demand_forecasts(location, forecast_date);
					CREATE INDEX IF NOT EXISTS idx_chat_stats_location_date ON chat_statistics(location, date);

					INSERT INTO schema_version (version) VALUES (1);
				`)
			}

			console.log('SQLite schema initialized successfully')

			// Verify tables were created
			const tablesResult = this.sqlStorage.exec(`
				SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
			`)
			const tables = tablesResult.toArray().map((row: any) => row.name)
			console.log('Created tables:', tables)
		} catch (error) {
			console.error('Failed to initialize schema:', error)
			console.error(
				'Schema error details:',
				error instanceof Error ? error.message : 'Unknown error'
			)
		}
	}

	// Load state from SQLite storage
	protected async loadStateFromStorage(): Promise<void> {
		try {
			console.log(`[INIT] Loading state from storage for path: ${this.currentPath}`)

			// Load fleet state
			const stateResult = this.sqlStorage.exec(
				`
				SELECT * FROM fleet_state WHERE id = ?
			`,
				this.currentPath
			)

			const stateRow = stateResult.toArray()[0] as any
			if (stateRow) {
				console.log(
					`[INIT] Found persisted state: counter=${stateRow.counter}, agents=${stateRow.agents}`
				)
				this.state.counter = stateRow.counter || 0
				this.state.agentType = stateRow.agent_type || 'orchestrator'

				// ✅ Restore agents from JSON
				const agentsArray = JSON.parse(stateRow.agents || '[]')
				this.state.agents = new Set(agentsArray)
				console.log(`[INIT] Restored ${this.state.agents.size} agents from storage`)
			} else {
				console.log(`[INIT] No persisted state found for path: ${this.currentPath}`)
			}

			// Load inventory items
			const inventoryResult = this.sqlStorage.exec(
				`
				SELECT * FROM inventory_items WHERE location = ?
			`,
				this.currentPath
			)

			const inventoryRows = inventoryResult.toArray()
			for (const row of inventoryRows) {
				const item: InventoryItem = {
					sku: row.sku as string,
					name: row.name as string,
					currentStock: row.current_stock as number,
					lowStockThreshold: row.low_stock_threshold as number,
					lastUpdated: new Date().toISOString(),
				}
				this.state.inventory.set(item.sku, item)
			}
			console.log(`[INIT] Restored ${this.state.inventory.size} inventory items from storage`)

			this.stateLoaded = true
			console.log(`[INIT] State loading completed successfully`)
		} catch (error) {
			console.error('[INIT] Failed to load state from storage:', error)
			// Continue with default state if loading fails
			this.stateLoaded = true
		}
	}

	// Save state to SQLite storage
	protected async saveState(): Promise<void> {
		try {
			console.log(
				`[FIXED] Saving state for location: ${this.currentPath} (${this.state.agents.size} agents, counter: ${this.state.counter})`
			)

			// Save fleet state for this specific location
			const timestamp = Math.floor(Date.now() / 1000)
			this.sqlStorage.exec(
				`
				INSERT OR REPLACE INTO fleet_state (id, counter, agents, agent_type, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?)
			`,
				this.currentPath, // Use currentPath instead of 'main'
				this.state.counter,
				JSON.stringify(Array.from(this.state.agents)),
				this.state.agentType,
				timestamp, // created_at
				timestamp // updated_at
			)

			// Save inventory items
			for (const [_sku, item] of this.state.inventory) {
				const itemTimestamp = Math.floor(Date.now() / 1000)
				this.sqlStorage.exec(
					`
					INSERT OR REPLACE INTO inventory_items
					(sku, name, current_stock, low_stock_threshold, location, created_at, updated_at)
					VALUES (?, ?, ?, ?, ?, ?, ?)
				`,
					item.sku,
					item.name,
					item.currentStock,
					item.lowStockThreshold,
					this.currentPath,
					itemTimestamp, // created_at
					itemTimestamp // updated_at
				)
			}
		} catch (error) {
			console.error('Failed to save state:', error)
		}
	}

	// Broadcast current state to all connected WebSockets
	protected broadcastState(): void {
		// ✅ Don't broadcast state until initialization is complete
		if (!this.initializationComplete) {
			console.log('[INIT] Skipping state broadcast - initialization not complete')
			return
		}

		this.broadcastToWebSockets({
			type: 'state',
			counter: this.state.counter,
			agents: Array.from(this.state.agents),
		})
	}

	// Send message to all connected WebSockets
	protected broadcastToWebSockets(message: FleetMessage): void {
		for (const ws of this.state.websockets) {
			this.sendToWebSocket(ws, message)
		}
	}

	// Send message to specific WebSocket
	protected sendToWebSocket(ws: WebSocket, message: FleetMessage): void {
		try {
			if (ws.readyState === 1) {
				console.log(`Sending WebSocket message:`, message)
				ws.send(JSON.stringify(message))
			} else {
				console.log(`WebSocket not ready, state: ${ws.readyState}`)
			}
		} catch (error) {
			console.error('Error sending WebSocket message:', error)
			this.state.websockets.delete(ws)
		}
	}

	// Store a message in SQLite
	protected storeMessage(
		fromAgent: string,
		toAgent: string | null,
		content: string,
		messageType: 'direct' | 'broadcast' | 'system'
	): void {
		const message: StoredMessage = {
			id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date().toISOString(),
			from_agent: fromAgent,
			to_agent: toAgent,
			content,
			message_type: messageType,
		}

		try {
			// Store in SQLite
			this.sqlStorage.exec(
				`
				INSERT INTO stored_messages (id, timestamp, from_agent, to_agent, content, message_type, location)
				VALUES (?, ?, ?, ?, ?, ?, ?)
			`,
				message.id,
				message.timestamp,
				message.from_agent,
				message.to_agent,
				message.content,
				message.message_type,
				this.currentPath
			)

			// Add to in-memory cache
			this.state.messages.push(message)

			// Keep only the last 100 messages to prevent memory bloat
			if (this.state.messages.length > 100) {
				this.state.messages = this.state.messages.slice(-100)
			}

			console.log(`Message stored: ${messageType} from ${fromAgent} to ${toAgent || 'broadcast'}`)
		} catch (error) {
			console.error('Failed to store message:', error)
		}
	}
}
