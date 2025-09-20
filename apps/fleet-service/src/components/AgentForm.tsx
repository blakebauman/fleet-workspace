import { Button, Card, Input } from './SimpleComponents'

import type { FC } from 'hono/jsx'

interface AgentFormProps {
	currentPath?: string
	isAtRoot?: boolean
}

export const AgentForm: FC<AgentFormProps> = ({
	currentPath: _currentPath = '/',
	isAtRoot = false,
}) => {
	const title = isAtRoot ? 'Create Location' : 'Create Sub-Location'

	return (
		<Card title={title}>
			<form onsubmit="createAgent(event)">
				<Input
					label="Location Name"
					id="agentName"
					placeholder="warehouse-ny, store-sf, dc-central"
					pattern="[a-zA-Z0-9 _\-]{1,32}"
					title="Alphanumeric, spaces, dashes, underscores (1-32 chars)"
					required
				/>

				<Button type="submit" variant="primary">
					Create Location
				</Button>
			</form>
		</Card>
	)
}
