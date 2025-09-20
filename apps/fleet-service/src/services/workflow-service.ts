// Workflow Service for triggering Cloudflare Workflows
import type { Env } from './base-fleet-manager'

export interface ReorderWorkflowParams {
	sku: string
	quantity: number
	urgency: 'low' | 'medium' | 'high' | 'critical'
	reasoning: string
	location: string
	estimatedCost: number
	leadTimeMs: number
}

export interface ForecastWorkflowParams {
	location: string
	forecastPeriod: number
	skuFilter?: string[]
	forceRefresh?: boolean
}

export interface SyncWorkflowParams {
	location: string
	systems: ('erp' | 'wms' | 'pos')[]
	forceFullSync?: boolean
	lastSyncTimestamp?: string
}

export class WorkflowService {
	constructor(private env: Env) {}

	// Trigger reorder workflow
	async triggerReorderWorkflow(params: ReorderWorkflowParams): Promise<string> {
		try {
			if (!this.env.REORDER_WORKFLOW) {
				throw new Error('Reorder workflow binding not available')
			}

			const workflowId = await this.env.REORDER_WORKFLOW.create({
				params
			})

			console.log(`Triggered reorder workflow: ${workflowId} for ${params.sku}`)
			return workflowId
		} catch (error) {
			console.error('Failed to trigger reorder workflow:', error)
			throw error
		}
	}

	// Trigger demand forecast workflow
	async triggerForecastWorkflow(params: ForecastWorkflowParams): Promise<string> {
		try {
			if (!this.env.FORECAST_WORKFLOW) {
				throw new Error('Forecast workflow binding not available')
			}

			const workflowId = await this.env.FORECAST_WORKFLOW.create({
				params
			})

			console.log(`Triggered forecast workflow: ${workflowId} for ${params.location}`)
			return workflowId
		} catch (error) {
			console.error('Failed to trigger forecast workflow:', error)
			throw error
		}
	}

	// Trigger inventory sync workflow
	async triggerSyncWorkflow(params: SyncWorkflowParams): Promise<string> {
		try {
			if (!this.env.SYNC_WORKFLOW) {
				throw new Error('Sync workflow binding not available')
			}

			const workflowId = await this.env.SYNC_WORKFLOW.create({
				params
			})

			console.log(`Triggered sync workflow: ${workflowId} for ${params.location}`)
			return workflowId
		} catch (error) {
			console.error('Failed to trigger sync workflow:', error)
			throw error
		}
	}

	// Get workflow status
	async getWorkflowStatus(workflowId: string, workflowType: 'reorder' | 'forecast' | 'sync'): Promise<any> {
		try {
			let workflow
			switch (workflowType) {
				case 'reorder':
					workflow = this.env.REORDER_WORKFLOW
					break
				case 'forecast':
					workflow = this.env.FORECAST_WORKFLOW
					break
				case 'sync':
					workflow = this.env.SYNC_WORKFLOW
					break
				default:
					throw new Error('Invalid workflow type')
			}

			if (!workflow) {
				throw new Error(`${workflowType} workflow binding not available`)
			}

			const status = await workflow.get(workflowId)
			return status
		} catch (error) {
			console.error(`Failed to get ${workflowType} workflow status:`, error)
			throw error
		}
	}

	// Cancel workflow
	async cancelWorkflow(workflowId: string, workflowType: 'reorder' | 'forecast' | 'sync'): Promise<void> {
		try {
			let workflow
			switch (workflowType) {
				case 'reorder':
					workflow = this.env.REORDER_WORKFLOW
					break
				case 'forecast':
					workflow = this.env.FORECAST_WORKFLOW
					break
				case 'sync':
					workflow = this.env.SYNC_WORKFLOW
					break
				default:
					throw new Error('Invalid workflow type')
			}

			if (!workflow) {
				throw new Error(`${workflowType} workflow binding not available`)
			}

			await workflow.cancel(workflowId)
			console.log(`Cancelled ${workflowType} workflow: ${workflowId}`)
		} catch (error) {
			console.error(`Failed to cancel ${workflowType} workflow:`, error)
			throw error
		}
	}

	// List active workflows
	async listActiveWorkflows(workflowType: 'reorder' | 'forecast' | 'sync'): Promise<any[]> {
		try {
			let workflow
			switch (workflowType) {
				case 'reorder':
					workflow = this.env.REORDER_WORKFLOW
					break
				case 'forecast':
					workflow = this.env.FORECAST_WORKFLOW
					break
				case 'sync':
					workflow = this.env.SYNC_WORKFLOW
					break
				default:
					throw new Error('Invalid workflow type')
			}

			if (!workflow) {
				throw new Error(`${workflowType} workflow binding not available`)
			}

			// In real implementation, this would list active workflows
			// For now, return empty array
			return []
		} catch (error) {
			console.error(`Failed to list ${workflowType} workflows:`, error)
			return []
		}
	}
}
