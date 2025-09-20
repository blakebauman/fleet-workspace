import type { FC } from 'hono/jsx'
import { Layout } from './Layout'
import { Breadcrumb } from './Breadcrumb'
import { StatusCard } from './StatusCard'
import { AgentForm } from './AgentForm'
import { AgentList } from './AgentList'
import { CommunicationPanel } from './CommunicationPanel'
import { InventoryDashboard } from './InventoryDashboard'
import { AIControlPanel } from './AIControlPanel'
import { ClientScript } from './ClientScript'
import { Tabs, Grid } from './SimpleComponents'

interface FleetManagerPageProps {
	path: string
	tenantId?: string
}

export const FleetManagerPage: FC<FleetManagerPageProps> = ({ path, tenantId }) => {
	const segments = path.split('/').filter(Boolean)
	const isAtRoot = segments.length === 0
	const currentAgent = segments[segments.length - 1] || 'Dashboard'
	const displayTenantId = tenantId || 'demo'

	// Calculate parent path with tenant awareness
	let parentPath: string | undefined = undefined
	if (segments.length > 0) {
		const parentSegments = segments.slice(0, -1)
		const parentHierarchyPath = parentSegments.length > 0 ? '/' + parentSegments.map(s => encodeURIComponent(s)).join('/') : '/'

		// Add tenant prefix if we have a tenant and it's not demo
		if (tenantId && tenantId !== 'demo') {
			parentPath = parentHierarchyPath === '/' ? `/${tenantId}` : `/${tenantId}${parentHierarchyPath}`
		} else {
			parentPath = parentHierarchyPath
		}
	}

	// Different titles for root vs inventory source
	const pageTitle = isAtRoot
		? `Tenant Dashboard - ${displayTenantId}`
		: `Inventory Source - ${currentAgent} (${displayTenantId})`

	return (
		<Layout title={pageTitle} path={path}>
			<Breadcrumb path={path} tenantId={tenantId} />

			{/* Architecture Info */}
			<div style="background: #f8f8f8; padding: 16px 32px; border-bottom: 1px solid #e5e5e5;">
				<div class="flex flex-between flex-center">
					<div class="performance-indicator">
						<strong>Architecture Stack:</strong> Edge Computing • Multi-Tenant • Real-time State Sync
					</div>
					<div class="performance-indicator">
						Tenant: {displayTenantId} • Real-time: Active • Edge Deployed
					</div>
				</div>
			</div>

			{/* Simple Tabs */}
			<Tabs tabs={[
				{ id: 'fleet', label: isAtRoot ? 'Locations' : 'Sub-Locations', active: true },
				{ id: 'inventory', label: 'Inventory Dashboard' },
				{ id: 'ai', label: 'AI Control Center' }
			]} />

			{/* Inventory Sources Tab */}
			<div id="fleet-content" class="tab-content active">
				<Grid cols={2}>
					<StatusCard path={path} parentPath={parentPath} />
					<AgentForm currentPath={path} isAtRoot={isAtRoot} />
					<AgentList currentPath={path} isAtRoot={isAtRoot} />
					<CommunicationPanel />
				</Grid>
			</div>

			{/* Inventory Dashboard Tab */}
			<div id="inventory-content" class="tab-content">
				<InventoryDashboard path={path} />
			</div>

			{/* AI Control Center Tab */}
			<div id="ai-content" class="tab-content">
				<AIControlPanel path={path} />
			</div>

			<ClientScript path={path} />
		</Layout>
	)
}
