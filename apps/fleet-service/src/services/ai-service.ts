// AI Service for inventory analysis and forecasting
import type { Env, InventoryItem } from './base-fleet-manager'

// AI-powered inventory insights
export interface InventoryInsights {
	sku: string
	shouldReorder: boolean
	reorderQuantity: number
	urgency: 'low' | 'medium' | 'high' | 'critical'
	leadTimeMs: number
	reasoning: string
	confidence: number
}

// Demand forecast data
export interface DemandForecast {
	sku: string
	location: string
	forecastPeriod: string
	predictedDemand: number
	seasonalityFactor: number
	trendDirection: 'increasing' | 'decreasing' | 'stable'
	confidence: number
	reasoning: string
}

export class AIService {
	constructor(private env: Env) {}

	// AI-powered inventory analysis using structured outputs
	async analyzeInventoryTrends(
		sku: string,
		item: InventoryItem,
		location: string,
		salesHistory: any[],
		salesVelocity: number,
		seasonalityFactor: number
	): Promise<InventoryInsights> {
		try {
			// Define structured output schema
			const InventoryAnalysisSchema = {
				type: 'object',
				properties: {
					shouldReorder: { type: 'boolean' },
					reorderQuantity: { type: 'number', minimum: 0 },
					urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
					leadTimeMs: { type: 'number', minimum: 0 },
					reasoning: { type: 'string' },
					confidence: { type: 'number', minimum: 0, maximum: 1 }
				},
				required: ['shouldReorder', 'reorderQuantity', 'urgency', 'leadTimeMs', 'reasoning', 'confidence']
			}

			// AI analysis prompt
			const analysisPrompt = `You are an expert inventory analyst. Analyze this inventory data and provide reorder recommendations:

CURRENT STATUS:
- SKU: ${sku}
- Current Stock: ${item.currentStock}
- Low Stock Threshold: ${item.lowStockThreshold}
- Location: ${location}

HISTORICAL DATA:
- Recent Sales: ${JSON.stringify(salesHistory.slice(0, 10))}
- Sales Velocity (units/day): ${salesVelocity}
- Seasonality Factor: ${seasonalityFactor}

Provide a JSON response with the exact schema specified.`

			// Use real Cloudflare Workers AI with structured output
			const aiResponse = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
				messages: [
					{
						role: 'system',
						content: 'You are an expert inventory analyst. Always respond with valid JSON matching the exact schema provided.'
					},
					{
						role: 'user',
						content: analysisPrompt
					}
				],
				response_format: {
					type: 'json_schema',
					schema: InventoryAnalysisSchema
				}
			})

			// Parse structured AI response
			const insights = aiResponse.parsed as InventoryInsights
			insights.sku = sku

			console.log(`AI Analysis for ${sku}:`, insights)
			return insights

		} catch (error) {
			console.error(`Failed to analyze inventory trends for ${sku}:`, error)
			// Return conservative fallback analysis
			return {
				sku,
				shouldReorder: item.currentStock <= item.lowStockThreshold,
				reorderQuantity: item.lowStockThreshold * 2,
				urgency: 'medium',
				leadTimeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
				reasoning: 'Fallback analysis due to AI processing error',
				confidence: 0.5
			}
		}
	}

	// Daily demand forecasting workflow
	async runDemandForecast(
		inventoryData: Array<{sku: string; currentStock: number; lowThreshold: number}>,
		location: string
	): Promise<DemandForecast[]> {
		try {
			if (inventoryData.length === 0) {
				console.log('No inventory items to forecast')
				return []
			}

			// Define structured output schema for demand forecasts
			const DemandForecastSchema = {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						sku: { type: 'string' },
						predictedDemand: { type: 'number', minimum: 0 },
						confidence: { type: 'number', minimum: 0, maximum: 1 },
						trendDirection: { type: 'string', enum: ['increasing', 'decreasing', 'stable'] },
						reasoning: { type: 'string' }
					},
					required: ['sku', 'predictedDemand', 'confidence', 'trendDirection', 'reasoning']
				}
			}

			// AI-powered demand forecasting
			const forecastPrompt = `Analyze inventory patterns and predict 30-day demand:

CURRENT INVENTORY:
${JSON.stringify(inventoryData, null, 2)}

LOCATION: ${location}
DATE: ${new Date().toISOString()}

For each SKU, predict demand and provide reasoning. Respond with JSON array matching the exact schema provided.`

			const aiResponse = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
				messages: [
					{
						role: 'system',
						content: 'You are a demand forecasting expert. Always respond with valid JSON array matching the exact schema provided.'
					},
					{
						role: 'user',
						content: forecastPrompt
					}
				],
				response_format: {
					type: 'json_schema',
					schema: DemandForecastSchema
				}
			})

			const forecasts = aiResponse.parsed as DemandForecast[]
			console.log(`Demand forecast completed for ${forecasts.length} SKUs`)
			return forecasts

		} catch (error) {
			console.error('Failed to run demand forecast:', error)
			return []
		}
	}

	// Generate product embedding for Vectorize
	async getProductEmbedding(sku: string, item: InventoryItem): Promise<number[] | null> {
		try {
			// Create product description for embedding
			const productDescription = `Product ${item.sku}: ${item.name}, Stock: ${item.currentStock}, Threshold: ${item.lowStockThreshold}`

			// Use Workers AI to generate embedding
			const embedding = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
				text: productDescription
			})

			return embedding.data[0]
		} catch (error) {
			console.error('Failed to generate product embedding:', error)
			return null
		}
	}

	// Mock AI response generator for fallback
	generateMockAIResponse(prompt: string): any {
		if (prompt.includes('shouldReorder')) {
			return {
				shouldReorder: true,
				reorderQuantity: 50,
				urgency: 'medium',
				leadTimeMs: 7 * 24 * 60 * 60 * 1000,
				reasoning: 'Current stock below threshold. Historical data suggests moderate demand.',
				confidence: 0.8
			}
		} else if (prompt.includes('forecast')) {
			return [{
				sku: 'MOCK-SKU',
				predictedDemand: 30,
				confidence: 0.75,
				trendDirection: 'stable',
				reasoning: 'Steady demand pattern observed over past 30 days'
			}]
		}
		return { message: 'Mock AI response for POC demonstration' }
	}
}
