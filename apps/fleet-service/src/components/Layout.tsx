import type { FC, PropsWithChildren } from 'hono/jsx'

interface LayoutProps {
	title: string
	path: string
}

export const Layout: FC<PropsWithChildren<LayoutProps>> = ({ title, path: _path, children }) => {
	return (
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>{title}</title>
				<style dangerouslySetInnerHTML={{
					__html: `
						/* Minimal Black & White Design System */
						* { box-sizing: border-box; margin: 0; padding: 0; }
						body {
							font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
							line-height: 1.6;
							background: #ffffff;
							color: #1a1a1a;
							font-size: 14px;
						}

						/* Layout */
						.container { max-width: 1400px; margin: 0 auto; padding: 0; min-height: 100vh; }
						.header {
							background: #000000;
							color: #ffffff;
							padding: 24px 32px;
							border-bottom: 1px solid #e5e5e5;
						}
						.header h1 {
							font-size: 20px;
							font-weight: 600;
							margin-bottom: 4px;
							letter-spacing: -0.025em;
						}
						.header p {
							font-size: 13px;
							opacity: 0.7;
							font-weight: 400;
						}

						/* Cards */
						.card {
							background: #ffffff;
							border: 1px solid #e5e5e5;
							padding: 24px;
							margin-bottom: 1px;
							transition: border-color 0.2s ease;
						}
						.card:hover { border-color: #000000; }
						.card h3 {
							font-size: 16px;
							font-weight: 600;
							margin-bottom: 16px;
							color: #000000;
							letter-spacing: -0.025em;
						}

						/* Forms */
						.form-group { margin-bottom: 16px; }
						.form-group label {
							display: block;
							margin-bottom: 6px;
							font-weight: 500;
							font-size: 13px;
							color: #000000;
						}
						.form-group input, .form-group textarea, .form-group select {
							width: 100%;
							padding: 12px;
							border: 1px solid #e5e5e5;
							background: #ffffff;
							font-size: 14px;
							transition: border-color 0.2s ease;
						}
						.form-group input:focus, .form-group textarea:focus, .form-group select:focus {
							outline: none;
							border-color: #000000;
						}

						/* Buttons */
						.btn {
							padding: 12px 20px;
							border: 1px solid #e5e5e5;
							background: #ffffff;
							font-size: 13px;
							font-weight: 500;
							cursor: pointer;
							transition: all 0.2s ease;
							display: inline-flex;
							align-items: center;
							gap: 8px;
							margin-right: 8px;
							margin-bottom: 8px;
						}
						.btn:hover {
							border-color: #000000;
							background: #f8f8f8;
						}
						.btn-primary {
							background: #000000;
							color: #ffffff;
							border-color: #000000;
						}
						.btn-primary:hover {
							background: #333333;
						}
						.btn-success {
							background: #ffffff;
							color: #000000;
							border-color: #000000;
						}
						.btn-success:hover {
							background: #000000;
							color: #ffffff;
						}
						.btn-danger {
							background: #ffffff;
							color: #000000;
							border-color: #000000;
						}
						.btn-danger:hover {
							background: #000000;
							color: #ffffff;
						}
						.btn-secondary {
							background: #f8f8f8;
							color: #000000;
							border-color: #e5e5e5;
						}
						.btn-secondary:hover {
							background: #e5e5e5;
							color: #000000;
						}

						/* Grid */
						.grid { display: grid; gap: 1px; }
						.grid-2 { grid-template-columns: 1fr 1fr; }
						.grid-3 { grid-template-columns: repeat(3, 1fr); }
						.grid-4 { grid-template-columns: repeat(4, 1fr); }

						/* Flex utilities */
						.flex { display: flex; }
						.flex-between { justify-content: space-between; }
						.flex-center { align-items: center; }
						.flex-1 { flex: 1; }

						/* Spacing */
						.mb-8 { margin-bottom: 8px; }
						.mb-16 { margin-bottom: 16px; }
						.mb-24 { margin-bottom: 24px; }
						.p-16 { padding: 16px; }
						.p-24 { padding: 24px; }

						/* Text */
						.text-center { text-align: center; }
						.text-muted { color: #000000; opacity: 0.6; }
						.text-small { font-size: 12px; }
						.font-mono { font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; }

						/* Status indicators */
						.status-dot {
							display: inline-block;
							width: 8px;
							height: 8px;
							border-radius: 50%;
							margin-right: 8px;
						}
						.status-online { background: #000000; }
						.status-offline { background: #ffffff; border: 1px solid #000000; }
						.status-connecting { background: #000000; opacity: 0.5; }

						/* Connection status */
						.connection-status {
							position: fixed;
							top: 16px;
							right: 16px;
							padding: 8px 12px;
							background: #000000;
							color: #ffffff;
							font-size: 11px;
							font-weight: 500;
							z-index: 1000;
							display: flex;
							align-items: center;
							gap: 6px;
						}

						/* Tabs */
						.tabs {
							border-bottom: 1px solid #e5e5e5;
							background: #f8f8f8;
							padding: 0 32px;
						}
						.tab {
							display: inline-block;
							padding: 16px 24px;
							cursor: pointer;
							font-size: 13px;
							font-weight: 500;
							color: #666666;
							border-bottom: 2px solid transparent;
							transition: all 0.2s ease;
						}
						.tab:hover { color: #000000; }
						.tab.active {
							color: #000000;
							border-bottom-color: #000000;
						}
						.tab-content {
							display: none;
							padding: 32px;
						}
						.tab-content.active { display: block; }

						/* Stats */
						.stats {
							display: grid;
							grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
							gap: 1px;
							margin-bottom: 32px;
						}
						.stat-card {
							background: #ffffff;
							border: 1px solid #e5e5e5;
							padding: 24px;
							text-align: center;
							transition: border-color 0.2s ease;
						}
						.stat-card:hover { border-color: #000000; }
						.stat-number {
							font-size: 32px;
							font-weight: 700;
							color: #000000;
							margin-bottom: 4px;
							font-variant-numeric: tabular-nums;
						}
						.stat-label {
							font-size: 11px;
							color: #666666;
							font-weight: 500;
							text-transform: uppercase;
							letter-spacing: 0.05em;
						}

						/* Messages */
						.message-list {
							max-height: 300px;
							overflow-y: auto;
							border: 1px solid #e5e5e5;
							background: #ffffff;
						}
						.message {
							padding: 12px 16px;
							border-bottom: 1px solid #f0f0f0;
							font-size: 13px;
						}
						.message:last-child { border-bottom: none; }
						.message-from {
							font-weight: 600;
							margin-bottom: 4px;
							color: #000000;
						}
						.message-content { color: #333333; }

						/* Alerts */
						.alert {
							padding: 16px;
							margin-bottom: 16px;
							border: 1px solid #e5e5e5;
							background: #f8f8f8;
							font-size: 13px;
						}
						.alert-info {
							border-left: 3px solid #000000;
						}
						.alert-success {
							border-left: 3px solid #000000;
						}
						.alert-warning {
							border-left: 3px solid #666666;
						}
						.alert-danger {
							border-left: 3px solid #dc2626;
						}

						/* Toast System */
						#toastContainer {
							position: fixed;
							top: 16px;
							right: 16px;
							z-index: 9999;
							display: flex;
							flex-direction: column;
							gap: 8px;
							pointer-events: none;
						}
						.toast {
							background: #000000;
							color: #ffffff;
							padding: 12px 16px;
							pointer-events: auto;
							min-width: 300px;
							max-width: 400px;
							display: flex;
							align-items: center;
							gap: 12px;
							transform: translateX(100%);
							animation: toastSlideIn 0.3s ease-out forwards;
							font-size: 13px;
						}
						.toast.success { background: #000000; }
						.toast.error { background: #dc2626; }
						.toast.info { background: #666666; }
						.toast.warning { background: #333333; }
						.toast-content { flex: 1; }
						.toast-title { font-weight: 600; margin-bottom: 2px; }
						.toast-description { opacity: 0.8; }
						.toast.removing { animation: toastSlideOut 0.2s ease-in forwards; }

						@keyframes toastSlideIn {
							from { transform: translateX(100%); opacity: 0; }
							to { transform: translateX(0); opacity: 1; }
						}
						@keyframes toastSlideOut {
							from { transform: translateX(0); opacity: 1; }
							to { transform: translateX(100%); opacity: 0; }
						}

			/* Breadcrumb */
			.breadcrumb {
				background: #f8f8f8;
				padding: 12px 32px;
				border-bottom: 1px solid #e5e5e5;
				font-size: 12px;
			}
			.breadcrumb-link {
				color: #666666;
				text-decoration: none;
				transition: color 0.2s ease;
				font-weight: 500;
			}
			.breadcrumb-link:hover {
				color: #000000;
				text-decoration: underline;
			}

						/* Responsive */
						@media (max-width: 768px) {
							.grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
							.container { padding: 0; }
							.header { padding: 16px 20px; }
							.tabs { padding: 0 20px; }
							.tab-content { padding: 20px; }
							.stats { grid-template-columns: 1fr; }
						}

						/* Architecture showcase elements */
						.architecture-highlight {
							border-left: 3px solid #000000;
							padding-left: 16px;
							margin: 16px 0;
						}
						.tech-badge {
							display: inline-block;
							padding: 4px 8px;
							background: #000000;
							color: #ffffff;
							font-size: 10px;
							font-weight: 600;
							text-transform: uppercase;
							letter-spacing: 0.5px;
							margin-right: 8px;
							margin-bottom: 4px;
							text-decoration: none;
							transition: background-color 0.2s ease;
						}
						.tech-badge:hover {
							background: #333333;
							color: #ffffff;
						}
						.performance-indicator {
							font-family: 'SF Mono', Monaco, monospace;
							font-size: 12px;
							color: #666666;
						}

						/* Inventory Source Items */
						.source-item {
							display: flex;
							justify-content: space-between;
							align-items: center;
							padding: 16px;
							background: #ffffff;
							border: 1px solid #e5e5e5;
							margin-bottom: 12px;
							transition: all 0.2s ease;
						}
						.source-item:hover {
							border-color: #000000;
							box-shadow: 0 2px 8px rgba(0,0,0,0.1);
						}
						.source-info {
							display: flex;
							align-items: center;
							gap: 12px;
							flex: 1;
						}
						.source-icon {
							width: 20px;
							height: 20px;
							fill: #666666;
						}
						.source-details h4 {
							margin: 0 0 4px 0;
							font-size: 16px;
							font-weight: 600;
							color: #000000;
						}
						.source-path {
							font-family: 'SF Mono', Monaco, monospace;
							font-size: 11px;
							color: #666666;
							margin: 0;
						}
						.source-actions {
							display: flex;
							gap: 8px;
						}
						.source-actions .btn {
							padding: 8px 12px;
							font-size: 12px;
							display: inline-flex;
							align-items: center;
							gap: 6px;
						}
						.source-actions .btn svg {
							width: 14px;
							height: 14px;
						}

						/* Enhanced Empty State */
						.empty-state {
							text-align: center;
							padding: 32px 16px;
						}
						.empty-state-icon {
							font-size: 48px;
							margin-bottom: 16px;
							opacity: 0.6;
						}
						.empty-state h4 {
							margin: 0 0 8px 0;
							font-size: 18px;
							font-weight: 600;
							color: #000000;
						}
						.empty-state p {
							margin: 0 0 24px 0;
							color: #000000;
							opacity: 0.7;
							line-height: 1.5;
						}
						.empty-state-features {
							display: flex;
							flex-direction: column;
							gap: 12px;
							margin-bottom: 24px;
							padding: 0 20px;
						}
						.feature-item {
							display: flex;
							align-items: center;
							gap: 12px;
							padding: 8px 12px;
							background: #ffffff;
							border: 1px solid #000000;
							font-size: 14px;
						}
						.feature-icon {
							font-size: 16px;
						}
						.empty-state-action {
							padding-top: 16px;
							border-top: 1px solid #e5e5e5;
						}
						.empty-state-action .text-small {
							color: #000000;
							opacity: 0.6;
							font-style: italic;
						}

						/* Hierarchy Visualization */
						.hierarchy-level-0 { border-left: 4px solid #000000; }
						.hierarchy-level-1 { border-left: 4px solid #333333; }
						.hierarchy-level-2 { border-left: 4px solid #666666; }
						.hierarchy-level-3 { border-left: 4px solid #999999; }

						.hierarchy-indicator {
							display: inline-flex;
							align-items: center;
							gap: 4px;
							font-family: monospace;
							font-size: 10px;
							font-weight: 600;
							padding: 2px 6px;
							background: #f0f0f0;
							color: #000;
							text-transform: uppercase;
							letter-spacing: 0.5px;
						}

						.parent-navigation {
							background: #fafafa;
							border: 1px solid #e5e5e5;
							padding: 12px;
							margin: 12px 0;
						}

						.hierarchy-path {
							font-family: monospace;
							background: #f8f8f8;
							padding: 8px;
							border-left: 3px solid #000;
							margin: 8px 0;
							font-size: 12px;
						}
					`
				}} />
			</head>
			<body>
				<div class="connection-status" id="connectionStatus">
					<span class="status-dot status-connecting"></span>
					Connecting
				</div>
				<div id="toastContainer"></div>

				<div class="container">
					<div class="header">
						<h1>Fleet Manager</h1>
						<p>Hierarchical Durable Objects • Real-time Architecture • Cloudflare Workers</p>
					</div>
					{children}
				</div>
			</body>
		</html>
	)
}
