import type { FC, ReactNode } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type FilterFieldType = "text" | "select" | "checkbox" | "date"

export interface FilterFieldOption {
	value: string
	label: string
}

export interface FilterFieldConfig {
	name: string
	label: string
	type: FilterFieldType
	placeholder?: string
	options?: FilterFieldOption[]
	icon?: ReactNode
	disabled?: boolean
	defaultValue?: string | boolean
}

interface FilterFieldProps {
	config: FilterFieldConfig
	value: string | boolean
	onChange: (value: string | boolean) => void
}

export const FilterField: FC<FilterFieldProps> = ({ config, value, onChange }) => {
	const { label, type, placeholder, options, icon, disabled = false } = config

	const renderField = () => {
		switch (type) {
			case "text":
			case "date":
				return (
					<div className="relative w-full">
						{icon && (
							<div className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground">
								{icon}
							</div>
						)}
						<Input
							type={type === "date" ? "date" : "text"}
							placeholder={placeholder}
							disabled={disabled}
							value={value as string}
							onChange={(e) => onChange(e.target.value)}
							className={icon ? "pl-10" : ""}
						/>
					</div>
				)

			case "select":
				return (
					<select
						disabled={disabled}
						value={value as string}
						onChange={(e) => onChange(e.target.value)}
						style={{
							width: "100%",
							padding: "8px",
							borderRadius: "6px",
							border: "1px solid #E2E8F0",
							backgroundColor: disabled ? "#F7FAFC" : "transparent",
							fontSize: "14px",
							cursor: disabled ? "not-allowed" : "pointer",
						}}
					>
						{placeholder && (
							<option value="" disabled>
								{placeholder || "選択してください"}
							</option>
						)}
						{options?.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				)

			case "checkbox":
				return (
					<div className="flex items-center gap-2">
						<Checkbox
							checked={value as boolean}
							onCheckedChange={(checked) => onChange(checked as boolean)}
							disabled={disabled}
						/>
						<Label>{label}</Label>
					</div>
				)

			default:
				return null
		}
	}

	// チェックボックスの場合はlabelを含めてレンダリング
	if (type === "checkbox") {
		return <div>{renderField()}</div>
	}

	return (
		<div className="flex flex-col items-stretch gap-1">
			{label && <Label className="font-bold text-sm">{label}</Label>}
			{renderField()}
		</div>
	)
}
