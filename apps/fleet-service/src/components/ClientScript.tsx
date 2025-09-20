import type { FC } from 'hono/jsx'

interface ClientScriptProps {
	path: string
}

export const ClientScript: FC<ClientScriptProps> = ({ path }) => {
	return (
		<script
			dangerouslySetInnerHTML={{
				__html: `
				// Prevent multiple script executions
				if (window.fleetManagerScriptLoaded) {
					console.log('[CLIENT] Fleet Manager script already loaded, skipping...');
				} else {
					window.fleetManagerScriptLoaded = true;
					console.log('[CLIENT] Loading Fleet Manager script...');

				const currentPath = '${path}';
				let ws = null;
				let reconnectTimeout = null;
				const maxReconnectDelay = 30000;
				let reconnectDelay = 1000;

				// Toast system inspired by Sonner
				const toast = {
					maxToasts: 5, // Limit number of visible toasts

					show: function(message, type = 'info', options = {}) {
						const container = document.getElementById('toastContainer');
						if (!container) {
							console.warn('Toast container not found');
							return null;
						}

						// Remove oldest toast if we have too many
						const existingToasts = container.querySelectorAll('.toast:not(.removing)');
						if (existingToasts.length >= this.maxToasts) {
							this.removeToast(existingToasts[0]);
						}

						const icons = {
							success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #059669;"><path d="M20 6 9 17l-5-5"/></svg>',
							error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #dc2626;"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
							info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #3b82f6;"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
							warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #d97706;"><path d="m21 16-4 4-4-4"/><path d="M17 20V9.5a2.5 2.5 0 0 0-5 0V20"/></svg>'
						};

						try {
							const toastEl = document.createElement('div');
							toastEl.className = 'toast ' + type;

							const title = options.title || message;
							const description = options.description || '';

							// Build HTML safely without nested template literals
							const iconHtml = icons[type] || icons.info;

							// Escape text to prevent HTML injection
							const escapeHtml = (text) => {
								const div = document.createElement('div');
								div.textContent = text;
								return div.innerHTML;
							};

							const safeTitle = escapeHtml(title);
							const safeDesc = description ? escapeHtml(description) : '';

							const titleHtml = '<div class="toast-title">' + safeTitle + '</div>';
							const descHtml = safeDesc ? '<div class="toast-description">' + safeDesc + '</div>' : '';

							toastEl.innerHTML =
								'<div class="toast-icon">' + iconHtml + '</div>' +
								'<div class="toast-content">' + titleHtml + descHtml + '</div>';

							// Store timeout IDs for cleanup
							toastEl._timeouts = [];

							container.appendChild(toastEl);

							// Auto-remove after duration
							const duration = options.duration || 4000;
							const autoRemoveTimeout = setTimeout(() => {
								this.removeToast(toastEl);
							}, duration);
							toastEl._timeouts.push(autoRemoveTimeout);

							// Click to dismiss
							const clickHandler = () => {
								this.removeToast(toastEl);
							};
							toastEl.addEventListener('click', clickHandler);
							toastEl._clickHandler = clickHandler; // Store for cleanup

							return toastEl;
						} catch (error) {
							console.error('Error creating toast:', error);
							return null;
						}
					},

					removeToast: function(toastEl) {
						if (!toastEl || !toastEl.parentNode) return;

						try {
							// Clear any pending timeouts
							if (toastEl._timeouts) {
								toastEl._timeouts.forEach(timeout => clearTimeout(timeout));
								toastEl._timeouts = [];
							}

							// Remove event listener
							if (toastEl._clickHandler) {
								toastEl.removeEventListener('click', toastEl._clickHandler);
								delete toastEl._clickHandler;
							}

							// Add removing class and animate out
							toastEl.classList.add('removing');

							const removeTimeout = setTimeout(() => {
								if (toastEl.parentNode) {
									toastEl.parentNode.removeChild(toastEl);
								}
							}, 200);

							toastEl._timeouts.push(removeTimeout);
						} catch (error) {
							console.error('Error removing toast:', error);
							// Fallback: force remove
							if (toastEl.parentNode) {
								toastEl.parentNode.removeChild(toastEl);
							}
						}
					},

					success: function(message, options = {}) {
						return this.show(message, 'success', options);
					},

					error: function(message, options = {}) {
						return this.show(message, 'error', options);
					},

					info: function(message, options = {}) {
						return this.show(message, 'info', options);
					},

					warning: function(message, options = {}) {
						return this.show(message, 'warning', options);
					}
				};

				// Global icon function for use throughout the client script
				const getIcon = (name, size = 16) => {
					const icons = {
						wifi: \`<svg width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>\`,
						wifiOff: \`<svg width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="m2 2 20 20"/></svg>\`,
						loader: \`<svg width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>\`,
						folder: \`<svg width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>\`,
						settings: \`<svg width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>\`,
						mail: \`<svg width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m22 6-10 7L2 6"/></svg>\`,
						trash: \`<svg width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2"/><path d="m10 11 0 6"/><path d="m14 11 0 6"/></svg>\`,
						check: \`<svg width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>\`,
						x: \`<svg width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>\`,
						alert: \`<svg width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 9 3-3 3 3"/><path d="M12 6v8"/></svg>\`
					};
					return icons[name] || '';
				};

				// Keep-alive mechanism
				let keepAliveInterval = null;
				let lastActivity = Date.now();
				let connectionToastShown = false;
				let disconnectionToastShown = false;
				let webSocketInitialized = false;

				// Initialize WebSocket connection
				function connectWebSocket() {
					// Prevent multiple connections
					if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
						console.log('[CLIENT] WebSocket already connected or connecting, skipping...');
						return;
					}

					// Close existing connection if any
					if (ws) {
						console.log('[CLIENT] Closing existing WebSocket connection');
						ws.close();
						ws = null;
					}

					const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
					const pathname = window.location.pathname.endsWith('/')
						? window.location.pathname + 'ws'
						: window.location.pathname + '/ws';
					const wsUrl = \`\${protocol}//\${window.location.host}\${pathname}\`;

					try {
						console.log('Connecting to WebSocket:', wsUrl);
						ws = new WebSocket(wsUrl);

						ws.onopen = function() {
							console.log('[CLIENT] WebSocket connected to:', wsUrl, 'at', new Date().toISOString());
							updateConnectionStatus('connected');
							reconnectDelay = 1000;
							lastActivity = Date.now();

							// Start keep-alive mechanism
							startKeepAlive();

							// Send immediate ping to establish activity
							setTimeout(() => {
								console.log('[CLIENT] Sending initial ping to establish activity');
								sendWebSocketMessage({ type: 'ping' });
							}, 1000);

							// Show connection toast only once per session
							if (!connectionToastShown) {
								toast.success('Connected to Fleet Manager', {
									description: 'Real-time communication established',
									duration: 2000
								});
								connectionToastShown = true;
								disconnectionToastShown = false; // Reset for next disconnection
							}
						};

						ws.onmessage = function(event) {
							console.log('[CLIENT] WebSocket message received at', new Date().toISOString(), ':', event.data);
							lastActivity = Date.now();
							const message = JSON.parse(event.data);
							handleWebSocketMessage(message);
						};

						ws.onclose = function(event) {
							console.log('[CLIENT] WebSocket disconnected at', new Date().toISOString(), 'Code:', event.code, 'Reason:', event.reason, 'WasClean:', event.wasClean);
							updateConnectionStatus('disconnected');
							stopKeepAlive();
							scheduleReconnect();

							// Show disconnection toast only once per disconnection
							if (!disconnectionToastShown) {
								toast.warning('Connection Lost', {
									description: 'Attempting to reconnect... Code: ' + event.code,
									duration: 3000
								});
								disconnectionToastShown = true;
								connectionToastShown = false; // Reset for next connection
							}
						};

						ws.onerror = function(error) {
							console.error('WebSocket error:', error);
							updateConnectionStatus('disconnected');
						};
					} catch (error) {
						console.error('Failed to create WebSocket:', error);
						updateConnectionStatus('disconnected');
						scheduleReconnect();
					}
				}

				function startKeepAlive() {
					stopKeepAlive(); // Clear any existing interval

					keepAliveInterval = setInterval(() => {
						const now = Date.now();
						const timeSinceLastActivity = now - lastActivity;

						// Send a ping every 10 seconds if no activity
						if (timeSinceLastActivity > 10000) {
							if (ws && ws.readyState === WebSocket.OPEN) {
								console.log('[CLIENT] Sending keepalive ping at', new Date().toISOString(), '(idle for ' + Math.round(timeSinceLastActivity/1000) + 's)');
								sendWebSocketMessage({ type: 'ping' });
								lastActivity = now;
							} else {
								console.log('[CLIENT] Cannot send ping - WebSocket state:', ws ? ws.readyState : 'null', 'at', new Date().toISOString());
							}
						}

						// If no activity for 2 minutes, assume connection is dead
						if (timeSinceLastActivity > 120000) {
							console.log('Connection appears dead, forcing reconnect');
							if (ws) {
								ws.close();
							}
						}
					}, 5000); // Check every 5 seconds
				}

				function stopKeepAlive() {
					if (keepAliveInterval) {
						clearInterval(keepAliveInterval);
						keepAliveInterval = null;
					}
				}

				function scheduleReconnect() {
					if (reconnectTimeout) {
						clearTimeout(reconnectTimeout);
					}

					reconnectTimeout = setTimeout(() => {
						console.log('Attempting to reconnect...');
						// Clear seen messages on reconnect to avoid stale deduplication
						seenMessages.clear();
						connectWebSocket();
						reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay);
					}, reconnectDelay);
				}

				function updateConnectionStatus(status) {
					const statusEl = document.getElementById('connectionStatus');

					if (status === 'connected') {
						const uptime = Math.round((Date.now() - lastActivity) / 1000);
						statusEl.innerHTML = \`<span class="flex items-center gap-2">\${getIcon('wifi')} Connected (idle: \${uptime}s)</span>\`;
						statusEl.className = 'connection-status connected';
					} else if (status === 'connecting') {
						statusEl.innerHTML = \`<span class="flex items-center gap-2">\${getIcon('loader')} Connecting</span>\`;
						statusEl.className = 'connection-status connecting';
					} else {
						statusEl.innerHTML = \`<span class="flex items-center gap-2">\${getIcon('wifiOff')} Disconnected</span>\`;
						statusEl.className = 'connection-status disconnected';
					}
				}

				// Update connection status display every few seconds
				setInterval(() => {
					if (ws && ws.readyState === WebSocket.OPEN) {
						updateConnectionStatus('connected');
					}
				}, 2000);

				function handleWebSocketMessage(message) {
					console.log('Handling WebSocket message:', message);
					switch (message.type) {
						case 'state':
							updateState(message.counter, message.agents);
							break;
						case 'agentCreated':
							addMessage('system', 'Agent "' + message.name + '" created', null, true);
							toast.success('Agent Created', {
								description: 'Agent "' + message.name + '" is now online',
								duration: 3000
							});
							// Request fresh state to update the UI immediately
							sendWebSocketMessage({ type: 'ping' });
							break;
						case 'agentDeleted':
							addMessage('system', 'Agent "' + message.name + '" deleted', null, true);
							toast.info('Agent Deleted', {
								description: 'Agent "' + message.name + '" has been removed',
								duration: 3000
							});
							// Request fresh state to update the UI immediately
							sendWebSocketMessage({ type: 'ping' });
							break;
						case 'message':
							console.log('Received message from:', message.from, 'content:', message.content);

							// Only treat as "new" if we're not loading history AND initial history is loaded
							const isNewLiveMessage = !isLoadingHistory && hasLoadedInitialHistory && message.from !== 'system';
							addMessage(message.from, message.content, null, isNewLiveMessage);

							// Show toast ONLY for genuinely new live messages (not historical ones or own messages)
							const isOwnMessage = recentlySentMessages.has(message.content);
							const currentTime = new Date();

							// Check if this message is newer than our last seen timestamp
							// For live messages, we consider them "new" if they arrive after session start
							const isRecentMessage = isNewLiveMessage && currentTime > sessionStartTime;

							if (isRecentMessage && !isOwnMessage) {
								const fromName = message.from.replace(/📢|📨/g, '').trim();
								const messageType = message.from.includes('📢') ? 'broadcast' : 'direct';

								toast.info('New ' + messageType + ' message', {
									description: 'From ' + fromName + ': ' + message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
									duration: 4000
								});

								// Update last seen timestamp for genuinely new messages
								updateLastSeenTimestamp();
							}

							// Clean up the message from tracking since we've processed it
							if (isOwnMessage) {
								recentlySentMessages.delete(message.content);
							}
							break;
						case 'pong':
							console.log('[CLIENT] Received pong from server at', new Date().toISOString());
							lastActivity = Date.now();
							break;
						case 'error':
							addMessage('error', message.message, null, true);
							toast.error('Error', {
								description: message.message,
								duration: 5000
							});
							break;
						case 'chatResponse':
							handleChatResponse(message);
							break;
						case 'chatStats':
							handleChatStats(message);
							break;
						default:
							console.log('Unknown message type:', message.type);
					}
				}

				function updateState(counter, agents) {
					const counterEl = document.getElementById('counter');
					const agentCountEl = document.getElementById('agent-count');
					const agentListEl = document.getElementById('agent-list');

					if (counterEl) counterEl.textContent = counter;
					if (agentCountEl) agentCountEl.textContent = agents.length;

					if (!agentListEl) return;

					// Determine if we're at root level (no path segments)
					const isAtRoot = currentPath === '/' || currentPath === '';
					const emptyTitle = isAtRoot ? 'No Locations' : 'No Sub-Locations';
					const emptyDescription = isAtRoot
						? 'Create your first location to start managing inventory across your organization.'
						: 'Create sub-locations to organize inventory under this location.';
					const actionText = isAtRoot ? 'location' : 'sub-location';

					if (agents.length === 0) {
						agentListEl.innerHTML = \`
							<div class="empty-state">
								<div class="empty-state-icon">□</div>
								<h4>\${emptyTitle}</h4>
								<p>\${emptyDescription}</p>
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
									<p class="text-small">← Use the form to create your first \${actionText}</p>
								</div>
							</div>
						\`;
					} else {
						agentListEl.innerHTML = agents.map(agent => \`
							<div class="source-item">
								<div class="source-info">
									\${getIcon('folder', 20)}
									<div class="source-details">
										<h4>\${agent}</h4>
										<p class="source-path">\${window.location.pathname === '/' ? '' : window.location.pathname}/\${agent}</p>
									</div>
								</div>
								<div class="source-actions">
									<a href="\${window.location.pathname === '/' ? '' : window.location.pathname}/\${encodeURIComponent(agent)}" class="btn btn-secondary" title="Manage \${agent}">
										\${getIcon('settings', 14)} Manage
									</a>
									<button onclick="sendDirectMessage('\${agent}')" class="btn btn-primary" title="Send message to \${agent}">
										\${getIcon('mail', 14)} Message
									</button>
									<button onclick="deleteAgent('\${agent}')" class="btn btn-danger" title="Delete \${agent} and all children">
										\${getIcon('trash', 14)} Delete
									</button>
								</div>
							</div>
						\`).join('');
					}
				}


				function sendWebSocketMessage(message) {
					console.log('Sending WebSocket message:', message);
					if (ws && ws.readyState === WebSocket.OPEN) {
						ws.send(JSON.stringify(message));
					} else {
						console.log('WebSocket not connected, readyState:', ws ? ws.readyState : 'null');
						addMessage('error', 'WebSocket not connected');
					}
				}

				function incrementCounter() {
					sendWebSocketMessage({ type: 'increment' });
				}

				function createAgent(event) {
					event.preventDefault();
					const form = event.target;
					const agentName = form.agentName.value.trim();

					console.log('Creating agent:', agentName);
					if (agentName) {
						sendWebSocketMessage({ type: 'createAgent', name: agentName });
						form.reset();

						// Show immediate feedback
						toast.info('Creating Agent...', {
							description: 'Setting up agent "' + agentName + '"',
							duration: 2000
						});
					}
				}

				function deleteAgent(name) {
					if (confirm('Are you sure you want to delete agent "' + name + '" and all its children?')) {
						sendWebSocketMessage({ type: 'deleteAgent', name });
					}
				}

				// Navigate to parent in hierarchy
				function navigateToParent(parentPath) {
					console.log('Navigating to parent:', parentPath);
					window.location.href = parentPath;
				}

				function broadcastMessage(event) {
					event.preventDefault();
					const form = event.target;
					const message = form.broadcastMessage.value.trim();

					if (message) {
						// Track this message as recently sent to avoid showing toast when it comes back
						recentlySentMessages.add(message);

						sendWebSocketMessage({ type: 'broadcast', message });
						form.reset();

						// Update last seen timestamp since we just sent a message
						updateLastSeenTimestamp();

						// Show immediate feedback
						toast.success('Message Sent!', {
							description: 'Broadcast sent to all agents',
							duration: 2000
						});
					}

					return false;
				}

				function sendDirectMessage(agentName) {
					// Create a modern modal for messaging
					const modal = document.createElement('div');
					modal.style.cssText = \`
						position: fixed;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
						background: rgba(0,0,0,0.7);
						display: flex;
						justify-content: center;
						align-items: center;
						z-index: 2000;
						backdrop-filter: blur(8px);
						animation: modalFadeIn 0.2s ease-out;
					\`;

					modal.innerHTML = \`
						<div class="bg-white border border-gray-200 rounded-lg max-w-md w-full mx-4" style="animation: modalSlideIn 0.3s ease-out;">
							<div class="border-b border-gray-200 p-6">
								<h3 class="text-xl font-semibold text-gray-900 flex items-center gap-3">
									\${getIcon('mail', 20)} Send Message to \${agentName}
								</h3>
							</div>
							<div class="p-6">
								<textarea
									id="messageInput"
									placeholder="Type your message here..."
									class="w-full h-32 p-3 border border-gray-300 rounded-md resize-vertical text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-150"
									autofocus
								></textarea>
							</div>
							<div class="flex gap-3 justify-end p-6 border-t border-gray-200 bg-gray-50">
								<button onclick="this.closest('[style*=fixed]').remove()" class="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md font-medium transition-colors duration-150 inline-flex items-center gap-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1">
									\${getIcon('x', 16)} Cancel
								</button>
								<button onclick="sendMessageFromModal('\${agentName}')" class="px-4 py-2 bg-gray-900 hover:bg-black text-white border border-gray-900 rounded-md font-medium transition-colors duration-150 inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1">
									\${getIcon('check', 16)} Send Message
								</button>
							</div>
						</div>
					\`;

					// Add modal animations to the page
					if (!document.querySelector('#modalAnimations')) {
						const style = document.createElement('style');
						style.id = 'modalAnimations';
						style.textContent = \`
							@keyframes modalFadeIn {
								from { opacity: 0; }
								to { opacity: 1; }
							}
							@keyframes modalSlideIn {
								from {
									opacity: 0;
									transform: scale(0.95) translateY(-20px);
								}
								to {
									opacity: 1;
									transform: scale(1) translateY(0);
								}
							}
						\`;
						document.head.appendChild(style);
					}

					document.body.appendChild(modal);
					modal.querySelector('#messageInput').focus();

					// Handle enter key
					modal.querySelector('#messageInput').addEventListener('keydown', function(e) {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							sendMessageFromModal(agentName);
						}
					});
				}

				function sendMessageFromModal(agentName) {
					const modal = document.querySelector('[style*="position: fixed"]');
					const messageInput = modal.querySelector('#messageInput');
					const message = messageInput.value.trim();

					if (message) {
						// Track this message as recently sent to avoid showing toast when it comes back
						recentlySentMessages.add(message);

						sendWebSocketMessage({
							type: 'directMessage',
							agentName: agentName,
							message: message
						});

						// Update last seen timestamp since we just sent a message
						updateLastSeenTimestamp();

						// Show immediate feedback
						toast.success('Direct Message Sent!', {
							description: 'Message sent to ' + agentName,
							duration: 2000
						});
					}

					modal.remove();
				}

				// Track message pagination
				let messageOffset = 0;
				let hasMoreMessages = true;
				let isLoadingHistory = false;
				let hasLoadedInitialHistory = false;

				// Track recently sent messages to avoid showing toasts for own messages
				let recentlySentMessages = new Set();

				// Clean up old message tracking every 30 seconds
				setInterval(() => {
					recentlySentMessages.clear();
				}, 30000);

				// Track last seen message timestamp to avoid showing toasts for old messages after refresh
				const getLastSeenTimestamp = () => {
					const stored = localStorage.getItem('fleetManager_lastSeenMessage');
					return stored ? new Date(stored) : new Date(0);
				};

				const updateLastSeenTimestamp = () => {
					localStorage.setItem('fleetManager_lastSeenMessage', new Date().toISOString());
				};

				// Initialize last seen timestamp for this session
				let sessionStartTime = new Date();
				let lastSeenTimestamp = getLastSeenTimestamp();

				// Track user activity to prevent unnecessary pings
				function updateUserActivity() {
					lastActivity = Date.now();
				}

				// Add event listeners to track user activity
				function setupActivityTracking() {
					// Track various user interactions
					const events = ['click', 'keypress', 'mousemove', 'scroll', 'touchstart'];
					events.forEach(event => {
						document.addEventListener(event, updateUserActivity, { passive: true });
					});
				}

				// Load message history from server
				function loadMessageHistory(limit = 20, offset = 0) {
					isLoadingHistory = true;

					const currentPath = window.location.pathname.endsWith('/')
						? window.location.pathname.slice(0, -1)
						: window.location.pathname;
					const messagesUrl = \`$\{currentPath}/messages?limit=$\{limit}&offset=$\{offset}\`;

					fetch(messagesUrl)
						.then(response => response.json())
						.then(data => {
							if (data.messages && data.messages.length > 0) {
								// Clear existing messages if this is the first load
								if (offset === 0) {
									document.getElementById('messages').innerHTML = '';
									messageOffset = 0;
								}

								// Add historical messages (NO toasts, NO animations for historical data)
								data.messages.forEach(msg => {
									const fromDisplay = msg.message_type === 'direct'
										? \`📨 $\{msg.from_agent}\`
										: msg.message_type === 'broadcast'
										? \`📢 $\{msg.from_agent}\`
										: msg.from_agent;
									addMessage(fromDisplay, msg.content, new Date(msg.timestamp), false); // false = no animations/toasts
								});

								messageOffset += data.messages.length;
								hasMoreMessages = data.hasMore;

								// Show/hide "Load More" button
								const loadMoreBtn = document.getElementById('loadMoreMessages');
								if (loadMoreBtn) {
									loadMoreBtn.style.display = hasMoreMessages ? 'block' : 'none';
								}

								console.log(\`Loaded $\{data.messages.length} historical messages\`);
							} else {
								hasMoreMessages = false;
								const loadMoreBtn = document.getElementById('loadMoreMessages');
								if (loadMoreBtn) {
									loadMoreBtn.style.display = 'none';
								}
							}

							// Mark that initial history has been loaded
							if (offset === 0) {
								hasLoadedInitialHistory = true;
							}
							isLoadingHistory = false;
						})
						.catch(error => {
							console.error('Failed to load message history:', error);
							addMessage('error', 'Failed to load message history', null, true); // Show error toast
							isLoadingHistory = false;
						});
				}

				// Load more messages function for the button
				function loadMoreMessages() {
					if (hasMoreMessages) {
						loadMessageHistory(20, messageOffset);
					}
				}

				// Enhanced addMessage function to handle timestamps and animations
				function addMessage(type, content, timestamp = null, isNewMessage = false) {
					console.log('Adding message:', type, content);
					const messages = document.getElementById('messages');
					if (!messages) {
						console.error('Messages container not found!');
						return;
					}

					const messageDiv = document.createElement('div');
					const typeColors = {
						system: 'var(--primary)',
						broadcast: 'var(--success)',
						error: 'var(--danger)',
						default: 'var(--secondary)'
					};

					const color = typeColors[type] || typeColors.default;
					const messageTime = timestamp || new Date();

					messageDiv.style.cssText = \`
						margin-bottom: 12px;
						padding: 12px 16px;
						border-radius: 6px;
						font-size: 0.875rem;
						background: var(--bg-primary);
						border-left: 4px solid \${color};
						transition: colors 0.15s ease;
					\`;

					// Add animation classes for new messages
					if (isNewMessage) {
						messageDiv.classList.add('message-enter');
						// Add highlight effect for really fresh messages
						setTimeout(() => {
							messageDiv.classList.add('message-highlight');
						}, 100);
					}

					messageDiv.innerHTML = \`
						<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
							<div>
								<strong style="color: \${color}; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px;">\${type}:</strong>
								<div style="margin-top: 4px; color: var(--text-primary);">\${content}</div>
							</div>
							<small style="color: var(--text-secondary); font-size: 0.75rem; white-space: nowrap;">\${messageTime.toLocaleTimeString()}</small>
						</div>
					\`;

					messages.appendChild(messageDiv);

					// Smooth scroll to new message
					if (isNewMessage) {
						messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
					} else {
						messages.scrollTop = messages.scrollHeight;
					}

					console.log('Message added, total messages:', messages.children.length);
				}

				// Initialize connection on page load
				document.addEventListener('DOMContentLoaded', function() {
					updateConnectionStatus('connecting');

					// Set up activity tracking
					setupActivityTracking();

					// Only initialize WebSocket once
					if (!webSocketInitialized) {
						connectWebSocket();
						webSocketInitialized = true;
					}

					// Load message history first
					loadMessageHistory();

					// Restore active tab from localStorage
					restoreActiveTab();

					// Add a welcome message
					setTimeout(() => {
						addMessage('system', 'Fleet Manager connected - ready for real-time communication');
						// Update last seen timestamp after loading initial history and connecting
						updateLastSeenTimestamp();
					}, 500);

					// Add event listener for broadcast form
					const broadcastForm = document.getElementById('broadcastForm');
					if (broadcastForm) {
						broadcastForm.addEventListener('submit', function(event) {
							event.preventDefault();
							broadcastMessage(event);
						});
					}
				});

				// Handle page unload
				window.addEventListener('beforeunload', function() {
					stopKeepAlive();
					if (ws) {
						ws.close();
					}
				});

				// ==============================================
				// UI TAB SWITCHING FUNCTIONALITY
				// ==============================================
				window.switchTab = function(tabName) {
					// Hide all content
					document.getElementById('fleet-content').classList.add('hidden');
					document.getElementById('inventory-content').classList.add('hidden');
					document.getElementById('ai-content').classList.add('hidden');

					// Reset all tab buttons
					['tab-fleet', 'tab-inventory', 'tab-ai'].forEach(id => {
						const btn = document.getElementById(id);
						btn.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
						btn.classList.add('text-gray-500');
					});

					// Show selected content and activate tab
					document.getElementById(tabName + '-content').classList.remove('hidden');
					const activeTab = document.getElementById('tab-' + tabName);
					activeTab.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
					activeTab.classList.remove('text-gray-500');

					// Load data when switching to tabs
					if (tabName === 'inventory') {
						refreshInventory();
					} else if (tabName === 'ai') {
						getAIInsights();
					}
				};

				// ==============================================
				// INVENTORY MANAGEMENT FUNCTIONALITY
				// ==============================================
				window.updateInventory = async function() {
					const sku = document.getElementById('sku-input').value.trim();
					const name = document.getElementById('name-input').value.trim();
					const quantity = parseInt(document.getElementById('quantity-input').value);
					const operation = document.getElementById('operation-select').value;
					const threshold = parseInt(document.getElementById('threshold-input').value) || 10;

					if (!sku || isNaN(quantity)) {
						alert('Please enter a valid SKU and quantity');
						return;
					}

					try {
						// Construct proper absolute URL for API call
						const baseUrl = window.location.origin;
						const pathPrefix = currentPath === '/' ? '' : currentPath;
						const apiUrl = baseUrl + pathPrefix + '/inventory/stock';

						const response = await fetch(apiUrl, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								sku,
								name: name || sku,
								quantity,
								operation,
								lowStockThreshold: threshold,
								timestamp: new Date().toISOString(),
								location: currentPath
							})
						});

						if (response.ok) {
							addMessage('System', 'Inventory updated successfully: ' + sku);
							document.getElementById('inventory-form').reset();
							await refreshInventory();
						} else {
							const error = await response.json();
							addMessage('System', 'Failed to update inventory: ' + error.details);
						}
					} catch (error) {
						addMessage('System', 'Error updating inventory: ' + error.message);
					}
				};

				window.refreshInventory = async function() {
					try {
						// Construct proper absolute URL for API call
						const baseUrl = window.location.origin;
						const pathPrefix = currentPath === '/' ? '' : currentPath;
						const apiUrl = baseUrl + pathPrefix + '/inventory/stock';
						console.log('Fetching inventory from:', apiUrl);

						const response = await fetch(apiUrl);
						if (response.ok) {
							const data = await response.json();
							displayInventoryList(data.inventory || []);
							updateInventoryStats(data.inventory || []);
							await refreshInventoryAlerts();
						}
					} catch (error) {
						console.error('Failed to refresh inventory:', error);
					}
				};

				window.displayInventoryList = function(inventory) {
					const container = document.getElementById('inventory-list');
					if (!inventory || inventory.length === 0) {
						container.innerHTML = \`
							<div class="text-center text-gray-500 py-8">
								<div class="h-12 w-12 mx-auto text-gray-300 mb-4">📦</div>
								<p>No inventory items found</p>
								<p class="text-sm">Add items using the form above</p>
							</div>
						\`;
						return;
					}

					container.innerHTML = inventory.map(item => \`
						<div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
							<div class="flex-1">
								<h4 class="font-medium text-gray-900">\${item.name || item.sku}</h4>
								<p class="text-sm text-gray-500">SKU: \${item.sku}</p>
								<div class="flex items-center mt-1">
									<span class="text-sm text-gray-600">Stock: </span>
									<span class="text-sm font-medium \${item.currentStock <= item.lowStockThreshold ? 'text-red-600' : 'text-green-600'} ml-1">
										\${item.currentStock}
									</span>
									<span class="text-xs text-gray-400 ml-2">(threshold: \${item.lowStockThreshold})</span>
								</div>
							</div>
							<div class="flex space-x-2">
								<button onclick="analyzeItem('\${item.sku}')" class="text-purple-600 hover:text-purple-800 text-sm">
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M9 12l2 2 4-4"/>
										<path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h18z"/>
										<path d="M3 12v6c0 .552.448 1 1 1h16c.552 0 1-.448 1-1v-6"/>
									</svg>
									Analyze
								</button>
								<button onclick="quickStock('\${item.sku}', 'increment')" class="text-green-600 hover:text-green-800 text-sm">
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M5 12h14"/>
										<path d="M12 5v14"/>
									</svg>
								</button>
								<button onclick="quickStock('\${item.sku}', 'decrement')" class="text-red-600 hover:text-red-800 text-sm">
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M5 12h14"/>
									</svg>
								</button>
							</div>
						</div>
					\`).join('');
				};

				window.updateInventoryStats = function(inventory) {
					const totalItems = inventory.length;
					const lowStockItems = inventory.filter(item => item.currentStock <= item.lowStockThreshold).length;
					const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * 10), 0); // Mock pricing

					document.getElementById('total-items').textContent = totalItems;
					document.getElementById('low-stock-count').textContent = lowStockItems;
					document.getElementById('total-value').textContent = '$' + totalValue.toLocaleString();
				};

				window.refreshInventoryAlerts = async function() {
					try {
						// Construct proper absolute URL for API call
						const baseUrl = window.location.origin;
						const pathPrefix = currentPath === '/' ? '' : currentPath;
						const apiUrl = baseUrl + pathPrefix + '/inventory/alerts';

						const response = await fetch(apiUrl);
						if (response.ok) {
							const data = await response.json();
							displayInventoryAlerts(data.alerts || []);
						}
					} catch (error) {
						console.error('Failed to refresh alerts:', error);
					}
				};

				window.displayInventoryAlerts = function(alerts) {
					const container = document.getElementById('inventory-alerts');
					if (!alerts || alerts.length === 0) {
						container.innerHTML = \`
							<div class="text-center text-gray-500 py-4">
								<div class="h-8 w-8 mx-auto text-gray-300 mb-2">⚠️</div>
								<p class="text-sm">No alerts at this time</p>
							</div>
						\`;
						return;
					}

					container.innerHTML = alerts.map(alert => \`
						<div class="flex items-center p-3 bg-\${alert.severity === 'critical' ? 'red' : 'yellow'}-50 border border-\${alert.severity === 'critical' ? 'red' : 'yellow'}-200 rounded-lg">
							<div class="h-4 w-4 text-\${alert.severity === 'critical' ? 'red' : 'yellow'}-500 mr-3">⚠️</div>
							<div class="flex-1">
								<p class="text-sm font-medium text-\${alert.severity === 'critical' ? 'red' : 'yellow'}-800">
									\${alert.name} (\${alert.sku})
								</p>
								<p class="text-xs text-\${alert.severity === 'critical' ? 'red' : 'yellow'}-600">
									Stock: \${alert.currentStock} / Threshold: \${alert.threshold}
								</p>
							</div>
							<button onclick="analyzeItem('\${alert.sku}')" class="text-xs text-\${alert.severity === 'critical' ? 'red' : 'yellow'}-700 hover:underline">
								Analyze
							</button>
						</div>
					\`).join('');
				};

				// Quick Actions
				window.simulateSale = function() {
					const skus = ['LAPTOP-001', 'PHONE-002', 'TABLET-003'];
					const randomSku = skus[Math.floor(Math.random() * skus.length)];
					quickStock(randomSku, 'decrement', Math.floor(Math.random() * 5) + 1);
				};

				window.simulateRestock = function() {
					const skus = ['LAPTOP-001', 'PHONE-002', 'TABLET-003'];
					const randomSku = skus[Math.floor(Math.random() * skus.length)];
					quickStock(randomSku, 'increment', Math.floor(Math.random() * 20) + 10);
				};

				window.triggerLowStockDemo = function() {
					const skus = ['LAPTOP-001', 'PHONE-002', 'TABLET-003'];
					const randomSku = skus[Math.floor(Math.random() * skus.length)];
					quickStock(randomSku, 'set', 2); // Set to very low stock
				};

				window.quickStock = async function(sku, operation, quantity = 1) {
					try {
						// Construct proper absolute URL for API call
						const baseUrl = window.location.origin;
						const pathPrefix = currentPath === '/' ? '' : currentPath;
						const apiUrl = baseUrl + pathPrefix + '/inventory/stock';

						const response = await fetch(apiUrl, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								sku,
								quantity,
								operation,
								timestamp: new Date().toISOString(),
								location: currentPath
							})
						});

						if (response.ok) {
							addMessage('System', \`📦 Quick \${operation}: \${sku} (\${quantity} units)\`);
							await refreshInventory();
						}
					} catch (error) {
						console.error('Quick stock operation failed:', error);
					}
				};

				// ==============================================
				// AI FUNCTIONALITY
				// ==============================================
				window.runAIAnalysis = async function() {
					const sku = document.getElementById('analyze-sku').value.trim();
					if (!sku) {
						alert('Please enter a SKU to analyze');
						return;
					}

					try {
						// Construct proper absolute URL for API call
						const baseUrl = window.location.origin;
						const pathPrefix = currentPath === '/' ? '' : currentPath;
						const apiUrl = baseUrl + pathPrefix + '/ai/analyze?sku=' + encodeURIComponent(sku);

						const response = await fetch(apiUrl);
						if (response.ok) {
							const data = await response.json();
							displayAIAnalysis(data.insights);
							addMessage('AI Agent', \`Analysis complete for \${sku}: \${data.insights.reasoning}\`);
						} else {
							const error = await response.json();
							addMessage('System', 'AI Analysis failed: ' + error.details);
						}
					} catch (error) {
						addMessage('System', 'AI Analysis error: ' + error.message);
					}
				};

				window.analyzeItem = async function(sku) {
					document.getElementById('analyze-sku').value = sku;
					switchTab('ai');
					await runAIAnalysis();
				};

				window.displayAIAnalysis = function(insights) {
					document.getElementById('ai-analysis-results').classList.remove('hidden');
					document.getElementById('should-reorder').textContent = insights.shouldReorder ? 'Yes' : 'No';
					document.getElementById('reorder-quantity').textContent = insights.reorderQuantity + ' units';
					document.getElementById('urgency').textContent = insights.urgency.toUpperCase();
					document.getElementById('confidence').textContent = Math.round(insights.confidence * 100) + '%';
					document.getElementById('ai-reasoning').textContent = insights.reasoning;

					// Update urgency color
					const urgencyEl = document.getElementById('urgency');
					urgencyEl.className = 'text-sm font-medium text-' + (
						insights.urgency === 'critical' ? 'red-600' :
						insights.urgency === 'high' ? 'orange-600' :
						insights.urgency === 'medium' ? 'yellow-600' : 'green-600'
					);
				};

				window.runDemandForecast = async function() {
					try {
						// Construct proper absolute URL for API call
						const baseUrl = window.location.origin;
						const pathPrefix = currentPath === '/' ? '' : currentPath;
						const apiUrl = baseUrl + pathPrefix + '/ai/forecast';

						addMessage('AI Agent', 'Running 30-day demand forecast...');
						const response = await fetch(apiUrl, { method: 'POST' });
						if (response.ok) {
							const data = await response.json();
							displayForecastResults(data.forecasts || []);
							addMessage('AI Agent', \`Demand forecast complete: \${data.totalForecasts} SKUs analyzed\`);
						} else {
							const error = await response.json();
							addMessage('System', 'Forecast failed: ' + error.details);
						}
					} catch (error) {
						addMessage('System', 'Forecast error: ' + error.message);
					}
				};

				window.displayForecastResults = function(forecasts) {
					const container = document.getElementById('forecast-results');
					if (!forecasts || forecasts.length === 0) {
						container.innerHTML = \`
							<div class="text-center text-gray-500 py-4">
								<div class="h-8 w-8 mx-auto text-gray-300 mb-2">
									<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<rect width="18" height="18" x="3" y="3" rx="2"/>
										<path d="M9 9h6v6H9z"/>
									</svg>
								</div>
								<p class="text-sm">No forecasts available</p>
							</div>
						\`;
						return;
					}

					container.innerHTML = forecasts.map(forecast => \`
						<div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
							<div class="flex justify-between items-start">
								<div class="flex-1">
									<h5 class="font-medium text-blue-900">\${forecast.sku}</h5>
									<div class="text-sm text-blue-700 mt-1">
										<span>Predicted Demand: \${forecast.predicted_demand} units</span>
										<span class="mx-2">•</span>
										<span>Trend: \${forecast.trend_direction}</span>
									</div>
								</div>
								<div class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
									\${Math.round(forecast.confidence * 100)}% confidence
								</div>
							</div>
							<p class="text-xs text-blue-600 mt-2">\${forecast.reasoning}</p>
						</div>
					\`).join('');
				};

				window.getAIInsights = async function() {
					try {
						// Construct proper absolute URL for API call
						const baseUrl = window.location.origin;
						const pathPrefix = currentPath === '/' ? '' : currentPath;
						const apiUrl = baseUrl + pathPrefix + '/ai/insights';

						const response = await fetch(apiUrl);
						if (response.ok) {
							const data = await response.json();
							updateAIStatus(data);
							displayDecisionHistory(data.insights.recentDecisions || []);
						}
					} catch (error) {
						console.error('Failed to get AI insights:', error);
					}
				};

				window.updateAIStatus = function(data) {
					document.getElementById('decisions-count').textContent = data.summary.totalDecisions;
					document.getElementById('avg-confidence').textContent = Math.round(data.summary.avgConfidence * 100) + '%';
					document.getElementById('active-workflows').textContent = '1'; // Mock value
				};

				window.displayDecisionHistory = function(decisions) {
					const container = document.getElementById('decision-history');
					if (!decisions || decisions.length === 0) {
						container.innerHTML = \`
							<div class="text-center text-gray-500 py-8">
								<div class="h-12 w-12 mx-auto text-gray-300 mb-4">
									<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M20 6 9 17l-5-5"/>
									</svg>
								</div>
								<p>No AI decisions recorded yet</p>
								<p class="text-sm">Decisions will appear here as the AI makes inventory recommendations</p>
							</div>
						\`;
						return;
					}

					container.innerHTML = decisions.map(decision => \`
						<div class="flex items-start p-3 border border-gray-200 rounded-lg">
							<div class="h-4 w-4 text-green-500 mt-0.5 mr-3">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M20 6 9 17l-5-5"/>
								</svg>
							</div>
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-900">\${decision.decision_type}</p>
								<p class="text-sm text-gray-600">\${decision.sku} - \${decision.reasoning}</p>
								<p class="text-xs text-gray-400 mt-1">\${new Date(decision.timestamp).toLocaleString()}</p>
							</div>
						</div>
					\`).join('');
				};

				// AI Workflow Controls
				window.enableAIMode = function() {
					addMessage('System', 'AI Auto-Reorder Mode: ENABLED');
					addMessage('AI Agent', 'I will now automatically analyze inventory and make reorder recommendations!');
				};

				window.disableAIMode = function() {
					addMessage('System', 'AI Auto-Reorder Mode: DISABLED');
					addMessage('AI Agent', 'AI auto-reorder has been disabled. Manual approval required for all orders.');
				};

				window.triggerAIWorkflow = function() {
					addMessage('System', 'Triggering AI workflow for all inventory items...');
					setTimeout(() => {
						addMessage('AI Agent', 'Workflow complete: Analyzed 3 SKUs, generated 1 reorder recommendation');
					}, 2000);
				};

				// Enhanced WebSocket message handling for inventory and AI
				const originalAddMessage = window.addMessage;
				window.addMessage = function(from, content) {
					originalAddMessage(from, content);

					// Update AI activity feed
					if (from.includes('AI') || from === 'System' && content.includes('AI')) {
						updateAIActivity(from, content);
					}

					// Auto-refresh inventory on updates
					if (content.includes('Stock updated') || content.includes('Inventory updated')) {
						setTimeout(() => {
							if (!document.getElementById('inventory-content').classList.contains('hidden')) {
								refreshInventory();
							}
						}, 500);
					}
				};

				window.updateAIActivity = function(from, content) {
					const container = document.getElementById('ai-activity');
					if (!container) return;

					// Create activity item
					const activityItem = document.createElement('div');
					activityItem.className = 'flex items-start p-3 bg-purple-50 border border-purple-200 rounded-lg';
					activityItem.innerHTML = \`
						<div class="h-4 w-4 text-purple-500 mt-0.5 mr-3">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M12 8V4H8"/>
								<rect width="16" height="12" x="4" y="8" rx="2"/>
								<path d="M2 14h2"/>
								<path d="M20 14h2"/>
								<path d="M15 13v2"/>
								<path d="M9 13v2"/>
							</svg>
						</div>
						<div class="flex-1">
							<p class="text-sm font-medium text-purple-900">\${from}</p>
							<p class="text-sm text-purple-700">\${content}</p>
							<p class="text-xs text-purple-500 mt-1">\${new Date().toLocaleString()}</p>
						</div>
					\`;

					// Remove empty state if present
					const emptyState = container.querySelector('.text-center');
					if (emptyState) {
						container.innerHTML = '';
					}

					// Add to top
					container.insertBefore(activityItem, container.firstChild);

					// Keep only last 10 items
					while (container.children.length > 10) {
						container.removeChild(container.lastChild);
					}
				};

				// Tab switching functionality with localStorage persistence
				window.switchTab = function(tabName) {
					// Hide all content
					const contents = ['fleet-content', 'inventory-content', 'chat-content', 'ai-content'];
					contents.forEach(id => {
						const el = document.getElementById(id);
						if (el) el.classList.remove('active');
					});

					// Reset all tab buttons
					const tabs = ['tab-fleet', 'tab-inventory', 'tab-chat', 'tab-ai'];
					tabs.forEach(id => {
						const btn = document.getElementById(id);
						if (btn) btn.classList.remove('active');
					});

					// Show selected content and activate tab
					const selectedContent = document.getElementById(tabName + '-content');
					const selectedTab = document.getElementById('tab-' + tabName);

					if (selectedContent) selectedContent.classList.add('active');
					if (selectedTab) selectedTab.classList.add('active');

					// Save active tab to localStorage
					try {
						localStorage.setItem('fleetManager_activeTab', tabName);
					} catch (error) {
						console.warn('Could not save tab state to localStorage:', error);
					}

					// Load data when switching to tabs
					if (tabName === 'inventory') {
						if (window.refreshInventory) window.refreshInventory();
					} else if (tabName === 'chat') {
						// Initialize chat when switching to chat tab
						initializeChatWithConnection();
					} else if (tabName === 'ai') {
						// Load AI data if needed
					}
				};

				// Function to restore active tab from localStorage
				window.restoreActiveTab = function() {
					try {
						const savedTab = localStorage.getItem('fleetManager_activeTab');
						if (savedTab && ['fleet', 'inventory', 'chat', 'ai'].includes(savedTab)) {
							// Small delay to ensure DOM is ready
							setTimeout(() => {
								window.switchTab(savedTab);
							}, 100);
						} else {
							// Default to fleet tab if no saved tab or invalid tab
							setTimeout(() => {
								window.switchTab('fleet');
							}, 100);
						}
					} catch (error) {
						console.warn('Could not restore tab state from localStorage:', error);
						// Default to fleet tab if localStorage is not available
						setTimeout(() => {
							window.switchTab('fleet');
						}, 100);
					}
				};

				// Chat functionality
				let chatMessageCount = 0;
				let chatActionsCount = 0;

				function initializeChat() {
					const chatForm = document.getElementById('chat-form');
					const chatInput = document.getElementById('chat-input');

					if (chatForm && chatInput) {
						chatForm.addEventListener('submit', function(e) {
							e.preventDefault();
							const message = chatInput.value.trim();
							if (message) {
								sendChatMessage(message);
								chatInput.value = '';
							}
						});

						// Also handle Enter key in input
						chatInput.addEventListener('keypress', function(e) {
							if (e.key === 'Enter') {
								e.preventDefault();
								const message = chatInput.value.trim();
								if (message) {
									sendChatMessage(message);
									chatInput.value = '';
								}
							}
						});
					}
				}

				function sendChatMessage(message) {
					console.log('[CHAT] Attempting to send message:', message);
					console.log('[CHAT] WebSocket state:', ws ? ws.readyState : 'null');
					console.log('[CHAT] WebSocket OPEN constant:', WebSocket.OPEN);

					if (!ws || ws.readyState !== WebSocket.OPEN) {
						console.error('[CHAT] WebSocket not connected. State:', ws ? ws.readyState : 'null');
						toast.error('WebSocket not connected', {
							description: 'Please wait for connection to be established',
							duration: 5000
						});
						return;
					}

					// Add user message to chat
					addChatMessage('user', message);
					chatMessageCount++;
					updateChatStats();

					// Send to server
					const chatMessage = {
						type: 'chatMessage',
						content: message,
						userId: 'user-' + Date.now()
					};

					console.log('[CHAT] Sending message to WebSocket:', chatMessage);
					ws.send(JSON.stringify(chatMessage));
				}

				function addChatMessage(role, content, metadata = null) {
					const messagesContainer = document.getElementById('chat-messages');
					if (!messagesContainer) return;

					// Create a unique key for deduplication
					const messageKey = role + '-' + content + '-' + Date.now();

					// Skip if we've already seen this message recently (within 1 second)
					const recentKey = role + '-' + content;
					if (seenMessages.has(recentKey)) {
						console.log('[CHAT] Skipping duplicate addChatMessage:', recentKey);
						return;
					}

					// Mark as seen
					seenMessages.add(recentKey);

					// Clear the recent key after 1 second to allow legitimate duplicates
					setTimeout(() => {
						seenMessages.delete(recentKey);
					}, 1000);

					const messageEl = document.createElement('div');
					messageEl.className = 'chat-message ' + role;

					const avatar = role === 'user'
						? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>'
						: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>';
					const sender = role === 'user' ? 'You' : 'AI Assistant';
					const time = new Date().toLocaleTimeString();

					messageEl.innerHTML = \`
						<div class="message-avatar">\${avatar}</div>
						<div class="message-content">
							<div class="message-header">
								<span class="message-sender">\${sender}</span>
								<span class="message-time">\${time}</span>
							</div>
							<div class="message-text">\${content}</div>
							\${metadata ? \`<div class="message-metadata">\${formatMetadata(metadata)}</div>\` : ''}
						</div>
					\`;

					messagesContainer.appendChild(messageEl);
					messagesContainer.scrollTop = messagesContainer.scrollHeight;
				}

				function formatMetadata(metadata) {
					if (!metadata) return '';

					let html = '';
					if (metadata.action) {
						html += \`<div class="metadata-item"><span class="metadata-label">Action:</span> <span class="metadata-value">\${metadata.action}</span></div>\`;
					}
					if (metadata.sku) {
						html += \`<div class="metadata-item"><span class="metadata-label">SKU:</span> <span class="metadata-value">\${metadata.sku}</span></div>\`;
					}
					if (metadata.stock !== undefined) {
						html += \`<div class="metadata-item"><span class="metadata-label">Stock:</span> <span class="metadata-value">\${metadata.stock}</span></div>\`;
					}
					if (metadata.confidence) {
						html += \`<div class="metadata-item"><span class="metadata-label">Confidence:</span> <span class="metadata-value">\${Math.round(metadata.confidence * 100)}%</span></div>\`;
					}

					return html;
				}

				function updateChatStats() {
					const messagesCountEl = document.getElementById('chat-messages-count');
					const actionsCountEl = document.getElementById('chat-actions-count');

					if (messagesCountEl) messagesCountEl.textContent = chatMessageCount;
					if (actionsCountEl) actionsCountEl.textContent = chatActionsCount;
				}

				// Quick action functions
				window.sendQuickMessage = function(message) {
					const chatInput = document.getElementById('chat-input');
					if (chatInput) {
						chatInput.value = message;
						sendChatMessage(message);
					}
				};

				// Test functions for persistence verification
				window.testPersistence = function() {
					console.log('Testing chat statistics persistence...');
					sendWebSocketMessage({ type: 'testPersistence' });
				};

				window.testPersistence25s = function() {
					console.log('Testing chat statistics persistence over 25 seconds...');
					sendWebSocketMessage({ type: 'testPersistence25s' });
				};

				window.testWebSocketConnection = function() {
					console.log('Testing WebSocket connection...');
					console.log('WebSocket state:', ws ? ws.readyState : 'null');
					console.log('WebSocket OPEN constant:', WebSocket.OPEN);

					if (!ws || ws.readyState !== WebSocket.OPEN) {
						toast.error('WebSocket Not Connected', {
							description: 'State: ' + (ws ? ws.readyState : 'null') + ', OPEN: ' + WebSocket.OPEN,
							duration: 5000
						});
						return;
					}

					// Send a test ping
					sendWebSocketMessage({ type: 'ping' });

					toast.success('WebSocket Test', {
						description: 'Ping sent successfully. Check console for response.',
						duration: 3000
					});
				};

				// Handle chat responses from WebSocket
				function handleChatResponse(data) {
					if (data.type === 'chatResponse') {
						// Create a unique key for deduplication
						const messageKey = data.role + '-' + data.content + '-' + data.timestamp;

						// Skip if we've already seen this message
						if (seenMessages.has(messageKey)) {
							console.log('[CHAT] Skipping duplicate message:', messageKey);
							return;
						}

						// Mark as seen and add to chat
						seenMessages.add(messageKey);
						addChatMessage(data.role, data.content, data.metadata);

						if (data.metadata && data.metadata.action) {
							chatActionsCount++;
							updateChatStats();
						}
					}
				}

				// Handle chat statistics updates from WebSocket
				function handleChatStats(data) {
					if (data.type === 'chatStats') {
						const messagesCountEl = document.getElementById('chat-messages-count');
						const actionsCountEl = document.getElementById('chat-actions-count');
						const successRateEl = document.getElementById('chat-success-rate');

						if (messagesCountEl) messagesCountEl.textContent = data.messagesToday;
						if (actionsCountEl) actionsCountEl.textContent = data.actionsExecuted;
						if (successRateEl) successRateEl.textContent = data.successRate + '%';

						console.log('Updated chat stats:', data);
					}
				}

				// Message deduplication
				const seenMessages = new Set();

				// Enhanced chat initialization with connection check
				function initializeChatWithConnection() {
					console.log('[CHAT] Initializing chat with connection check');

					// Check WebSocket connection status
					if (ws && ws.readyState === WebSocket.OPEN) {
						console.log('[CHAT] WebSocket is connected, chat ready');
					} else {
						console.log('[CHAT] WebSocket not connected, chat will wait for connection');
					}

					// Initialize chat functionality
					initializeChat();
				}

				} // End of script execution guard
			`,
			}}
		/>
	)
}
