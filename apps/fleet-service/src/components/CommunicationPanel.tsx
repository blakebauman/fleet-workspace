import { Button, Card, Textarea } from './SimpleComponents'

import type { FC } from 'hono/jsx'

export const CommunicationPanel: FC = () => {
	return (
		<Card title="Real-time Communication">
			<div class="architecture-highlight mb-16">
				<div class="text-small">WebSocket-based messaging across hierarchy</div>
			</div>

			<form onsubmit="sendMessage(event)" class="mb-16">
				<Textarea
					label="Broadcast Message"
					id="messageInput"
					placeholder="Test real-time message propagation..."
					rows={2}
					required
				/>
				<Button type="submit" variant="primary">
					Broadcast
				</Button>
			</form>

			<div>
				<div class="flex flex-between flex-center mb-8">
					<span class="text-small font-mono">Message Log</span>
					<span class="status-dot status-connecting"></span>
				</div>
				<div id="messages" class="message-list">
					<div class="text-center text-muted">
						<p class="text-small">Waiting for messages...</p>
					</div>
				</div>
			</div>
		</Card>
	)
}
