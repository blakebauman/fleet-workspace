import { Button, Card, Input, StatCard } from './SimpleComponents'

import type { FC } from 'hono/jsx'

interface ChatInterfaceProps {
	path: string
}

export const ChatInterface: FC<ChatInterfaceProps> = ({ path: _path }) => {
	return (
		<div>
			{/* Chat Status Cards */}
			<div class="stats">
				<StatCard number="0" label="Messages Today" id="chat-messages-count" />
				<StatCard number="0" label="Actions Executed" id="chat-actions-count" />
				<StatCard number="0" label="Success Rate" id="chat-success-rate" />
			</div>

			{/* Chat Container */}
			<Card title="AI Inventory Assistant" class="chat-container">
				{/* Chat Messages */}
				<div id="chat-messages" class="chat-messages">
					<div class="chat-message assistant">
						<div class="message-avatar">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M12 8V4H8" />
								<rect width="16" height="12" x="4" y="8" rx="2" />
								<path d="M2 14h2" />
								<path d="M20 14h2" />
								<path d="M15 13v2" />
								<path d="M9 13v2" />
							</svg>
						</div>
						<div class="message-content">
							<div class="message-header">
								<span class="message-sender">AI Assistant</span>
								<span class="message-time">Just now</span>
							</div>
							<div class="message-text">
								Hello! I'm your AI inventory assistant. I can help you with:
								<ul>
									<li>Checking stock levels and inventory status</li>
									<li>Analyzing trends and forecasting demand</li>
									<li>Suggesting reorder quantities and timing</li>
									<li>Finding similar products and recommendations</li>
									<li>Managing inventory across multiple locations</li>
								</ul>
								What would you like to know about your inventory?
							</div>
						</div>
					</div>
				</div>

				{/* Chat Input */}
				<div class="chat-input-container">
					<form id="chat-form" class="chat-form">
						<Input
							label="Your Message"
							id="chat-input"
							placeholder="Ask me anything about inventory..."
							class="flex-1"
						/>
						<div style="align-self: end; margin-left: 10px;">
							<Button type="submit" variant="primary">
								Send
							</Button>
						</div>
					</form>

					{/* Quick Actions */}
					<div class="chat-quick-actions">
						<Button
							variant="secondary"
							class="quick-action-btn"
							onclick="sendQuickMessage('Show me low stock items')"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M3 3v16a2 2 0 0 0 2 2h16" />
								<path d="m19 9-5 5-4-4-3 3" />
							</svg>
							Low Stock
						</Button>
						<Button
							variant="secondary"
							class="quick-action-btn"
							onclick="sendQuickMessage('What needs reordering?')"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
								<path d="M3 3v5h5" />
							</svg>
							Reorder
						</Button>
						<Button
							variant="secondary"
							class="quick-action-btn"
							onclick="sendQuickMessage('Show inventory summary')"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<rect width="18" height="18" x="3" y="3" rx="2" />
								<path d="M9 9h6v6H9z" />
							</svg>
							Summary
						</Button>
						<Button
							variant="secondary"
							class="quick-action-btn"
							onclick="sendQuickMessage('Generate demand forecast')"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
								<path d="M12 9v4" />
								<path d="M12 17h.01" />
							</svg>
							Forecast
						</Button>
					</div>

					{/* Test Actions */}
					<div
						class="chat-test-actions"
						style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;"
					>
						<Button
							variant="secondary"
							class="quick-action-btn test-persistence-btn"
							onclick="testPersistence()"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M9 12l2 2 4-4" />
								<path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
								<path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
								<path d="M13 12h3a2 2 0 0 1 2 2v1" />
								<path d="M11 12H8a2 2 0 0 0-2 2v1" />
							</svg>
							Test Persistence
						</Button>
						<Button
							variant="secondary"
							class="quick-action-btn test-persistence-25s-btn"
							onclick="testPersistence25s()"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<circle cx="12" cy="12" r="10" />
								<polyline points="12,6 12,12 16,14" />
							</svg>
							Test 25s Persistence
						</Button>
						<Button
							variant="secondary"
							class="quick-action-btn test-websocket-btn"
							onclick="testWebSocketConnection()"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
								<polyline points="3.27,6.96 12,12.01 20.73,6.96" />
								<line x1="12" y1="22.08" x2="12" y2="12" />
							</svg>
							Test WebSocket
						</Button>
					</div>
				</div>
			</Card>

			{/* Chat Features */}
			<Card title="Chat Features">
				<div class="grid grid-2">
					<div class="feature-section">
						<h4>Natural Language Queries</h4>
						<p class="text-muted">
							Ask questions in plain English about your inventory. The AI understands context and
							can provide intelligent responses.
						</p>
						<div class="example-queries">
							<strong>Examples:</strong>
							<ul>
								<li>"What's the stock level for product ABC123?"</li>
								<li>"Show me items that need reordering"</li>
								<li>"Which products are selling fastest?"</li>
								<li>"Generate a forecast for next month"</li>
							</ul>
						</div>
					</div>
					<div class="feature-section">
						<h4>Intelligent Actions</h4>
						<p class="text-muted">
							The AI can execute actions based on your requests, such as updating stock levels,
							triggering reorders, or generating reports.
						</p>
						<div class="action-examples">
							<strong>Actions:</strong>
							<ul>
								<li>Update inventory quantities</li>
								<li>Trigger reorder workflows</li>
								<li>Generate demand forecasts</li>
								<li>Send notifications</li>
								<li>Create reports</li>
							</ul>
						</div>
					</div>
				</div>
			</Card>

			{/* Chat Settings */}
			<Card title="Chat Settings">
				<div class="grid grid-3">
					<div class="setting-item">
						<label>
							<input type="checkbox" id="auto-execute" checked />
							Auto-execute safe actions
						</label>
						<p class="text-small text-muted">
							Automatically execute low-risk actions without confirmation
						</p>
					</div>
					<div class="setting-item">
						<label>
							<input type="checkbox" id="voice-enabled" />
							Enable voice input
						</label>
						<p class="text-small text-muted">Use speech-to-text for hands-free interaction</p>
					</div>
					<div class="setting-item">
						<label>
							<input type="checkbox" id="notifications" checked />
							Enable notifications
						</label>
						<p class="text-small text-muted">Get notified when AI takes important actions</p>
					</div>
				</div>
			</Card>

			{/* Chat History */}
			<Card title="Recent Conversations">
				<div id="chat-history" class="chat-history">
					<p class="text-muted text-center">No previous conversations found</p>
				</div>
			</Card>

			{/* Chat Styles */}
			<style
				dangerouslySetInnerHTML={{
					__html: `
					/* Chat Interface Styles */
					.chat-container {
						height: 600px;
						display: flex;
						flex-direction: column;
					}

					.chat-messages {
						flex: 1;
						overflow-y: auto;
						padding: 16px;
						background: #fafafa;
						border: 1px solid #e5e5e5;
						margin-bottom: 16px;
						max-height: 400px;
					}

					.chat-message {
						display: flex;
						margin-bottom: 16px;
						align-items: flex-start;
						gap: 12px;
					}

					.chat-message.user {
						flex-direction: row-reverse;
					}

					.message-avatar {
						width: 32px;
						height: 32px;
						border-radius: 50%;
						background: #000000;
						color: #ffffff;
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 16px;
						flex-shrink: 0;
					}

					.chat-message.user .message-avatar {
						background: #666666;
					}

					.message-content {
						flex: 1;
						max-width: 70%;
					}

					.message-header {
						display: flex;
						justify-content: space-between;
						align-items: center;
						margin-bottom: 4px;
					}

					.message-sender {
						font-weight: 600;
						font-size: 12px;
						color: #000000;
					}

					.message-time {
						font-size: 11px;
						color: #666666;
					}

					.message-text {
						background: #ffffff;
						padding: 12px 16px;
						border-radius: 8px;
						border: 1px solid #e5e5e5;
						font-size: 14px;
						line-height: 1.5;
					}

					.chat-message.user .message-text {
						background: #000000;
						color: #ffffff;
						border-color: #000000;
					}

					.chat-input-container {
						border-top: 1px solid #e5e5e5;
						padding-top: 16px;
					}

					.chat-form {
						margin-bottom: 12px;
					}

					.chat-input-wrapper {
						display: flex;
						gap: 8px;
						align-items: flex-end;
					}

					.chat-input {
						flex: 1;
					}

					.chat-input .form-group {
						margin-bottom: 0;
					}

					.chat-input input {
						border-radius: 20px;
						padding: 12px 16px;
					}

					.chat-send-btn {
						border-radius: 20px;
						padding: 12px 20px;
						white-space: nowrap;
					}

					.chat-quick-actions {
						display: flex;
						gap: 8px;
						flex-wrap: wrap;
					}

					.quick-action-btn {
						font-size: 12px;
						padding: 8px 12px;
						border-radius: 16px;
					}

					.feature-section {
						padding: 16px;
						background: #f8f8f8;
						border: 1px solid #e5e5e5;
					}

					.feature-section h4 {
						margin: 0 0 8px 0;
						font-size: 14px;
						font-weight: 600;
						color: #000000;
					}

					.feature-section p {
						margin: 0 0 12px 0;
						font-size: 13px;
						color: #666666;
					}

					.example-queries ul,
					.action-examples ul {
						margin: 0;
						padding-left: 16px;
					}

					.example-queries li,
					.action-examples li {
						font-size: 12px;
						color: #333333;
						margin-bottom: 4px;
					}

					.setting-item {
						padding: 12px;
						background: #f8f8f8;
						border: 1px solid #e5e5e5;
					}

					.setting-item label {
						display: flex;
						align-items: center;
						gap: 8px;
						font-weight: 500;
						font-size: 13px;
						margin-bottom: 4px;
					}

					.setting-item input[type="checkbox"] {
						width: auto;
						margin: 0;
					}

					.chat-history {
						max-height: 200px;
						overflow-y: auto;
					}

					/* Typing indicator */
					.typing-indicator {
						display: flex;
						align-items: center;
						gap: 8px;
						padding: 12px 16px;
						background: #f0f0f0;
						border-radius: 8px;
						font-size: 13px;
						color: #666666;
					}

					.typing-dots {
						display: flex;
						gap: 4px;
					}

					.typing-dot {
						width: 6px;
						height: 6px;
						background: #666666;
						border-radius: 50%;
						animation: typing 1.4s infinite ease-in-out;
					}

					.typing-dot:nth-child(1) { animation-delay: -0.32s; }
					.typing-dot:nth-child(2) { animation-delay: -0.16s; }

					@keyframes typing {
						0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
						40% { transform: scale(1); opacity: 1; }
					}

					/* Message metadata */
					.message-metadata {
						margin-top: 8px;
						padding: 8px 12px;
						background: #f8f8f8;
						border-radius: 4px;
						font-size: 12px;
						color: #666666;
					}

					.metadata-item {
						display: flex;
						justify-content: space-between;
						margin-bottom: 2px;
					}

					.metadata-item:last-child {
						margin-bottom: 0;
					}

					.metadata-label {
						font-weight: 500;
					}

					.metadata-value {
						color: #000000;
					}

					/* Action buttons in messages */
					.message-actions {
						margin-top: 8px;
						display: flex;
						gap: 8px;
					}

					.message-action-btn {
						font-size: 11px;
						padding: 4px 8px;
						border-radius: 12px;
					}
				`,
				}}
			/>
		</div>
	)
}
