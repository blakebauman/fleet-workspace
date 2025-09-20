import type { FC } from 'hono/jsx'
import { Card, Button } from './SimpleComponents'

interface StatusCardProps {
	path: string
	parentPath?: string
}

export const StatusCard: FC<StatusCardProps> = ({ path, parentPath }) => {
	const segments = path.split('/').filter(Boolean)
	const isAtRoot = segments.length === 0

	return (
		<Card title="System Status">
			<div class="mb-16">
				<div class="flex flex-between flex-center mb-8">
					<span class="text-small">Active Locations</span>
					<span id="agent-count" class="font-mono">0</span>
				</div>
				<div class="flex flex-between flex-center mb-8">
					<span class="text-small">Connection</span>
					<span class="status-dot status-connecting"></span>
				</div>
				<div class="flex flex-between flex-center">
					<span class="text-small">Sync Counter</span>
					<span id="counter" class="font-mono">0</span>
				</div>
			</div>

			<div class="mb-16">
				<Button variant="primary" onclick="incrementCounter()">
					Test Sync
				</Button>
				{parentPath && (
					<Button variant="secondary" onclick={`navigateToParent('${parentPath}')`}>
						← Back
					</Button>
				)}
			</div>

			{!isAtRoot && (
				<Button variant="danger" onclick="deleteSubtree()">
					Delete Location
				</Button>
			)}
		</Card>
	)
}
