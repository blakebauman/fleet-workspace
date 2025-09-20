import type { FC } from 'hono/jsx'

interface IconProps {
	size?: number
	class?: string
}

// SVG icon components that work with Hono JSX server-side rendering
export const Zap: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
	</svg>
)

export const Network: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<rect x="16" y="16" width="6" height="6" rx="1" />
		<rect x="2" y="16" width="6" height="6" rx="1" />
		<rect x="9" y="2" width="6" height="6" rx="1" />
		<path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
		<path d="M12 12V8" />
	</svg>
)

export const Home: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
		<polyline points="9,22 9,12 15,12 15,22" />
	</svg>
)

export const ChevronRight: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="m9 18 6-6-6-6" />
	</svg>
)

export const Target: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<circle cx="12" cy="12" r="10" />
		<circle cx="12" cy="12" r="6" />
		<circle cx="12" cy="12" r="2" />
	</svg>
)

export const BarChart3: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="M3 3v16a2 2 0 0 0 2 2h16" />
		<path d="m19 9-5 5-4-4-3 3" />
	</svg>
)

export const Users: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<path d="m22 21-2-2" />
		<path d="m16 5 2 2" />
		<path d="M22 13h-4" />
	</svg>
)

export const Activity: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="m22 12-4-4-6 6-4-4-4 4" />
	</svg>
)

export const ArrowLeft: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="m12 19-7-7 7-7" />
		<path d="M19 12H5" />
	</svg>
)

export const Plus: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="M5 12h14" />
		<path d="m12 5v14" />
	</svg>
)

export const Send: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="m22 2-7 20-4-9-9-4Z" />
		<path d="M22 2 11 13" />
	</svg>
)

export const MessageSquare: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
	</svg>
)

export const Radio: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="m2 16 20-6-6 20A2 2 0 0 1 14 28z" />
		<path d="M5.5 5.5c.5.5.5 1.5 0 2l-2 2c-.5.5-1.5.5-2 0s-.5-1.5 0-2l2-2c.5-.5 1.5-.5 2 0Z" />
		<path d="M19 13c1.5 1.5 1.5 4 0 5.5s-4 1.5-5.5 0 -1.5-4 0-5.5 4-1.5 5.5 0Z" />
	</svg>
)

export const Folder: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
	</svg>
)

export const UserCheck: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<polyline points="16,11 18,13 22,9" />
	</svg>
)

// Additional icons for inventory and AI components
export const Package: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="m7.5 4.27 9 5.15" />
		<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
		<path d="m3.3 7 8.7 5 8.7-5" />
		<path d="M12 22V12" />
	</svg>
)

export const AlertTriangle: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
		<path d="M12 9v4" />
		<path d="M12 17h.01" />
	</svg>
)

export const TrendingUp: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
		<polyline points="16,7 22,7 22,13" />
	</svg>
)

export const Minus: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="M5 12h14" />
	</svg>
)

export const RotateCcw: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
		<path d="M3 3v5h5" />
	</svg>
)

export const Brain: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
		<path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
		<path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
		<path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
		<path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
		<path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
		<path d="M19.938 10.5a4 4 0 0 1 .585.396" />
		<path d="M6 18a4 4 0 0 1-1.967-.516" />
		<path d="M19.967 17.484A4 4 0 0 1 18 18" />
	</svg>
)

export const BarChart: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<line x1="12" x2="12" y1="20" y2="10" />
		<line x1="18" x2="18" y1="20" y2="4" />
		<line x1="6" x2="6" y1="20" y2="16" />
	</svg>
)

export const CheckCircle: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
		<polyline points="22,4 12,14.01 9,11.01" />
	</svg>
)

export const Clock: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<circle cx="12" cy="12" r="10" />
		<polyline points="12,6 12,12 16,14" />
	</svg>
)

export const AlertCircle: FC<IconProps> = ({ size = 24, class: className }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		<circle cx="12" cy="12" r="10" />
		<line x1="12" x2="12" y1="8" y2="12" />
		<line x1="12" x2="12.01" y1="16" y2="16" />
	</svg>
)
