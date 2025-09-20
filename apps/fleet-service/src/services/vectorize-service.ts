// Vectorize Service for product similarity and recommendations
import { AIService } from './ai-service'

import type { Env, InventoryItem } from './base-fleet-manager'

export interface SimilarProduct {
	sku: string
	similarity: number
	name: string
}

export class VectorizeService {
	private aiService: AIService

	constructor(private env: Env) {
		this.aiService = new AIService(env)
	}

	// Get similar products using Vectorize
	async getSimilarProducts(sku: string, limit: number = 5): Promise<SimilarProduct[]> {
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
	private async getProductEmbedding(_sku: string): Promise<number[] | null> {
		try {
			// This would need access to the inventory item
			// In a real implementation, this would be passed as a parameter
			// or retrieved from the database
			console.warn('getProductEmbedding needs inventory item context')
			return null
		} catch (error) {
			console.error('Failed to generate product embedding:', error)
			return null
		}
	}

	// Store product embedding in Vectorize
	async storeProductEmbedding(sku: string, item: InventoryItem, location: string): Promise<void> {
		try {
			if (!this.env.INVENTORY_VECTORS) {
				console.warn('Vectorize not available, skipping embedding storage')
				return
			}

			const embedding = await this.aiService.getProductEmbedding(sku, item)
			if (!embedding) return

			// Store in Vectorize
			await this.env.INVENTORY_VECTORS.insert([
				{
					id: sku,
					values: embedding,
					metadata: {
						sku: item.sku,
						name: item.name,
						location,
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

	// Update product embedding when inventory changes
	async updateProductEmbedding(sku: string, item: InventoryItem, location: string): Promise<void> {
		try {
			if (!this.env.INVENTORY_VECTORS) {
				console.warn('Vectorize not available, skipping embedding update')
				return
			}

			// First delete the old embedding
			await this.env.INVENTORY_VECTORS.deleteByIds([sku])

			// Then store the new one
			await this.storeProductEmbedding(sku, item, location)
		} catch (error) {
			console.error('Failed to update product embedding:', error)
		}
	}

	// Search products by description
	async searchProductsByDescription(
		description: string,
		limit: number = 10
	): Promise<SimilarProduct[]> {
		try {
			if (!this.env.INVENTORY_VECTORS) {
				console.warn('Vectorize not available, returning empty search results')
				return []
			}

			// Generate embedding for the search query
			const queryEmbedding = await this.aiService.getProductEmbedding('search', {
				sku: 'search',
				name: description,
				currentStock: 0,
				lowStockThreshold: 0,
				lastUpdated: new Date().toISOString(),
			})

			if (!queryEmbedding) {
				return []
			}

			// Query similar products using Vectorize
			const results = await this.env.INVENTORY_VECTORS.query(queryEmbedding, {
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
			console.error('Failed to search products by description:', error)
			return []
		}
	}
}
