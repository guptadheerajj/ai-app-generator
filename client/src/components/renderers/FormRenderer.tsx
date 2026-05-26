import { useState } from "react";
import type { PageConfig, EntityConfig, FieldConfig } from "@shared/types";
import { runtimeApi } from "../../api/client";

interface Props {
	page: PageConfig;
	entity: EntityConfig;
	onSuccess?: () => void;
}

function FieldInput({
	field,
	value,
	onChange,
}: {
	field: FieldConfig;
	value: string;
	onChange: (val: string) => void;
}) {
	const base = {
		width: "100%",
		padding: "8px 12px",
		background: "#1f2937",
		border: "1px solid #374151",
		borderRadius: 6,
		color: "#f3f4f6",
		fontSize: 14,
		boxSizing: "border-box" as const,
	};

	if (field.type === "select" && field.options) {
		return (
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				style={base}
			>
				<option value="">Select...</option>
				{field.options.map((o) => (
					<option key={o} value={o}>
						{o}
					</option>
				))}
			</select>
		);
	}

	if (field.type === "boolean") {
		return (
			<input
				type="checkbox"
				checked={value === "true"}
				onChange={(e) => onChange(String(e.target.checked))}
			/>
		);
	}

	const typeMap: Record<string, string> = {
		email: "email",
		number: "number",
		date: "date",
		string: "text",
	};

	return (
		<input
			type={typeMap[field.type] ?? "text"}
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={field.name}
			style={base}
		/>
	);
}

export function FormRenderer({ page, entity, onSuccess }: Props) {
	const initial = Object.fromEntries(entity.fields.map((f) => [f.name, ""]));
	const [values, setValues] = useState<Record<string, string>>(initial);
	const [errors, setErrors] = useState<string[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async () => {
		setSubmitting(true);
		setErrors([]);
		setSuccess(false);
		try {
			await runtimeApi.create(entity.name, values);
			setValues(initial);
			setSuccess(true);
			onSuccess?.();
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { errors?: string[] } } };
			setErrors(axiosError?.response?.data?.errors ?? ["Submission failed."]);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div>
			<h2 style={{ color: "#f3f4f6", marginBottom: 16 }}>{page.name}</h2>

			{errors.length > 0 && (
				<div
					style={{
						background: "#450a0a",
						border: "1px solid #f87171",
						borderRadius: 6,
						padding: 12,
						marginBottom: 16,
					}}
				>
					{errors.map((e, i) => (
						<p key={i} style={{ color: "#f87171", fontSize: 13, margin: 0 }}>
							{e}
						</p>
					))}
				</div>
			)}

			{success && (
				<div
					style={{
						background: "#052e16",
						border: "1px solid #4ade80",
						borderRadius: 6,
						padding: 12,
						marginBottom: 16,
					}}
				>
					<p style={{ color: "#4ade80", margin: 0, fontSize: 13 }}>
						✓ Record created successfully
					</p>
				</div>
			)}

			<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
				{entity.fields.map((field) => (
					<div key={field.name}>
						<label
							style={{
								display: "block",
								color: "#9ca3af",
								fontSize: 12,
								marginBottom: 4,
							}}
						>
							{field.name}{" "}
							{field.required && <span style={{ color: "#f87171" }}>*</span>}
						</label>
						<FieldInput
							field={field}
							value={values[field.name]}
							onChange={(val) =>
								setValues((prev) => ({ ...prev, [field.name]: val }))
							}
						/>
					</div>
				))}

				<button
					onClick={handleSubmit}
					disabled={submitting}
					style={{
						padding: "10px 24px",
						background: submitting ? "#374151" : "#6366f1",
						color: "#fff",
						border: "none",
						borderRadius: 6,
						cursor: submitting ? "not-allowed" : "pointer",
						fontSize: 14,
						fontWeight: 600,
					}}
				>
					{submitting ? "Submitting..." : "Submit"}
				</button>
			</div>
		</div>
	);
}
