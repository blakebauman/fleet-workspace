import type { FC, PropsWithChildren } from 'hono/jsx'

// Simple Button Component
interface ButtonProps {
	variant?: 'primary' | 'secondary' | 'success' | 'danger'
	type?: 'button' | 'submit'
	onclick?: string
	class?: string
}

export const Button: FC<PropsWithChildren<ButtonProps>> = ({
	variant = 'primary',
	type = 'button',
	onclick,
	class: className = '',
	children
}) => {
	const variantClass = `btn-${variant}`

	return (
		<button
			type={type}
			onclick={onclick}
			class={`btn ${variantClass} ${className}`}
		>
			{children}
		</button>
	)
}

// Simple Input Component
interface InputProps {
	label: string
	id?: string
	type?: 'text' | 'email' | 'password' | 'number'
	placeholder?: string
	required?: boolean
	pattern?: string
	title?: string
	min?: string
	step?: string
	value?: string
	class?: string
}

export const Input: FC<InputProps> = ({
	label,
	id,
	type = 'text',
	placeholder,
	required,
	pattern,
	title,
	min,
	step,
	value,
	class: className = ''
}) => {
	return (
		<div class={`form-group ${className}`}>
			<label for={id}>{label}</label>
			<input
				type={type}
				id={id}
				name={id}
				placeholder={placeholder}
				required={required}
				pattern={pattern}
				title={title}
				min={min}
				step={step}
				value={value}
			/>
		</div>
	)
}

// Simple Textarea Component
interface TextareaProps {
	label: string
	id?: string
	placeholder?: string
	rows?: number
	required?: boolean
	class?: string
}

export const Textarea: FC<TextareaProps> = ({
	label,
	id,
	placeholder,
	rows = 3,
	required,
	class: className = ''
}) => {
	return (
		<div class={`form-group ${className}`}>
			<label for={id}>{label}</label>
			<textarea
				id={id}
				name={id}
				placeholder={placeholder}
				rows={rows}
				required={required}
			/>
		</div>
	)
}

// Simple Card Component
interface CardProps {
	title?: string
	class?: string
}

export const Card: FC<PropsWithChildren<CardProps>> = ({
	title,
	class: className = '',
	children
}) => {
	return (
		<div class={`card ${className}`}>
			{title && <h3 class="mb-20">{title}</h3>}
			{children}
		</div>
	)
}

// Simple Grid Component
interface GridProps {
	cols?: 2 | 3 | 4
	class?: string
}

export const Grid: FC<PropsWithChildren<GridProps>> = ({
	cols = 2,
	class: className = '',
	children
}) => {
	return (
		<div class={`grid grid-${cols} ${className}`}>
			{children}
		</div>
	)
}

// Simple Stat Card Component
interface StatCardProps {
	number: string | number
	label: string
	id?: string
}

export const StatCard: FC<StatCardProps> = ({ number, label, id }) => {
	return (
		<div class="stat-card">
			<div class="stat-number" id={id}>{number}</div>
			<div class="stat-label">{label}</div>
		</div>
	)
}

// Simple Alert Component
interface AlertProps {
	type?: 'info' | 'success' | 'warning' | 'danger'
	class?: string
}

export const Alert: FC<PropsWithChildren<AlertProps>> = ({
	type = 'info',
	class: className = '',
	children
}) => {
	return (
		<div class={`alert alert-${type} ${className}`}>
			{children}
		</div>
	)
}

// Simple Tabs Component
interface TabsProps {
	tabs: Array<{ id: string; label: string; active?: boolean }>
}

export const Tabs: FC<TabsProps> = ({ tabs }) => {
	return (
		<div class="tabs">
			{tabs.map(tab => (
				<div
					key={tab.id}
					id={`tab-${tab.id}`}
					class={`tab ${tab.active ? 'active' : ''}`}
					onclick={`switchTab('${tab.id}')`}
				>
					{tab.label}
				</div>
			))}
		</div>
	)
}
