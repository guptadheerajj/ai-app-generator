import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useConfig } from "../context/ConfigContext";

const EXAMPLE_CONFIG = JSON.stringify(
	{
		appName: "Employee Portal",
		entities: [
			{
				name: "Employee",
				fields: [
					{ name: "fullName", type: "string", required: true },
					{ name: "email", type: "email", required: true },
					{ name: "department", type: "string", required: false },
				],
			},
		],
		pages: [
			{ name: "All Employees", type: "table", entity: "Employee" },
			{ name: "Add Employee", type: "form", entity: "Employee" },
			{
				name: "Overview",
				type: "dashboard",
				widgets: [
					{
						type: "stat",
						label: "Total Employees",
						entity: "Employee",
						aggregate: "count",
					},
				],
			},
		],
	},
	null,
	2,
);

export function HomePage() {
	const [json, setJson] = useState(EXAMPLE_CONFIG);
	const [parseError, setParseError] = useState<string | null>(null);
	const {
		submitConfig,
		activateConfig,
		isLoading,
		error,
		warnings,
		savedConfigs,
		loadSavedConfigs,
	} = useConfig();
	const navigate = useNavigate();

	useEffect(() => {
		loadSavedConfigs();
	}, []);

	const handleSubmit = async () => {
		setParseError(null);
		let parsed: unknown;
		try {
			parsed = JSON.parse(json);
		} catch {
			setParseError("Invalid JSON — check your syntax.");
			return;
		}
		await submitConfig(parsed);
		navigate("/app");
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				background: "#111827",
				color: "#f3f4f6",
				padding: 32,
			}}
		>
			<div style={{ maxWidth: 900, margin: "0 auto" }}>
				<h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
					AI App Generator
				</h1>
				<p style={{ color: "#9ca3af", marginBottom: 32 }}>
					Paste a JSON config to generate a working app instantly.
				</p>

				{/* Saved configs */}
				{savedConfigs.length > 0 && (
					<div style={{ marginBottom: 32 }}>
						<h3
							style={{
								color: "#9ca3af",
								fontSize: 13,
								textTransform: "uppercase",
								marginBottom: 12,
							}}
						>
							Saved Configs
						</h3>
						<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
							{savedConfigs.map((c) => (
								<button
									key={c.id}
									onClick={async () => {
										await activateConfig(c.id);
										navigate("/app");
									}}
									style={{
										padding: "6px 14px",
										background: "#1f2937",
										border: "1px solid #374151",
										borderRadius: 6,
										color: "#f3f4f6",
										cursor: "pointer",
										fontSize: 13,
									}}
								>
									{c.name}
								</button>
							))}
						</div>
					</div>
				)}

				{/* JSON Editor */}
				<div style={{ marginBottom: 16 }}>
					<label
						style={{
							display: "block",
							color: "#9ca3af",
							fontSize: 13,
							marginBottom: 8,
						}}
					>
						App Configuration (JSON)
					</label>
					<textarea
						value={json}
						onChange={(e) => setJson(e.target.value)}
						rows={22}
						style={{
							width: "100%",
							background: "#1f2937",
							border: "1px solid #374151",
							borderRadius: 8,
							color: "#f3f4f6",
							fontFamily: "monospace",
							fontSize: 13,
							padding: 16,
							boxSizing: "border-box",
							resize: "vertical",
						}}
					/>
				</div>

				{/* Errors and warnings */}
				{(parseError || error) && (
					<div
						style={{
							background: "#450a0a",
							border: "1px solid #f87171",
							borderRadius: 6,
							padding: 12,
							marginBottom: 16,
						}}
					>
						<p style={{ color: "#f87171", margin: 0, fontSize: 13 }}>
							{parseError || error}
						</p>
					</div>
				)}
				{warnings.length > 0 && (
					<div
						style={{
							background: "#431407",
							border: "1px solid #fb923c",
							borderRadius: 6,
							padding: 12,
							marginBottom: 16,
						}}
					>
						<p
							style={{
								color: "#fb923c",
								fontSize: 12,
								fontWeight: 600,
								marginBottom: 6,
							}}
						>
							⚠ Config was corrected:
						</p>
						{warnings.map((w, i) => (
							<p
								key={i}
								style={{ color: "#fdba74", fontSize: 12, margin: "2px 0" }}
							>
								• {w}
							</p>
						))}
					</div>
				)}

				<button
					onClick={handleSubmit}
					disabled={isLoading}
					style={{
						padding: "12px 28px",
						background: isLoading ? "#374151" : "#6366f1",
						color: "#fff",
						border: "none",
						borderRadius: 8,
						cursor: isLoading ? "not-allowed" : "pointer",
						fontSize: 15,
						fontWeight: 700,
					}}
				>
					{isLoading ? "Generating..." : "Generate App →"}
				</button>
			</div>
		</div>
	);
}
