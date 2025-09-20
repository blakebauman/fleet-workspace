import type { FC } from 'hono/jsx'

interface BreadcrumbProps {
	path: string
	tenantId?: string
}

export const Breadcrumb: FC<BreadcrumbProps> = ({ path, tenantId }) => {
	const segments = path.split('/').filter(Boolean)

	// Build tenant-aware URLs
	const getTenantUrl = (targetPath: string) => {
		// If we have a tenant and we're not on localhost with subdomain
		if (tenantId && tenantId !== 'demo') {
			// For single-level tenant paths like /jerome/child
			const tenantPrefix = `/${tenantId}`
			return targetPath === '/' ? tenantPrefix : `${tenantPrefix}${targetPath}`
		}
		return targetPath
	}

	// Determine if we're at root level (tenant dashboard) or in an inventory source
	const isAtRoot = segments.length === 0
	const rootLabel = isAtRoot ? 'Tenant Dashboard' : 'Dashboard'

	return (
		<div class="breadcrumb">
			<nav class="flex flex-between flex-center">
				<div class="flex flex-center">
					<a href={getTenantUrl('/')} class="tech-badge" style="margin-right: 8px;" title="View all locations for this tenant">{rootLabel}</a>
					{segments.map((segment, index) => {
						const segmentPath = '/' + segments.slice(0, index + 1).join('/')
						const isLastSegment = index === segments.length - 1
						const segmentLabel = decodeURIComponent(segment)
						return (
							<>
								<span style="margin: 0 4px; color: #666666;">→</span>
								<a
									href={getTenantUrl(segmentPath)}
									class="tech-badge"
									style="margin-right: 8px;"
									title={isLastSegment ? `Current location: ${segmentLabel}` : `Navigate to ${segmentLabel}`}
								>
									{segmentLabel}
								</a>
							</>
						)
					})}
				</div>
				<div class="text-small">
					<span class="performance-indicator">
						{isAtRoot
							? `Tenant: ${tenantId || 'demo'} • Locations Overview`
							: `Depth: ${segments.length} • Location`
						}
					</span>
				</div>
			</nav>
		</div>
	)
}
