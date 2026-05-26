import { Component, ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: string;
}
interface State {
	hasError: boolean;
	message: string;
}

export class ErrorBoundary extends Component<Props, State> {
	state: State = { hasError: false, message: "" };

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, message: error.message };
	}

	render() {
		if (this.state.hasError) {
			return (
				<div
					style={{
						border: "1px dashed #f87171",
						borderRadius: 8,
						padding: 16,
						background: "#1f1f1f",
						color: "#f87171",
					}}
				>
					<p style={{ fontWeight: 600 }}>⚠ Component failed to render</p>
					<p style={{ fontSize: 12, color: "#9ca3af" }}>{this.state.message}</p>
				</div>
			);
		}
		return this.props.children;
	}
}
