import { useEffect, useState } from "react";
import type { PageConfig, EntityConfig } from "@shared/types";
import { runtimeApi } from "../../api/client";

interface Props {
	page: PageConfig;
	entity: EntityConfig;
}

export function TableRenderer({ page, entity }: Props) {
	const [rows, setRows] = useState<Record<string, unknown>[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchRows = async () => {
		try {
			setLoading(true);
			const data = await runtimeApi.getAll(entity.name);
			setRows(data as Record<string, unknown>[]);
		} catch {
			setError("Failed to load data.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRows();
	}, [entity.name]);

	const handleDelete = async (id: string) => {
		await runtimeApi.remove(entity.name, id);
		fetchRows();
	};

	if (loading)
		return <p style={{ color: "#9ca3af" }}>Loading {entity.name}...</p>;
	if (error) return <p style={{ color: "#f87171" }}>{error}</p>;

	const columns = entity.fields.map((f) => f.name);

	return (
		<div>
			<h2 style={{ color: "#f3f4f6", marginBottom: 16 }}>{page.name}</h2>
			{rows.length === 0 ? (
				<p style={{ color: "#6b7280" }}>No records yet.</p>
			) : (
				<div style={{ overflowX: "auto" }}>
					<table
						style={{
							width: "100%",
							borderCollapse: "collapse",
							color: "#f3f4f6",
						}}
					>
						<thead>
							<tr style={{ borderBottom: "1px solid #374151" }}>
								{columns.map((col) => (
									<th
										key={col}
										style={{
											padding: "8px 12px",
											textAlign: "left",
											color: "#9ca3af",
											fontSize: 12,
											textTransform: "uppercase",
										}}
									>
										{col}
									</th>
								))}
								<th style={{ padding: "8px 12px" }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row, i) => (
								<tr
									key={String(row.id ?? i)}
									style={{ borderBottom: "1px solid #1f2937" }}
								>
									{columns.map((col) => (
										<td
											key={col}
											style={{ padding: "10px 12px", fontSize: 14 }}
										>
											{String(row[col.toLowerCase()] ?? "—")}
										</td>
									))}
									<td style={{ padding: "10px 12px" }}>
										<button
											onClick={() => handleDelete(String(row.id))}
											style={{
												color: "#f87171",
												background: "none",
												border: "none",
												cursor: "pointer",
												fontSize: 12,
											}}
										>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
