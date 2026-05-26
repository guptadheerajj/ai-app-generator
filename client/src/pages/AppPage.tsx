import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConfig } from "../context/ConfigContext";
import { PageRenderer } from "../components/PageRenderer";

export function AppPage() {
	const { config, warnings } = useConfig();
	const [activePage, setActivePage] = useState(0);
	const navigate = useNavigate();

	if (!config) {
		return (
			<div
				style={{
					minHeight: "100vh",
					background: "#111827",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<div style={{ textAlign: "center", color: "#9ca3af" }}>
					<p>No config loaded.</p>
					<button
						onClick={() => navigate("/")}
						style={{
							color: "#6366f1",
							background: "none",
							border: "none",
							cursor: "pointer",
						}}
					>
						← Go back
					</button>
				</div>
			</div>
		);
	}

	const currentPage = config.pages[activePage];

	return (
		<div style={{ display: "flex", minHeight: "100vh", background: "#111827" }}>
			{/* Sidebar */}
			<div
				style={{
					width: 220,
					background: "#0f172a",
					borderRight: "1px solid #1f2937",
					padding: "24px 0",
					flexShrink: 0,
				}}
			>
				<div style={{ padding: "0 16px", marginBottom: 24 }}>
					<p
						style={{
							color: "#6366f1",
							fontWeight: 700,
							fontSize: 14,
							margin: 0,
						}}
					>
						{config.appName}
					</p>
					<button
						onClick={() => navigate("/")}
						style={{
							color: "#6b7280",
							background: "none",
							border: "none",
							cursor: "pointer",
							fontSize: 12,
							padding: 0,
							marginTop: 4,
						}}
					>
						← New config
					</button>
				</div>

				{config.pages.map((page, i) => (
					<button
						key={i}
						onClick={() => setActivePage(i)}
						style={{
							display: "block",
							width: "100%",
							textAlign: "left",
							padding: "10px 16px",
							background: activePage === i ? "#1e293b" : "none",
							border: "none",
							borderLeft:
								activePage === i
									? "2px solid #6366f1"
									: "2px solid transparent",
							color: activePage === i ? "#f3f4f6" : "#9ca3af",
							cursor: "pointer",
							fontSize: 14,
						}}
					>
						{page.type === "unknown" ? "⚠ " : ""}
						{page.name}
					</button>
				))}
			</div>

			{/* Main content */}
			<div style={{ flex: 1, padding: 32, overflowY: "auto" }}>
				{warnings.length > 0 && (
					<div
						style={{
							background: "#431407",
							border: "1px solid #fb923c",
							borderRadius: 6,
							padding: 10,
							marginBottom: 24,
						}}
					>
						<p style={{ color: "#fb923c", fontSize: 12, margin: 0 }}>
							⚠ {warnings.length} config issue(s) were auto-corrected
						</p>
					</div>
				)}
				{currentPage ? (
					<PageRenderer page={currentPage} config={config} />
				) : (
					<p style={{ color: "#6b7280" }}>No pages defined in this config.</p>
				)}
			</div>
		</div>
	);
}
