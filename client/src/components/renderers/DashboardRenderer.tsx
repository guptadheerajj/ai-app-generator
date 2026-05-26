import { useEffect, useState } from "react";
import type { PageConfig, AppConfig } from "@shared/types";
import { runtimeApi } from "../../api/client";

interface Props {
	page: PageConfig;
	config: AppConfig;
}

export function DashboardRenderer({ page, config }: Props) {
	const [stats, setStats] = useState<Record<string, number>>({});

	useEffect(() => {
		const load = async () => {
			const results: Record<string, number> = {};
			for (const widget of page.widgets ?? []) {
				if (
					widget.type === "stat" &&
					widget.entity &&
					widget.aggregate === "count"
				) {
					try {
						const rows = await runtimeApi.getAll(widget.entity);
						results[widget.label] = rows.length;
					} catch {
						results[widget.label] = 0;
					}
				}
			}
			setStats(results);
		};
		load();
	}, [page]);

	return (
		<div>
			<h2 style={{ color: "#f3f4f6", marginBottom: 16 }}>{page.name}</h2>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
					gap: 16,
				}}
			>
				{(page.widgets ?? []).map((widget, i) => (
					<div
						key={i}
						style={{
							background: "#1f2937",
							borderRadius: 8,
							padding: 20,
							border: "1px solid #374151",
						}}
					>
						{widget.type === "unknown" ? (
							<p style={{ color: "#6b7280", fontSize: 13 }}>⚠ {widget.label}</p>
						) : (
							<>
								<p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>
									{widget.label}
								</p>
								<p
									style={{
										color: "#f3f4f6",
										fontSize: 32,
										fontWeight: 700,
										margin: "8px 0 0",
									}}
								>
									{stats[widget.label] ?? "..."}
								</p>
							</>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
