// Inventory Service for stock management and operations
import type { Env, InventoryItem, InventoryUpdate, StockUpdateSchema } from './base-fleet-manager'
import { InventoryError } from './base-fleet-manager'
import { AIService } from './ai-service'
import { VectorizeService } from './vectorize-service'
import { QueueService } from './queue-service'
import { WorkflowService } from './workflow-service'

export interface InventoryAlert {
	type: 'low_stock' | 'out_of_stock' | 'overstock' | 'reorder_needed'
	sku: string
	name: string
	currentStock: number
	threshold: number
	location: string
	severity: 'warning' | 'critical' | 'info'
	message: string
}

export class InventoryService {
	private aiService: AIService
	private vectorizeService: VectorizeService
	private queueService: QueueService
	private workflowService: WorkflowService

	constructor(private env: Env) {
		this.aiService = new AIService(env)
		this.vectorizeService = new VectorizeService(env)
		this.queueService = new QueueService(env)
		this.workflowService = new WorkflowService(env)
	}

	// Process stock updates with AI enhancement
	async processStockUpdate(
		update: InventoryUpdate,
		location: string,
		sqlStorage: SqlStorage,
		inventory: Map<string, InventoryItem>,
		broadcastCallback: (message: any) => void
	): Promise<void> {
		const sku = update.sku
		const quantity = update.quantity
		const operation = update.operation

		// Get or create inventory item
		let item = inventory.get(sku)
		if (!item) {
			item = {
				sku,
				name: `Product ${sku}`, // In real system, this would come from product catalog
				currentStock: 0,
				lowStockThreshold: 10, // Default threshold
				lastUpdated: new Date().toISOString()
			}
		}

		const previousStock = item.currentStock

		// Apply the operation
		switch (operation) {
			case 'set':
				item.currentStock = quantity
				break
			case 'increment':
				item.currentStock += quantity
				break
			case 'decrement':
				item.currentStock = Math.max(0, item.currentStock - quantity) // Prevent negative stock
				break
		}

		item.lastUpdated = new Date().toISOString()
		inventory.set(sku, item)

		// Record transaction in database for AI analysis
		try {
			await sqlStorage.exec(`
				INSERT INTO inventory_transactions (sku, operation, quantity, location, timestamp)
				VALUES (?, ?, ?, ?, ?)
			`, [sku, operation, quantity, location, new Date().toISOString()])
		} catch (error) {
			console.error('Failed to record inventory transaction:', error)
		}

		// Store product embedding in Vectorize for similarity search
		try {
			await this.vectorizeService.storeProductEmbedding(sku, item, location)
		} catch (error) {
			console.error('Failed to store product embedding:', error)
		}

		// AI-powered low stock analysis and autonomous actions
		if (item.currentStock <= item.lowStockThreshold) {
			const alert: InventoryAlert = {
				type: item.currentStock === 0 ? 'out_of_stock' : 'low_stock',
				sku,
				name: item.name,
				currentStock: item.currentStock,
				threshold: item.lowStockThreshold,
				location,
				severity: item.currentStock === 0 ? 'critical' : 'warning',
				message: `Stock level ${item.currentStock} is below threshold ${item.lowStockThreshold}`
			}

			broadcastCallback({
				type: 'lowStockAlert',
				sku,
				currentStock: item.currentStock,
				threshold: item.lowStockThreshold,
				location
			})

			// Trigger AI-powered reorder analysis
			await this.processLowStockAlert(sku, item, location, sqlStorage, broadcastCallback)
		}

		// Broadcast update to connected clients
		broadcastCallback({
			type: 'stockUpdate',
			sku,
			quantity: item.currentStock,
			operation: 'set' // Always send current state
		})

		console.log(`🔄 Stock updated: ${sku} = ${item.currentStock} at ${location} (${previousStock} → ${item.currentStock})`)
	}

	// Process low stock alert with AI analysis
	private async processLowStockAlert(
		sku: string,
		item: InventoryItem,
		location: string,
		sqlStorage: SqlStorage,
		broadcastCallback: (message: any) => void
	): Promise<void> {
		try {
			console.log(`Processing low stock alert for ${sku} (${item.currentStock} units)`)

			// Gather historical data for AI analysis
			const salesHistory = await this.getSalesHistory(sku, location, sqlStorage)
			const salesVelocity = await this.getSalesVelocity(sku, location, sqlStorage)
			const seasonalityFactor = await this.getSeasonalityFactor(sku)

			// AI-powered analysis
			const insights = await this.aiService.analyzeInventoryTrends(
				sku,
				item,
				location,
				salesHistory,
				salesVelocity,
				seasonalityFactor
			)

			// Store analysis in database
			await sqlStorage.exec(`
				INSERT INTO inventory_analysis (sku, location, analysis, confidence, timestamp)
				VALUES (?, ?, ?, ?, ?)
			`, [sku, location, JSON.stringify(insights), insights.confidence, new Date().toISOString()])

			if (insights.shouldReorder) {
				// For high-value or critical items, use human-in-the-loop
				if (insights.urgency === 'critical' || insights.reorderQuantity > 1000) {
					await this.requestHumanApproval(insights, location, broadcastCallback)
				}

				// Trigger the reorder workflow
				const workflowId = await this.workflowService.triggerReorderWorkflow({
					sku,
					quantity: insights.reorderQuantity,
					urgency: insights.urgency,
					reasoning: insights.reasoning,
					location,
					estimatedCost: insights.reorderQuantity * 10, // Mock cost calculation
					leadTimeMs: insights.leadTimeMs
				})

				// Log audit trail
				await this.queueService.logAudit({
					action: 'reorder_workflow_triggered',
					resource: sku,
					location,
					details: {
						workflowId,
						quantity: insights.reorderQuantity,
						urgency: insights.urgency,
						reasoning: insights.reasoning
					},
					timestamp: new Date().toISOString()
				})

				// Broadcast to connected clients
				broadcastCallback({
					type: 'message',
					from: 'AI Inventory Agent',
					content: `🤖 Auto-reorder initiated: ${insights.reorderQuantity} units of ${sku} (${insights.urgency} priority)`
				})
			}

			// Store decision in audit trail
			await sqlStorage.exec(`
				INSERT INTO inventory_decisions (sku, location, decision_type, reasoning, timestamp)
				VALUES (?, ?, ?, ?, ?)
			`, [sku, location, 'reorder_analysis', insights.reasoning, new Date().toISOString()])

		} catch (error) {
			console.error(`Failed to process low stock alert for ${sku}:`, error)
		}
	}

	// Human-in-the-loop approval for critical decisions
	private async requestHumanApproval(
		insights: any,
		location: string,
		broadcastCallback: (message: any) => void
	): Promise<boolean> {
		try {
			// Broadcast approval request to connected clients
			broadcastCallback({
				type: 'message',
				from: 'System',
				content: `🚨 APPROVAL NEEDED: Reorder for ${insights.sku} - ${insights.reorderQuantity} units (${insights.urgency} priority). Reason: ${insights.reasoning}`
			})

			// For POC, auto-approve after short delay (in production, this would wait for human input)
			await new Promise(resolve => setTimeout(resolve, 2000))

			console.log(`Auto-approved reorder for ${insights.sku} (POC mode)`)
			return true

		} catch (error) {
			console.error('Failed to request human approval:', error)
			return false // Fail safe
		}
	}

	// Get inventory alerts
	async getInventoryAlerts(
		inventory: Map<string, InventoryItem>,
		location: string
	): Promise<InventoryAlert[]> {
		const alerts: InventoryAlert[] = []

		for (const [sku, item] of inventory) {
			if (item.currentStock <= item.lowStockThreshold) {
				alerts.push({
					type: item.currentStock === 0 ? 'out_of_stock' : 'low_stock',
					sku,
					name: item.name,
					currentStock: item.currentStock,
					threshold: item.lowStockThreshold,
					location,
					severity: item.currentStock === 0 ? 'critical' : 'warning',
					message: `Stock level ${item.currentStock} is below threshold ${item.lowStockThreshold}`
				})
			}
		}

		return alerts
	}

	// Get similar products using Vectorize
	async getSimilarProducts(sku: string, limit: number = 5): Promise<any[]> {
		return await this.vectorizeService.getSimilarProducts(sku, limit)
	}

	// Search products by description
	async searchProducts(description: string, limit: number = 10): Promise<any[]> {
		return await this.vectorizeService.searchProductsByDescription(description, limit)
	}

	// Trigger demand forecast workflow
	async triggerDemandForecast(location: string, forecastPeriod: number = 30, skuFilter?: string[]): Promise<string> {
		try {
			const workflowId = await this.workflowService.triggerForecastWorkflow({
				location,
				forecastPeriod,
				skuFilter,
				forceRefresh: false
			})

			// Log audit trail
			await this.queueService.logAudit({
				action: 'forecast_workflow_triggered',
				resource: location,
				location,
				details: {
					workflowId,
					forecastPeriod,
					skuFilter
				},
				timestamp: new Date().toISOString()
			})

			return workflowId
		} catch (error) {
			console.error('Failed to trigger demand forecast workflow:', error)
			throw error
		}
	}

	// Trigger inventory sync workflow
	async triggerInventorySync(location: string, systems: ('erp' | 'wms' | 'pos')[], forceFullSync: boolean = false): Promise<string> {
		try {
			const workflowId = await this.workflowService.triggerSyncWorkflow({
				location,
				systems,
				forceFullSync,
				lastSyncTimestamp: undefined
			})

			// Log audit trail
			await this.queueService.logAudit({
				action: 'sync_workflow_triggered',
				resource: location,
				location,
				details: {
					workflowId,
					systems,
					forceFullSync
				},
				timestamp: new Date().toISOString()
			})

			return workflowId
		} catch (error) {
			console.error('Failed to trigger inventory sync workflow:', error)
			throw error
		}
	}

	// Get workflow status
	async getWorkflowStatus(workflowId: string, workflowType: 'reorder' | 'forecast' | 'sync'): Promise<any> {
		return await this.workflowService.getWorkflowStatus(workflowId, workflowType)
	}

	// Helper methods
	private async getSalesHistory(sku: string, location: string, sqlStorage: SqlStorage): Promise<any[]> {
		try {
			const result = await sqlStorage.exec(`
				SELECT * FROM inventory_transactions
				WHERE sku = ? AND location = ?
				ORDER BY timestamp DESC
				LIMIT 30
			`, [sku, location])

			return result.toArray()
		} catch {
			return []
		}
	}

	private async getSalesVelocity(sku: string, location: string, sqlStorage: SqlStorage): Promise<number> {
		try {
			const result = await sqlStorage.exec(`
				SELECT AVG(quantity) as avg_sales
				FROM inventory_transactions
				WHERE sku = ? AND operation = 'decrement'
				AND location = ?
				AND timestamp > datetime('now', '-7 days')
			`, [sku, location])

			const avgSales = result.toArray()[0]?.avg_sales
		return typeof avgSales === 'number' ? avgSales : Number(avgSales) || 0
		} catch {
			return 0
		}
	}

	private async getSeasonalityFactor(_sku: string): Promise<number> {
		// Mock seasonality calculation - in production this would analyze historical patterns
		const month = new Date().getMonth()
		return Math.sin((month / 12) * 2 * Math.PI) * 0.3 + 1.0 // Seasonal variation
	}
}
