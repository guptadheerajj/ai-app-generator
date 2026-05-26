import type { PageConfig, AppConfig } from "@shared/types";
import { ErrorBoundary } from "./ErrorBoundary";
import { TableRenderer } from "./renderers/TableRenderer";
import { FormRenderer } from "./renderers/FormRenderer";
import { DashboardRenderer } from "./renderers/DashboardRenderer";
import { UnknownRenderer } from "./renderers/UnknownRenderer";

interface Props {
	page: PageConfig;
	config: AppConfig;
}

export function PageRenderer({ page, config }: Props) {
	const entity = config.entities.find(
		(e) => e.name.toLowerCase() === page.entity?.toLowerCase(),
	);

	const renderInner = () => {
		if (page.type === "unknown" || page._error) {
			return <UnknownRenderer page={page} />;
		}
		if (page.type === "table") {
			if (!entity)
				return (
					<UnknownRenderer
						page={{
							...page,
							_error: `Entity "${page.entity}" not found in config`,
						}}
					/>
				);
			return <TableRenderer page={page} entity={entity} />;
		}
		if (page.type === "form") {
			if (!entity)
				return (
					<UnknownRenderer
						page={{
							...page,
							_error: `Entity "${page.entity}" not found in config`,
						}}
					/>
				);
			return <FormRenderer page={page} entity={entity} />;
		}
		if (page.type === "dashboard") {
			return <DashboardRenderer page={page} config={config} />;
		}
		return <UnknownRenderer page={page} />;
	};

	return <ErrorBoundary>{renderInner()}</ErrorBoundary>;
}
