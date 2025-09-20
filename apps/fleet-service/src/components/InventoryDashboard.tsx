import type { FC } from 'hono/jsx'
import { Card, Input, Button, Grid, StatCard } from './SimpleComponents'

interface InventoryDashboardProps {
	path: string
}

export const InventoryDashboard: FC<InventoryDashboardProps> = ({ path: _path }) => {
	return (
		<div>
			{/* Inventory Status Cards */}
			<div class="stats">
				<StatCard number="0" label="Total Items" id="total-items" />
				<StatCard number="0" label="Low Stock Alerts" id="low-stock-count" />
				<StatCard number="$0" label="Total Value" id="total-value" />
			</div>

			{/* Inventory Management Form */}
			<Card title="Inventory Management">
				<form id="inventory-form">
					<Grid cols={2}>
						<Input
							label="SKU"
							id="inventory-sku"
							placeholder="e.g., WIDGET-001"
							required
						/>
						<Input
							label="Product Name"
							id="inventory-name"
							placeholder="e.g., Blue Widget"
							required
						/>
						<Input
							label="Quantity"
							id="inventory-quantity"
							type="number"
							placeholder="100"
							min="0"
							required
						/>
						<Input
							label="Unit Price"
							id="inventory-price"
							type="number"
							placeholder="9.99"
							step="0.01"
							min="0"
							required
						/>
					</Grid>
					<Button
						type="submit"
						variant="primary"
						onclick="addInventoryItem(event)"
					>
						Add Item
					</Button>
					<Button
						type="button"
						variant="secondary"
						onclick="syncInventory()"
					>
						Sync All
					</Button>
				</form>
			</Card>

			{/* Current Inventory */}
			<Card>
				<div class="flex flex-between flex-center mb-20">
					<h3>Current Inventory</h3>
					<Button variant="secondary" onclick="refreshInventory()">
						Refresh
					</Button>
				</div>
				<div id="inventory-list">
					<p class="text-muted text-center">Loading inventory...</p>
				</div>
			</Card>

			{/* Real-time Alerts */}
			<Card title="Real-time Alerts">
				<div id="inventory-alerts">
					<p class="text-muted text-center">No alerts at this time</p>
				</div>
			</Card>

			{/* Quick Actions */}
			<Card title="Quick Actions">
				<Grid cols={3}>
					<Button variant="success" onclick="bulkStockUpdate()">
						Bulk Stock Update
					</Button>
					<Button variant="primary" onclick="generateReport()">
						Generate Report
					</Button>
					<Button variant="secondary" onclick="exportInventory()">
						Export Data
					</Button>
				</Grid>
			</Card>
		</div>
	)
}
