import { Card } from './SimpleComponents'

import type { FC } from 'hono/jsx'

interface AgentListProps {
	currentPath: string
	isAtRoot?: boolean
}

export const AgentList: FC<AgentListProps> = ({ currentPath: _currentPath, isAtRoot = false }) => {
	const title = isAtRoot ? 'Locations' : 'Sub-Locations'
	const emptyTitle = isAtRoot ? 'No Locations' : 'No Sub-Locations'
	const emptyDescription = isAtRoot
		? 'Create your first location to start managing inventory across your organization.'
		: 'Create sub-locations to organize inventory under this location.'

	return (
		<Card title={title}>
			<div id="agent-list">
				<div class="empty-state">
					<div class="empty-state-icon">□</div>
					<h4>{emptyTitle}</h4>
					<p>{emptyDescription}</p>
					<div class="empty-state-features">
						<div class="feature-item">
							<span class="feature-icon">■</span>
							<span>Real-time Updates</span>
						</div>
						<div class="feature-item">
							<span class="feature-icon">▲</span>
							<span>Multi-location Support</span>
						</div>
						<div class="feature-item">
							<span class="feature-icon">●</span>
							<span>Instant Sync</span>
						</div>
					</div>
					<div class="empty-state-action">
						<p class="text-small">
							← Use the form to create your first {isAtRoot ? 'location' : 'sub-location'}
						</p>
					</div>
				</div>
			</div>
		</Card>
	)
}
