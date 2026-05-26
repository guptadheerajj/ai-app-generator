import type { PageConfig } from "@shared/types";

export function UnknownRenderer({ page }: { page: PageConfig }) {
	return (
		<div
			style={{
				border: "1px dashed #6b7280",
				borderRadius: 8,
				padding: 24,
				textAlign: "center",
				color: "#6b7280",
			}}
		>
			<p style={{ fontSize: 20 }}>⚙</p>
			<p style={{ fontWeight: 600 }}>Unknown page type</p>
			<p style={{ fontSize: 12 }}>
				{page._error ?? `Cannot render "${page.type}"`}
			</p>
		</div>
	);
}
