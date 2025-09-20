import { Alert, Button, Card, Grid, Input, StatCard } from './SimpleComponents'

import type { FC } from 'hono/jsx'

interface AIControlPanelProps {
	path: string
}

export const AIControlPanel: FC<AIControlPanelProps> = ({ path: _path }) => {
	return (
		<div>
			{/* AI Status Cards */}
			<div class="stats">
				<StatCard number="0" label="Decisions Made" id="ai-decisions-count" />
				<StatCard number="95%" label="Confidence Avg" id="ai-confidence" />
				<StatCard number="3" label="Active Workflows" id="ai-workflows-count" />
			</div>

			{/* AI Inventory Analysis */}
			<Card title="AI Inventory Analysis">
				<form id="ai-analysis-form">
					<div class="flex">
						<Input
							label="Analyze SKU"
							id="analysis-sku"
							placeholder="Enter SKU to analyze"
							class="flex-1"
						/>
						<div style="align-self: end; margin-left: 10px;">
							<Button type="submit" variant="primary" onclick="analyzeInventory(event)">
								Analyze
							</Button>
						</div>
					</div>
				</form>
				<div id="ai-analysis-results" class="mb-20">
					<p class="text-muted text-center">Enter a SKU above to get AI analysis</p>
				</div>
			</Card>

			{/* Demand Forecasting */}
			<Card title="Demand Forecasting">
				<div class="flex flex-between flex-center mb-20">
					<p class="text-muted">Generate 30-day demand forecasts for all inventory items</p>
					<Button variant="success" onclick="generateForecast()">
						Generate Forecast
					</Button>
				</div>
				<div id="forecast-results">
					<p class="text-muted text-center">No forecasts generated yet</p>
				</div>
			</Card>

			{/* AI Decision History */}
			<Card>
				<div class="flex flex-between flex-center mb-20">
					<h3>AI Decision History</h3>
					<Button variant="secondary" onclick="refreshDecisionHistory()">
						Refresh
					</Button>
				</div>
				<div id="ai-decision-history">
					<p class="text-muted text-center">No AI decisions recorded yet</p>
				</div>
			</Card>

			{/* AI Workflow Controls */}
			<Card title="AI Workflow Controls">
				<Grid cols={3}>
					<Button variant="success" onclick="enableAIWorkflows()">
						Enable AI
					</Button>
					<Button variant="danger" onclick="disableAIWorkflows()">
						Disable AI
					</Button>
					<Button variant="primary" onclick="trainAIModel()">
						Train Model
					</Button>
				</Grid>
				<Alert type="info" class="mb-20">
					<strong>AI Status:</strong> AI workflows are currently <span id="ai-status">active</span>{' '}
					and monitoring inventory patterns.
				</Alert>
			</Card>
		</div>
	)
}
